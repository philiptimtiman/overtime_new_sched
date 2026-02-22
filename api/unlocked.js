// api/unlocked.js
export default function handler(req, res) {
  // Only GET is needed
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const cookie = req.headers.cookie || '';
  const unlocked = cookie.split(';').some(c => c.trim().startsWith('overtime_unlocked='));
  return res.status(200).json({ unlocked: !!unlocked });
}