// POST /api/scan
// body: { storeName: string, keywords: string }

import { sql } from "./_db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { storeName, keywords } = req.body || {};
  if (!storeName || !keywords) {
    return res.status(400).json({ error: "storeName and keywords are required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  const prompt = `너는 네이버 플레이스 마케팅 전문가다.
매장명: ${storeName}
분석할 키워드 목록: ${keywords}

각 키워드별로 다음 형식의 JSON 배열만 반환해라(설명 텍스트 없이 JSON만):
[
  { "keyword": "키워드", "expectedRank": 숫자(1~30), "difficulty": "낮음|보통|높음", "reason": "한 줄 이유" }
]`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!r.ok) {
      const errText = await r.text();
      return res.status(502).json({ error: "Gemini API error", detail: errText });
    }

    const data = await r.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = []; }

    try {
      await sql`
        INSERT INTO scans (store_name, keywords, result)
        VALUES (${storeName}, ${keywords}, ${JSON.stringify(parsed)})
      `;
    } catch (dbErr) {
      console.error("DB insert failed", dbErr);
    }

    return res.status(200).json({ storeName, keywords, results: parsed });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
