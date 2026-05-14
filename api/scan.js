// POST /api/scan
// V2 — Kakao Local API + 네이버 검색광고 keywordstool 통합
// 흐름: 크롤(좌표 포함) → Kakao로 진짜 주변 POI → Gemini로 자연 조합 → 검색광고 keywordstool로 월간 검색량 검증 → 모바일 5위 추적

import { sql } from "./_db.js";
import crypto from "crypto";

export const config = { maxDuration: 60 };

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13; SM-G998N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36",
  "Accept-Language": "ko-KR,ko;q=0.9",
};

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
    .replace(" - 네이버 지도", "").replace(" : 네이버", "")
    .replace(" | 네이버 플레이스", "").replace(" - Naver Place", "").trim();
}

function extractStoreName(html, placeId) {
  const candidates = [];
  const og = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
  if (og) candidates.push(cleanName(og[1]));
  const t = html.match(/<title>([^<]+)<\/title>/);
  if (t) candidates.push(cleanName(t[1]));
  if (placeId) {
    const m = html.match(new RegExp(`"id":"${placeId}"[\\s\\S]{0,800}?"name":"([^"]+)"`));
    if (m) candidates.push(cleanName(m[1]));
  }
  for (const pat of [
    /"businessName"\s*:\s*"([^"]+)"/, /"placeName"\s*:\s*"([^"]+)"/,
    /"siteName"\s*:\s*"([^"]+)"/, /"name":"([^"]+)","businessCategory"/,
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

function extractCoords(html) {
  const patterns = [
    /"x":\s*"?(-?1[2-3]\d\.\d+)"?\s*,\s*"y":\s*"?(-?[3-4]\d\.\d+)"?/,
    /"y":\s*"?(-?[3-4]\d\.\d+)"?\s*,\s*"x":\s*"?(-?1[2-3]\d\.\d+)"?/,
    /"longitude":\s*"?(-?1[2-3]\d\.\d+)"?[\s\S]{0,80}?"latitude":\s*"?(-?[3-4]\d\.\d+)"?/,
    /"latitude":\s*"?(-?[3-4]\d\.\d+)"?[\s\S]{0,80}?"longitude":\s*"?(-?1[2-3]\d\.\d+)"?/,
    /"mapx":\s*"?(-?1[2-3]\d\.?\d*)"?\s*,\s*"mapy":\s*"?(-?[3-4]\d\.?\d*)"?/,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (!m) continue;
    let a = parseFloat(m[1]);
    let b = parseFloat(m[2]);
    if (a > 100 && a < 140 && b > 30 && b < 45) return { lng: a, lat: b };
    if (b > 100 && b < 140 && a > 30 && a < 45) return { lng: b, lat: a };
  }
  return null;
}

async function getStoreInfo(placeUrl) {
  const placeIdMatch = placeUrl.match(/\/(?:restaurant|place|hairshop)\/(\d+)/);
  const placeId = placeIdMatch ? placeIdMatch[1] : null;
  const typeMatch = placeUrl.match(/\/(restaurant|place|hairshop)\//);
  const type = typeMatch ? typeMatch[1] : "restaurant";

  let rawHtml = "";
  if (placeId) {
    try {
      const r = await fetch(`https://pcmap.place.naver.com/${type}/${placeId}/home`, {
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
  const coords = extractCoords(rawHtml);

  const locations = new Set();
  for (const m of rawHtml.matchAll(/"(?:address|roadAddress|jibunAddress|abbrAddress)":"([^"]+)"/g)) {
    for (const p of m[1].split(/\s+/)) {
      const cleaned = p.replace(/(동)\d*가$/, "$1"); // 수성동4가 → 수성동
      if (/(?:시|도|구|군|읍|면|동)$/.test(cleaned) && cleaned.length >= 2 && cleaned.length <= 7) {
        locations.add(cleaned);
      }
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

  const menus = new Set();
  for (const m of rawHtml.matchAll(/"name":"([^"]+)","price"/g)) {
    let v = m[1].replace(/\([^)]*\)/g, "");
    v = v.replace(/[^가-힣a-zA-Z0-9\s]/g, "").trim();
    v = v.replace(/\d+\s*(g|G|인분|원|ml|ML)/g, "").trim();
    if (v.length >= 2) menus.add(v);
  }

  return {
    storeName,
    placeId,
    coords,
    locations: [...locations],
    categories: [...categories],
    menus: [...menus].slice(0, 20),
  };
}

const KAKAO_CATEGORIES = [
  { code: "SW8", label: "지하철역" },
  { code: "AT4", label: "관광명소" },
  { code: "PO3", label: "공공기관" },
  { code: "SC4", label: "학교" },
  { code: "CT1", label: "문화시설" },
];

async function getKakaoNearbyPOIs(coords, kakaoKey) {
  if (!coords || !kakaoKey) return [];
  const all = [];
  for (const cat of KAKAO_CATEGORIES) {
    try {
      const url = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=${cat.code}&x=${coords.lng}&y=${coords.lat}&radius=1500&size=15&sort=distance`;
      const r = await fetch(url, { headers: { Authorization: `KakaoAK ${kakaoKey}` } });
      if (!r.ok) continue;
      const data = await r.json();
      for (const doc of data.documents || []) {
        const name = (doc.place_name || "").trim();
        if (!name || name.length < 2 || name.length > 15) continue;
        // 지하철역은 "역" 만 남기기 (예: "범어역 1번출구" → "범어역")
        let cleanedName = name;
        if (cat.code === "SW8") {
          const stationMatch = name.match(/^([가-힣]{1,8}역)/);
          if (stationMatch) cleanedName = stationMatch[1];
        }
        all.push({
          name: cleanedName,
          rawName: name,
          category: cat.label,
          categoryCode: cat.code,
          distance: parseInt(doc.distance) || 9999,
        });
      }
    } catch {}
  }
  all.sort((a, b) => a.distance - b.distance);
  const seen = new Set();
  const out = [];
  for (const p of all) {
    const k = p.name.replace(/\s/g, "");
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
    if (out.length >= 25) break;
  }
  return out;
}

function buildSeeds(info, pois) {
  const seeds = new Set();
  const locDong = info.locations.find(l => /동$/.test(l));
  const locGu = info.locations.find(l => /(?:구|군)$/.test(l));
  const primaryCat = info.categories[0] || null;

  // 1. 지역 + 업종
  for (const loc of info.locations.slice(0, 3)) {
    if (primaryCat) seeds.add(`${loc} ${primaryCat}`);
    seeds.add(`${loc} 맛집`);
  }
  // 2. POI + 의도어
  const intents = ["맛집", "회식", "데이트", "점심", "저녁"];
  for (const poi of pois.slice(0, 6)) {
    for (const intent of intents.slice(0, 3)) {
      seeds.add(`${poi.name} ${intent}`);
    }
  }
  // 3. POI + 업종
  if (primaryCat) {
    for (const poi of pois.slice(0, 4)) {
      seeds.add(`${poi.name} ${primaryCat}`);
    }
  }

  return [...seeds].slice(0, 12);
}

async function geminiNaturalize(info, pois, geminiKey, excluded) {
  const excludedList = excluded && excluded.size > 0 ? [...excluded].slice(0, 150) : null;
  const prompt = `당신은 대한민국 지역 로컬 마케팅 전문가입니다.
아래 [확정된 데이터]만 사용해서 자연스러운 검색어 조합 40개를 만드세요.

[확정된 데이터]
- 매장명: ${info.storeName}
- 행정구역(반드시 이중 하나만 사용): ${JSON.stringify(info.locations)}
- 매장 카테고리: ${JSON.stringify(info.categories)}
- 매장 메뉴: ${JSON.stringify(info.menus)}
- 주변 실제 POI (Kakao API로 검증된 진짜 명소·역·기관): ${JSON.stringify(pois.map(p => `${p.name}(${p.category})`))}

[규칙]
1. 위 데이터에 없는 새로운 명소·지역·역 이름은 절대 만들지 마세요. 환각 금지.
2. "지역+메뉴", "지역+카테고리", "POI+의도어(맛집/회식/점심/저녁/데이트)", "POI+메뉴" 형식.
3. 매장명(${info.storeName}) 자체를 포함하지 마세요.
4. 무게(g/인분/ml) 및 가격 정보 제거.
5. JSON 배열만 응답.
${excludedList ? `6. 다음은 이미 검색했으니 제외: ${JSON.stringify(excludedList)}` : ""}`;

  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 18000);
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
    clearTimeout(tid);
  }
  if (!r.ok) throw new Error("Gemini: " + (await r.text()));
  const data = await r.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  const arr = JSON.parse(text);
  if (!Array.isArray(arr)) throw new Error("Gemini response not array");

  const cleanStore = (info.storeName || "").replace(/\s+/g, "");
  const seen = new Set();
  const out = [];
  for (const kw of arr) {
    if (typeof kw !== "string") continue;
    const c = cleanKeyword(kw);
    const ns = c.replace(/\s+/g, "");
    if (ns.length < 3) continue;
    if (cleanStore && ns.includes(cleanStore)) continue;
    const norm = ns.replace(/역(?=맛집|고기집|회식|모임|추천|점심|저녁|$)/g, "");
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(c);
  }
  return out;
}

function makeAdSignature(timestamp, method, uri, secret) {
  const message = `${timestamp}.${method}.${uri}`;
  return crypto.createHmac("sha256", secret).update(message).digest("base64");
}

async function fetchKeywordVolumes(seedKeywords, naverAd) {
  // 검색광고 keywordstool — 시드 5개씩 묶어 호출. 응답은 시드 + 연관 키워드 모두 포함.
  if (!naverAd?.apiKey || !naverAd?.secretKey || !naverAd?.customerId) return null;
  const acc = new Map(); // keyword → {mobile, pc}
  for (let i = 0; i < seedKeywords.length; i += 5) {
    const chunk = seedKeywords.slice(i, i + 5);
    const uri = "/keywordstool";
    const ts = Date.now().toString();
    const sig = makeAdSignature(ts, "GET", uri, naverAd.secretKey);
    const url = `https://api.searchad.naver.com${uri}?hintKeywords=${encodeURIComponent(chunk.join(","))}&showDetail=1`;
    try {
      const r = await fetch(url, {
        headers: {
          "X-Timestamp": ts,
          "X-API-KEY": naverAd.apiKey,
          "X-Customer": naverAd.customerId,
          "X-Signature": sig,
        },
      });
      if (!r.ok) continue;
      const data = await r.json();
      for (const row of data.keywordList || []) {
        const kw = (row.relKeyword || "").trim();
        if (!kw) continue;
        const pc = parseInt(String(row.monthlyPcQcCnt).replace(/[<>,\s]/g, ""), 10) || 0;
        const mobile = parseInt(String(row.monthlyMobileQcCnt).replace(/[<>,\s]/g, ""), 10) || 0;
        acc.set(kw, { pc, mobile, total: pc + mobile });
      }
    } catch {}
  }
  return acc;
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
        return organicRank <= 5
          ? { status: "상위노출", rank: organicRank }
          : { status: "순위밖", rank: null };
      }
    }
    return { status: "순위밖", rank: null };
  } catch {
    return { status: "에러", rank: null };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { url } = req.body || {};
  if (!url || typeof url !== "string") return res.status(400).json({ error: "url is required" });

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

  const kakaoKey = process.env.KAKAO_REST_API_KEY;
  const naverAd = {
    apiKey: process.env.NAVER_AD_API_KEY,
    secretKey: process.env.NAVER_AD_SECRET_KEY,
    customerId: process.env.NAVER_AD_CUSTOMER_ID,
  };

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (res.flushHeaders) res.flushHeaders();
  const send = (d) => { res.write(`data: ${JSON.stringify(d)}\n\n`); if (res.flush) res.flush(); };

  const start = Date.now();
  const TIMEOUT_MS = 52000;
  const SAFETY_MS = 6000;

  try {
    // 1. 크롤
    send({ type: "stage_start", stage: "crawl", message: "플레이스 페이지 크롤링 중..." });
    const info = await getStoreInfo(url);
    if (!info.storeName) {
      send({ type: "error", message: "매장 정보를 가져올 수 없습니다." });
      return res.end();
    }
    send({ type: "stage_done", stage: "crawl", info: { ...info, landmarks: [], placeKeywords: [] } });

    // 2. 카카오 로컬 API로 진짜 POI 확보
    let pois = [];
    if (kakaoKey && info.coords) {
      send({ type: "stage_start", stage: "poi", message: `Kakao Local API로 반경 1.5km 주변 명소 조회 중...` });
      pois = await getKakaoNearbyPOIs(info.coords, kakaoKey);
      send({ type: "stage_done", stage: "poi", pois });
    } else {
      send({ type: "info", message: kakaoKey ? "좌표 추출 실패 — POI 조회 건너뜀" : "KAKAO_REST_API_KEY 없음 — POI 조회 건너뜀" });
    }

    // 3. Gemini로 자연 조합 생성
    send({ type: "stage_start", stage: "keywords", message: "Gemini로 자연스러운 키워드 조합 생성 중..." });
    let geminiPool;
    try {
      geminiPool = await geminiNaturalize(info, pois, geminiKey);
    } catch (e) {
      send({ type: "error", message: "Gemini 호출 실패: " + (e?.message || e) });
      return res.end();
    }
    send({ type: "stage_done", stage: "keywords", poolSize: geminiPool.length });

    // 4. 네이버 검색광고 keywordstool로 월간 검색량 가져오기 (시드 기반)
    let volumeMap = null;
    if (naverAd.apiKey && naverAd.secretKey && naverAd.customerId) {
      send({ type: "stage_start", stage: "volume", message: "네이버 검색광고 API로 월간 검색량 조회 중..." });
      const seeds = buildSeeds(info, pois);
      volumeMap = await fetchKeywordVolumes(seeds, naverAd);
      if (volumeMap) {
        send({ type: "stage_done", stage: "volume", message: `${volumeMap.size}개 키워드의 월간 검색량 확보` });
      } else {
        send({ type: "info", message: "검색광고 API 응답 실패 — 검색량 검증 건너뜀" });
      }
    } else {
      send({ type: "info", message: "NAVER_AD_* 환경변수 없음 — 검색량 검증 건너뜀" });
    }

    // 5. 풀 합치기 — Gemini 후보 + 검색광고가 발견한 고검색량 키워드
    let pool;
    const cleanStore = (info.storeName || "").replace(/\s+/g, "");
    if (volumeMap && volumeMap.size > 0) {
      const candidates = new Map(); // keyword → volume
      // Gemini 후보: volumeMap에서 검색량 조회 (없으면 0)
      for (const kw of geminiPool) {
        const v = volumeMap.get(kw) || volumeMap.get(kw.replace(/\s/g, "")) || { total: 0, mobile: 0 };
        candidates.set(kw, v.mobile || v.total || 0);
      }
      // 검색광고가 직접 던져준 연관키워드 중에서도 매장과 관련된 것만 추가
      const locWords = info.locations.concat(pois.map(p => p.name)).map(s => s.replace(/\s/g, ""));
      for (const [kw, v] of volumeMap.entries()) {
        if (candidates.has(kw)) continue;
        const ns = kw.replace(/\s/g, "");
        if (ns.length < 4 || ns.length > 25) continue;
        if (cleanStore && ns.includes(cleanStore)) continue;
        // 매장 지역/POI 중 하나라도 포함되어야 함
        if (!locWords.some(w => w && ns.includes(w))) continue;
        if ((v.mobile || 0) < 30) continue;
        candidates.set(kw, v.mobile || v.total || 0);
      }
      // 정렬: 검색량 내림차순, 최대 60개
      pool = [...candidates.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 60)
        .map(([kw]) => kw);
      send({ type: "info", message: `검색량 기준 정렬된 키워드 ${pool.length}개로 추적 시작` });
    } else {
      pool = geminiPool.slice(0, 50);
    }

    if (pool.length === 0) {
      send({ type: "error", message: "검색할 키워드를 확보하지 못했습니다." });
      return res.end();
    }

    // 6. 순위 추적
    send({ type: "stage_start", stage: "check", poolSize: pool.length, message: "모바일 통합검색 5위 이내 추적 중..." });

    const TARGET = 10;
    const BATCH = 8;
    const REPEAT_LIMIT = 5;
    const found = [];
    const scannedAll = [];
    const searchedSet = new Set();
    let totalPoolSize = pool.length;
    let lastRound = 0;

    for (let round = 0; round < REPEAT_LIMIT && found.length < TARGET; round++) {
      lastRound = round;
      const elapsed = Date.now() - start;
      if (elapsed > TIMEOUT_MS - SAFETY_MS) {
        send({ type: "info", message: `시간 한계로 추가 검색 중단 (경과 ${Math.round(elapsed/1000)}초)` });
        break;
      }

      if (round > 0) {
        send({ type: "retry_start", round, message: `재시도 ${round}/${REPEAT_LIMIT - 1}회차 — 새 키워드 생성 중... (현재 ${found.length}/10)` });
        try {
          pool = await geminiNaturalize(info, pois, geminiKey, searchedSet);
        } catch (e) {
          send({ type: "info", message: `재시도 ${round} — Gemini 실패: ${String(e?.message || e)}` });
          break;
        }
        totalPoolSize += pool.length;
      }

      const newKws = pool.filter(kw => !searchedSet.has(kw));
      if (newKws.length === 0) {
        send({ type: "info", message: "더 이상 새 키워드가 없습니다." });
        break;
      }
      if (round > 0) {
        send({ type: "retry_pool", round, poolSize: newKws.length, message: `재시도 ${round} — 새 키워드 ${newKws.length}개로 추가 검색` });
      }

      for (let i = 0; i < newKws.length && found.length < TARGET; i += BATCH) {
        if (Date.now() - start > TIMEOUT_MS - SAFETY_MS) {
          send({ type: "info", message: "검색 시간 한계 — 결과 정리 중" });
          break;
        }
        const batch = newKws.slice(i, i + BATCH);
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
            keyword: r.kw, status: r.status, rank: r.rank,
            scannedCount: scannedAll.length,
            foundCount: found.length,
            poolSize: newKws.length,
            round, foundItem,
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
        coords: info.coords,
        locations: info.locations,
        categories: info.categories,
        menus: info.menus,
        pois: pois.map(p => ({ name: p.name, category: p.category, distance: p.distance })),
      },
    };

    send({ type: "saving", message: "DB에 결과 저장 중..." });
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
