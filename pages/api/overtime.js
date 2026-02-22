// pages/api/overtime.js
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from('overtime_data')
    .select('id, name, notes, overtime_date')
    .order('id', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  // Optionally normalize date to ISO string for clients
  const normalized = data.map(row => ({
    ...row,
    overtime_date: row.overtime_date ? row.overtime_date : null
  }));

  res.status(200).json(normalized);
}