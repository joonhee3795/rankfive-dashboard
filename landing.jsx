/* ============================================
   랜딩 페이지
   ============================================ */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ---------- 랜딩 상단 GNB ---------- */
const TopNav = ({ goto }) => (
  <nav style={{
    position: "sticky", top: 0, zIndex: 50,
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(229,231,235,0.7)",
  }}>
    <div style={{
      maxWidth: 1200, margin: "0 auto",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 28px", height: 64,
    }}>
      <div onClick={() => goto("landing")} style={{ cursor: "pointer" }}>
        <Logo size={26}/>
      </div>
      <ul style={{ display: "flex", gap: 28, fontSize: 14, fontWeight: 500, color: "var(--ink-700)" }}>
        <li style={{ cursor: "pointer" }}>기능</li>
        <li style={{ cursor: "pointer" }}>요금제</li>
        <li style={{ cursor: "pointer" }}>고객사례</li>
        <li style={{ cursor: "pointer" }}>도움말</li>
      </ul>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => goto("auth")}>로그인</button>
        <button className="btn btn-primary btn-sm" onClick={() => goto("dashboard")}>
          무료로 시작하기
          <Icon name="arrowR" size={14}/>
        </button>
      </div>
    </div>
  </nav>
);

/* ---------- Hero ---------- */
const Hero = ({ goto }) => {
  const [url, setUrl] = useState("");
  return (
    <section style={{
      position: "relative",
      paddingTop: 100, paddingBottom: 120,
      overflow: "hidden",
      background: "linear-gradient(180deg, #FAFCFB 0%, #F1FAF4 60%, #EAF8EF 100%)",
    }}>
      <DotsBg opacity={0.35} color="#03C75A"/>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "0 28px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "white", border: "1px solid var(--green-100)",
          padding: "6px 14px 6px 8px", borderRadius: 999,
          fontSize: 13, fontWeight: 600, color: "var(--green-700)",
          boxShadow: "0 2px 8px rgba(3,199,90,0.08)",
          marginBottom: 28,
        }}>
          <span style={{
            background: "var(--green-500)", color: "white",
            padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700,
          }}>NEW</span>
          Gemini 2.5 AI 키워드 추론 엔진 탑재
        </div>

        <h1 style={{
          fontSize: "clamp(40px, 6vw, 68px)",
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: "-0.045em",
          marginBottom: 20,
        }}>
          내 매장이 <span style={{
            position: "relative",
            color: "var(--green-600)",
            display: "inline-block",
            whiteSpace: "nowrap",
          }}>
            진짜 5위 안에
            <svg width="100%" height="14" style={{ position: "absolute", left: 0, bottom: -6 }} viewBox="0 0 320 14" preserveAspectRatio="none">
              <path d="M2 8 Q 80 1 160 6 T 318 4" stroke="var(--green-500)" strokeWidth="4" fill="none" strokeLinecap="round"/>
            </svg>
          </span> 노출되는<br/>
          키워드를 찾아드립니다.
        </h1>

        <p style={{
          fontSize: 19, color: "var(--ink-600)", lineHeight: 1.55,
          maxWidth: 640, margin: "0 auto 40px", letterSpacing: "-0.015em",
        }}>
          네이버 플레이스 URL 한 줄만 넣으면, AI가 수백 개의 검색어를 자동으로 조합해서<br/>
          실제 5위 이내에 뜨는 키워드만 골라드립니다. <strong style={{ color: "var(--ink-900)" }}>광고 제외, 오가닉 기준.</strong>
        </p>

        {/* URL 입력 박스 */}
        <div style={{
          maxWidth: 620, margin: "0 auto 18px",
          background: "white", borderRadius: 16, padding: 6,
          boxShadow: "0 24px 60px rgba(3,199,90,0.18), 0 4px 16px rgba(15,20,25,0.06)",
          border: "1px solid var(--green-100)",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <div style={{ paddingLeft: 14, color: "var(--ink-400)", display: "flex" }}>
            <Icon name="link" size={20}/>
          </div>
          <input
            placeholder="https://m.place.naver.com/restaurant/..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            style={{
              flex: 1, border: 0, outline: 0, padding: "16px 4px",
              fontSize: 15, fontFamily: "var(--font-mono)", color: "var(--ink-800)",
              background: "transparent",
            }}
          />
          <button
            onClick={() => goto("dashboard")}
            className="btn btn-primary"
            style={{ padding: "12px 22px", borderRadius: 12, fontSize: 15 }}>
            5위 키워드 찾기
            <Icon name="arrowR" size={16}/>
          </button>
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 56 }}>
          신용카드 필요 없음 · 가입 즉시 1회 무료 스캔
        </div>

        {/* Trust bar */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 56, flexWrap: "wrap",
          paddingTop: 8, color: "var(--ink-500)", fontSize: 14,
        }}>
          {[
            ["분석한 매장", "12,847"],
            ["추출한 키워드", "284만+"],
            ["평균 발견 시간", "3분 12초"],
            ["고객 만족도", "98%"],
          ].map(([k, v]) => (
            <div key={k} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: "-0.03em" }}>{v}</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{k}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------- 데모 미리보기 카드 ---------- */
const DemoPreview = () => (
  <section style={{ background: "white", paddingTop: 80, paddingBottom: 100 }}>
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px" }}>
      <div style={{
        position: "relative",
        background: "linear-gradient(135deg, #02A94C 0%, #03C75A 50%, #1DC76C 100%)",
        borderRadius: 28,
        padding: "60px 60px 0",
        overflow: "hidden",
        boxShadow: "0 40px 100px rgba(3,199,90,0.3)",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          opacity: 0.5,
        }}/>
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 60, alignItems: "end" }}>
          <div style={{ paddingBottom: 60, color: "white" }}>
            <Tag tone="dark" size="lg">실시간 데모</Tag>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.04em", marginTop: 20, lineHeight: 1.1 }}>
              우리 매장이 어떤<br/>검색어로 잡히고 있는지<br/>
              <span style={{ opacity: 0.85 }}>1분 만에 확인하세요.</span>
            </h2>
            <p style={{ fontSize: 16, opacity: 0.92, marginTop: 18, lineHeight: 1.6, maxWidth: 440 }}>
              상위노출 컨설팅 받기 전, 우리 매장의 실제 상태부터 정확히 파악하세요.
              마케터 50명이 일주일 걸려서 할 분석을 3분 안에 끝냅니다.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              <button className="btn btn-dark btn-lg" style={{ background: "var(--ink-900)" }}>
                지금 무료로 시작
                <Icon name="arrowR" size={16}/>
              </button>
              <button className="btn btn-lg" style={{ background: "rgba(255,255,255,0.18)", color: "white" }}>
                데모 영상 보기
              </button>
            </div>
          </div>

          {/* 떠있는 결과 카드 */}
          <div style={{ position: "relative", height: 460 }}>
            <FloatingResultCard/>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const FloatingResultCard = () => {
  const rankResults = [
    { rank: 1, kw: "수성동 천겹살", v: 8420 },
    { rank: 2, kw: "범어네거리 회식장소", v: 5210 },
    { rank: 3, kw: "수성구 고기집", v: 12830 },
    { rank: 4, kw: "수성못 맛집 추천", v: 4280 },
    { rank: 4, kw: "대구 수성구 삼겹살", v: 6710 },
  ];
  return (
    <div style={{
      position: "absolute", inset: "20px 0 0",
      background: "white", borderRadius: "20px 20px 0 0",
      padding: 24, boxShadow: "0 -20px 60px rgba(0,0,0,0.18)",
      transform: "rotate(-1.5deg)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 500 }}>분석 결과</div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em" }}>섬부가든 (수성구)</div>
        </div>
        <Tag tone="green" size="lg" icon="check">완료 · 3분 12초</Tag>
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
        padding: "14px 0", borderTop: "1px dashed var(--border)", borderBottom: "1px dashed var(--border)", marginBottom: 16,
      }}>
        {[["5위 이내", "10", "var(--green-600)"], ["스캔 키워드", "287", "var(--ink-700)"], ["광고 제외", "✓", "var(--ink-700)"]].map(([k,v,c]) => (
          <div key={k}>
            <div style={{ fontSize: 22, fontWeight: 800, color: c, letterSpacing: "-0.03em" }}>{v}</div>
            <div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 500 }}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rankResults.map((r, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "11px 12px", background: "var(--ink-50)",
            borderRadius: 10, border: "1px solid var(--border)",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: r.rank === 1 ? "var(--green-500)" : r.rank === 2 ? "var(--ink-700)" : "white",
              color: r.rank <= 2 ? "white" : "var(--ink-700)",
              display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13,
              border: r.rank > 2 ? "1px solid var(--border)" : "0",
            }}>{r.rank}</div>
            <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{r.kw}</div>
            <div style={{ fontSize: 12, color: "var(--ink-500)" }}>월 {r.v.toLocaleString()}</div>
          </div>
        ))}
        <div style={{ textAlign: "center", padding: "10px 0", fontSize: 12, color: "var(--ink-400)", fontWeight: 500 }}>+ 5개 더 보기</div>
      </div>
    </div>
  );
};

