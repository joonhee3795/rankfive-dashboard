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

async function getKakaoRegions(coords, kakaoKey) {
  // coord2regioncode — 좌표 → 행정동(H) + 법정동(B) 둘 다 반환
  if (!coords || !kakaoKey) return { city: null, gu: null, hDong: null, bDong: null, raw: [] };
  try {
    const url = `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${coords.lng}&y=${coords.lat}`;
    const r = await fetch(url, { headers: { Authorization: `KakaoAK ${kakaoKey}` } });
    if (!r.ok) return { city: null, gu: null, hDong: null, bDong: null, raw: [] };
    const data = await r.json();
    const docs = data.documents || [];
    const out = { city: null, gu: null, hDong: null, bDong: null, raw: [] };
    for (const d of docs) {
      out.raw.push({ type: d.region_type, name: d.region_3depth_name, code: d.code });
      if (!out.city) out.city = (d.region_1depth_name || "").replace("광역시", "").replace("특별시", "").replace("특별자치시", "").replace("특별자치도", "");
      if (!out.gu) out.gu = d.region_2depth_name;
      if (d.region_type === "H") out.hDong = d.region_3depth_name;
      if (d.region_type === "B") out.bDong = d.region_3depth_name;
    }
    return out;
  } catch {
    return { city: null, gu: null, hDong: null, bDong: null, raw: [] };
  }
}

