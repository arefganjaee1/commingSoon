// ─── تنظیمات ───────────────────────────────────────────────
const ADMIN_PASSWORD = "gharzi1404";   // ← پسورد پنل ادمین رو عوض کن
const KV_KEY         = "registrations";
// ────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export default {
  async fetch(request, env) {
    const { method } = request;
    const url = new URL(request.url);

    // preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // ── POST /register ── ثبت‌نام جدید (عمومی)
    if (method === "POST" && url.pathname === "/register") {
      let body;
      try { body = await request.json(); } catch { return json({ success: false, message: "داده نامعتبر" }, 400); }

      const { name, phone, msg } = body;
      if (!name || !phone) return json({ success: false, message: "نام و موبایل الزامیه" }, 400);
      if (!/^09\d{9}$/.test(phone)) return json({ success: false, message: "شماره موبایل نامعتبر" }, 400);

      const raw  = await env.GHARZI_KV.get(KV_KEY);
      const list = raw ? JSON.parse(raw) : [];

      if (list.find(r => r.phone === phone))
        return json({ success: false, message: "این شماره قبلاً ثبت شده ✅" });

      list.push({ name, phone, msg: msg || "", date: new Date().toISOString() });
      await env.GHARZI_KV.put(KV_KEY, JSON.stringify(list));

      return json({ success: true, message: "ثبت شدی!" });
    }

    // ── GET /stats ── آمار عمومی (بدون اطلاعات خصوصی)
    if (method === "GET" && url.pathname === "/stats") {
      const raw  = await env.GHARZI_KV.get(KV_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const today = new Date().toDateString();
      return json({
        total: list.length,
        today: list.filter(r => new Date(r.date).toDateString() === today).length,
        msgs:  list.filter(r => r.msg && r.msg.trim()).length,
      });
    }

    // ── GET /admin ── لیست کامل (فقط با پسورد)
    if (method === "GET" && url.pathname === "/admin") {
      const pass = request.headers.get("X-Admin-Password");
      if (pass !== ADMIN_PASSWORD)
        return json({ success: false, message: "دسترسی ندارید" }, 401);

      const raw  = await env.GHARZI_KV.get(KV_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return json({ success: true, list: [...list].reverse() });
    }

    return json({ error: "Not Found" }, 404);
  },
};
