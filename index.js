// خادم الترحيل: يتحقق من الرموز ويمرّر نصوصا مشفرة فقط، ولا يستطيع قراءة الرسائل.
const N = 5;
async function sha(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname !== "/ws") return new Response("majlis relay");
    return env.ROOM.get(env.ROOM.idFromName("majlis")).fetch(req);
  },
};
export class Room {
  constructor(state, env) { this.state = state; this.env = env; }
  async fetch(req) {
    if (req.headers.get("Upgrade") !== "websocket") return new Response("", { status: 426 });
    const [client, server] = Object.values(new WebSocketPair());
    this.state.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }
  joined(except) {
    return this.state.getWebSockets().filter(w => w !== except && w.deserializeAttachment()?.seat !== undefined);
  }
  roster(except) {
    const list = this.joined(except).map(w => w.deserializeAttachment());
    const msg = JSON.stringify({ t: "roster", seats: list });
    for (const w of list.length ? this.joined(except) : []) { try { w.send(msg); } catch {} }
  }
  async webSocketMessage(ws, raw) {
    let m; try { m = JSON.parse(raw); } catch { return; }
    const me = ws.deserializeAttachment();
    if (m.t === "join" && !me) {
      const hashes = JSON.parse(this.env.CODE_HASHES || "[]");
      const code = String(m.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      const seat = hashes.indexOf(await sha(code));
      if (seat < 0 || seat >= N) { ws.send(JSON.stringify({ t: "err", e: "bad" })); return ws.close(1008, "bad"); }
      if (this.joined(ws).some(w => w.deserializeAttachment().seat === seat)) {
        ws.send(JSON.stringify({ t: "err", e: "used" })); return ws.close(1008, "used");
      }
      ws.serializeAttachment({ seat, pub: String(m.pub || "").slice(0, 200) });
      ws.send(JSON.stringify({ t: "ok", seat }));
      this.roster();
    } else if (m.t === "relay" && me) {
      const out = JSON.stringify({ t: "relay", from: me.seat, d: m.d });
      for (const w of this.joined(ws)) {
        if (m.to === "all" || w.deserializeAttachment().seat === m.to) { try { w.send(out); } catch {} }
      }
    }
  }
  webSocketClose(ws) { this.roster(ws); }
  webSocketError(ws) { this.roster(ws); }
}
