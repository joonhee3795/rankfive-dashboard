/* ============================================
   워크스페이스 셸 (사이드바 + 톱바)
   + 대시보드 + 검색 이력
   ============================================ */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ---------- 사이드바 ---------- */
const Sidebar = ({ active, setActive, onNewScan }) => {
  const navItems = [
    { id: "dashboard", icon: "grid",     label: "대시보드" },
    { id: "history",   icon: "history",  label: "검색 이력", badge: 124 },
    { id: "favorites", icon: "bookmark", label: "즐겨찾기" },
    { id: "alerts",    icon: "bell",     label: "변동 알림", badge: 3, badgeColor: "danger" },
  ];
  const secondary = [
    { id: "team",      icon: "user",     label: "팀 관리" },
    { id: "billing",   icon: "crown",    label: "요금제 / 결제" },
    { id: "settings",  icon: "settings", label: "설정" },
  ];

  return (
    <aside style={{
      width: 248, flexShrink: 0,
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
        onClick={onNewScan}
        className="btn btn-primary"
        style={{
          width: "100%", padding: "11px 14px", justifyContent: "space-between",
          marginBottom: 22, borderRadius: 10, fontSize: 14,
        }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="plus" size={16} stroke={2.4}/>
          새 스캔 시작
        </span>
        <kbd style={{
          background: "rgba(255,255,255,0.2)", color: "white",
          padding: "1px 6px", borderRadius: 5, fontSize: 11,
          fontFamily: "var(--font-mono)", fontWeight: 600,
        }}>⌘N</kbd>
      </button>

      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-400)", padding: "0 10px 8px", letterSpacing: "0.06em" }}>WORKSPACE</div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(it => (
          <NavItem key={it.id} {...it} active={active === it.id} onClick={() => setActive(it.id)}/>
        ))}
      </nav>

      <div style={{ marginTop: 24, fontSize: 11, fontWeight: 700, color: "var(--ink-400)", padding: "0 10px 8px", letterSpacing: "0.06em" }}>ACCOUNT</div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {secondary.map(it => (
          <NavItem key={it.id} {...it} active={active === it.id} onClick={() => setActive(it.id)}/>
        ))}
      </nav>

      <div style={{ flex: 1 }}/>

      {/* 사용량 카드 */}
      <div style={{
        background: "linear-gradient(135deg, var(--ink-50) 0%, var(--green-50) 100%)",
        border: "1px solid var(--green-100)",
        borderRadius: 12, padding: 16,
        marginBottom: 12,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-700)" }}>이번 달 사용량</div>
          <Tag tone="green">Agency</Tag>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ink-900)" }}>
          124 <span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 500 }}>/ 200 스캔</span>
        </div>
        <div style={{ height: 6, background: "var(--ink-200)", borderRadius: 999, marginTop: 8, overflow: "hidden" }}>
          <div style={{ width: "62%", height: "100%", background: "var(--green-500)", borderRadius: 999 }}/>
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 6 }}>26일 후 갱신 · 76회 남음</div>
      </div>

      {/* 사용자 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 8px", borderRadius: 10,
        background: "var(--ink-50)",
      }}>
        <Avatar name="박지훈" size={32}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-900)" }} className="truncate">박지훈</div>
          <div style={{ fontSize: 11, color: "var(--ink-500)" }} className="truncate">로컬코어 마케팅</div>
        </div>
        <Icon name="chevron" size={14} style={{ color: "var(--ink-400)" }}/>
      </div>
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
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--ink-50)", padding: "8px 12px",
        borderRadius: 10, border: "1px solid var(--border)",
        width: 300,
      }}>
        <Icon name="search" size={16} style={{ color: "var(--ink-400)" }}/>
        <input placeholder="매장명, URL, 키워드 검색"
          style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 13 }}/>
        <kbd style={{
          background: "white", color: "var(--ink-500)",
          padding: "1px 6px", borderRadius: 4, fontSize: 11,
          fontFamily: "var(--font-mono)", border: "1px solid var(--border)",
        }}>⌘K</kbd>
      </div>
      <button className="btn btn-outline btn-sm" style={{ padding: 9, width: 38, height: 38, borderRadius: 10 }}>
        <Icon name="bell" size={16}/>
      </button>
      {actions}
    </div>
  </header>
);

/* ---------- 대시보드 ---------- */
const Dashboard = ({ goto }) => {
  const [url, setUrl] = useState("");
  const recentScans = [
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

  return (
    <div data-screen-label="03 Dashboard">
      <TopBar
        title="대시보드"
        subtitle="안녕하세요 박지훈님, 오늘도 좋은 키워드를 찾아보세요 ☕"
        actions={
          <button className="btn btn-dark btn-sm" onClick={() => goto("scan")}>
            <Icon name="plus" size={14} stroke={2.4}/>
            새 스캔
          </button>
        }
      />

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
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "center" }}>
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
                <button className="btn btn-primary" onClick={() => goto("scan")}
                  style={{ padding: "10px 18px", borderRadius: 10 }}>
                  분석 시작
                  <Icon name="arrowR" size={14}/>
                </button>
              </div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 10 }}>
                💡 음식점·미용실·헬스장 등 모든 네이버 플레이스 업종 지원
              </div>
            </div>

            {/* 우측 통계 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <MiniStat label="이번 달 스캔" value="124" delta="+18" tone="green"/>
              <MiniStat label="발견한 5위 키워드" value="876" delta="+62" tone="green"/>
              <MiniStat label="평균 완료 시간" value="3:12" delta="-0:28" tone="green" unit=""/>
              <MiniStat label="활성 매장" value="38" delta="+2" tone="green"/>
            </div>
          </div>
        </div>

        {/* 두 컬럼: 최근 스캔 + 인사이트 */}
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 20 }}>

          {/* 최근 스캔 */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>최근 분석한 매장</h3>
                <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>최근 7일간의 스캔 결과</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-ghost btn-sm">
                  <Icon name="filter" size={14}/>
                  필터
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => goto("history")}>
                  전체보기
                  <Icon name="arrowR" size={13}/>
                </button>
              </div>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em" }}>{s.name}</div>
                      <Tag tone="outline">{s.cat}</Tag>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-500)", fontFamily: "var(--font-mono)" }} className="truncate">
                      {s.addr} · {s.url}
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
                    <div>{s.scanned}개 스캔</div>
                    <div>{s.dur}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 110, justifyContent: "flex-end" }}>
                    <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{s.time}</div>
                    <Icon name="chevron" size={14} style={{ color: "var(--ink-400)" }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 인사이트 사이드 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700 }}>5위 발견율</h3>
                  <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 2 }}>최근 30일 · 모든 매장 평균</div>
                </div>
                <Tag tone="green" icon="trend">+8.4%</Tag>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <Donut value={72} size={92} stroke={10} label="%"/>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <Row label="평균 스캔 / 매장" value="287"/>
                  <Row label="평균 발견 키워드" value="7.3개"/>
                  <Row label="광고 필터링" value="61%"/>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>순위 변동 알림</h3>
                <Tag tone="danger">3 NEW</Tag>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { kw: "수성동 천겹살", from: 4, to: 1, type: "up" },
                  { kw: "범어네거리 회식", from: 2, to: 6, type: "down" },
                  { kw: "수성구 헤어샵", from: 5, to: 5, type: "stay" },
                ].map((a, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 0",
                    borderTop: i === 0 ? "0" : "1px dashed var(--border)",
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: a.type === "up" ? "var(--green-50)" : a.type === "down" ? "#FFE9E9" : "var(--ink-100)",
                      color: a.type === "up" ? "var(--green-600)" : a.type === "down" ? "#B43232" : "var(--ink-500)",
                      display: "grid", placeItems: "center",
                    }}>
                      <Icon name={a.type === "up" ? "arrowU" : a.type === "down" ? "arrowD" : "dot"} size={14} stroke={2.4}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }} className="truncate">{a.kw}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-500)" }}>{a.from}위 → {a.to}위</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* TOP 키워드 차트 */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>이번 주 가장 많이 발견된 키워드</h3>
              <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>전체 매장 통합 · 5위 이내 노출 횟수 기준</div>
            </div>
            <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--ink-100)", borderRadius: 8 }}>
              {["주간", "월간", "분기"].map((t, i) => (
                <button key={t} style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: i === 0 ? "white" : "transparent",
                  color: i === 0 ? "var(--ink-900)" : "var(--ink-500)",
                  boxShadow: i === 0 ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {[
              { kw: "수성동 천겹살", count: 23, week: [4, 6, 8, 12, 18, 21, 23] },
              { kw: "수성구 고기집", count: 18, week: [10, 12, 14, 15, 17, 18, 18] },
              { kw: "범어네거리 회식", count: 14, week: [2, 4, 6, 8, 10, 12, 14] },
              { kw: "수성못 맛집", count: 11, week: [5, 7, 7, 9, 10, 10, 11] },
              { kw: "대구 수성 삼겹살", count: 9, week: [3, 4, 5, 6, 7, 8, 9] },
            ].map((k, i) => (
              <div key={i} style={{
                background: "var(--ink-50)", borderRadius: 12, padding: 16,
                border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-500)", letterSpacing: "0.04em" }}>#{i + 1}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, marginBottom: 12, letterSpacing: "-0.01em" }}>{k.kw}</div>
                <SparkBars data={k.week} color="var(--green-500)" h={32}/>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 10 }}>
                  <div style={{ fontSize: 12, color: "var(--ink-500)" }}>매장 수</div>
                  <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>{k.count}</div>
                </div>
              </div>
            ))}
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
  const rows = [
    { name: "섬부가든", cat: "삼겹살", area: "대구 수성구", hit: 10, scanned: 287, dur: "3:12", date: "2026.05.13 14:22", who: "박지훈", status: "완료" },
    { name: "수성못 옆 파스타", cat: "이탈리안", area: "대구 수성구", hit: 7, scanned: 412, dur: "4:28", date: "2026.05.13 12:08", who: "박지훈", status: "완료" },
    { name: "범어동 헤어샵 lumen", cat: "헤어샵", area: "대구 수성구", hit: 5, scanned: 198, dur: "2:41", date: "2026.05.12 18:51", who: "김민지", status: "완료" },
    { name: "동성로 진심스시", cat: "스시", area: "대구 중구", hit: 0, scanned: 564, dur: "5:02", date: "2026.05.12 16:30", who: "김민지", status: "결과없음" },
    { name: "구암동 곱창집", cat: "곱창", area: "대구 북구", hit: 6, scanned: 312, dur: "3:48", date: "2026.05.12 11:14", who: "박지훈", status: "완료" },
    { name: "수성구청 카페 nook", cat: "카페", area: "대구 수성구", hit: 9, scanned: 256, dur: "3:01", date: "2026.05.11 17:22", who: "박지훈", status: "완료" },
    { name: "월배 디저트연구소", cat: "디저트", area: "대구 달서구", hit: 4, scanned: 178, dur: "2:18", date: "2026.05.11 14:05", who: "김민지", status: "완료" },
    { name: "동대구역 회집", cat: "횟집", area: "대구 동구", hit: 3, scanned: 224, dur: "2:50", date: "2026.05.10 19:33", who: "박지훈", status: "완료" },
    { name: "두류공원 분식", cat: "분식", area: "대구 달서구", hit: 11, scanned: 341, dur: "4:01", date: "2026.05.10 13:20", who: "김민지", status: "완료" },
    { name: "테스트 매장 A", cat: "—", area: "—", hit: 0, scanned: 0, dur: "—", date: "2026.05.10 10:08", who: "박지훈", status: "오류" },
  ];

  return (
    <div data-screen-label="06 History">
      <TopBar title="검색 이력"
        subtitle="124회의 스캔 기록 · 총 35,820개의 키워드 분석 완료"
        actions={
          <>
            <button className="btn btn-outline btn-sm">
              <Icon name="download" size={14}/>
              CSV 내보내기
            </button>
            <button className="btn btn-dark btn-sm" onClick={() => goto("scan")}>
              <Icon name="plus" size={14} stroke={2.4}/>
              새 스캔
            </button>
          </>
        }
      />
      <main style={{ padding: 32, maxWidth: 1400 }}>
        {/* 필터 바 */}
        <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <Icon name="search" size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }}/>
            <input className="input" placeholder="매장명 또는 키워드로 검색" style={{ paddingLeft: 38 }}/>
          </div>
          <FilterPill label="기간" value="최근 30일"/>
          <FilterPill label="업종" value="전체"/>
          <FilterPill label="지역" value="대구 전체"/>
          <FilterPill label="상태" value="완료만"/>
          <FilterPill label="담당자" value="모두"/>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-ghost btn-sm">
            <Icon name="refresh" size={14}/>
            초기화
          </button>
        </div>

        {/* 테이블 */}
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--ink-50)", textAlign: "left", color: "var(--ink-600)", fontSize: 12, fontWeight: 700 }}>
                <th style={{ padding: "12px 16px 12px 24px", width: 28 }}>
                  <input type="checkbox" style={{ accentColor: "var(--green-500)" }}/>
                </th>
                <th style={{ padding: "12px 12px" }}>매장</th>
                <th style={{ padding: "12px 12px" }}>지역</th>
                <th style={{ padding: "12px 12px", textAlign: "right" }}>5위 키워드</th>
                <th style={{ padding: "12px 12px", textAlign: "right" }}>스캔 수</th>
                <th style={{ padding: "12px 12px", textAlign: "right" }}>소요</th>
                <th style={{ padding: "12px 12px" }}>담당자</th>
                <th style={{ padding: "12px 12px" }}>일시</th>
                <th style={{ padding: "12px 24px 12px 12px", textAlign: "right" }}>상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}
                  onClick={() => goto("results")}
                  style={{ borderTop: "1px solid var(--border)", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--ink-50)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 16px 14px 24px" }} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" style={{ accentColor: "var(--green-500)" }}/>
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: ["#FFB78C", "#B4A7F2", "#FFD56A", "#88C7F9", "#8FE0B6"][i % 5],
                        display: "grid", placeItems: "center",
                        fontWeight: 800, color: "white", fontSize: 13,
                      }}>{r.name.slice(0, 1)}</div>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--ink-900)" }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-500)" }}>{r.cat}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 12px", color: "var(--ink-600)" }}>{r.area}</td>
                  <td style={{ padding: "14px 12px", textAlign: "right" }}>
                    <span style={{
                      fontSize: 16, fontWeight: 800,
                      color: r.hit === 0 ? "var(--ink-400)" : "var(--green-600)",
                      letterSpacing: "-0.02em",
                    }}>{r.hit}</span>
                    <span style={{ fontSize: 11, color: "var(--ink-400)", marginLeft: 2 }}>/10</span>
                  </td>
                  <td style={{ padding: "14px 12px", textAlign: "right", color: "var(--ink-600)", fontFamily: "var(--font-mono)" }}>{r.scanned}</td>
                  <td style={{ padding: "14px 12px", textAlign: "right", color: "var(--ink-600)", fontFamily: "var(--font-mono)" }}>{r.dur}</td>
                  <td style={{ padding: "14px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={r.who} size={22}/>
                      <span style={{ color: "var(--ink-700)" }}>{r.who}</span>
                    </div>
                  </td>
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
            padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
            borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--ink-500)",
          }}>
            <div>전체 124개 중 1–10 표시 중</div>
            <div style={{ display: "flex", gap: 4 }}>
              <button className="btn btn-outline btn-sm" style={{ padding: "5px 10px" }} disabled>이전</button>
              {[1,2,3,"...",13].map((p,i) => (
                <button key={i} className={p === 1 ? "btn btn-dark btn-sm" : "btn btn-outline btn-sm"}
                  style={{ padding: "5px 10px", minWidth: 32 }}>{p}</button>
              ))}
              <button className="btn btn-outline btn-sm" style={{ padding: "5px 10px" }}>다음</button>
            </div>
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
