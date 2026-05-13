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

const GENERIC_NAMES = new Set(["네이버 플레이스", "네이버플레이스", "네이버 지도", "네이버지도", "네이버", "Naver"]);

function cleanName(s) {
  return (s || "")
    .replace(" - 네이버 지도", "")
    .replace(" : 네이버", "")
    .replace(" | 네이버 플레이스", "")
    .replace(" - Naver Place", "")
    .trim();
}

function extractStoreName(html, placeId) {
  const candidates = [];

  const og = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
  if (og) candidates.push(cleanName(og[1]));

  const titleM = html.match(/<title>([^<]+)<\/title>/);
  if (titleM) candidates.push(cleanName(titleM[1]));

  if (placeId) {
    const near = new RegExp(`"id":"${placeId}"[\\s\\S]{0,800}?"name":"([^"]+)"`);
    const m = html.match(near);
    if (m) candidates.push(cleanName(m[1]));
  }

  for (const pat of [
    /"businessName"\s*:\s*"([^"]+)"/,
    /"placeName"\s*:\s*"([^"]+)"/,
    /"siteName"\s*:\s*"([^"]+)"/,
    /"name":"([^"]+)","businessCategory"/,
    /"name":"([^"]+)","types"/,
  ]) {
    const m = html.match(pat);
    if (m) candidates.push(cleanName(m[1]));
  }

  for (const c of candidates) {
    if (c && !GENERIC_NAMES.has(c) && c.length >= 2 && c.length < 60) return c;
  }
  return candidates[0] || null;
}

async function getStoreInfo(placeUrl) {
  const placeIdMatch = placeUrl.match(/\/(?:restaurant|place|hairshop)\/(\d+)/);
  const placeId = placeIdMatch ? placeIdMatch[1] : null;
  const typeMatch = placeUrl.match(/\/(restaurant|place|hairshop)\//);
  const type = typeMatch ? typeMatch[1] : "restaurant";

  let rawHtml = "";
  if (placeId) {
    try {
      const desktopUrl = `https://pcmap.place.naver.com/${type}/${placeId}/home`;
      const r = await fetch(desktopUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
          "Accept-Language": "ko-KR,ko;q=0.9",
        },
      });
      if (r.ok) rawHtml = decodeUnicodeEscapes(await r.text());
    } catch {}
  }
  if (!rawHtml || rawHtml.length < 2000) {
    const r2 = await fetch(placeUrl, { headers: HEADERS });
    rawHtml = decodeUnicodeEscapes(await r2.text());
  }

  const storeName = extractStoreName(rawHtml, placeId);

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

