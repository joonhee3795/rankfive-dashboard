// POST /api/scan
// body: { url: string }  ← 네이버 플레이스 URL
// 파이썬 naver_place.py 로직을 포팅: 크롤링 → Gemini 키워드 생성 → 5위 이내 검색

import { sql } from "./_db.js";

export const config = { maxDuration: 60 };

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13; SM-G998N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36",
  "Accept-Language": "ko-KR,ko;q=0.9",
};

const BAD_LANDMARK_TAILS = ["지역","방역","전역","내역","영역","광역","병역","용역","번역","통역","현역","구역","대역","침대","무대"];
const LANDMARK_PATTERN = /([가-힣]{1,5}(?:사거리|삼거리|네거리|역|공원|해수욕장|대학교|여대|캠퍼스|시장|못|천|호수|교|터미널|유원지))[^가-힣]/g;

function decodeUnicodeEscapes(text) {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function cleanKeyword(kw) {
  const words = kw.split(/\s+/).filter(Boolean);
  const result = [];
  for (const w of words) {
    if (result.length === 0) { result.push(w); continue; }
    let redundant = false;
    for (let i = 0; i < result.length; i++) {
      if (w === result[i] || result[i].includes(w)) { redundant = true; break; }
      if (w.includes(result[i])) { result[i] = w; redundant = true; break; }
    }
    if (!redundant) result.push(w);
  }
  return result.join(" ");
}

async function getStoreInfo(placeUrl) {
  const placeIdMatch = placeUrl.match(/\/(?:restaurant|place|hairshop)\/(\d+)/);
  const placeId = placeIdMatch ? placeIdMatch[1] : null;

  const r = await fetch(placeUrl, { headers: HEADERS });
  const rawHtml = decodeUnicodeEscapes(await r.text());

  let storeName = null;
  const og = rawHtml.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
  if (og) storeName = og[1].replace(" - 네이버 지도", "").replace(" : 네이버", "").trim();
  if (!storeName) {
    const t = rawHtml.match(/<title>([^<]+)<\/title>/);
    if (t) storeName = t[1].replace(" - 네이버 지도", "").replace(" : 네이버", "").trim();
  }

  const locations = new Set();
  for (const m of rawHtml.matchAll(/"(?:address|roadAddress|jibunAddress|abbrAddress)":"([^"]+)"/g)) {
    for (const p of m[1].split(/\s+/)) {
      if (/[시도구군읍면로길]$/.test(p) && p.length >= 2) locations.add(p);
      else if (/동$/.test(p) || /동\d*가$/.test(p)) locations.add(p);
    }
  }

  const categories = new Set();
  const catMatch = rawHtml.match(/"(?:category|bizCategory)":"([^"]+)"/);
  if (catMatch) {
    catMatch[1].replace(/>/g, ",").split(",").forEach(c => {
      const v = c.trim();
      if (v.length >= 2) categories.add(v);
    });
  }

  const placeKeywords = new Set();
  for (const pat of [/"keywordList":\[(.*?)\]/, /"keywords":\[(.*?)\]/, /"tags":\[(.*?)\]/]) {
    const m = rawHtml.match(pat);
    if (m) {
      for (const inner of m[1].matchAll(/"([^"]+)"/g)) {
        inner[1].split(",").forEach(kw => {
          const v = kw.trim();
          if (v) placeKeywords.add(v);
        });
      }
    }
  }

  const menus = new Set();
  for (const m of rawHtml.matchAll(/"name":"([^"]+)","price"/g)) {
    let v = m[1].replace(/\([^)]*\)/g, "");
    v = v.replace(/[^가-힣a-zA-Z0-9\s]/g, "").trim();
    v = v.replace(/\d+\s*(g|G|인분|원|ml|ML)/g, "").trim();
    if (v.length >= 2) menus.add(v);
  }

  const landmarks = new Set();
  for (const m of rawHtml.matchAll(LANDMARK_PATTERN)) {
    const lm = m[1];
    if (lm.length >= 2 && !BAD_LANDMARK_TAILS.some(b => lm.endsWith(b))) landmarks.add(lm);
  }

  return {
    storeName,
    placeId,
    locations: [...locations],
    categories: [...categories],
    placeKeywords: [...placeKeywords],
    menus: [...menus].slice(0, 20),
    landmarks: [...landmarks].slice(0, 10),
  };
}

