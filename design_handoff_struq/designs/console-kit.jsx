// Shared Console kit — tokens + primitives for all non-Perform screens.
// `designs/console.jsx` (Perform) uses its own styling; these are the shared
// building blocks for Login/Setlists/Songs/Settings.

const mono = { fontFamily:"'JetBrains Mono', ui-monospace, monospace" };
const sans = { fontFamily:"Inter, sans-serif" };

const C = {
  bg:      "#080808",
  bg2:     "#0d0d0e",
  bg3:     "#161618",
  line:    "rgba(255,255,255,0.08)",
  line2:   "rgba(255,255,255,0.14)",
  text:    "#e8e6e0",
  dim:     "rgba(255,255,255,0.55)",
  dim2:    "rgba(255,255,255,0.35)",
  dim3:    "rgba(255,255,255,0.2)",
  accent:  "var(--sec-a)",
};

function MetaTag({ children, color, size=10 }) {
  return <span style={{
    ...mono, fontSize:size, letterSpacing:"0.22em",
    color: color ?? "rgba(255,255,255,0.4)",
    textTransform:"uppercase", fontWeight:500,
  }}>{children}</span>;
}

function ConsoleField({ label, value, placeholder, mono:isMono, required }) {
  return (
    <label style={{display:"block"}}>
      <div style={{...mono, fontSize:9, letterSpacing:"0.25em", color:"rgba(255,255,255,0.4)", marginBottom:8, textTransform:"uppercase"}}>
        {label}{required && <span style={{color:"oklch(0.70 0.18 25)", marginLeft:4}}>*</span>}
      </div>
      <div style={{
        background:"rgba(255,255,255,0.02)",
        border:`1px solid ${C.line}`,
        borderLeft: value? `2px solid ${C.accent}` : `1px solid ${C.line}`,
        padding:"12px 14px",
        ...(isMono? mono : sans),
        fontSize:14, fontWeight: isMono? 500:400,
        color: value? "#fff" : "rgba(255,255,255,0.3)",
        letterSpacing: isMono? "0.08em":0,
      }}>
        {value || placeholder}
      </div>
    </label>
  );
}

function TopBar({ title, left, right, subtitle }) {
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"auto 1fr auto",
      alignItems:"center", padding:"14px 18px",
      borderBottom:`1px solid ${C.line}`, background:C.bg, gap:12,
    }}>
      <div style={{minWidth:32}}>{left}</div>
      <div style={{textAlign:"center", minWidth:0}}>
        <div style={{...sans, fontSize:15, fontWeight:600, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{title}</div>
        {subtitle && <div style={{...mono, fontSize:9, letterSpacing:"0.22em", color:"rgba(255,255,255,0.4)", marginTop:3}}>{subtitle}</div>}
      </div>
      <div style={{minWidth:32, textAlign:"right", display:"flex", justifyContent:"flex-end", gap:4}}>{right}</div>
    </div>
  );
}

function BottomNav({ active }) {
  const tabs = [
    { id:"setlists", label:"SETLISTS", icon:(
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M3 12h12M3 18h8M19 15l4 3-4 3z"/></svg>
    )},
    { id:"songs",    label:"SONGS", icon:(
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/></svg>
    )},
    { id:"settings", label:"SETTINGS", icon:(
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8L6.3 17.7M17.7 6.3l2.1-2.1"/></svg>
    )},
  ];
  return (
    <div style={{display:"flex", borderTop:`1px solid ${C.line}`, background:C.bg}}>
      {tabs.map(t=>{
        const on = t.id===active;
        return (
          <div key={t.id} style={{
            flex:1, padding:"10px 0 12px", textAlign:"center",
            borderTop: on? `2px solid ${C.accent}` : "2px solid transparent",
            marginTop: on? -1 : 0,
            color: on? "#fff" : "rgba(255,255,255,0.4)",
            display:"flex", flexDirection:"column", alignItems:"center", gap:5,
          }}>
            {t.icon}
            <div style={{...mono, fontSize:9, letterSpacing:"0.22em", fontWeight: on?600:400}}>{t.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// Icons
const IconBack = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M15 18l-6-6 6-6"/></svg>;
const IconPlay = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z"/></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg>;
const IconPlus = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M12 5v14M5 12h14"/></svg>;
const IconSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>;
const IconSparkles = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3v4M12 17v4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M3 12h4M17 12h4M4.2 19.8L7 17M17 7l2.8-2.8"/></svg>;
const IconDrag = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>;
const IconExt = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 3h6v6M10 14L21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>;
const IconPin = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s-8-7-8-13a8 8 0 0 1 16 0c0 6-8 13-8 13z"/><circle cx="12" cy="9" r="2.5"/></svg>;
const IconCal = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;

Object.assign(window, {
  C, mono, sans,
  MetaTag, ConsoleField, TopBar, BottomNav,
  IconBack, IconPlay, IconTrash, IconPlus, IconSearch, IconSparkles, IconDrag, IconExt, IconPin, IconCal,
});
