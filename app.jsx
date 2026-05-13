const { useState, useEffect, useRef, useMemo, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{"accent":"#03C75A","scanStyle":"split","denseMode":false}/*EDITMODE-END*/;

const ACCENT_PALETTES = {
  "#03C75A": {
    "--green-300": "#5ee89a",
    "--green-400": "#2ed672",
    "--green-500": "#03C75A",
    "--green-600": "#02a84c",
    "--green-700": "#028A3F",
    "--accent":    "#03C75A",
    "--accent-bg": "#f0fdf6",
  },
  "#0EAEA0": {
    "--green-300": "#5ee8df",
    "--green-400": "#2ed6cc",
    "--green-500": "#0EAEA0",
    "--green-600": "#0b9187",
    "--green-700": "#08756c",
    "--accent":    "#0EAEA0",
    "--accent-bg": "#f0fdfb",
  },
  "#4F6BED": {
    "--green-300": "#97a8f7",
    "--green-400": "#7489f3",
    "--green-500": "#4F6BED",
    "--green-600": "#3d57d9",
    "--green-700": "#2d44c4",
    "--accent":    "#4F6BED",
    "--accent-bg": "#f0f2ff",
  },
  "#1A222B": {
    "--green-300": "#8899aa",
    "--green-400": "#556677",
    "--green-500": "#1A222B",
    "--green-600": "#111820",
    "--green-700": "#090d11",
    "--accent":    "#1A222B",
    "--accent-bg": "#f4f5f6",
  },
};

const SCREENS = [
  { id: "landing",   label: "랜딩" },
  { id: "auth",      label: "로그인" },
  { id: "dashboard", label: "대시보드" },
  { id: "scan",      label: "스캔" },
  { id: "results",   label: "결과" },
  { id: "history",   label: "이력" },
];

const Placeholder = ({ screen }) => (
  <div style={{
    minHeight: "100vh", display: "grid", placeItems: "center",
    background: "var(--surface-1)", color: "var(--ink-400)",
    fontSize: 18, fontWeight: 600,
  }}>
    {screen} — 준비 중
  </div>
);

const PrototypeChrome = ({ screen, setScreen }) => (
  <div style={{
    position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
    zIndex: 9999,
    background: "rgba(15,18,22,0.88)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 999,
    padding: "6px 8px",
    display: "flex", gap: 2,
    boxShadow: "0 8px 32px rgba(0,0,0,0.32)",
  }}>
    {SCREENS.map(s => (
      <button
        key={s.id}
        onClick={() => setScreen(s.id)}
        style={{
          padding: "7px 16px",
          borderRadius: 999,
          fontSize: 13,
          fontWeight: screen === s.id ? 700 : 500,
          color: screen === s.id ? "#fff" : "rgba(255,255,255,0.55)",
          background: screen === s.id ? "var(--accent, #03C75A)" : "transparent",
          transition: "all 0.15s",
          whiteSpace: "nowrap",
          cursor: "pointer",
        }}
      >
        {s.label}
      </button>
    ))}
  </div>
);

const Root = () => {
  const [screen, setScreen] = useState("dashboard");
  const [selectedScan, setSelectedScan] = useState(null);
  const [scanUrl, setScanUrl] = useState(null);
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);

  const openResult = useCallback((scan) => {
    setSelectedScan(scan);
    setScreen("results");
  }, []);

  const startScan = useCallback((url) => {
    setScanUrl(url);
    setScreen("scan");
  }, []);

  useEffect(() => {
    const palette = ACCENT_PALETTES[tweaks.accent] || ACCENT_PALETTES["#03C75A"];
    const root = document.documentElement;
    Object.entries(palette).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [tweaks.accent]);

  const goto = useCallback((s) => setScreen(s), []);

  const renderInner = () => {
    switch (screen) {
      case "scan":    return <ScanProgress key={scanUrl} url={scanUrl} goto={goto} openResult={openResult}/>;
      case "results": return <Results goto={goto} scan={selectedScan}/>;
      case "history": return <History goto={goto} openResult={openResult}/>;
      default:        return <Dashboard goto={goto} openResult={openResult} startScan={startScan}/>;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--surface-1)" }}>
      <Sidebar goto={goto} active={screen}/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {renderInner()}
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<Root/>);