async function getKakaoKeywordLandmarks(coords, kakaoKey, query) {
  // 좌표 기준 키워드 검색 — 잘 알려진 명소(예술의거리, 거리, 광장) 찾기
  if (!coords || !kakaoKey) return [];
  try {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&x=${coords.lng}&y=${coords.lat}&radius=2000&size=10&sort=accuracy`;
    const r = await fetch(url, { headers: { Authorization: `KakaoAK ${kakaoKey}` } });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.documents || [])
      .map(d => (d.place_name || "").trim())
      .filter(n => n.length >= 2 && n.length <= 15);
  } catch { return []; }
}

async function getKakaoNearbyPOIs(coords, kakaoKey, onDiag) {
  if (!coords || !kakaoKey) return [];
  const all = [];
  const diag = [];
  for (const cat of KAKAO_CATEGORIES) {
    try {
      const url = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=${cat.code}&x=${coords.lng}&y=${coords.lat}&radius=1500&size=15&sort=distance`;
      const r = await fetch(url, { headers: { Authorization: `KakaoAK ${kakaoKey}` } });
      if (!r.ok) {
        const errText = await r.text().catch(() => "");
        diag.push(`[${cat.code}] HTTP ${r.status} — ${errText.slice(0, 200)}`);
        continue;
      }
      const data = await r.json();
      const docs = data.documents || [];
      diag.push(`[${cat.code}] ${docs.length}건`);
      for (const doc of docs) {
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
    } catch (e) {
      diag.push(`[${cat.code}] 예외: ${String(e?.message || e)}`);
    }
  }
  if (onDiag) onDiag(diag);
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

// 카테고리를 사람들이 검색하는 자연어로 매핑
function naturalizeCategory(cat) {
  if (!cat) return null;
  const c = cat.replace(/\s/g, "");
  if (c.includes("요리주점") || c.includes("일본식") || c.includes("이자카야")) return "이자카야";
  if (c.includes("삼겹살") || c.includes("돼지")) return "삼겹살";
  if (c.includes("갈비") || c.includes("소고기")) return "고기집";
  if (c.includes("한식")) return "맛집";
  if (c.includes("카페") || c.includes("커피")) return "카페";
  if (c.includes("미용") || c.includes("헤어")) return "미용실";
  if (c.includes("스시") || c.includes("초밥")) return "스시";
  if (c.includes("파스타") || c.includes("이탈리")) return "파스타";
  if (c.includes("중식") || c.includes("짜장")) return "중식당";
  if (c.includes("분식") || c.includes("떡볶이")) return "분식";
  if (c.includes("치킨")) return "치킨";
  return cat.length <= 4 ? cat : "맛집";
}

function buildSeeds(info, pois) {
  const seeds = new Set();
  const city = info.regions?.city;
  const gu = info.regions?.gu;
  const dongs = [info.regions?.hDong, info.regions?.bDong].filter(Boolean);
  const cat = naturalizeCategory(info.categories[0]);
  const intents = ["맛집", "술집", "회식"];

  // 1. 도시/구/동 + 카테고리
  for (const loc of [city, gu, ...dongs].filter(Boolean)) {
    if (cat) seeds.add(`${loc} ${cat}`);
    seeds.add(`${loc} 맛집`);
  }
  // 2. 도시 + 동 + 카테고리 (광주 동명동 이자카야 같은 패턴)
  if (city) {
    for (const d of dongs) {
      if (cat) seeds.add(`${city} ${d} ${cat}`);
    }
  }
  // 3. POI + 카테고리/맛집
  const allLandmarks = [...pois.map(p => p.name), ...(info.landmarkBonus || [])];
  for (const lm of allLandmarks.slice(0, 6)) {
    if (cat) seeds.add(`${lm} ${cat}`);
    seeds.add(`${lm} 맛집`);
  }

  return [...seeds].slice(0, 12);
}

async function geminiNaturalize(info, pois, geminiKey, excluded, allowMenu) {
  const excludedList = excluded && excluded.size > 0 ? [...excluded].slice(0, 150) : null;
  const categoriesText = JSON.stringify(info.categories);
  const poiNames = (pois || []).map(p => p.name).concat(info.landmarkBonus || []).slice(0, 25);
  const menusText = JSON.stringify((info.menus || []).slice(0, 12));

  const baseHeader = `당신은 네이버 플레이스에서 사람들이 실제로 검색하는 지역 검색어를 잘 아는 전문가입니다.

[매장 컨텍스트]
- 도시: ${info.regions?.city || "(미상)"}
- 구/군: ${info.regions?.gu || "(미상)"}
- 행정동: ${info.regions?.hDong || "(미상)"}
- 법정동: ${info.regions?.bDong || "(미상)"}
- 그 외 주소 단위: ${JSON.stringify((info.locations || []).filter(l => l !== info.regions?.city && l !== info.regions?.gu))}
- 매장 카테고리: ${categoriesText}
- 검증된 주변 명소/지하철역/장소(Kakao API): ${JSON.stringify(poiNames)}
${allowMenu ? `- 매장 메뉴(폴백용): ${menusText}` : ""}`;

  const naturalRules = `[필수 규칙]
1. 형식은 다음 패턴 중 하나여야 함:
   - {도시명} {카테고리}        (예: 광주 이자카야)
   - {도시명} {동/구} {카테고리}  (예: 광주 동명동 이자카야)
   - {동/구} {카테고리}          (예: 동명동 이자카야)
   - {명소/역} {카테고리}        (예: 문화전당역 이자카야)
   - {명소/역} 맛집/술집/회식    (예: 광주예술의거리 술집)
   - {도시명} {명소} {카테고리}   (예: 광주 예술의거리 이자카야)
2. 카테고리는 일반 사람이 쓰는 단어로 자연화:
   - "요리주점" → "이자카야", "술집", "퓨전요리"
   - "삼겹살" → "삼겹살", "고기집"
3. 행정동(${info.regions?.hDong || ""})과 법정동(${info.regions?.bDong || ""})이 다르면 둘 다 사용하세요. 사람들은 인지도 높은 쪽을 검색합니다.
4. 명소/역 이름은 위 [검증된 목록]에만 있는 것만 쓰세요. 새로 만들지 마세요.
5. 매장명(${info.storeName}) 자체는 포함 금지.
6. 메뉴명을 조합어로 쓰지 마세요. (특히 외국어/낯선 메뉴는 검색량 0)
7. JSON 배열만 응답.

[좋은 예시]
["광주 이자카야", "광주 동명동 이자카야", "동명동 술집", "문화전당역 이자카야", "광주 예술의거리 술집", "동구 이자카야", "광주 동구 술집"]

[나쁜 예시 — 절대 만들지 마세요]
["동구 오렌지치킨 저녁", "장동 명란 오믈렛 맛집", "광주 스부타 점심"]`;

  const menuFallbackRules = `[필수 규칙 — 메뉴 폴백 모드]
1차 라운드(자연스러운 지역 키워드)에서 5위 이내 목표 10개를 못 채워서, 메뉴를 활용한 추가 조합이 필요한 단계입니다.
1. 다음 패턴을 사용하세요:
   - {동/구/도시} {대표메뉴}     (예: 동명동 삼겹살, 광주 파스타)
   - {명소/역} {대표메뉴}        (예: 문화전당역 파스타)
   - {도시} {대표메뉴} 맛집      (예: 광주 파스타 맛집)
2. 단, 다음 메뉴만 사용 가능:
   - 일반인이 들어본 익숙한 음식명 (삼겹살, 파스타, 스시, 라멘 등)
   - 외국어/생소한 요리 메뉴는 절대 제외 (예: 오렌지치킨, 잿방어감자말이, 명란 오믈렛 X)
3. 메뉴 + 의미 없는 수식어 조합 금지 (X "동구 메뉴X 저녁")
4. 행정동(${info.regions?.hDong || ""})과 법정동(${info.regions?.bDong || ""}) 둘 다 활용.
5. 매장명(${info.storeName}) 자체는 포함 금지.
6. JSON 배열만 응답.

[좋은 예시]
["광주 삼겹살", "동명동 삼겹살", "문화전당역 파스타", "광주 동구 파스타 맛집"]

[나쁜 예시]
["동구 명란 오믈렛", "장동 잿방어감자말이"]`;

  const prompt = `${baseHeader}

[당신의 임무]
${allowMenu ? "이전 라운드에서 자연스러운 지역 키워드로 10개를 못 채웠습니다. 메뉴를 결합한 추가 키워드 30개를 생성하세요." : "실제 사람이 네이버 모바일에서 '어디 가까운 데 ○○ 어디 좋을까' 하고 검색할 법한 자연스러운 키워드 40개 생성."}

${allowMenu ? menuFallbackRules : naturalRules}
${excludedList ? `\n[중복 제외]\n다음 키워드는 이미 시도했으니 제외: ${JSON.stringify(excludedList.slice(0, 80))}` : ""}`;

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

async function fetchKeywordVolumes(seedKeywords, naverAd, onDiag) {
  if (!naverAd?.apiKey || !naverAd?.secretKey || !naverAd?.customerId) return null;
  const acc = new Map();
  const diag = [];
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
      if (!r.ok) {
        const errText = await r.text().catch(() => "");
        diag.push(`HTTP ${r.status} — ${errText.slice(0, 300)}`);
        continue;
      }
      const data = await r.json();
      const list = data.keywordList || [];
      diag.push(`chunk ${i/5+1}: ${list.length}건`);
      for (const row of list) {
        const kw = (row.relKeyword || "").trim();
        if (!kw) continue;
        const pc = parseInt(String(row.monthlyPcQcCnt).replace(/[<>,\s]/g, ""), 10) || 0;
        const mobile = parseInt(String(row.monthlyMobileQcCnt).replace(/[<>,\s]/g, ""), 10) || 0;
        acc.set(kw, { pc, mobile, total: pc + mobile });
      }
    } catch (e) {
      diag.push(`예외: ${String(e?.message || e)}`);
    }
  }
  if (onDiag) onDiag(diag);
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

    // 2. 카카오 로컬 API로 진짜 POI + 행정구역 정보 확보
    let pois = [];
    let regions = { city: null, gu: null, hDong: null, bDong: null, raw: [] };
    let landmarkBonus = []; // 키워드 검색으로 찾은 추가 명소
    if (kakaoKey && info.coords) {
      send({ type: "stage_start", stage: "poi", message: `Kakao Local API로 반경 1.5km 주변 명소 조회 중...` });

      // 2a. 행정동 + 법정동 확보 (장동 / 동명동 같이 다른 동 이름)
      regions = await getKakaoRegions(info.coords, kakaoKey);
      send({ type: "info", message: `Kakao 지역: ${regions.city || "?"} ${regions.gu || "?"} (행정동: ${regions.hDong || "?"} · 법정동: ${regions.bDong || "?"})` });

      // 2b. 카테고리 검색 (역/명소/공공기관/학교/문화시설)
      pois = await getKakaoNearbyPOIs(info.coords, kakaoKey, (diag) => {
        for (const d of diag) send({ type: "info", message: `Kakao 진단: ${d}` });
      });

      // 2c. 키워드 검색으로 잘 알려진 명소·거리·광장 추가 발견
      const queries = ["거리", "광장", "공원", "역"];
      for (const q of queries) {
        const found = await getKakaoKeywordLandmarks(info.coords, kakaoKey, q);
        for (const name of found) {
          if (landmarkBonus.includes(name)) continue;
          if (pois.some(p => p.name === name)) continue;
          landmarkBonus.push(name);
        }
      }
      send({ type: "info", message: `Kakao 키워드 검색 명소: ${landmarkBonus.slice(0, 6).join(", ")}${landmarkBonus.length > 6 ? " ..." : ""}` });

      send({ type: "stage_done", stage: "poi", pois, regions, landmarkBonus });
    } else {
      send({ type: "info", message: kakaoKey ? "좌표 추출 실패 — POI 조회 건너뜀" : "KAKAO_REST_API_KEY 없음 — POI 조회 건너뜀" });
    }

    // 2d. 매장 정보에 카카오 지역 데이터 병합 (행정동/법정동 둘 다 활용)
    const allLocations = new Set(info.locations);
    if (regions.city) allLocations.add(regions.city);
    if (regions.gu) allLocations.add(regions.gu);
    if (regions.hDong) allLocations.add(regions.hDong);
    if (regions.bDong) allLocations.add(regions.bDong);
    info.locations = [...allLocations];
    info.regions = regions;
    info.landmarkBonus = landmarkBonus.slice(0, 10);

    // 3. Gemini로 자연 조합 생성 (1차: 메뉴 없이 자연스러운 지역 기반만)
    send({ type: "stage_start", stage: "keywords", message: "Gemini로 자연스러운 지역 키워드 조합 생성 중 (1차)..." });
    let geminiPool;
    try {
      geminiPool = await geminiNaturalize(info, pois, geminiKey, null, false);
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
      send({ type: "info", message: `검색량 시드: ${seeds.slice(0, 6).join(", ")}${seeds.length > 6 ? " ..." : ""}` });
      volumeMap = await fetchKeywordVolumes(seeds, naverAd, (diag) => {
        for (const d of diag) send({ type: "info", message: `검색광고 진단: ${d}` });
      });
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
        // round 1부터는 메뉴 폴백 모드 활성화 — 자연 키워드만으로 10개 못 채운 경우
        const allowMenu = true;
        send({ type: "retry_start", round, message: `재시도 ${round}/${REPEAT_LIMIT - 1}회차 — ${allowMenu ? "메뉴 폴백 모드로" : "자연 키워드로"} 새 조합 생성 중... (현재 ${found.length}/10)` });
        try {
          pool = await geminiNaturalize(info, pois, geminiKey, searchedSet, allowMenu);
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
