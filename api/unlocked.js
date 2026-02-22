export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const cookie = req.headers.cookie || '';
  const unlocked = cookie.split(';').some(c => c.trim().startsWith('overtime_unlocked='));
  return res.status(200).json({ unlocked: !!unlocked });
}

export default function handler(req, res) {
  return res.status(200).json({ ok: true, now: new Date().toISOString() });
}
