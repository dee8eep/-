# المجلس: دردشة سرية لخمسة أعضاء

- `docs/`: الواجهة (تُنشر عبر GitHub Pages).
- `worker/`: خادم الترحيل (Cloudflare Workers + Durable Objects).

## الخطوات من الهاتف
1. GitHub: أنشئ مستودعًا جديدًا، ثم Add file > Upload files وارفع المجلدين `docs` و`worker` وهذا الملف.
2. GitHub: Settings > Pages > Source: Deploy from a branch > Branch: main > Folder: /docs > Save.
3. Cloudflare: Workers & Pages > Create > Import a repository، اختر المستودع،
   وفي Root directory اكتب `worker`، ثم Deploy.
4. Cloudflare: افتح الـ Worker > Settings > Variables and Secrets > Add،
   النوع Secret، الاسم `CODE_HASHES`، القيمة: السطر الموجود في ملف `hashes.txt`. ثم Deploy.
5. انسخ عنوان الـ Worker (workers.dev) وضعه في أول سكربت `docs/index.html` مكان `WS_URL`
   بعد استبدال https بـ wss وإضافة `/ws` في آخره. عدّل الملف من GitHub مباشرة.
6. افتح رابط GitHub Pages وأدخل الرموز.
