/* ============================================
   로그인 / 회원가입
   ============================================ */
const { useState, useEffect, useRef, useMemo, useCallback } = React;
const Auth = ({ goto }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);

  return (
    <div data-screen-label="02 Auth" style={{
      minHeight: "100vh",
      display: "grid", gridTemplateColumns: "1fr 1fr",
      background: "white",
    }}>
      {/* 좌측 비주얼 */}
      <div style={{
        position: "relative",
        background: "linear-gradient(160deg, #028A3F 0%, #02A94C 40%, #03C75A 100%)",
        color: "white",
        padding: "56px 60px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        overflow: "hidden",
      }}>
        <DotsBg color="rgba(255,255,255,0.4)" opacity={0.4}/>

        <div style={{ position: "relative" }} onClick={() => goto("landing")} role="button">
          <Logo size={28} color="white"/>
          <style>{`[data-screen-label="02 Auth"] [role="button"] span { color: white !important; }`}</style>
        </div>

        <div style={{ position: "relative" }}>
          <Tag tone="dark" size="lg" icon="sparkle">실제 분석 데이터</Tag>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.15, marginTop: 18 }}>
            평균 3분 12초.<br/>
            마케터 한 명이 하루 종일 할 일을<br/>
            대신 끝내드립니다.
          </h2>

          {/* 미니 결과 카드 */}
          <div style={{
            marginTop: 36,
            background: "rgba(0,0,0,0.22)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 18, padding: 20,
            maxWidth: 420,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 500 }}>오늘의 분석</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, opacity: 0.8 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--green-300)", boxShadow: "0 0 8px var(--green-300)" }}/>
                실시간
              </div>
            </div>
            {[
              { kw: "수성동 천겹살", r: 1, c: "var(--green-300)" },
              { kw: "범어네거리 회식장소", r: 2, c: "rgba(255,255,255,0.8)" },
              { kw: "수성구 고기집", r: 3, c: "rgba(255,255,255,0.8)" },
            ].map((x, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 0",
                borderTop: i === 0 ? "0" : "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: i === 0 ? "var(--green-500)" : "rgba(255,255,255,0.12)",
                  display: "grid", placeItems: "center",
                  fontWeight: 800, fontSize: 12, color: i === 0 ? "white" : "rgba(255,255,255,0.9)",
                }}>{x.r}</div>
                <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{x.kw}</div>
                <Icon name="trend" size={16} stroke={2}/>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "relative", fontSize: 13, opacity: 0.7 }}>
          "수성동 한 매장에서 23개 키워드 5위 안에 진입했어요. 인사이트 회의 시간이 절반으로 줄었습니다."
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7, fontWeight: 600 }}>— 박지훈, 로컬코어 마케팅 팀장</div>
        </div>
      </div>

      {/* 우측 폼 */}
      <div style={{ display: "grid", placeItems: "center", padding: "48px 60px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.15 }}>
            {mode === "login" ? "다시 오신 걸 환영합니다 👋" : "30초 만에 가입하기"}
          </h1>
          <p style={{ fontSize: 15, color: "var(--ink-600)", marginTop: 10 }}>
            {mode === "login"
              ? "계정에 로그인하고 키워드 분석을 이어가세요."
              : "이메일만 있으면 됩니다. 가입 즉시 무료 스캔 1회 제공."}
          </p>

          {/* 소셜 로그인 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 32 }}>
            <button className="btn btn-lg" style={{
              width: "100%", background: "#FEE500", color: "#000", borderRadius: 12,
            }}>
              <Icon name="kakao" size={18}/>
              카카오로 1초 만에 시작하기
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button className="btn btn-lg" style={{ background: "#03C75A", color: "white", borderRadius: 12 }}>
                <Icon name="naverN" size={16}/>
                네이버
              </button>
              <button className="btn btn-outline btn-lg" style={{ borderRadius: 12 }}>
                <Icon name="google" size={16}/>
                구글
              </button>
            </div>
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            margin: "28px 0", color: "var(--ink-400)", fontSize: 12,
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
            또는 이메일로
            <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
          </div>

          {/* 이메일 폼 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-700)" }}>이메일</label>
              <div style={{ position: "relative", marginTop: 6 }}>
                <Icon name="mail" size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }}/>
                <input className="input" placeholder="work@agency.co.kr"
                  value={email} onChange={e => setEmail(e.target.value)}
                  style={{ paddingLeft: 40 }}/>
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-700)" }}>비밀번호</label>
                {mode === "login" && (
                  <span style={{ fontSize: 12, color: "var(--green-600)", fontWeight: 600, cursor: "pointer" }}>비밀번호를 잊으셨나요?</span>
                )}
              </div>
              <div style={{ position: "relative", marginTop: 6 }}>
                <Icon name="lock" size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }}/>
                <input className="input"
                  type={showPw ? "text" : "password"}
                  placeholder={mode === "login" ? "비밀번호 입력" : "8자 이상"}
                  value={pw} onChange={e => setPw(e.target.value)}
                  style={{ paddingLeft: 40, paddingRight: 40 }}/>
                <button onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }}>
                  <Icon name={showPw ? "eyeOff" : "eye"} size={16}/>
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <label style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                fontSize: 13, color: "var(--ink-700)", lineHeight: 1.5, cursor: "pointer",
                padding: "4px 0",
              }}>
                <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}
                  style={{ marginTop: 3, accentColor: "var(--green-500)", width: 16, height: 16 }}/>
                <span>
                  <strong>(필수)</strong> 이용약관 및 개인정보 처리방침에 동의합니다.
                  <span style={{ color: "var(--green-600)", fontWeight: 600, marginLeft: 4 }}>약관 보기</span>
                </span>
              </label>
            )}

            <button
              onClick={() => goto("dashboard")}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginTop: 6, height: 50, fontSize: 15 }}>
              {mode === "login" ? "로그인" : "무료로 시작하기"}
              <Icon name="arrowR" size={16}/>
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--ink-600)" }}>
            {mode === "login" ? "아직 계정이 없으신가요?" : "이미 계정이 있으신가요?"}
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
              style={{ color: "var(--green-600)", fontWeight: 700, marginLeft: 6 }}>
              {mode === "login" ? "회원가입" : "로그인"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Auth });
