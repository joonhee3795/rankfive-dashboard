/* ============================================
   스캔 진행 화면 (URL 입력 → 실시간 로그 + 프로그레스)
   ============================================ */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const SCAN_STAGES = [
  { id: "fetch",   t: "매장 정보 수집",      d: "플레이스 HTML 파싱 · 메뉴 · 명소 추출" },
  { id: "ai",      t: "AI 키워드 추론",      d: "Gemini 2.5가 50+개 자연어 키워드 생성" },
  { id: "rank",    t: "오가닉 순위 추적",    d: "모바일 통합검색 5위 이내만 정밀 필터링" },
  { id: "verify",  t: "결과 검증 & 정리",    d: "광고 슬롯 제거 · 중복 키워드 통합" },
];

/* ---------- 스캔 진행 화면 ---------- */
const Scan = ({ goto }) => {
  const [stageIdx, setStageIdx] = useState(0);
  const [scanned, setScanned] = useState(0);
  const [found, setFound] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const logRef = useRef(null);

  const script = useMemo(() => buildScript(), []);

  useEffect(() => {
    if (!isPlaying) return;
    if (scanned >= script.length) return;

    const ev = script[scanned];
    const delay = ev.delay ?? 350;
    const t = setTimeout(() => {
      setLogs(L => [...L.slice(-200), ev]);
      setScanned(s => s + 1);
      if (ev.type === "hit") setFound(f => f + 1);
      if (ev.stage != null) setStageIdx(ev.stage);
    }, delay);
    return () => clearTimeout(t);
  }, [scanned, isPlaying, script]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const progress = Math.min(scanned / script.length, 1);
  const isDone = scanned >= script.length;

  return (
    <div data-screen-label="04 Scan in progress">
      <TopBar
        title="실시간 스캔 진행 중"
        subtitle="섬부가든 · 대구 수성구 수성동4가"
        actions={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setIsPlaying(!isPlaying)}>
              <Icon name={isPlaying ? "pause" : "play"} size={14}/>
              {isPlaying ? "일시정지" : "재개"}
            </button>
            {isDone
              ? <button className="btn btn-primary btn-sm" onClick={() => goto("results")}>
                  결과 보기
                  <Icon name="arrowR" size={14}/>
                </button>
              : <button className="btn btn-outline btn-sm" style={{ color: "var(--rose-500)" }}>
                  <Icon name="x" size={14}/>
                  중단
                </button>
            }
          </>
        }
      />

      <main style={{ padding: 32, display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 20, maxWidth: 1400 }}>

        {/* 좌측: 매장 + 단계 + KPI */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* 매장 정보 카드 */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 14,
                background: "linear-gradient(135deg, #FFB78C, #EF7C3C)",
                color: "white", fontSize: 24, fontWeight: 800,
                display: "grid", placeItems: "center",
                flexShrink: 0,
              }}>섬</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.025em" }}>섬부가든</h2>
                  <Tag tone="gray">place_id: 12489327</Tag>
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-600)", marginBottom: 8 }}>
                  대구광역시 수성구 수성동4가 · 한식 &gt; 삼겹살 · ⭐ 4.6 (리뷰 1,284)
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["수성동", "수성구", "수성동4가", "범어네거리", "수성못", "수성구청"].map(t => (
                    <Tag key={t} tone="outline" icon="map">{t}</Tag>
                  ))}
                </div>
              </div>
            </div>

            {/* 추출된 데이터 미니 그리드 */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12,
              padding: "16px 18px", background: "var(--ink-50)", borderRadius: 12,
              border: "1px solid var(--border)",
            }}>
              {[
                { l: "지역 추출", v: 6, i: "map" },
                { l: "메뉴 추출", v: 18, i: "list" },
                { l: "주변 명소", v: 4, i: "star" },
                { l: "대표 키워드", v: 12, i: "spark" },
              ].map((x, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "white", border: "1px solid var(--border)",
                    display: "grid", placeItems: "center", color: "var(--green-600)",
                  }}>
                    <Icon name={x.i} size={15}/>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>{x.v}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 600, marginTop: 2 }}>{x.l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 단계 트래커 */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>분석 단계</h3>
                <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>현재 단계: {SCAN_STAGES[stageIdx].t}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 13, color: "var(--ink-500)" }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-900)", letterSpacing: "-0.02em" }}>
                    {Math.round(progress * 100)}
                  </span>%
                </div>
              </div>
            </div>

            {/* 전체 프로그레스 바 */}
            <div style={{
              height: 8, background: "var(--ink-100)", borderRadius: 999,
              overflow: "hidden", marginBottom: 22,
            }}>
              <div style={{
                width: `${progress * 100}%`, height: "100%",
                background: "linear-gradient(90deg, var(--green-400), var(--green-500))",
                borderRadius: 999, transition: "width 0.3s ease",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                  animation: "shimmer 1.4s linear infinite",
                  backgroundSize: "50% 100%",
                }}/>
              </div>
            </div>

            {/* 단계 리스트 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {SCAN_STAGES.map((s, i) => {
                const status = i < stageIdx ? "done" : i === stageIdx ? "active" : "pending";
                return (
                  <div key={s.id} style={{
                    display: "grid", gridTemplateColumns: "32px 1fr auto",
                    alignItems: "center", gap: 14,
                    padding: "12px 4px",
                    borderTop: i === 0 ? "0" : "1px solid var(--border)",
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: status === "done" ? "var(--green-500)"
                                  : status === "active" ? "white"
                                  : "var(--ink-100)",
                      color: status === "done" ? "white" : "var(--ink-500)",
                      border: status === "active" ? "2px solid var(--green-500)" : "0",
                      display: "grid", placeItems: "center",
                      fontSize: 12, fontWeight: 800,
                      animation: status === "active" ? "pulse-ring 1.4s infinite" : "none",
                      position: "relative",
                    }}>
                      {status === "done"
                        ? <Icon name="check" size={14} stroke={3}/>
                        : <span>{i + 1}</span>}
                    </div>
                    <div>
                      <div style={{
                        fontSize: 14, fontWeight: 600,
                        color: status === "pending" ? "var(--ink-400)" : "var(--ink-900)",
                      }}>{s.t}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{s.d}</div>
                    </div>
                    {status === "done" && <Tag tone="green" icon="check">완료</Tag>}
                    {status === "active" && (
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        fontSize: 12, fontWeight: 700, color: "var(--green-600)",
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: 999, background: "var(--green-500)",
                          animation: "pulse-dot 1.2s infinite",
                        }}/>
                        진행 중
                      </div>
                    )}
                    {status === "pending" && <span style={{ fontSize: 12, color: "var(--ink-400)" }}>대기</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 실시간 KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <KPICard label="스캔한 키워드" value={scanned} suffix="개" trend={<span>{Math.round(scanned * 0.7)}건 / 분</span>}/>
            <KPICard label="5위 이내 발견" value={found} suffix={`/ 10`} highlight/>
            <KPICard label="광고 제외" value={Math.floor(scanned * 0.18)} suffix="건" sub="자동 필터링됨"/>
          </div>

          {/* 현재 발견된 키워드 미리보기 */}
          <FoundList logs={logs} found={found}/>

        </div>

        {/* 우측: 터미널 로그 */}
        <LogTerminal logs={logs} found={found} scanned={scanned} isDone={isDone}/>

      </main>
    </div>
  );
};