async function generateKeywordPool(info, geminiKey) {
  const prompt = `당신은 대한민국 지역 로컬 마케팅 및 네이버 지도 검색어 최적화 전문가입니다.
사용자가 검색할 법한 자연스러운 '지역명 + 키워드' 조합을 만들어주세요.

[제공된 데이터]
- 매장명: ${info.storeName}
- 지역명: ${JSON.stringify(info.locations)}
- 업종: ${JSON.stringify(info.categories)}
- 대표키워드: ${JSON.stringify(info.placeKeywords)}
- 메뉴: ${JSON.stringify(info.menus)}
- 주변 명소/사거리: ${JSON.stringify(info.landmarks)}

[중요 지침]
1. 메뉴명에 있는 무게(g, 인분, ml)나 가격 정보 제거.
2. 행정구역명은 자연스럽게 (예: "수성동4가" → "수성동", 도로명 제외).
3. 제공된 지역명을 바탕으로 실제 존재하는 주변 명소 이름(범어네거리, 수성못, 수성구청역 등)을 적극 활용.
4. "지역명+메뉴", "지역명+업종", "명소명+메뉴", "명소명+회식/모임장소" 등 자연 조합 50개.
5. 매장명(${info.storeName}) 자체가 포함된 키워드는 제외.
6. JSON 배열만 응답 (예: ["수성구 고기집", "수성동 천겹살"]).`;

  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );

  if (!r.ok) throw new Error("Gemini API: " + (await r.text()));
  const data = await r.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  const arr = JSON.parse(text);
  if (!Array.isArray(arr)) throw new Error("Gemini response is not an array");

  const cleanStore = (info.storeName || "").replace(/\s+/g, "");
  const seen = new Set();
  const out = [];
  for (const kw of arr) {
    if (typeof kw !== "string") continue;
    const c = cleanKeyword(kw);
    const noSpace = c.replace(/\s+/g, "");
    if (noSpace.length < 2) continue;
    if (cleanStore && noSpace.includes(cleanStore)) continue;
    const norm = noSpace.replace(/역(?=맛집|고기집|회식|모임|추천|점심|저녁|$)/g, "");
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(c);
  }
  return out;
}

async function checkRanking(placeId, keyword) {
  const url = `https://m.search.naver.com/search.naver?sm=mtb_hty.top&where=m&query=${encodeURIComponent(keyword)}`;
  try {
    const r = await fetch(url, { headers: HEADERS, redirect: "follow" });
    const html = await r.text();

    if (r.url && r.url.includes("place.naver.com")) return { status: "단일매장", rank: null };
    if (!placeId || !html.includes(String(placeId))) return { status: "순위밖", rank: null };

    const linkRe = /<a[^>]*href="[^"]*place\.naver\.com\/(?:restaurant|place|hairshop)\/(\d+)/g;
    const seen = new Set();
    let organicRank = 0;
    let m;
    while ((m = linkRe.exec(html)) !== null) {
      const pid = m[1];
      if (seen.has(pid)) continue;
      seen.add(pid);

      const linkPos = m.index;
      const ctxStart = Math.max(0, linkPos - 3000);
      const before = html.substring(ctxStart, linkPos);
      const lastLi = before.lastIndexOf("<li");
      const liStart = lastLi >= 0 ? ctxStart + lastLi : Math.max(0, linkPos - 500);

      const afterStart = linkPos + m[0].length;
      const after = html.substring(afterStart, Math.min(html.length, afterStart + 3000));
      const liEnd = after.indexOf("</li>");
      const liStop = liEnd >= 0 ? afterStart + liEnd : afterStart + 500;

      const block = html.substring(liStart, liStop);
      const isAd = />광고<\/(?:span|em|div|i|strong)>/i.test(block);

      if (isAd) {
        if (pid === String(placeId)) return { status: "광고", rank: null };
        continue;
      }

      organicRank++;
      if (pid === String(placeId)) {
        if (organicRank <= 5) return { status: "상위노출", rank: organicRank };
        return { status: "순위밖", rank: null };
      }
    }
    return { status: "순위밖", rank: null };
  } catch (e) {
    return { status: "에러", rank: null };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body || {};
  if (!url || typeof url !== "string") return res.status(400).json({ error: "url is required" });

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

  const start = Date.now();
  const TIMEOUT_MS = 50000;

  try {
    const info = await getStoreInfo(url);
    if (!info.storeName) {
      return res.status(400).json({ error: "매장 정보를 가져올 수 없습니다. URL을 확인하세요." });
    }

    const pool = await generateKeywordPool(info, geminiKey);
    if (pool.length === 0) {
      return res.status(400).json({ error: "키워드 풀 생성 실패", detail: "Gemini가 키워드를 반환하지 않았습니다" });
    }

    const TARGET = 10;
    const BATCH = 8;
    const found = [];
    const scanned = [];

    for (let i = 0; i < pool.length && found.length < TARGET; i += BATCH) {
      if (Date.now() - start > TIMEOUT_MS) break;

      const batch = pool.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map(kw => checkRanking(info.placeId, kw).then(r => ({ kw, ...r })))
      );

      for (const r of results) {
        scanned.push({ keyword: r.kw, status: r.status, rank: r.rank });
        if (r.status === "상위노출" && found.length < TARGET) {
          found.push({
            keyword: r.kw,
            expectedRank: r.rank,
            difficulty: r.rank <= 2 ? "낮음" : r.rank <= 3 ? "보통" : "높음",
            reason: `네이버 모바일 검색 ${r.rank}위 노출 (광고 제외)`,
          });
        }
      }
    }

    found.sort((a, b) => a.expectedRank - b.expectedRank);

    const payload = {
      scanned: scanned.length,
      poolSize: pool.length,
      found,
      meta: {
        placeId: info.placeId,
        locations: info.locations,
        categories: info.categories,
        menus: info.menus,
        landmarks: info.landmarks,
      },
    };

    try {
      await sql`
        INSERT INTO scans (store_name, keywords, result)
        VALUES (${info.storeName}, ${url}, ${JSON.stringify(payload)})
      `;
    } catch (e) {
      console.error("DB insert failed", e);
    }

    return res.status(200).json({
      storeName: info.storeName,
      placeId: info.placeId,
      poolSize: pool.length,
      scanned: scanned.length,
      found,
    });
  } catch (e) {
    return res.status(500).json({ error: "Scan failed", detail: String(e?.message || e) });
  }
}
