/* ============================================
   워크스페이스 셸 (사이드바 + 톱바)
   + 대시보드 + 검색 이력
   ============================================ */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ---------- 사이드바 ---------- */
const Sidebar = ({ active, goto }) => {
  const navItems = [
    { id: "dashboard", icon: "grid",    label: "대시보드" },
    { id: "history",   icon: "history", label: "검색 이력" },
  ];

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: "white",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      padding: "20px 14px",
      height: "100vh", position: "sticky", top: 0,
    }}>
      <div style={{ padding: "0 6px 16px" }}>
        <Logo size={24}/>
      </div>

      <button
        onClick={() => goto("dashboard")}
        className="btn btn-primary"
        style={{
          width: "100%", padding: "11px 14px",
          marginBottom: 22, borderRadius: 10, fontSize: 14,
          justifyContent: "center", gap: 8,
        }}>
        <Icon name="plus" size={16} stroke={2.4}/>
        새 스캔 시작
      </button>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(it => (
          <NavItem key={it.id} {...it} active={active === it.id} onClick={() => goto(it.id)}/>
        ))}
      </nav>

      <div style={{ flex: 1 }}/>
    </aside>
  );
};

const NavItem = ({ icon, label, active, onClick, badge, badgeColor }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 11,
    padding: "9px 10px", borderRadius: 8,
    background: active ? "var(--green-50)" : "transparent",
    color: active ? "var(--green-700)" : "var(--ink-700)",
    fontWeight: active ? 700 : 500,
    fontSize: 13.5, textAlign: "left", width: "100%",
    transition: "all 0.15s",
  }}
  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--ink-50)"; }}
  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
    <Icon name={icon} size={17} stroke={active ? 2.2 : 1.7}/>
    <span style={{ flex: 1 }}>{label}</span>
    {badge != null && (
      <span style={{
        background: badgeColor === "danger" ? "#FFE9E9" : "var(--ink-100)",
        color: badgeColor === "danger" ? "#B43232" : "var(--ink-600)",
        fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
      }}>{badge}</span>
    )}
  </button>
);

/* ---------- 톱바 ---------- */
const TopBar = ({ title, subtitle, actions }) => (
  <header style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 32px", background: "white",
    borderBottom: "1px solid var(--border)",
    position: "sticky", top: 0, zIndex: 5,
  }}>
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}>{title}</h1>
      {subtitle && <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2 }}>{subtitle}</div>}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {actions}
    </div>
  </header>
);

