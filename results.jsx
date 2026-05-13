/* ============================================
   결과 화면 — 실제 분석 결과 보기
   ============================================ */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const Results = ({ goto, scan }) => {
  const [latest, setLatest] = useState(null);

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

  const results = Array.isArray(active.result) ? active.result : (active.result?.found || []);
  const scannedCount = Array.isArray(active.result) ? active.result.length : (active.result?.scanned || 0);
  const top5 = results.filter(r => r.expectedRank && r.expectedRank <= 5);
  const dist = [0, 0, 0, 0, 0, 0];
  results.forEach(r => { if (r.expectedRank >= 1 && r.expectedRank <= 5) dist[r.expectedRank]++; });

  const dateStr = new Date(active.created_at).toLocaleString("ko-KR");

  return (
    <div data-screen-label="05 Results">
      <TopBar
        title="분석 결과"
        subtitle={<>
          <span style={{ color: "var(--ink-700)", fontWeight: 600 }}>{active.store_name}</span>
          {" · "}{dateStr} 완료
        </>}
        actions={
          <button className="btn btn-outline btn-sm" onClick={() => goto("history")}>
            <Icon name="history" size={14}/> 다른 분석 보기
          </button>
        }
      />

      <main style={{ padding: 32, maxWidth: 1400 }}>

        {/* 스코어보드 */}
        <div style={{
          background: "linear-gradient(120deg, #0F1419 0%, #1A222B 60%, #028A3F 100%)",
          borderRadius: 20, padding: 32, color: "white",
          display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr 1fr 1fr", gap: 32, alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>매장</div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{active.store_name}</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4, fontFamily: "var(--font-mono)" }} className="truncate">
              {active.keywords}
            </div>
          </div>
          <Stat label="검색한 키워드" value={scannedCount} suffix="개"/>
          <Stat label="5위 이내" value={top5.length} suffix="개" tone="green"/>
          <Stat label="1위 진입" value={dist[1]} suffix="개" tone="green"/>
          <Stat label="2~3위" value={dist[2] + dist[3]} suffix="개"/>
          <Stat label="4~5위" value={dist[4] + dist[5]} suffix="개"/>
        </div>

        {/* 키워드 카드 */}
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

const Stat = ({ label, value, suffix, tone }) => (
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

Object.assign(window, { Results });
