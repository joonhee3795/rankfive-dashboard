/* ============================================
   결과 대시보드 (TOP 10 키워드 분석 보고서)
   ============================================ */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const RESULT_KEYWORDS = [
  { rank: 1, kw: "수성동 천겹살",        volume: 8420,  competitors: 47, change: "+2", new: true,  cat: "메뉴", history: [3, 2, 2, 1, 1, 1, 1] },
  { rank: 1, kw: "범어네거리 삼겹살",    volume: 4120,  competitors: 28, change: "+1", new: false, cat: "명소", history: [4, 3, 2, 2, 1, 1, 1] },
  { rank: 2, kw: "수성동 삼겹살",        volume: 6710,  competitors: 52, change: "0",  new: false, cat: "메뉴", history: [3, 3, 2, 2, 2, 2, 2] },
  { rank: 2, kw: "범어네거리 회식장소",  volume: 5210,  competitors: 38, change: "+3", new: true,  cat: "명소", history: [5, 5, 4, 3, 3, 2, 2] },
  { rank: 3, kw: "수성구 천겹살",        volume: 5210,  competitors: 41, change: "+1", new: false, cat: "메뉴", history: [4, 4, 4, 3, 3, 3, 3] },
  { rank: 3, kw: "수성구 고기집",        volume: 12830, competitors: 89, change: "+2", new: false, cat: "업종", history: [5, 5, 4, 4, 3, 3, 3] },
  { rank: 4, kw: "수성못 맛집 추천",     volume: 4280,  competitors: 64, change: "-1", new: false, cat: "명소", history: [3, 3, 4, 4, 4, 4, 4] },
  { rank: 4, kw: "대구 수성 삼겹살",     volume: 6710,  competitors: 72, change: "0",  new: false, cat: "지역", history: [4, 4, 4, 4, 4, 4, 4] },
  { rank: 4, kw: "수성동 흑돼지",        volume: 2400,  competitors: 21, change: "+2", new: true,  cat: "메뉴", history: [null, null, 6, 5, 4, 4, 4] },
  { rank: 5, kw: "수성구청 회식",        volume: 3920,  competitors: 33, change: "0",  new: false, cat: "명소", history: [5, 5, 5, 5, 5, 5, 5] },
];

const Results = ({ goto }) => {
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);

  const dist = [0, 0, 0, 0, 0, 0];
  RESULT_KEYWORDS.forEach(k => dist[k.rank]++);

  return (
    <div data-screen-label="05 Results">
      <TopBar
        title="분석 결과"
        subtitle={<>
          <span style={{ color: "var(--ink-700)", fontWeight: 600 }}>섬부가든</span>
          {" · "}대구 수성구 · 2026.05.13 14:22 완료 · 3분 12초 소요
        </>}
        actions={
          <>
            <button className="btn btn-outline btn-sm">
              <Icon name="refresh" size={14}/>
              재스캔
            </button>
            <button className="btn btn-outline btn-sm">
              <Icon name="share" size={14}/>
              공유
            </button>
            <button className="btn btn-dark btn-sm">
              <Icon name="download" size={14}/>
              보고서 다운로드
            </button>
          </>
        }
      />

      <main style={{ padding: 32, maxWidth: 1400 }}>

        {/* 헤더: 종합 스코어 */}
        <ResultsScoreboard dist={dist}/>

        {/* 메인 그리드: TOP 키워드 + 인사이트 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginTop: 24 }}>

          {/* 좌측: 키워드 카드 */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.025em" }}>TOP 10 키워드</h2>
                <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2 }}>
                  287개 키워드 중 5위 이내 노출 10개 · 광고 슬롯 자동 제외
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--ink-100)", borderRadius: 8 }}>
                  <button onClick={() => setView("grid")} style={{
                    padding: "6px 10px", borderRadius: 6, display: "flex", alignItems: "center", gap: 5,
                    background: view === "grid" ? "white" : "transparent",
                    color: view === "grid" ? "var(--ink-900)" : "var(--ink-500)",
                    fontSize: 12, fontWeight: 600,
                    boxShadow: view === "grid" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  }}>
                    <Icon name="grid" size={13}/> 카드
                  </button>
                  <button onClick={() => setView("list")} style={{
                    padding: "6px 10px", borderRadius: 6, display: "flex", alignItems: "center", gap: 5,
                    background: view === "list" ? "white" : "transparent",
                    color: view === "list" ? "var(--ink-900)" : "var(--ink-500)",
                    fontSize: 12, fontWeight: 600,
                    boxShadow: view === "list" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  }}>
                    <Icon name="list" size={13}/> 표
                  </button>
                </div>
                <FilterPill label="정렬" value="순위 ↑"/>
              </div>
            </div>

            {view === "grid" ? (
              <KeywordGrid keywords={RESULT_KEYWORDS} onSelect={setSelected}/>
            ) : (
              <KeywordTable keywords={RESULT_KEYWORDS} onSelect={setSelected}/>
            )}
          </div>

          {/* 우측: 사이드 패널 */}
          <ResultsSidebar dist={dist}/>
        </div>

        {/* 6~10위 보너스 섹션 */}
        <BonusKeywords/>

      </main>
    </div>
  );
};

