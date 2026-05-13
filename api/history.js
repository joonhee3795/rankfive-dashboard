// GET /api/history → 최근 스캔 이력 50건

import { sql } from "./_db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rows = await sql`
      SELECT id, store_name, keywords, result, created_at
      FROM scans
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return res.status(200).json({ rows });
  } catch (e) {
    return res.status(500).json({ error: "DB error", detail: String(e) });
  }
}
