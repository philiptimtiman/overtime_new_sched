// pages/index.js (Next.js example)
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('overtime_data')
        .select('id, name, notes, overtime_date')
        .order('id', { ascending: true });

      if (error) {
        console.error('Supabase error', error);
      } else {
        setRows(data);
      }
    }
    load();
  }, []);

  return (
    <div>
      <h1>Overtime Data</h1>
      <ul>
        {rows.map(r => (
          <li key={r.id}>
            <strong>{r.name}</strong> — {r.notes} — <em>{formatDate(r.overtime_date)}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(d) {
  if (!d) return 'No date';
  const dt = new Date(d);
  return dt.toLocaleDateString(); // adjust locale/options as needed
}