/* ---------- 대시보드 ---------- */
const Dashboard = ({ goto, openResult, startScan }) => {
  const [url, setUrl] = useState("");
  const [dbScans, setDbScans] = useState(null);

  useEffect(() => {
    fetch("/api/history")
      .then(r => r.json())
      .then(d => setDbScans(d.rows || []))
      .catch(() => setDbScans([]));
  }, []);

  const runScan = () => {
    if (!url.trim()) { alert("네이버 플레이스 URL을 입력하세요 (m.place.naver.com/...)"); return; }
    if (!/place\.naver\.com\/(restaurant|place|hairshop)\/\d+/.test(url)) {
      alert("올바른 네이버 플레이스 URL 형식이 아닙니다.\n예) https://m.place.naver.com/restaurant/1234567890");
      return;
    }
    if (startScan) startScan(url);
  };

  const parseRes = r => {
    let v = r.result;
    if (typeof v === "string") { try { v = JSON.parse(v); } catch { v = null; } }
    return v;
  };
  const getFound = r => { const v = parseRes(r); return Array.isArray(v) ? v : (v && Array.isArray(v.found) ? v.found : []); };
  const getScanned = r => {
    const v = parseRes(r);
    if (Array.isArray(v)) return v.length;
    if (Array.isArray(v?.scanned)) return v.scanned.length;
    if (typeof v?.scanned === "number") return v.scanned;
    return v?.scannedCount || 0;
  };

  const recentScans = (dbScans || []).map(r => {
    const found = getFound(r);
    return {
      raw: r,
      name: r.store_name,
      addr: r.keywords,
      cat: "",
      url: r.keywords,
      hit: found.length,
      scanned: getScanned(r),
      dur: "-",
      time: new Date(r.created_at).toLocaleString("ko-KR"),
      status: "완료",
      thumb: "linear-gradient(135deg, #03C75A, #028A3F)",
    };
  });

  return (
    <div data-screen-label="03 Dashboard">
      <TopBar title="대시보드" subtitle="5위 이내 키워드를 분석합니다."/>

      <main style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24, maxWidth: 1400 }}>

        {/* 빠른 스캔 카드 */}
        <div style={{
          position: "relative",
          background: "linear-gradient(120deg, #0F1419 0%, #1A222B 60%, #028A3F 100%)",
          borderRadius: 20, padding: 36, color: "white",
          overflow: "hidden",
        }}>
          <div aria-hidden style={{
            position: "absolute", inset: 0,
            backgroundImage: "radial-gradient(rgba(3,199,90,0.18) 1px, transparent 1px)",
            backgroundSize: "28px 28px", opacity: 0.6,
          }}/>
          <div style={{ position: "relative" }}>
            <div>
              <Tag tone="green" size="lg">⚡ 빠른 스캔</Tag>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginTop: 12, letterSpacing: "-0.035em", lineHeight: 1.2 }}>
                네이버 모바일 플레이스 URL을<br/>
                붙여넣으면 5위 키워드 10개 추출.
              </h2>
              <div style={{
                marginTop: 24,
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14, padding: 6,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <div style={{ paddingLeft: 14, color: "var(--green-300)", display: "flex" }}>
                  <Icon name="link" size={18}/>
                </div>
                <input placeholder="https://m.place.naver.com/restaurant/..."
                  value={url} onChange={e => setUrl(e.target.value)}
                  style={{
                    flex: 1, border: 0, outline: 0, padding: "12px 4px",
                    background: "transparent", color: "white",
                    fontSize: 14, fontFamily: "var(--font-mono)",
                  }}/>
                <button className="btn btn-primary" onClick={runScan}
                  style={{ padding: "10px 18px", borderRadius: 10 }}>
                  분석 시작
                  <Icon name="arrowR" size={14}/>
                </button>
              </div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 10 }}>
                💡 음식점·미용실·헬스장 등 모든 네이버 플레이스 업종 지원
              </div>
            </div>

          </div>
        </div>

        {dbScans !== null && recentScans.length > 0 && (
        <div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>최근 분석한 매장</h3>
                <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>DB에 저장된 최근 스캔</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => goto("history")}>
                전체보기
                <Icon name="arrowR" size={13}/>
              </button>
            </div>
            <div>
              {recentScans.map((s, i) => (
                <div key={i}
                  onClick={() => s.raw && openResult ? openResult(s.raw) : goto("results")}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr auto auto auto",
                    alignItems: "center", gap: 16,
                    padding: "16px 24px",
                    borderTop: i === 0 ? "0" : "1px solid var(--border)",
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--ink-50)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: s.thumb,
                    display: "grid", placeItems: "center",
                    color: "white", fontWeight: 800, fontSize: 14,
                  }}>{s.name.slice(0, 1)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em", marginBottom: 3 }} className="truncate">{s.name}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-500)" }} className="truncate">
                      키워드: {s.url}
                    </div>
                  </div>
                  <div style={{ textAlign: "center", minWidth: 80 }}>
                    <div style={{
                      fontSize: 20, fontWeight: 800,
                      color: s.error ? "var(--ink-400)" : "var(--green-600)",
                      letterSpacing: "-0.02em",
                    }}>{s.hit}</div>
                    <div style={{ fontSize: 10, color: "var(--ink-500)", fontWeight: 600 }}>5위 키워드</div>
                  </div>
                  <div style={{ minWidth: 100, fontSize: 12, color: "var(--ink-500)", textAlign: "right" }}>
                    <div>{s.scanned}개 분석</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 110, justifyContent: "flex-end" }}>
                    <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{s.time}</div>
                    <Icon name="chevron" size={14} style={{ color: "var(--ink-400)" }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        )}

      </main>
    </div>
  );
};

const MiniStat = ({ label, value, delta, tone = "green", unit }) => (
  <div style={{
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, padding: 14,
  }}>
    <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 500, marginBottom: 4 }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.025em" }}>{value}{unit}</span>
      <span style={{
        fontSize: 11, fontWeight: 700,
        color: tone === "green" ? "var(--green-300)" : "rgba(255,255,255,0.6)",
      }}>{delta}</span>
    </div>
  </div>
);

const Row = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
    <span style={{ color: "var(--ink-500)" }}>{label}</span>
    <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>{value}</span>
  </div>
);