/* ---------- 헤더 스코어보드 ---------- */
const ResultsScoreboard = ({ dist }) => (
  <div style={{
    position: "relative",
    background: "linear-gradient(120deg, #0F1419 0%, #1A222B 50%, #028A3F 100%)",
    borderRadius: 20, padding: "32px 36px",
    color: "white", overflow: "hidden",
  }}>
    <div aria-hidden style={{
      position: "absolute", inset: 0,
      backgroundImage: "radial-gradient(rgba(3,199,90,0.15) 1px, transparent 1px)",
      backgroundSize: "26px 26px", opacity: 0.5,
    }}/>
    <div style={{ position: "relative", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 40, alignItems: "center" }}>

      {/* 좌측: 매장 정보 */}
      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
        <div style={{
          width: 76, height: 76, borderRadius: 18,
          background: "linear-gradient(135deg, #FFB78C, #EF7C3C)",
          display: "grid", placeItems: "center",
          fontSize: 30, fontWeight: 800, color: "white",
          boxShadow: "0 12px 28px rgba(239,124,60,0.4)",
        }}>섬</div>
        <div>
          <Tag tone="green" icon="check">스캔 완료</Tag>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 6 }}>섬부가든</h2>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
            대구 수성구 수성동4가 · 한식 &gt; 삼겹살 · ⭐ 4.6 (1,284)
          </div>
        </div>
      </div>

      {/* 중앙: 메인 스코어 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, padding: "0 20px" }}>
        {[
          { v: 10, l: "5위 이내 키워드", c: "var(--green-300)", suffix: "/10", main: true },
          { v: 287, l: "총 스캔 키워드", c: "white" },
          { v: "62%", l: "광고 필터링률", c: "rgba(255,255,255,0.85)" },
          { v: "3:12", l: "분석 소요시간", c: "rgba(255,255,255,0.85)" },
        ].map((s, i) => (
          <div key={i} style={{
            paddingLeft: i === 0 ? 0 : 24,
            borderLeft: i === 0 ? "0" : "1px solid rgba(255,255,255,0.1)",
          }}>
            <div style={{
              fontSize: s.main ? 48 : 28, fontWeight: 800,
              color: s.c, letterSpacing: "-0.035em", lineHeight: 1,
              display: "flex", alignItems: "baseline", gap: 3,
            }}>
              {s.v}
              {s.suffix && <span style={{ fontSize: 16, opacity: 0.5 }}>{s.suffix}</span>}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6, fontWeight: 500 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* 우측: 다음 액션 */}
      <div style={{
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14, padding: 16, minWidth: 200,
      }}>
        <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600, marginBottom: 4 }}>다음 자동 재스캔</div>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>5월 20일 (월)</div>
        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
          <Icon name="refresh" size={11}/> 주간 자동 재스캔 ON
        </div>
      </div>
    </div>
  </div>
);

