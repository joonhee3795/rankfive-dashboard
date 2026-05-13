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
        onClick={() => goto("scan")}
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
const Dashboard = ({ goto }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [dbScans, setDbScans] = useState(null);

  useEffect(() => {
    fetch("/api/history")
      .then(r => r.json())
      .then(d => setDbScans(d.rows || []))
      .catch(() => {});
  }, []);

  const runScan = async () => {
    if (!url.trim()) { alert("네이버 플레이스 URL 또는 매장명을 입력하세요"); return; }
    setLoading(true);
    setLastResult(null);
    try {
      const r = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: url,
          keywords: "고기집,회식장소,점심,저녁,데이트,가족모임",
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error((data.error || "스캔 실패") + " — " + (data.detail || ""));
      setLastResult(data);
      const h = await fetch("/api/history").then(x => x.json());
      setDbScans(h.rows || []);
    } catch (e) {
      alert("에러: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const fallbackScans = [
    {
      name: "섬부가든", addr: "대구 수성구 수성동", cat: "삼겹살",
      url: "place.naver.com/restaurant/12489...",
      hit: 10, scanned: 287, dur: "3분 12초",
      time: "방금 전", status: "완료",
      thumb: "linear-gradient(135deg, #FFB78C, #EF7C3C)",
    },
    {
      name: "수성못 옆 파스타", addr: "대구 수성구 두산동", cat: "이탈리안",
      url: "place.naver.com/restaurant/87123...",
      hit: 7, scanned: 412, dur: "4분 28초",
      time: "2시간 전", status: "완료",
      thumb: "linear-gradient(135deg, #B4A7F2, #6E54D9)",
    },
    {
      name: "범어동 헤어샵 lumen", addr: "대구 수성구 범어동", cat: "헤어샵",
      url: "place.naver.com/hairshop/23448...",
      hit: 5, scanned: 198, dur: "2분 41초",
      time: "어제", status: "완료",
      thumb: "linear-gradient(135deg, #FFD56A, #F4A52B)",
    },
    {
      name: "동성로 진심스시", addr: "대구 중구 동성로2가", cat: "스시",
      url: "place.naver.com/restaurant/55881...",
      hit: 0, scanned: 564, dur: "5분 02초",
      time: "어제", status: "5위 키워드 없음", error: true,
      thumb: "linear-gradient(135deg, #88C7F9, #2B7FFF)",
    },
  ];

  const recentScans = (dbScans && dbScans.length > 0)
    ? dbScans.map(r => {
        const results = Array.isArray(r.result) ? r.result : [];
        const hit = results.filter(x => x.expectedRank && x.expectedRank <= 5).length;
        return {
          name: r.store_name,
          addr: "DB 저장",
          cat: "분석 완료",
          url: r.keywords,
          hit,
          scanned: results.length,
          dur: "-",
          time: new Date(r.created_at).toLocaleString("ko-KR"),
          status: "완료",
          thumb: "linear-gradient(135deg, #03C75A, #028A3F)",
        };
      })
    : fallbackScans;

  return (
    <div data-screen-label="03 Dashboard">
      <TopBar title="대시보드" subtitle="매장명을 5위 이내 키워드를 분석합니다."/>

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
                새 매장의 5위 키워드,<br/>
                URL만 붙여넣으면 끝.
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
                <button className="btn btn-primary" onClick={runScan} disabled={loading}
                  style={{ padding: "10px 18px", borderRadius: 10 }}>
                  {loading ? "분석 중..." : "분석 시작"}
                  <Icon name="arrowR" size={14}/>
                </button>
              </div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 10 }}>
                💡 음식점·미용실·헬스장 등 모든 네이버 플레이스 업종 지원
              </div>
            </div>

          </div>
        </div>

        {lastResult && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>"{lastResult.storeName}" 분석 결과</h3>
              <Tag tone="green">Gemini 분석 완료</Tag>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {(lastResult.results || []).map((r, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 14,
                  alignItems: "center", padding: "12px 16px",
                  background: "var(--surface-2)", borderRadius: 10,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: r.expectedRank <= 5 ? "var(--green-500)" : "var(--ink-300)",
                    color: "white", display: "grid", placeItems: "center",
                    fontWeight: 800, fontSize: 13,
                  }}>{r.expectedRank}위</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.keyword}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>{r.reason}</div>
                  </div>
                  <Tag tone={r.difficulty === "낮음" ? "green" : r.difficulty === "보통" ? "warn" : "danger"}>
                    난이도 {r.difficulty}
                  </Tag>
                </div>
              ))}
            </div>
          </div>
        )}

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
                  onClick={() => goto("results")}
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
const History = ({ goto }) => {
  const [dbRows, setDbRows] = useState(null);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    fetch("/api/history")
      .then(r => r.json())
      .then(d => setDbRows(d.rows || []))
      .catch(() => setDbRows([]));
  }, []);

  const mapped = (dbRows || []).map(r => {
    const results = Array.isArray(r.result) ? r.result : [];
    const hit = results.filter(x => x.expectedRank && x.expectedRank <= 5).length;
    const d = new Date(r.created_at);
    const pad = n => String(n).padStart(2, "0");
    return {
      name: r.store_name,
      cat: "—",
      area: r.keywords,
      hit,
      scanned: results.length,
      dur: "—",
      date: `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
      who: "나",
      status: results.length === 0 ? "오류" : hit === 0 ? "결과없음" : "완료",
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
        subtitle={dbRows === null ? "불러오는 중..." : `${(dbRows||[]).length}회의 스캔 기록 · 총 ${(dbRows||[]).reduce((s,r)=>s+(Array.isArray(r.result)?r.result.length:0),0)}개의 키워드 분석 완료`}
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
                  style={{ borderTop: "1px solid var(--border)", transition: "background 0.1s" }}
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

Object.assign(window, { Sidebar, TopBar, Dashboard, History, FilterPill });