/* ---------- 검색 이력 ---------- */
const History = ({ goto, openResult }) => {
  const [dbRows, setDbRows] = useState(null);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    fetch("/api/history")
      .then(r => r.json())
      .then(d => setDbRows(d.rows || []))
      .catch(() => setDbRows([]));
  }, []);

  const mapped = (dbRows || []).map(r => {
    let v = r.result;
    if (typeof v === "string") { try { v = JSON.parse(v); } catch { v = null; } }
    const found = Array.isArray(v) ? v : (v && Array.isArray(v.found) ? v.found : []);
    const scannedCnt = Array.isArray(v) ? v.length
      : Array.isArray(v?.scanned) ? v.scanned.length
      : typeof v?.scanned === "number" ? v.scanned
      : (v?.scannedCount || 0);
    const d = new Date(r.created_at);
    const pad = n => String(n).padStart(2, "0");
    return {
      raw: r,
      name: r.store_name,
      cat: "—",
      area: r.keywords,
      hit: found.length,
      scanned: scannedCnt,
      dur: "—",
      date: `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
      who: "나",
      status: scannedCnt === 0 ? "오류" : found.length === 0 ? "결과없음" : "완료",
    };
  });

  const fallback = [
    { name: "(샘플) 섬부가든", cat: "삼겹살", area: "대구 수성구", hit: 10, scanned: 287, dur: "3:12", date: "2026.05.13 14:22", who: "샘플", status: "완료" },
  ];

  const rows = (dbRows === null)
    ? []
    : mapped.length > 0
      ? mapped.filter(r => !keyword || r.name.toLowerCase().includes(keyword.toLowerCase()) || (r.area||"").toLowerCase().includes(keyword.toLowerCase()))
      : fallback;

  return (
    <div data-screen-label="06 History">
      <TopBar title="검색 이력"
        subtitle={dbRows === null ? "불러오는 중..." : `${(dbRows||[]).length}회의 스캔 기록 · 총 ${(dbRows||[]).reduce((s,r)=>{
          let v = r.result;
          if (typeof v === "string") { try { v = JSON.parse(v); } catch { v = null; } }
          if (Array.isArray(v)) return s + v.length;
          if (Array.isArray(v?.scanned)) return s + v.scanned.length;
          if (typeof v?.scanned === "number") return s + v.scanned;
          return s + (v?.scannedCount || 0);
        },0)}개 키워드 검색`}
      />
      <main style={{ padding: 32, maxWidth: 1400 }}>
        {/* 필터 바 */}
        <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <Icon name="search" size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }}/>
            <input className="input" placeholder="매장명 또는 키워드로 검색"
              value={keyword} onChange={e => setKeyword(e.target.value)}
              style={{ paddingLeft: 38 }}/>
          </div>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-ghost btn-sm" onClick={() => setKeyword("")}>
            <Icon name="refresh" size={14}/>
            초기화
          </button>
        </div>

        {/* 테이블 */}
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--ink-50)", textAlign: "left", color: "var(--ink-600)", fontSize: 12, fontWeight: 700 }}>
                <th style={{ padding: "12px 24px" }}>매장</th>
                <th style={{ padding: "12px 12px" }}>분석 키워드</th>
                <th style={{ padding: "12px 12px", textAlign: "right" }}>5위 키워드</th>
                <th style={{ padding: "12px 12px", textAlign: "right" }}>분석 수</th>
                <th style={{ padding: "12px 12px" }}>일시</th>
                <th style={{ padding: "12px 24px 12px 12px", textAlign: "right" }}>상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}
                  onClick={() => r.raw && openResult && openResult(r.raw)}
                  style={{ borderTop: "1px solid var(--border)", cursor: r.raw ? "pointer" : "default", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--ink-50)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: ["#FFB78C", "#B4A7F2", "#FFD56A", "#88C7F9", "#8FE0B6"][i % 5],
                        display: "grid", placeItems: "center",
                        fontWeight: 800, color: "white", fontSize: 13,
                      }}>{(r.name || "?").slice(0, 1)}</div>
                      <div style={{ fontWeight: 700, color: "var(--ink-900)" }}>{r.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 12px", color: "var(--ink-600)", fontSize: 12 }}>{r.area}</td>
                  <td style={{ padding: "14px 12px", textAlign: "right" }}>
                    <span style={{
                      fontSize: 16, fontWeight: 800,
                      color: r.hit === 0 ? "var(--ink-400)" : "var(--green-600)",
                      letterSpacing: "-0.02em",
                    }}>{r.hit}</span>
                  </td>
                  <td style={{ padding: "14px 12px", textAlign: "right", color: "var(--ink-600)", fontFamily: "var(--font-mono)" }}>{r.scanned}</td>
                  <td style={{ padding: "14px 12px", color: "var(--ink-500)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.date}</td>
                  <td style={{ padding: "14px 24px 14px 12px", textAlign: "right" }}>
                    <Tag tone={r.status === "완료" ? "green" : r.status === "결과없음" ? "gray" : "danger"}
                         icon={r.status === "완료" ? "check" : r.status === "오류" ? "x" : "info"}>
                      {r.status}
                    </Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--ink-500)",
          }}>
            전체 {rows.length}개 표시 중
          </div>
        </div>
      </main>
    </div>
  );
};

const FilterPill = ({ label, value }) => (
  <button style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 12px", borderRadius: 8,
    background: "white", border: "1px solid var(--border)",
    fontSize: 12.5, color: "var(--ink-700)",
  }}>
    <span style={{ color: "var(--ink-500)" }}>{label}:</span>
    <span style={{ fontWeight: 700 }}>{value}</span>
    <Icon name="chevronD" size={13} style={{ color: "var(--ink-400)" }}/>
  </button>
);

/* ---------- 결과 화면 ---------- */
const Results = ({ goto, scan }) => {
  const [latest, setLatest] = useState(null);
  const [showSearched, setShowSearched] = useState(false);

  useEffect(() => {
    if (scan) return;
    fetch("/api/history")
      .then(r => r.json())
      .then(d => setLatest((d.rows || [])[0] || null))
      .catch(() => {});
  }, [scan]);

  const active = scan || latest;

  if (!active) {
    return (
      <div data-screen-label="05 Results">
        <TopBar title="분석 결과" subtitle="아직 저장된 분석이 없습니다."/>
        <main style={{ padding: 32, maxWidth: 1400 }}>
          <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--ink-500)" }}>
            <div style={{ fontSize: 15, marginBottom: 16 }}>분석 데이터가 없습니다.</div>
            <button className="btn btn-primary" onClick={() => goto("dashboard")}>
              <Icon name="plus" size={14}/> 대시보드로 가서 분석 시작
            </button>
          </div>
        </main>
      </div>
    );
  }

  let rawResult = active.result;
  if (typeof rawResult === "string") {
    try { rawResult = JSON.parse(rawResult); } catch { rawResult = null; }
  }
  const results = Array.isArray(rawResult) ? rawResult : (rawResult && Array.isArray(rawResult.found) ? rawResult.found : []);
  const searchedList = (rawResult && Array.isArray(rawResult.scanned)) ? rawResult.scanned : [];
  const scannedCount = Array.isArray(rawResult)
    ? rawResult.length
    : (Array.isArray(rawResult?.scanned) ? rawResult.scanned.length : (typeof rawResult?.scanned === "number" ? rawResult.scanned : 0));
  const rounds = rawResult?.rounds || 1;
  const top5 = results.filter(r => r && r.expectedRank && r.expectedRank <= 5);
  const dist = [0, 0, 0, 0, 0, 0];
  results.forEach(r => { if (r && r.expectedRank >= 1 && r.expectedRank <= 5) dist[r.expectedRank]++; });

  const dateStr = active.created_at ? new Date(active.created_at).toLocaleString("ko-KR") : "";

  return (
    <div data-screen-label="05 Results">
      <TopBar
        title="분석 결과"
        subtitle={<>
          <span style={{ color: "var(--ink-700)", fontWeight: 600 }}>{active.store_name}</span>
          {" · "}{dateStr} 완료
        </>}
        actions={
          <>
            {searchedList.length > 0 && (
              <button className="btn btn-outline btn-sm" onClick={() => setShowSearched(true)}>
                <Icon name="list" size={14}/> 검색한 키워드 보기 ({searchedList.length})
              </button>
            )}
            <button className="btn btn-outline btn-sm" onClick={() => goto("history")}>
              <Icon name="history" size={14}/> 다른 분석 보기
            </button>
          </>
        }
      />

      {showSearched && (
        <SearchedKeywordsModal items={searchedList} onClose={() => setShowSearched(false)}/>
      )}

      <main style={{ padding: 32, maxWidth: 1400 }}>
        <div style={{
          background: "linear-gradient(120deg, #0F1419 0%, #1A222B 60%, #028A3F 100%)",
          borderRadius: 20, padding: 32, color: "white",
          display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr 1fr 1fr", gap: 32, alignItems: "center",
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>매장</div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{active.store_name}</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4, fontFamily: "var(--font-mono)" }} className="truncate">
              {active.keywords}
            </div>
          </div>
          <ResultStat label={`검색한 키워드${rounds > 1 ? ` (${rounds}회차)` : ""}`} value={scannedCount} suffix="개"/>
          <ResultStat label="5위 이내" value={top5.length} suffix="개" tone="green"/>
          <ResultStat label="1위 진입" value={dist[1]} suffix="개" tone="green"/>
          <ResultStat label="2~3위" value={dist[2] + dist[3]} suffix="개"/>
          <ResultStat label="4~5위" value={dist[4] + dist[5]} suffix="개"/>
        </div>

        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>키워드별 분석</h2>
          {results.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--ink-500)" }}>
              이 분석에는 키워드 결과가 없습니다.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
              {results.map((r, i) => (
                <div key={i} className="card" style={{ padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: r.expectedRank <= 3 ? "var(--green-500)"
                                : r.expectedRank <= 5 ? "var(--green-400)"
                                : "var(--ink-300)",
                      color: "white", display: "grid", placeItems: "center",
                      fontWeight: 800, fontSize: 14,
                    }}>
                      {r.expectedRank}위
                    </div>
                    <Tag tone={r.difficulty === "낮음" ? "green" : r.difficulty === "보통" ? "warn" : "danger"}>
                      난이도 {r.difficulty}
                    </Tag>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>
                    {r.keyword}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink-600)", lineHeight: 1.5 }}>
                    {r.reason}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const SearchedKeywordsModal = ({ items, onClose }) => {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const stats = items.reduce((s, it) => {
    s.total++;
    if (it.status === "상위노출") s.hit++;
    else if (it.status === "광고") s.ad++;
    else if (it.status === "단일매장") s.single++;
    else if (it.status === "에러") s.err++;
    else s.miss++;
    return s;
  }, { total: 0, hit: 0, miss: 0, ad: 0, single: 0, err: 0 });

  const filtered = items.filter(it => {
    if (filter === "hit" && it.status !== "상위노출") return false;
    if (filter === "miss" && it.status !== "순위밖") return false;
    if (filter === "ad" && it.status !== "광고") return false;
    if (q && !it.keyword.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const FILTER_BTNS = [
    { id: "all",  label: `전체 (${stats.total})` },
    { id: "hit",  label: `5위 진입 (${stats.hit})`, color: "green" },
    { id: "miss", label: `순위 밖 (${stats.miss})`, color: "gray" },
    { id: "ad",   label: `광고 (${stats.ad})`, color: "warn" },
  ];

  const tone = (st) => st === "상위노출" ? "green"
    : st === "광고" ? "warn"
    : st === "단일매장" ? "info"
    : st === "에러" ? "danger" : "gray";

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0,
      background: "rgba(15, 20, 25, 0.55)",
      backdropFilter: "blur(4px)",
      zIndex: 100,
      display: "grid", placeItems: "center",
      padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: 16,
        width: "100%", maxWidth: 720, maxHeight: "85vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
        overflow: "hidden",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>검색한 키워드 전체 보기</h3>
            <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>
              총 {stats.total}개 — 5위 진입 {stats.hit}, 순위 밖 {stats.miss}, 광고 {stats.ad}, 단일매장 {stats.single}, 에러 {stats.err}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: "var(--ink-100)", display: "grid", placeItems: "center",
          }}>
            <Icon name="x" size={14}/>
          </button>
        </div>

        <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Icon name="search" size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }}/>
            <input className="input" placeholder="키워드 검색"
              value={q} onChange={e => setQ(e.target.value)}
              style={{ paddingLeft: 34, height: 34, fontSize: 13 }}/>
          </div>
          {FILTER_BTNS.map(b => (
            <button key={b.id} onClick={() => setFilter(b.id)}
              className={filter === b.id ? "btn btn-dark btn-sm" : "btn btn-outline btn-sm"}
              style={{ padding: "6px 10px", fontSize: 12 }}>
              {b.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--ink-500)" }}>일치하는 키워드가 없습니다.</div>
          ) : filtered.map((it, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12,
              alignItems: "center", padding: "10px 24px",
              borderTop: i === 0 ? "0" : "1px solid var(--border)",
            }}>
              <div style={{ fontSize: 13, fontWeight: 600 }} className="truncate">{it.keyword}</div>
              {it.rank ? (
                <div style={{
                  fontSize: 12, fontWeight: 800, color: "var(--green-600)",
                  background: "var(--green-50)", padding: "3px 8px", borderRadius: 6,
                  minWidth: 36, textAlign: "center",
                }}>{it.rank}위</div>
              ) : <div/>}
              <Tag tone={tone(it.status)}>{it.status}</Tag>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ResultStat = ({ label, value, suffix, tone }) => (
  <div>
    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
      <span style={{
        fontSize: 28, fontWeight: 800, letterSpacing: "-0.025em",
        color: tone === "green" ? "var(--green-300)" : "white",
      }}>{value}</span>
      <span style={{ fontSize: 12, opacity: 0.7 }}>{suffix}</span>
    </div>
  </div>
);

/* ---------- 스캔 진행 화면 ---------- */
const ScanProgress = ({ url, goto, openResult }) => {
  const [stage, setStage] = useState("crawl");
  const [info, setInfo] = useState(null);
  const [pois, setPois] = useState([]);
  const [regions, setRegions] = useState(null);
  const [landmarkBonus, setLandmarkBonus] = useState([]);
  const [kakaoDiag, setKakaoDiag] = useState([]);
  const [adDiag, setAdDiag] = useState([]);
  const [volumeMsg, setVolumeMsg] = useState(null);
  const [poolSize, setPoolSize] = useState(0);
  const [scannedCount, setScannedCount] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [foundList, setFoundList] = useState([]);
  const [log, setLog] = useState([]);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const logRef = useRef(null);
  const startedRef = useRef(false);

  const pushLog = useCallback((entry) => {
    setLog(prev => {
      const next = [...prev, { ...entry, t: new Date() }];
      return next.length > 200 ? next.slice(-200) : next;
    });
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log.length]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const r = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (!r.ok && r.headers.get("content-type")?.includes("application/json")) {
          const data = await r.json();
          throw new Error((data.error || "스캔 실패") + (data.detail ? " — " + data.detail : ""));
        }
        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop();
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            let ev;
            try { ev = JSON.parse(line.slice(6)); } catch { continue; }

            if (ev.type === "stage_start") {
              setStage(ev.stage);
              pushLog({ kind: "info", text: ev.message || ev.stage });
            } else if (ev.type === "retry_start") {
              pushLog({ kind: "info", text: `🔄 ${ev.message}` });
            } else if (ev.type === "retry_pool") {
              setPoolSize(prev => prev + (ev.poolSize || 0));
              pushLog({ kind: "ok", text: ev.message || `재시도 ${ev.round} — 새 키워드 ${ev.poolSize}개 추가` });
            } else if (ev.type === "info") {
              if (ev.message?.startsWith("Kakao 진단:")) {
                setKakaoDiag(prev => [...prev, ev.message.replace("Kakao 진단:", "").trim()]);
              } else if (ev.message?.startsWith("검색광고 진단:")) {
                setAdDiag(prev => [...prev, ev.message.replace("검색광고 진단:", "").trim()]);
              }
              pushLog({ kind: "info", text: ev.message });
            } else if (ev.type === "saving") {
              pushLog({ kind: "info", text: `💾 ${ev.message}` });
            } else if (ev.type === "stage_done") {
              if (ev.stage === "crawl" && ev.info) {
                setInfo(ev.info);
                const c = ev.info.coords;
                pushLog({ kind: "ok", text: `매장: ${ev.info.storeName} (ID: ${ev.info.placeId})${c ? ` · 좌표 ${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}` : ""} — 지역 ${ev.info.locations?.length||0} · 메뉴 ${ev.info.menus?.length||0}` });
              } else if (ev.stage === "poi" && Array.isArray(ev.pois)) {
                setPois(ev.pois);
                if (ev.regions) setRegions(ev.regions);
                if (ev.landmarkBonus) setLandmarkBonus(ev.landmarkBonus);
                pushLog({ kind: "ok", text: `Kakao Local — 주변 POI ${ev.pois.length}개 확보: ${ev.pois.slice(0,5).map(p => p.name).join(", ")}${ev.pois.length > 5 ? " ..." : ""}` });
              } else if (ev.stage === "keywords") {
                setPoolSize(ev.poolSize);
                pushLog({ kind: "ok", text: `Gemini가 ${ev.poolSize}개의 키워드 생성 완료` });
              } else if (ev.stage === "volume") {
                setVolumeMsg(ev.message);
                pushLog({ kind: "ok", text: ev.message });
              }
            } else if (ev.type === "check_progress") {
              setScannedCount(ev.scannedCount);
              setFoundCount(ev.foundCount);
              setPoolSize(ev.poolSize);
              if (ev.foundItem) {
                setFoundList(prev => [...prev, ev.foundItem]);
                pushLog({ kind: "hit", text: `★ TOP ${ev.rank} HIT! "${ev.keyword}"` });
              } else if (ev.status === "광고") {
                pushLog({ kind: "warn", text: `💸 "${ev.keyword}" — 광고 구역` });
              } else if (ev.status === "단일매장") {
                pushLog({ kind: "warn", text: `⚠️ "${ev.keyword}" — 단일매장` });
              } else if (ev.status === "에러") {
                pushLog({ kind: "err", text: `× "${ev.keyword}" — 에러` });
              } else {
                pushLog({ kind: "miss", text: `× "${ev.keyword}" — 순위 밖` });
              }
            } else if (ev.type === "done") {
              setDone(true);
              pushLog({ kind: "ok", text: `✅ 완료 — ${ev.found.length}/10개 발견 (총 ${ev.scanned}개 검색)` });
              const h = await fetch("/api/history").then(x => x.json()).catch(() => ({rows:[]}));
              const newRow = (h.rows || [])[0];
              setTimeout(() => { if (newRow && openResult) openResult(newRow); }, 800);
            } else if (ev.type === "error") {
              setError(ev.message);
              pushLog({ kind: "err", text: `❌ ${ev.message}` });
            }
          }
        }
      } catch (e) {
        setError(String(e?.message || e));
        pushLog({ kind: "err", text: `❌ ${e?.message || e}` });
      }
    })();
  }, [url, openResult, pushLog]);

  const stages = [
    { id: "crawl",    label: "매장 정보 수집",  sub: "플레이스 HTML · 좌표 · 메뉴 추출" },
    { id: "poi",      label: "주변 POI 조회",   sub: "Kakao Local API로 반경 1.5km 명소" },
    { id: "keywords", label: "AI 자연 조합",    sub: "확정된 데이터로만 환각 없는 키워드" },
    { id: "volume",   label: "월간 검색량 검증", sub: "네이버 검색광고 API로 진짜 검색량" },
    { id: "check",    label: "오가닉 순위 추적", sub: "모바일 통합검색 5위 이내 광고 제외" },
  ];
  const stageIdx = stages.findIndex(s => s.id === stage);
  const overallPct = done ? 100
    : stage === "crawl" ? 10
    : stage === "poi" ? 20
    : stage === "keywords" ? 30
    : stage === "volume" ? 40
    : poolSize > 0 ? Math.min(99, 40 + Math.floor((scannedCount / poolSize) * 55))
    : 40;

  return (
    <div data-screen-label="04 Scan">
      <TopBar
        title="실시간 스캔 진행 중"
        subtitle={info ? `${info.storeName} · ${(info.locations||[]).slice(0,2).join(" ")}` : "매장 정보 가져오는 중..."}
        actions={
          <button className="btn btn-outline btn-sm" onClick={() => goto("dashboard")} disabled={!done && !error}>
            <Icon name="x" size={14}/> {done || error ? "닫기" : "중단"}
          </button>
        }
      />

      <main style={{ padding: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* 좌측: 매장 정보 + 단계 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            {info ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: "linear-gradient(135deg, #FFB78C, #EF7C3C)",
                    color: "white", display: "grid", placeItems: "center",
                    fontWeight: 800, fontSize: 18,
                  }}>{info.storeName.slice(0, 1)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>{info.storeName}</h3>
                      {info.placeId && <Tag tone="outline">place_id: {info.placeId}</Tag>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }} className="truncate">
                      {(info.categories || []).join(" · ")}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(info.locations||[]).slice(0, 4).map((x, i) => (
                    <Tag key={`l${i}`} tone="outline" icon="pin">{x}</Tag>
                  ))}
                  {pois.slice(0, 5).map((p, i) => (
                    <Tag key={`p${i}`} tone="green" icon="star">{p.name}</Tag>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 16 }}>
                  <KpiCell label="지역" value={(info.locations||[]).length}/>
                  <KpiCell label="메뉴" value={(info.menus||[]).length}/>
                  <KpiCell label="주변 POI" value={pois.length} highlight={pois.length > 0}/>
                  <KpiCell label="좌표" value={info.coords ? "확보" : "—"}/>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink-500)" }}>
                <div className="loader-dot"/> 매장 정보를 가져오는 중...
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>분석 단계</h3>
              <span style={{ fontSize: 18, fontWeight: 800, color: "var(--green-600)" }}>{overallPct}%</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-500)", marginBottom: 12 }}>
              현재 단계: {stages.find(s => s.id === stage)?.label || "준비 중"}
            </div>
            <div style={{ height: 6, background: "var(--ink-100)", borderRadius: 999, overflow: "hidden", marginBottom: 18 }}>
              <div style={{ width: `${overallPct}%`, height: "100%", background: "var(--green-500)", transition: "width 0.3s" }}/>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stages.map((s, i) => {
                const isDone = done || i < stageIdx;
                const isActive = !done && i === stageIdx;
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 999,
                      background: isDone ? "var(--green-500)" : isActive ? "white" : "var(--ink-100)",
                      border: isActive ? "2px solid var(--green-500)" : "0",
                      color: isDone ? "white" : isActive ? "var(--green-600)" : "var(--ink-400)",
                      display: "grid", placeItems: "center",
                      fontWeight: 800, fontSize: 11,
                    }}>{isDone ? "✓" : i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isDone || isActive ? "var(--ink-900)" : "var(--ink-500)" }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-500)" }}>{s.sub}</div>
                    </div>
                    {isDone && <Tag tone="green">완료</Tag>}
                    {isActive && <Tag tone="green">진행 중</Tag>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <KpiCell label="검색 완료" value={`${scannedCount} / ${poolSize || "?"}`}/>
              <KpiCell label="5위 진입" value={foundCount} highlight/>
              <KpiCell label="남은 목표" value={Math.max(0, 10 - foundCount)}/>
            </div>
          </div>

          {/* API 진단 상태 카드 — 스크롤 없이 항상 보임 */}
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>API 진단</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>Kakao 행정구역</span>
                  <Tag tone={regions?.hDong || regions?.bDong ? "green" : "gray"}>
                    {regions?.hDong || regions?.bDong ? "확보" : "미확보"}
                  </Tag>
                </div>
                {regions && (
                  <div style={{ color: "var(--ink-600)", fontSize: 11 }}>
                    {regions.city || "?"} {regions.gu || "?"} · 행정 <b>{regions.hDong || "—"}</b> · 법정 <b>{regions.bDong || "—"}</b>
                  </div>
                )}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>Kakao POI (카테고리)</span>
                  <Tag tone={pois.length > 0 ? "green" : "danger"}>{pois.length}건</Tag>
                </div>
                {kakaoDiag.length > 0 && (
                  <div style={{ color: "var(--ink-600)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                    {kakaoDiag.join(" · ")}
                  </div>
                )}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>Kakao 키워드 검색 명소</span>
                  <Tag tone={landmarkBonus.length > 0 ? "green" : "gray"}>{landmarkBonus.length}건</Tag>
                </div>
                {landmarkBonus.length > 0 && (
                  <div style={{ color: "var(--ink-600)", fontSize: 11 }} className="truncate">
                    {landmarkBonus.slice(0, 5).join(", ")}{landmarkBonus.length > 5 ? " ..." : ""}
                  </div>
                )}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>네이버 검색광고 keywordstool</span>
                  <Tag tone={adDiag.some(d => /\d+건/.test(d)) ? "green" : "danger"}>
                    {adDiag.length > 0 ? adDiag[adDiag.length - 1] : "대기"}
                  </Tag>
                </div>
                {adDiag.length > 0 && (
                  <div style={{ color: "var(--ink-600)", fontSize: 11, fontFamily: "var(--font-mono)" }} className="truncate">
                    {adDiag.join(" · ")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 터미널 로그 */}
        <div style={{
          background: "#0a0d12",
          borderRadius: 14, overflow: "hidden",
          border: "1px solid #1c2128",
          display: "flex", flexDirection: "column",
          height: "calc(100vh - 200px)", minHeight: 500,
        }}>
          <div style={{
            padding: "10px 14px", borderBottom: "1px solid #1c2128",
            display: "flex", alignItems: "center", gap: 10,
            background: "#11161c",
          }}>
            <div style={{ display: "flex", gap: 5 }}>
              <div style={{ width: 11, height: 11, borderRadius: 999, background: "#ff5f57" }}/>
              <div style={{ width: 11, height: 11, borderRadius: 999, background: "#ffbd2e" }}/>
              <div style={{ width: 11, height: 11, borderRadius: 999, background: "#28ca42" }}/>
            </div>
            <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: "#8b949e", fontFamily: "var(--font-mono)" }}>
              rankfive @ scanner — {info?.storeName || "..."}
            </div>
            <button
              onClick={() => {
                const text = log.map(l => `${l.t.toTimeString().slice(0,8)}  ${l.text}`).join("\n");
                navigator.clipboard.writeText(text).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
              style={{
                padding: "4px 10px", borderRadius: 6,
                background: copied ? "#28ca42" : "#1f2937",
                color: "white", fontSize: 11, fontWeight: 600,
                border: "1px solid #2d3748", cursor: "pointer",
              }}>
              {copied ? "✓ 복사됨" : "복사"}
            </button>
            {!done && !error && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#03C75A" }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "#03C75A", boxShadow: "0 0 6px #03C75A" }}/>
                LIVE
              </div>
            )}
          </div>
          <div ref={logRef} style={{
            flex: 1, overflowY: "auto",
            padding: "12px 16px",
            fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.7,
            color: "#c9d1d9",
          }}>
            {log.map((l, i) => {
              const c = l.kind === "hit" ? "#3fb950"
                      : l.kind === "ok" ? "#58a6ff"
                      : l.kind === "warn" ? "#d29922"
                      : l.kind === "err" ? "#f85149"
                      : l.kind === "miss" ? "#6e7681"
                      : "#c9d1d9";
              return (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: "#6e7681", flexShrink: 0 }}>{l.t.toTimeString().slice(0,8)}</span>
                  <span style={{ color: c }}>{l.kind === "hit" ? "★" : l.kind === "ok" ? "→" : l.kind === "warn" ? "!" : l.kind === "err" ? "✗" : "·"}</span>
                  <span style={{ color: c }}>{l.text}</span>
                </div>
              );
            })}
            {!done && !error && (
              <div style={{ color: "#3fb950", marginTop: 4 }}>
                <span className="blink">▊</span>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

const KpiCell = ({ label, value, icon, highlight }) => (
  <div style={{
    background: highlight ? "var(--green-50)" : "var(--ink-50)",
    border: `1px solid ${highlight ? "var(--green-200)" : "var(--border)"}`,
    borderRadius: 10, padding: "10px 12px",
  }}>
    <div style={{ fontSize: 10, color: "var(--ink-500)", fontWeight: 600, marginBottom: 4, letterSpacing: "0.02em" }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: highlight ? "var(--green-700)" : "var(--ink-900)" }}>{value}</div>
  </div>
);

Object.assign(window, { Sidebar, TopBar, Dashboard, History, Results, ScanProgress, SearchedKeywordsModal, FilterPill });
