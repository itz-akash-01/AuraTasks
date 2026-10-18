// Vercel serverless function: POST /api/enquiry
// Validates and sanitises input, rate-limits (best effort), emails via Resend if configured.
const hits = new Map();
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  // Same-origin only: browsers always send Origin on cross-site POSTs, so reject anything not from this host.
  let sameOrigin = false; try { sameOrigin = new URL(String(req.headers.origin || '')).host === String(req.headers.host || ''); } catch { /* invalid origin */ }
  if (!sameOrigin) return res.status(403).json({ error: 'Forbidden.' });
  if (!String(req.headers['content-type'] || '').toLowerCase().includes('application/json')) return res.status(415).json({ error: 'Unsupported content type.' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
  if (recent.length >= 5) return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  recent.push(now); hits.set(ip, recent);

  const b = req.body && typeof req.body === 'object' ? req.body : {};
  if (JSON.stringify(b).length > 6000) return res.status(413).json({ error: 'Request too large.' });
  if (b.company) return res.status(200).json({ ok: true, mode: 'demo' }); // honeypot: silently drop bots

  const name = clean(b.name, 80), email = clean(b.email, 120), message = clean(b.message, 1500);
  const errors = {};
  if (name.length < 2) errors.name = 'Enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
  if (message.length < 10) errors.message = 'Write at least 10 characters.';
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Please fix the highlighted fields.', errors });

  const { RESEND_API_KEY: key, ENQUIRY_TO_EMAIL: to, ENQUIRY_FROM_EMAIL: from } = process.env;
  if (!key || !to || !from) return res.status(200).json({ ok: true, mode: 'demo' }); // not configured: nothing sent

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], reply_to: email, subject: `New enquiry from ${name}`, text: `${message}\n\n— ${name} <${email}>` })
    });
    if (!r.ok) throw new Error(`mail provider status ${r.status}`);
    return res.status(200).json({ ok: true, mode: 'live' });
  } catch (e) {
    console.error('enquiry failed:', e.message); // never log the secret or message body
    return res.status(502).json({ error: 'Could not send right now. Please try again later.' });
  }
};