const KPICard = ({ label, value, suffix, trend, sub, highlight }) => (
  <div className="card" style={{
    padding: 18,
    background: highlight ? "linear-gradient(135deg, #E8F8F0 0%, #C9EFDA 100%)" : "white",
    borderColor: highlight ? "var(--green-200)" : "var(--border)",
  }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: highlight ? "var(--green-700)" : "var(--ink-500)" }}>{label}</div>
    <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 4 }}>
      <span style={{
        fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em",
        color: highlight ? "var(--green-700)" : "var(--ink-900)",
        fontFamily: "var(--font-mono)",
      }}>{value}</span>
      <span style={{ fontSize: 13, color: highlight ? "var(--green-700)" : "var(--ink-500)", fontWeight: 600 }}>{suffix}</span>
    </div>
    {trend && <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 4 }}>{trend}</div>}
    {sub && <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 4 }}>{sub}</div>}
  </div>
);

/* ---------- 발견된 키워드 카드 ---------- */
const FoundList = ({ logs, found }) => {
  const hits = logs.filter(l => l.type === "hit").slice(-10);
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="target" size={18} style={{ color: "var(--green-600)" }}/>
          <h3 style={{ fontSize: 14, fontWeight: 700 }}>발견된 5위 키워드</h3>
          <Tag tone="green">{found} / 10</Tag>
        </div>
      </div>
      {hits.length === 0 ? (
        <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--ink-400)", fontSize: 13 }}>
          🔎 분석 시작 중입니다... 곧 첫 키워드를 발견할 거예요.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {hits.map((h, i) => (
            <div key={i} className="fade-in" style={{
              display: "grid", gridTemplateColumns: "32px 1fr auto auto",
              alignItems: "center", gap: 12,
              padding: "12px 20px",
              borderTop: i === 0 ? "0" : "1px solid var(--border)",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: h.rank === 1 ? "var(--green-500)" : h.rank === 2 ? "var(--ink-800)" : "white",
                color: h.rank <= 2 ? "white" : "var(--ink-700)",
                border: h.rank > 2 ? "1px solid var(--border)" : "0",
                display: "grid", placeItems: "center",
                fontWeight: 800, fontSize: 12,
              }}>{h.rank}</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{h.kw}</div>
              <Tag tone="green">{h.volume.toLocaleString()}/월</Tag>
              <Icon name="checkC" size={16} style={{ color: "var(--green-500)" }}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- 터미널 로그 ---------- */
const LogTerminal = ({ logs, found, scanned, isDone }) => {
  const logRef = useRef(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  return (
    <div style={{
      position: "sticky", top: 92, height: "calc(100vh - 124px)",
      background: "var(--dark-900)",
      borderRadius: 16,
      border: "1px solid var(--dark-line)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    }}>
      {/* 헤더 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px",
        borderBottom: "1px solid var(--dark-line)",
        background: "var(--dark-800)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ width: 11, height: 11, borderRadius: 999, background: "#FF5F57" }}/>
            <span style={{ width: 11, height: 11, borderRadius: 999, background: "#FEBC2E" }}/>
            <span style={{ width: 11, height: 11, borderRadius: 999, background: "#28C840" }}/>
          </div>
          <div style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--dark-sub)", marginLeft: 8 }}>
            rankfive @ scanner — 섬부가든.log
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: isDone ? "var(--green-400)" : "var(--amber-500)" }}>
            <span style={{
              width: 7, height: 7, borderRadius: 999,
              background: "currentColor",
              animation: !isDone ? "pulse-dot 1.4s infinite" : "none",
            }}/>
            {isDone ? "COMPLETE" : "LIVE"}
          </div>
          <button style={{ color: "var(--dark-sub)" }}>
            <Icon name="copy" size={14}/>
          </button>
        </div>
      </div>

      {/* 본문 로그 */}
      <div ref={logRef} className="has-scroll" style={{
        flex: 1, overflowY: "auto",
        padding: "16px 0",
        fontFamily: "var(--font-mono)",
        fontSize: 12.5, lineHeight: 1.65,
        color: "var(--dark-text)",
      }}>
        {logs.length === 0 ? (
          <div style={{ padding: "12px 24px", color: "var(--dark-sub)" }}>
            $ rankfive scan --url https://m.place.naver.com/restaurant/12489327
            <br/>
            <span style={{ color: "var(--green-400)" }}>✓ </span>
            <span style={{ color: "var(--dark-text)" }}>Initializing scanner...</span>
            <span style={{ color: "var(--dark-text)", animation: "blink 1s infinite" }}>▊</span>
          </div>
        ) : (
          logs.map((l, i) => <LogLine key={i} log={l}/>)
        )}
        {!isDone && (
          <div style={{ padding: "4px 24px", color: "var(--dark-sub)" }}>
            <span style={{ color: "var(--green-400)", animation: "blink 1s infinite" }}>▊</span>
          </div>
        )}
        {isDone && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--dark-line)", marginTop: 12 }}>
            <div style={{ color: "var(--green-400)", fontWeight: 700 }}>✨ Scan completed in 3m 12s</div>
            <div style={{ color: "var(--dark-sub)", marginTop: 4 }}>10 top-5 keywords discovered out of {scanned} scanned.</div>
            <div style={{ color: "var(--dark-sub)" }}>$ <span style={{ animation: "blink 1s infinite" }}>▊</span></div>
          </div>
        )}
      </div>

      {/* 하단 통계 바 */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
        padding: 0,
        borderTop: "1px solid var(--dark-line)",
        background: "var(--dark-800)",
        fontFamily: "var(--font-mono)",
      }}>
        {[
          ["스캔", scanned, "var(--dark-text)"],
          ["발견", found, "var(--green-400)"],
          ["광고", Math.floor(scanned * 0.18), "var(--amber-500)"],
          ["순위밖", Math.max(0, scanned - found - Math.floor(scanned * 0.18)), "var(--dark-sub)"],
        ].map(([k, v, c], i) => (
          <div key={k} style={{
            padding: "12px 14px",
            borderLeft: i === 0 ? "0" : "1px solid var(--dark-line)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: c, letterSpacing: "-0.02em" }}>{v}</div>
            <div style={{ fontSize: 10, color: "var(--dark-sub)", fontWeight: 600, marginTop: 2, letterSpacing: "0.05em" }}>{k.toUpperCase()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LogLine = ({ log }) => {
  const palette = {
    info:   { fg: "var(--dark-text)", icon: "·", iconColor: "var(--dark-sub)" },
    stage:  { fg: "var(--indigo-500)", icon: "▶", iconColor: "var(--indigo-500)" },
    scan:   { fg: "var(--dark-text)", icon: "→", iconColor: "var(--dark-sub)" },
    miss:   { fg: "var(--dark-sub)", icon: "✗", iconColor: "var(--rose-500)" },
    ad:     { fg: "var(--amber-500)", icon: "$", iconColor: "var(--amber-500)" },
    hit:    { fg: "var(--green-400)", icon: "★", iconColor: "var(--green-400)" },
    error:  { fg: "var(--rose-500)", icon: "!", iconColor: "var(--rose-500)" },
    ok:     { fg: "var(--green-400)", icon: "✓", iconColor: "var(--green-400)" },
  };
  const c = palette[log.type] || palette.info;
  const time = log.t || timeStr();
  return (
    <div className="fade-in" style={{
      display: "grid",
      gridTemplateColumns: "56px 16px 1fr",
      gap: 6,
      padding: "2px 24px",
      background: log.type === "hit" ? "rgba(3,199,90,0.06)" : "transparent",
      borderLeft: log.type === "hit" ? "2px solid var(--green-500)" : "2px solid transparent",
    }}>
      <span style={{ color: "var(--dark-sub)", fontSize: 11 }}>{time}</span>
      <span style={{ color: c.iconColor, fontWeight: 700 }}>{c.icon}</span>
      <span style={{ color: c.fg }}>{log.msg}</span>
    </div>
  );
};

/* ---------- 시뮬레이션 스크립트 ---------- */
function timeStr() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function pad(n) { return String(n).padStart(2, "0"); }

function buildScript() {
  const events = [];
  const push = (e) => events.push(e);

  push({ type: "info",  msg: "Connecting to m.place.naver.com...", stage: 0, delay: 200 });
  push({ type: "stage", msg: "▶ STAGE 1 / 매장 정보 수집", delay: 600 });
  push({ type: "ok",    msg: "Headers: User-Agent set to Mobile Android (SM-G998N)", delay: 300 });
  push({ type: "scan",  msg: "Parsing place HTML (place_id: 12489327)...", delay: 500 });
  push({ type: "ok",    msg: "Extracted store name: 섬부가든", delay: 400 });
  push({ type: "ok",    msg: "Locations: [수성동4가, 수성구, 수성동, 대구]", delay: 350 });
  push({ type: "ok",    msg: "Menus: 천겹살, 흑돼지, 삼겹살, 목살, 항정살, 갈매기살... (18)", delay: 400 });
  push({ type: "ok",    msg: "Landmarks: 범어네거리, 수성못, 수성구청, 들안길", delay: 400 });

  push({ type: "stage", msg: "▶ STAGE 2 / Gemini 2.5 키워드 추론", stage: 1, delay: 800 });
  push({ type: "info",  msg: "Sending prompt to gemini-2.5-flash (12.4 KB)...", delay: 600 });
  push({ type: "ok",    msg: "Generated 52 keyword candidates", delay: 1200 });
  push({ type: "info",  msg: "Deduplicating with normalization (역, 동, 가)...", delay: 400 });
  push({ type: "ok",    msg: "Final keyword pool: 47 unique queries", delay: 500 });

  push({ type: "stage", msg: "▶ STAGE 3 / 오가닉 순위 추적", stage: 2, delay: 700 });

  const queries = [
    { kw: "수성동 천겹살",        rank: 1, volume: 8420 },
    { kw: "수성구 천겹살",        rank: 3, volume: 5210 },
    { kw: "수성구 삼겹살 맛집",   rank: 7, volume: 12830 },
    { kw: "수성동 삼겹살",        rank: 2, volume: 6710 },
    { kw: "범어동 삼겹살",        rank: 12, volume: 3140 },
    { kw: "수성못 맛집 추천",     rank: 4, volume: 4280 },
    { kw: "들안길 회식장소",      rank: 8, volume: 2810 },
    { kw: "수성구 회식 추천",     rank: "ad", volume: 0 },
    { kw: "수성구청 회식",        rank: 5, volume: 3920 },
    { kw: "범어네거리 회식장소",  rank: 2, volume: 5210 },
    { kw: "수성구 흑돼지",        rank: "ad", volume: 0 },
    { kw: "대구 수성 삼겹살",     rank: 4, volume: 6710 },
    { kw: "범어동 회식",          rank: 9, volume: 2100 },
    { kw: "수성구청역 맛집",      rank: 6, volume: 4820 },
    { kw: "수성동 회식장소",      rank: 5, volume: 3140 },
    { kw: "수성구 고기집",        rank: 3, volume: 12830 },
    { kw: "수성구청 점심",        rank: 11, volume: 2810 },
    { kw: "수성못 고기집",        rank: 6, volume: 3920 },
    { kw: "수성동 흑돼지",        rank: 4, volume: 2400 },
    { kw: "들안길 삼겹살",        rank: 7, volume: 1980 },
    { kw: "범어네거리 삼겹살",    rank: 1, volume: 4120 },
    { kw: "수성구 모임장소",      rank: 14, volume: 1820 },
    { kw: "수성동 항정살",        rank: 8, volume: 1410 },
  ];

  queries.forEach((q, i) => {
    push({ type: "scan", msg: `[${pad2(i + 1)}/47] Searching "${q.kw}"...`, delay: 220 });
    if (q.rank === "ad") {
      push({ type: "ad",   msg: `  → 광고 슬롯에 노출됨 — 오가닉 카운트 제외`, delay: 300 });
    } else if (q.rank <= 5) {
      push({ type: "hit",  msg: `  ★ TOP ${q.rank} HIT! "${q.kw}" — 월 검색 ${q.volume.toLocaleString()}`,
             rank: q.rank, kw: q.kw, volume: q.volume, delay: 320 });
    } else {
      push({ type: "miss", msg: `  ✗ ${q.rank}위 — 순위 밖`, delay: 250 });
    }
  });

  push({ type: "stage", msg: "▶ STAGE 4 / 결과 검증 & 정리", stage: 3, delay: 700 });
  push({ type: "info",  msg: "Deduplicating similar rankings (수성동/수성구/범어)...", delay: 500 });
  push({ type: "ok",    msg: "Final TOP 5 keyword count: 10", delay: 400 });
  push({ type: "ok",    msg: "Report generated · 3m 12s elapsed", delay: 500 });

  return events;
}
function pad2(n) { return String(n).padStart(2, "0"); }

Object.assign(window, { Scan });