/* ---------- 키워드 카드 그리드 ---------- */
const KeywordGrid = ({ keywords, onSelect }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
    {keywords.map((k, i) => (
      <KeywordCard key={i} k={k} onClick={() => onSelect && onSelect(k)}/>
    ))}
  </div>
);

const KeywordCard = ({ k, onClick }) => {
  const isTop = k.rank === 1;
  const isStrong = k.rank <= 2;
  const changeColor = k.change.startsWith("+") ? "var(--green-600)"
                    : k.change.startsWith("-") ? "#B43232" : "var(--ink-500)";
  return (
    <div
      onClick={onClick}
      className="card"
      style={{
        padding: 20, cursor: "pointer", transition: "all 0.2s",
        background: isTop ? "linear-gradient(135deg, #E8F8F0 0%, #FFFFFF 60%)" : "white",
        borderColor: isTop ? "var(--green-200)" : "var(--border)",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-xs)"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: isTop ? "linear-gradient(135deg, #03C75A, #02A94C)"
                     : isStrong ? "var(--ink-900)" : "white",
            color: isStrong ? "white" : "var(--ink-700)",
            border: !isStrong ? "1.5px solid var(--border)" : "0",
            display: "grid", placeItems: "center",
            fontWeight: 800, fontSize: 22, letterSpacing: "-0.04em",
            boxShadow: isTop ? "0 8px 16px rgba(3,199,90,0.3)" : "none",
            position: "relative",
          }}>
            {k.rank}
            {isTop && <Icon name="crown" size={14} style={{ position: "absolute", top: -8, right: -8, color: "var(--amber-500)" }}/>}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-500)", letterSpacing: "0.05em" }}>
                {k.rank}위 노출
              </span>
              {k.new && <Tag tone="green">NEW</Tag>}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 2 }}>
              {k.kw}
            </div>
          </div>
        </div>
        <button style={{ color: "var(--ink-400)", padding: 4 }}>
          <Icon name="bookmark" size={16}/>
        </button>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: 12, padding: "14px 0", borderTop: "1px dashed var(--border)", borderBottom: "1px dashed var(--border)",
      }}>
        <Cell label="월 검색량" value={k.volume.toLocaleString()} sub="회"/>
        <Cell label="경쟁 매장" value={k.competitors} sub="개"/>
        <Cell label="순위 변동" value={k.change} sub="(7일)" color={changeColor}/>
      </div>

      <div style={{
        marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end",
      }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--ink-500)", marginBottom: 4 }}>최근 7일 순위 추이</div>
          <RankSparkline data={k.history}/>
        </div>
        <Tag tone="outline">{k.cat}</Tag>
      </div>
    </div>
  );
};

const Cell = ({ label, value, sub, color }) => (
  <div>
    <div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 500 }}>{label}</div>
    <div style={{ marginTop: 2 }}>
      <span style={{ fontSize: 17, fontWeight: 800, color: color || "var(--ink-900)", letterSpacing: "-0.02em" }}>{value}</span>
      <span style={{ fontSize: 11, color: "var(--ink-500)", marginLeft: 2 }}>{sub}</span>
    </div>
  </div>
);

/* ---------- 순위 스파크라인 ---------- */
const RankSparkline = ({ data, w = 80, h = 28 }) => {
  const clean = data.map(v => (typeof v === "number" ? v : null));
  const maxRank = 6;
  const points = clean.map((v, i) => {
    if (v == null) return null;
    const x = (i / (clean.length - 1)) * w;
    const y = ((v - 1) / (maxRank - 1)) * (h - 6) + 3;
    return [x, y];
  });
  const validPoints = points.filter(p => p != null);
  const path = validPoints.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const last = validPoints[validPoints.length - 1];
  return (
    <svg width={w} height={h}>
      <path d={path} fill="none" stroke="var(--green-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {last && <circle cx={last[0]} cy={last[1]} r="3" fill="var(--green-500)"/>}
    </svg>
  );
};