/* ---------- 기능 섹션 ---------- */
const Features = () => {
  const items = [
    {
      icon: "spark", color: "var(--green-500)", bg: "var(--green-50)",
      tag: "AI 추론",
      title: "Gemini 2.5가 직접 키워드를 추론",
      body: "단순 조합이 아닙니다. 지역명·메뉴·랜드마크를 종합해 사람이 칠 법한 자연스러운 검색어 50개+를 매 회차마다 새로 만들어냅니다.",
    },
    {
      icon: "shield", color: "var(--indigo-500)", bg: "#EEF1FF",
      tag: "정확도",
      title: "광고 슬롯 100% 자동 제거",
      body: "VLTHu 클래스 같은 가변 셀렉터에 의존하지 않습니다. place.naver.com 링크를 직접 추적해서 오가닉 5위만 정밀하게 골라냅니다.",
    },
    {
      icon: "bolt", color: "var(--amber-500)", bg: "#FFF4DA",
      tag: "속도",
      title: "10개 찾을 때까지 무한 스캔",
      body: "한 번 돌리면 끝까지 갑니다. 5위 이내 키워드 10개가 채워질 때까지 새 조합을 계속 생성하며, 평균 3분 12초 안에 결과가 나옵니다.",
    },
    {
      icon: "map", color: "var(--teal-500)", bg: "#DFF6F3",
      tag: "지리 지식",
      title: "행정구역 → 실제 랜드마크 매핑",
      body: "'수성구 맛집' 같은 뻔한 키워드만 만들지 않습니다. '범어네거리', '수성못'처럼 실제 동네 사람이 검색하는 단어를 찾아냅니다.",
    },
    {
      icon: "trend", color: "var(--rose-500)", bg: "#FFE9E9",
      tag: "트래킹",
      title: "주기적 자동 재스캔 & 변동 알림",
      body: "1주일·1개월 단위로 같은 매장을 다시 추적해서 순위 변동을 표로 보여줍니다. 떨어진 키워드는 카톡으로 즉시 알림.",
    },
    {
      icon: "download", color: "var(--ink-800)", bg: "var(--ink-100)",
      tag: "협업",
      title: "CSV·PPT 보고서 자동 생성",
      body: "고객사 보고용 포맷으로 한 번에 추출. 대행사 워크플로우에 맞춘 PPT 템플릿과 CSV 일괄 다운로드를 지원합니다.",
    },
  ];
  return (
    <section style={{ background: "var(--bg-app)", padding: "120px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <Tag tone="green" size="lg">왜 랭크파이브인가</Tag>
          <h2 style={{ fontSize: 48, fontWeight: 800, marginTop: 16, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
            추측이 아닌, 데이터로 증명되는<br/>
            <span style={{ color: "var(--green-600)" }}>진짜 상위노출 키워드</span>
          </h2>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16,
        }}>
          {items.map((f, i) => (
            <div key={i} className="card" style={{
              padding: 32, borderRadius: 20, background: "white",
              transition: "all 0.25s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-xs)"; }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: f.bg, color: f.color,
                display: "grid", placeItems: "center",
                marginBottom: 20,
              }}>
                <Icon name={f.icon} size={22} stroke={2}/>
              </div>
              <Tag tone="outline">{f.tag}</Tag>
              <h3 style={{ fontSize: 19, fontWeight: 700, marginTop: 12, letterSpacing: "-0.025em", lineHeight: 1.3 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.6, marginTop: 8 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------- 작동 방식 ---------- */
const HowItWorks = () => {
  const steps = [
    { n: "01", t: "URL 붙여넣기", d: "네이버 플레이스 매장 주소를 입력합니다. 음식점·미용실·헬스장 등 모든 업종 지원." },
    { n: "02", t: "AI가 키워드를 추론", d: "매장의 위치·메뉴·주변 명소를 종합해 실제 검색될 만한 50+개 키워드를 매 회차 생성합니다." },
    { n: "03", t: "오가닉 5위만 정밀 추적", d: "광고를 자동 제거하고 모바일 통합검색 기준 진짜 순위만 골라냅니다." },
    { n: "04", t: "10개 채워질 때까지 무한 반복", d: "TOP 5에 노출된 키워드 10개가 발견되면 자동으로 정리해서 보여드립니다." },
  ];
  return (
    <section style={{ background: "var(--ink-900)", color: "white", padding: "120px 0", position: "relative", overflow: "hidden" }}>
      <div aria-hidden style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(rgba(3,199,90,0.08) 1px, transparent 1px)",
        backgroundSize: "30px 30px",
      }}/>
      <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "0 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 60, alignItems: "start" }}>
          <div style={{ position: "sticky", top: 100 }}>
            <Tag tone="green" size="lg">작동 방식</Tag>
            <h2 style={{ fontSize: 44, fontWeight: 800, marginTop: 18, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
              크롤러도 아니고, 단순 매크로도 아닙니다.
            </h2>
            <p style={{ fontSize: 16, opacity: 0.7, marginTop: 18, lineHeight: 1.7 }}>
              네이버의 모바일 통합검색 결과를 모바일 안드로이드 기기로 가장한 채 추적하고,
              place 링크를 직접 식별해서 진짜 오가닉 순위만 골라내는 정밀 분석기입니다.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {steps.map((s, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "auto 1fr",
                gap: 28, padding: "32px 0",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: i === 0 ? "var(--green-500)" : "rgba(255,255,255,0.06)",
                  border: i === 0 ? "0" : "1px solid rgba(255,255,255,0.12)",
                  display: "grid", placeItems: "center",
                  fontSize: 18, fontWeight: 800,
                  color: i === 0 ? "white" : "rgba(255,255,255,0.5)",
                  letterSpacing: "-0.02em",
                }}>{s.n}</div>
                <div style={{ paddingTop: 8 }}>
                  <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em" }}>{s.t}</h3>
                  <p style={{ fontSize: 15, opacity: 0.65, marginTop: 6, lineHeight: 1.6 }}>{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ---------- 요금제 ---------- */
const Pricing = ({ goto }) => {
  const plans = [
    {
      name: "Starter",
      desc: "혼자 매장 운영하시는 사장님",
      price: "0",
      period: "원 / 영구",
      cta: "무료로 시작",
      badge: null,
      features: ["월 1회 무료 스캔", "TOP 5 키워드 최대 5개", "결과 24시간 보관", "이메일 지원"],
      featured: false,
    },
    {
      name: "Agency",
      desc: "마케팅 대행사·컨설턴트",
      price: "89,000",
      period: "원 / 월 (VAT 별도)",
      cta: "Agency 시작하기",
      badge: "가장 인기",
      features: [
        "월 200회 스캔 (매장 무제한)",
        "TOP 5 키워드 10개 + 6~10위 추가 보너스",
        "주간 자동 재스캔 + 변동 알림",
        "PPT·CSV 보고서 자동 생성",
        "팀 멤버 3명 포함",
        "고객사 화이트라벨링",
      ],
      featured: true,
    },
    {
      name: "Enterprise",
      desc: "프랜차이즈 본사·대형 대행사",
      price: "맞춤",
      period: "견적 문의",
      cta: "도입 상담 받기",
      badge: null,
      features: [
        "스캔 횟수 무제한",
        "API 제공",
        "전담 매니저 배정",
        "온프레미스 옵션",
        "SLA 99.9% 보장",
      ],
      featured: false,
    },
  ];
  return (
    <section style={{ background: "white", padding: "120px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <Tag tone="green" size="lg">요금제</Tag>
          <h2 style={{ fontSize: 48, fontWeight: 800, marginTop: 16, letterSpacing: "-0.04em" }}>
            단순한 가격, 무제한 매장 분석
          </h2>
          <p style={{ fontSize: 17, color: "var(--ink-600)", marginTop: 12 }}>
            모든 요금제는 7일 무료 체험 후 결제됩니다.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, alignItems: "stretch" }}>
          {plans.map((p, i) => (
            <div key={i} style={{
              position: "relative",
              padding: 36, borderRadius: 20,
              background: p.featured ? "var(--ink-900)" : "white",
              color: p.featured ? "white" : "var(--ink-900)",
              border: p.featured ? "0" : "1px solid var(--border)",
              boxShadow: p.featured ? "0 30px 60px rgba(15,20,25,0.18)" : "var(--shadow-xs)",
              display: "flex", flexDirection: "column",
              transform: p.featured ? "scale(1.02)" : "scale(1)",
            }}>
              {p.badge && (
                <div style={{
                  position: "absolute", top: -12, left: 28,
                  background: "var(--green-500)", color: "white",
                  padding: "5px 12px", borderRadius: 999,
                  fontSize: 12, fontWeight: 700,
                }}>{p.badge}</div>
              )}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: p.featured ? "var(--green-300)" : "var(--green-600)" }}>{p.name}</div>
                <div style={{ fontSize: 14, opacity: p.featured ? 0.7 : 1, color: p.featured ? "white" : "var(--ink-600)", marginTop: 4 }}>{p.desc}</div>
              </div>
              <div style={{ marginBottom: 28, display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.04em" }}>{p.price}</span>
                <span style={{ fontSize: 14, opacity: 0.6 }}>{p.period}</span>
              </div>
              <button
                onClick={() => goto("dashboard")}
                className={p.featured ? "btn btn-primary btn-lg" : "btn btn-outline btn-lg"}
                style={{ width: "100%", marginBottom: 28 }}>
                {p.cta}
              </button>
              <ul style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
                {p.features.map((f, j) => (
                  <li key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 999, flexShrink: 0,
                      background: p.featured ? "rgba(3,199,90,0.22)" : "var(--green-50)",
                      color: p.featured ? "var(--green-300)" : "var(--green-600)",
                      display: "grid", placeItems: "center", marginTop: 2,
                    }}>
                      <Icon name="check" size={11} stroke={3}/>
                    </div>
                    <span style={{ lineHeight: 1.45, opacity: p.featured ? 0.9 : 1 }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------- 푸터 ---------- */
const Footer = () => (
  <footer style={{ background: "var(--ink-50)", padding: "60px 0 30px", borderTop: "1px solid var(--border)" }}>
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 48, marginBottom: 40 }}>
        <div>
          <Logo size={24}/>
          <p style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 14, lineHeight: 1.6 }}>
            네이버 플레이스 5위 키워드를 자동으로 찾아주는<br/>
            마케팅 대행사 전용 데이터 분석 도구.
          </p>
        </div>
        {[
          { t: "제품", l: ["기능", "요금제", "변경 이력", "API"] },
          { t: "회사", l: ["소개", "블로그", "채용", "보도자료"] },
          { t: "리소스", l: ["고객사례", "가이드", "도움말", "상태"] },
          { t: "약관", l: ["이용약관", "개인정보", "환불정책"] },
        ].map(c => (
          <div key={c.t}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-800)", marginBottom: 12 }}>{c.t}</div>
            <ul style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "var(--ink-500)" }}>
              {c.l.map(x => <li key={x} style={{ cursor: "pointer" }}>{x}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div style={{
        paddingTop: 24, borderTop: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-500)",
      }}>
        <div>© 2026 RankFive Inc. 사업자등록번호 123-45-67890</div>
        <div>대표: 김영업 · 서울시 강남구 테헤란로 123, 5층</div>
      </div>
    </div>
  </footer>
);

const Landing = ({ goto }) => (
  <div data-screen-label="01 Landing">
    <TopNav goto={goto}/>
    <Hero goto={goto}/>
    <DemoPreview/>
    <Features/>
    <HowItWorks/>
    <Pricing goto={goto}/>
    <Footer/>
  </div>
);

Object.assign(window, { Landing });