async function generateKeywordPool(info, geminiKey, excluded) {
  const excludedList = excluded && excluded.size > 0 ? [...excluded].slice(0, 200) : null;
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
6. JSON 배열만 응답 (예: ["수성구 고기집", "수성동 천겹살"]).
${excludedList ? `7. 다음 키워드는 이미 검색했으니 절대 포함하지 마세요. 완전히 새로운 조합을 만드세요: ${JSON.stringify(excludedList)}` : ""}`;

  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), 20000);
  let r;
  try {
    r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
        signal: ctrl.signal,
      }
    );
  } finally {
    clearTimeout(timeoutId);
  }

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

  // SSE 스트리밍 응답
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (res.flushHeaders) res.flushHeaders();

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (res.flush) res.flush();
  };

  const start = Date.now();
  const TIMEOUT_MS = 52000;
  const SAFETY_MS = 6000;

  try {
    send({ type: "stage_start", stage: "crawl", message: "플레이스 페이지 크롤링 중..." });
    const info = await getStoreInfo(url);
    if (!info.storeName) {
      send({ type: "error", message: "매장 정보를 가져올 수 없습니다. URL을 확인하세요." });
      return res.end();
    }
    send({ type: "stage_done", stage: "crawl", info });

    const TARGET = 10;
    const BATCH = 8;
    const REPEAT_LIMIT = 5;
    const found = [];
    const scannedAll = [];
    const searchedSet = new Set();
    let totalPoolSize = 0;
    let lastRound = 0;

    send({ type: "stage_start", stage: "keywords", message: "Gemini 2.5 Flash로 키워드 생성 중..." });
    let pool = await generateKeywordPool(info, geminiKey);
    if (pool.length === 0) {
      send({ type: "error", message: "Gemini가 키워드를 반환하지 않았습니다." });
      return res.end();
    }
    totalPoolSize = pool.length;
    send({ type: "stage_done", stage: "keywords", poolSize: pool.length });

    send({ type: "stage_start", stage: "check", poolSize: pool.length, message: "모바일 통합검색 5위 이내 추적 중..." });

    for (let round = 0; round < REPEAT_LIMIT && found.length < TARGET; round++) {
      lastRound = round;
      const elapsed = Date.now() - start;
      if (elapsed > TIMEOUT_MS - SAFETY_MS) {
        send({ type: "info", message: `시간 한계로 추가 검색 중단 (경과 ${Math.round(elapsed/1000)}초)` });
        break;
      }

      if (round > 0) {
        send({ type: "retry_start", round, message: `재시도 ${round}/${REPEAT_LIMIT - 1}회차 — Gemini로 새 키워드 생성 중... (현재 ${found.length}/10 발견)` });
        try {
          pool = await generateKeywordPool(info, geminiKey, searchedSet);
        } catch (e) {
          send({ type: "info", message: `재시도 ${round} — Gemini 호출 실패: ${String(e?.message || e)}` });
          break;
        }
        totalPoolSize += pool.length;
      }

      const newKeywords = pool.filter(kw => !searchedSet.has(kw));
      if (newKeywords.length === 0) {
        send({ type: "info", message: "더 이상 생성 가능한 새 키워드가 없습니다." });
        break;
      }
      if (round > 0) {
        send({ type: "retry_pool", round, poolSize: newKeywords.length, message: `재시도 ${round} — 새 키워드 ${newKeywords.length}개로 추가 검색` });
      }

      for (let i = 0; i < newKeywords.length && found.length < TARGET; i += BATCH) {
        if (Date.now() - start > TIMEOUT_MS - SAFETY_MS) {
          send({ type: "info", message: "검색 시간 한계 도달 — 결과 정리 중" });
          break;
        }

        const batch = newKeywords.slice(i, i + BATCH);
        batch.forEach(kw => searchedSet.add(kw));
        const results = await Promise.all(
          batch.map(kw => checkRanking(info.placeId, kw).then(r => ({ kw, ...r })))
        );

        for (const r of results) {
          scannedAll.push({ keyword: r.kw, status: r.status, rank: r.rank, round });
          let foundItem = null;
          if (r.status === "상위노출" && found.length < TARGET) {
            foundItem = {
              keyword: r.kw,
              expectedRank: r.rank,
              difficulty: r.rank <= 2 ? "낮음" : r.rank <= 3 ? "보통" : "높음",
              reason: `네이버 모바일 검색 ${r.rank}위 노출 (광고 제외)`,
            };
            found.push(foundItem);
          }
          send({
            type: "check_progress",
            keyword: r.kw,
            status: r.status,
            rank: r.rank,
            scannedCount: scannedAll.length,
            foundCount: found.length,
            poolSize: newKeywords.length,
            round,
            foundItem,
          });
        }
      }
    }

    found.sort((a, b) => a.expectedRank - b.expectedRank);

    const payload = {
      scanned: scannedAll,
      scannedCount: scannedAll.length,
      poolSize: totalPoolSize,
      rounds: lastRound + 1,
      found,
      meta: {
        placeId: info.placeId,
        locations: info.locations,
        categories: info.categories,
        menus: info.menus,
        landmarks: info.landmarks,
      },
    };

    send({
      type: "saving",
      message: "DB에 결과 저장 중...",
    });
    try {
      await sql`
        INSERT INTO scans (store_name, keywords, result)
        VALUES (${info.storeName}, ${url}, ${JSON.stringify(payload)})
      `;
    } catch (e) {
      console.error("DB insert failed", e);
      send({ type: "info", message: "DB 저장 실패 (결과는 화면에 표시됨)" });
    }

    send({
      type: "done",
      storeName: info.storeName,
      placeId: info.placeId,
      poolSize: totalPoolSize,
      scanned: scannedAll.length,
      rounds: lastRound + 1,
      found,
    });
    res.end();
  } catch (e) {
    send({ type: "error", message: String(e?.message || e) });
    res.end();
  }
}