/* ---------- 키워드 표 ---------- */
const KeywordTable = ({ keywords, onSelect }) => (
  <div className="card" style={{ overflow: "hidden" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ background: "var(--ink-50)", textAlign: "left", color: "var(--ink-600)", fontSize: 12, fontWeight: 700 }}>
          <th style={{ padding: "12px 16px", width: 60 }}>순위</th>
          <th style={{ padding: "12px 12px" }}>키워드</th>
          <th style={{ padding: "12px 12px" }}>분류</th>
          <th style={{ padding: "12px 12px", textAlign: "right" }}>월 검색량</th>
          <th style={{ padding: "12px 12px", textAlign: "right" }}>경쟁</th>
          <th style={{ padding: "12px 12px", textAlign: "right" }}>변동</th>
          <th style={{ padding: "12px 16px", width: 100 }}>7일 추이</th>
        </tr>
      </thead>
      <tbody>
        {keywords.map((k, i) => (
          <tr key={i} onClick={() => onSelect && onSelect(k)}
            style={{ borderTop: "1px solid var(--border)", cursor: "pointer", transition: "background 0.1s" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--ink-50)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <td style={{ padding: "14px 16px" }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: k.rank === 1 ? "var(--green-500)" : k.rank <= 2 ? "var(--ink-900)" : "white",
                color: k.rank <= 2 ? "white" : "var(--ink-700)",
                border: k.rank > 2 ? "1px solid var(--border)" : "0",
                display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14,
              }}>{k.rank}</div>
            </td>
            <td style={{ padding: "14px 12px", fontWeight: 700, fontSize: 14 }}>
              {k.kw}
              {k.new && <Tag tone="green" style={{ marginLeft: 8 }}>NEW</Tag>}
            </td>
            <td style={{ padding: "14px 12px" }}><Tag tone="outline">{k.cat}</Tag></td>
            <td style={{ padding: "14px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{k.volume.toLocaleString()}</td>
            <td style={{ padding: "14px 12px", textAlign: "right", color: "var(--ink-600)", fontFamily: "var(--font-mono)" }}>{k.competitors}</td>
            <td style={{ padding: "14px 12px", textAlign: "right", fontWeight: 700,
                color: k.change.startsWith("+") ? "var(--green-600)" : k.change.startsWith("-") ? "#B43232" : "var(--ink-500)" }}>
              {k.change}
            </td>
            <td style={{ padding: "14px 16px" }}>
              <RankSparkline data={k.history}/>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ---------- 사이드바: 분포 + 추천 ---------- */
const ResultsSidebar = ({ dist }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    {/* 순위 분포 */}
    <div className="card" style={{ padding: 22 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>순위 분포</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2, 3, 4, 5].map(r => {
          const cnt = dist[r];
          const max = Math.max(...dist.slice(1, 6), 1);
          return (
            <div key={r} style={{ display: "grid", gridTemplateColumns: "32px 1fr 24px", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: r === 1 ? "var(--green-500)" : r === 2 ? "var(--ink-800)" : "var(--ink-100)",
                color: r <= 2 ? "white" : "var(--ink-700)",
                display: "grid", placeItems: "center",
                fontWeight: 800, fontSize: 12,
              }}>{r}</div>
              <div style={{ height: 8, background: "var(--ink-100)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{
                  width: `${(cnt / max) * 100}%`, height: "100%",
                  background: r === 1 ? "var(--green-500)" : "var(--ink-700)",
                  borderRadius: 999, transition: "width 0.6s ease",
                }}/>
              </div>
              <div style={{ textAlign: "right", fontWeight: 800, fontSize: 14, color: "var(--ink-900)" }}>{cnt}</div>
            </div>
          );
        })}
      </div>
    </div>

    {/* 카테고리 분포 */}
    <div className="card" style={{ padding: 22 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>키워드 유형</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { l: "메뉴 기반", v: 4, c: "var(--green-500)" },
          { l: "명소/사거리", v: 4, c: "var(--indigo-500)" },
          { l: "행정구역", v: 1, c: "var(--amber-500)" },
          { l: "업종 일반", v: 1, c: "var(--rose-500)" },
        ].map((cat, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: cat.c }}/>
            <span style={{ flex: 1, fontSize: 13, color: "var(--ink-700)" }}>{cat.l}</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--ink-900)" }}>{cat.v}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, padding: 12, background: "var(--ink-50)", borderRadius: 10, fontSize: 12, color: "var(--ink-600)", lineHeight: 1.55 }}>
        💡 <strong style={{ color: "var(--ink-900)" }}>인사이트:</strong> 메뉴 + 명소 조합 키워드의 비중이 높습니다.
        '천겹살', '범어네거리' 같은 강점 단어 중심으로 추가 마케팅을 권장드려요.
      </div>
    </div>

    {/* AI 추천 액션 */}
    <div className="card" style={{
      padding: 22,
      background: "linear-gradient(135deg, #0F1419 0%, #1A222B 100%)",
      color: "white", borderColor: "transparent",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Icon name="sparkle" size={16} style={{ color: "var(--green-300)" }}/>
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>AI 추천 액션</h3>
      </div>
      <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          "'수성구청 회식'이 5위로 진입했어요. 회사 모임 콘텐츠를 보강하세요.",
          "'들안길 회식장소' 8위 — 메뉴 사진에 '들안길' 키워드 추가 권장.",
          "경쟁사 'OOO한우'가 상위권 진입 중. 가격 비교 콘텐츠 검토.",
        ].map((tip, i) => (
          <li key={i} style={{
            display: "grid", gridTemplateColumns: "20px 1fr", gap: 8,
            fontSize: 12.5, lineHeight: 1.55, opacity: 0.9,
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: 999,
              background: "rgba(3,199,90,0.2)", color: "var(--green-300)",
              display: "grid", placeItems: "center", flexShrink: 0,
              fontSize: 10, fontWeight: 800,
            }}>{i + 1}</div>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
      <button className="btn btn-primary btn-sm" style={{ width: "100%", marginTop: 18 }}>
        <Icon name="sparkle" size={13}/>
        전체 인사이트 보기
      </button>
    </div>
  </div>
);

/* ---------- 보너스 키워드 (6~10위) ---------- */
const BonusKeywords = () => {
  const bonus = [
    { rank: 6, kw: "수성구청역 맛집",    vol: 4820, gap: -1 },
    { rank: 7, kw: "수성구 삼겹살 맛집", vol: 12830, gap: -2 },
    { rank: 7, kw: "들안길 삼겹살",       vol: 1980, gap: -2 },
    { rank: 8, kw: "들안길 회식장소",    vol: 2810, gap: -3 },
    { rank: 8, kw: "수성동 항정살",       vol: 1410, gap: -3 },
    { rank: 9, kw: "범어동 회식",         vol: 2100, gap: -4 },
  ];
  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.025em" }}>곧 진입 가능한 키워드</h2>
        <Tag tone="warn" icon="flame">6~10위 권</Tag>
        <span style={{ fontSize: 13, color: "var(--ink-500)" }}>조금만 더 노력하면 5위 안에 들어올 키워드들이에요.</span>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <tbody>
            {bonus.map((b, i) => (
              <tr key={i} style={{ borderTop: i === 0 ? "0" : "1px solid var(--border)" }}>
                <td style={{ padding: "14px 24px", width: 80 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: "var(--ink-100)", color: "var(--ink-700)",
                    display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13,
                  }}>{b.rank}</div>
                </td>
                <td style={{ padding: "14px 12px", fontWeight: 700, fontSize: 14 }}>{b.kw}</td>
                <td style={{ padding: "14px 12px" }}>
                  <Tag tone="warn">5위까지 {Math.abs(b.gap)}계단</Tag>
                </td>
                <td style={{ padding: "14px 12px", textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-700)" }}>월 {b.vol.toLocaleString()}회 검색</div>
                </td>
                <td style={{ padding: "14px 24px", textAlign: "right", width: 100 }}>
                  <button className="btn btn-ghost btn-sm">
                    개선 가이드
                    <Icon name="arrowR" size={12}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

Object.assign(window, { Results });
