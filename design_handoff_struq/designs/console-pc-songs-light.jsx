// Light-mode PC version of the Songs screen.
// Mirrors SongsPC structure but rebuilds tokens, primitives, and section colors
// for a warm-paper aesthetic. Standalone — does not depend on console-kit's dark C.

const monoL = { fontFamily:"'JetBrains Mono', ui-monospace, monospace" };
const sansL = { fontFamily:"Inter, sans-serif" };

// Warm paper palette
const CL = {
  bg:      "#f4f1ea",          // paper
  bg2:     "#ece8df",          // panel / sidebar
  bg3:     "#e3ddd0",          // elevated card tint
  inkHi:   "#141312",          // primary text
  ink:     "#2a2825",          // body
  dim:     "rgba(20,19,18,0.55)",
  dim2:    "rgba(20,19,18,0.38)",
  dim3:    "rgba(20,19,18,0.20)",
  line:    "rgba(20,19,18,0.10)",
  line2:   "rgba(20,19,18,0.18)",
  rule:    "rgba(20,19,18,0.28)",
  // Accent — anchored to the dark version's --sec-a hue (250) but darker for contrast on paper
  accent:  "oklch(0.48 0.16 250)",
  accentSoft: "oklch(0.48 0.16 250 / 0.10)",
  danger:  "oklch(0.52 0.20 25)",
};

// Section colors — same hues as dark mode, lower lightness + slightly higher chroma
// so they remain distinguishable on warm paper.
const SEC_LIGHT = {
  intro:     "oklch(0.55 0.04 250)",
  a:         "oklch(0.50 0.15 250)",
  b:         "oklch(0.50 0.16 295)",
  chorus:    "oklch(0.62 0.16 65)",
  bridge:    "oklch(0.52 0.13 160)",
  solo:      "oklch(0.55 0.18 25)",
  outro:     "oklch(0.55 0.04 250)",
  interlude: "oklch(0.55 0.12 195)",
  custom:    "oklch(0.55 0.16 340)",
};

// Light-mode primitives
function MetaTagL({ children, color, size=10 }) {
  return <span style={{
    ...monoL, fontSize:size, letterSpacing:"0.22em",
    color: color ?? CL.dim,
    textTransform:"uppercase", fontWeight:500,
  }}>{children}</span>;
}

function ConsoleFieldL({ label, value, placeholder, mono:isMono, required }) {
  const filled = !!value;
  return (
    <label style={{display:"block"}}>
      <div style={{...monoL, fontSize:9, letterSpacing:"0.25em", color:CL.dim, marginBottom:8, textTransform:"uppercase"}}>
        {label}{required && <span style={{color:CL.danger, marginLeft:4}}>*</span>}
      </div>
      <div style={{
        background:"#fbf9f4",
        border:`1px solid ${CL.line2}`,
        borderLeft: filled ? `2px solid ${CL.accent}` : `1px solid ${CL.line2}`,
        padding:"12px 14px",
        ...(isMono? monoL : sansL),
        fontSize:14, fontWeight: isMono? 500:400,
        color: filled ? CL.inkHi : CL.dim2,
        letterSpacing: isMono? "0.08em":0,
      }}>
        {value || placeholder}
      </div>
    </label>
  );
}

function TopRailL({ title, subtitle, right }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:18,
      padding:"14px 28px", borderBottom:`1px solid ${CL.line}`, background:CL.bg,
    }}>
      <div style={{flex:1}}>
        <div style={{...sansL, fontSize:20, fontWeight:700, letterSpacing:"-0.01em", color:CL.inkHi}}>{title}</div>
        {subtitle && <div style={{...monoL, fontSize:10, letterSpacing:"0.22em", color:CL.dim, marginTop:3}}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

// Small inline icons (re-declared so this file is self-contained)
const I = {
  Search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>,
  Plus:   () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M12 5v14M5 12h14"/></svg>,
  Play:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z"/></svg>,
  Trash:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg>,
  Sparks: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3v4M12 17v4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M3 12h4M17 12h4M4.2 19.8L7 17M17 7l2.8-2.8"/></svg>,
  Drag:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>,
  Sun:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>,
};

// Side rail (light)
function SideRailL({ active }) {
  const items = [
    { id:"setlists", label:"SETLIST", icon:(
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6h18M3 12h12M3 18h8M19 15l4 3-4 3z"/></svg>
    )},
    { id:"songs", label:"SONGS", icon:(
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/></svg>
    )},
    { id:"settings", label:"SETTINGS", icon:(
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8L6.3 17.7M17.7 6.3l2.1-2.1"/></svg>
    )},
  ];
  return (
    <div style={{
      width:76, background:CL.bg2, borderRight:`1px solid ${CL.line}`,
      display:"flex", flexDirection:"column", alignItems:"stretch",
    }}>
      <div style={{padding:"18px 0", textAlign:"center", borderBottom:`1px solid ${CL.line}`}}>
        <svg width="26" height="26" viewBox="0 0 24 24">
          <rect x="2"  y="4"  width="6"  height="3" fill={SEC_LIGHT.intro}/>
          <rect x="10" y="4"  width="8"  height="3" fill={SEC_LIGHT.a}/>
          <rect x="2"  y="10" width="12" height="3" fill={SEC_LIGHT.chorus}/>
          <rect x="2"  y="16" width="5"  height="3" fill={SEC_LIGHT.bridge}/>
          <rect x="9"  y="16" width="11" height="3" fill={SEC_LIGHT.solo}/>
        </svg>
      </div>
      <div style={{flex:1, display:"flex", flexDirection:"column", paddingTop:6}}>
        {items.map(it=>{
          const on = it.id===active;
          return (
            <div key={it.id} style={{
              padding:"18px 0 16px", textAlign:"center",
              borderLeft: on ? `2px solid ${CL.accent}` : "2px solid transparent",
              color: on ? CL.inkHi : CL.dim2,
              display:"flex", flexDirection:"column", alignItems:"center", gap:6,
            }}>
              {it.icon}
              <div style={{...monoL, fontSize:8, letterSpacing:"0.22em", fontWeight: on?600:400}}>{it.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{padding:"14px 0", borderTop:`1px solid ${CL.line}`, textAlign:"center"}}>
        <div style={{
          width:32, height:32, margin:"0 auto", background:CL.accent, color:"#fbf9f4",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"Inter", fontSize:13, fontWeight:700, letterSpacing:"-0.02em",
        }}>MK</div>
      </div>
    </div>
  );
}

// ─── Songs (PC, LIGHT) ────────────────────────────────
function SongsPCLight({ width=1440, height=900 }) {
  const { SECTIONS } = window;

  const songs = [
    { title:"Love Me Do",         artist:"The Beatles", bpm:120, key:"G",  secs:SECTIONS.slice(0,10), active:true },
    { title:"Come Together",      artist:"The Beatles", bpm:82,  key:"Dm", secs:SECTIONS.slice(2,10) },
    { title:"Yesterday",          artist:"The Beatles", bpm:97,  key:"F",  secs:SECTIONS.slice(0,6)  },
    { title:"Here Comes the Sun", artist:"The Beatles", bpm:129, key:"A",  secs:SECTIONS.slice(1,10) },
    { title:"Let It Be",          artist:"The Beatles", bpm:72,  key:"C",  secs:SECTIONS.slice(0,7)  },
    { title:"Hey Jude",           artist:"The Beatles", bpm:73,  key:"F",  secs:SECTIONS.slice(0,10) },
    { title:"Blackbird",          artist:"The Beatles", bpm:96,  key:"G",  secs:SECTIONS.slice(0,5)  },
    { title:"Something",          artist:"The Beatles", bpm:66,  key:"C",  secs:SECTIONS.slice(0,8)  },
  ];

  // Fixed-section render of SECTIONS using LIGHT palette (instead of the global dark var())
  const secColor = (t) => SEC_LIGHT[t] || SEC_LIGHT.custom;

  return (
    <div style={{width, height, background:CL.bg, color:CL.ink, ...sansL, display:"flex", overflow:"hidden"}}>
      <SideRailL active="songs"/>

      {/* Library list */}
      <div style={{width:360, background:CL.bg, borderRight:`1px solid ${CL.line}`, display:"flex", flexDirection:"column"}}>
        <div style={{padding:"14px 22px", borderBottom:`1px solid ${CL.line}`, display:"flex", alignItems:"center"}}>
          <div style={{flex:1}}>
            <div style={{...sansL, fontSize:16, fontWeight:700, color:CL.inkHi}}>Songs</div>
            <div style={{...monoL, fontSize:9, letterSpacing:"0.22em", color:CL.dim, marginTop:2}}>32 TOTAL · 8 SHOWN</div>
          </div>
          <button style={{
            ...monoL, fontSize:10, letterSpacing:"0.22em", background:CL.inkHi, color:CL.bg,
            border:"none", padding:"6px 10px", display:"flex", alignItems:"center", gap:4, borderRadius:1, fontWeight:600,
          }}><I.Plus/>NEW</button>
        </div>
        <div style={{padding:"10px 22px", borderBottom:`1px solid ${CL.line}`, display:"flex", alignItems:"center", gap:8}}>
          <div style={{color:CL.dim}}><I.Search/></div>
          <input placeholder="Search title, artist, key…" style={{
            flex:1, background:"transparent", border:"none", outline:"none",
            ...sansL, fontSize:13, color:CL.inkHi,
          }}/>
          <MetaTagL size={9}>A–Z</MetaTagL>
        </div>

        <div style={{flex:1, overflow:"auto"}}>
          {songs.map((s,i)=>(
            <div key={i} style={{
              padding:"12px 22px", borderBottom:`1px solid ${CL.line}`,
              display:"flex", gap:10,
              background: s.active ? "rgba(20,19,18,0.045)" : "transparent",
              borderLeft: s.active ? `2px solid ${CL.accent}` : "2px solid transparent",
              marginLeft: s.active ? -2 : 0,
            }}>
              <div style={{...monoL, fontSize:9, letterSpacing:"0.18em", color:CL.dim2, paddingTop:4, width:18}}>
                {String(i+1).padStart(2,"0")}
              </div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{...sansL, fontSize:13, fontWeight:600, color: s.active ? CL.inkHi : CL.ink}}>{s.title}</div>
                <div style={{display:"flex", gap:10, marginTop:3, ...monoL, fontSize:9, letterSpacing:"0.18em", color:CL.dim}}>
                  <span>{s.bpm}BPM</span><span>{s.key}</span><span>{String(s.secs.length).padStart(2,"0")}SEC</span>
                </div>
                <div style={{display:"flex", gap:1, marginTop:6, height:3}}>
                  {s.secs.map((sec,k)=>(
                    <div key={k} style={{flex:sec.bars, background:secColor(sec.type)}}/>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0, background:CL.bg}}>
        <TopRailL
          title="Love Me Do"
          subtitle="EDITING · 10 SECTIONS · 60 BARS"
          right={
            <div style={{display:"flex", gap:8, alignItems:"center"}}>
              <button style={{
                ...monoL, fontSize:10, letterSpacing:"0.22em", background:"transparent", color:CL.danger,
                border:`1px solid ${CL.line2}`, padding:"8px 10px", borderRadius:1, display:"flex", alignItems:"center", gap:4,
              }}><I.Trash/>DELETE</button>
              <button style={{
                ...monoL, fontSize:11, letterSpacing:"0.22em", background:CL.inkHi, color:CL.bg,
                border:"none", padding:"10px 16px", borderRadius:1, fontWeight:700,
              }}>SAVE CHANGES</button>
              <button style={{
                ...monoL, fontSize:11, letterSpacing:"0.22em", background:CL.accent, color:"#fbf9f4",
                border:"none", padding:"10px 16px", borderRadius:1, display:"flex", alignItems:"center", gap:6, fontWeight:700,
              }}><I.Play/>PERFORM</button>
            </div>
          }
        />

        <div style={{flex:1, overflow:"auto", display:"grid", gridTemplateColumns:"380px 1fr", gap:0}}>
          {/* META column */}
          <div style={{padding:"22px 26px", borderRight:`1px solid ${CL.line}`}}>
            <MetaTagL>01 · TRACK META</MetaTagL>
            <div style={{marginTop:14, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
              <div style={{gridColumn:"span 2"}}><ConsoleFieldL label="Title" value="Love Me Do" required/></div>
              <div style={{gridColumn:"span 2"}}><ConsoleFieldL label="Artist" value="The Beatles"/></div>
              <ConsoleFieldL label="BPM" value="120" mono/>
              <ConsoleFieldL label="Key" value="G" mono/>
              <div style={{gridColumn:"span 2"}}>
                <ConsoleFieldL label="Reference URL" value="https://open.spotify.com/…" mono/>
              </div>
            </div>

            <div style={{marginTop:24}}>
              <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
                <MetaTagL>02 · STRUCTURE PREVIEW</MetaTagL>
                <div style={{flex:1, height:1, background:CL.line}}/>
              </div>
              <div style={{display:"flex", gap:2, height:14}}>
                {SECTIONS.map((s,i)=>(
                  <div key={i} style={{flex:s.bars, background:secColor(s.type)}}/>
                ))}
              </div>
              <div style={{display:"flex", gap:2, marginTop:5}}>
                {SECTIONS.map((s,i)=>(
                  <div key={i} style={{flex:s.bars, textAlign:"center", ...monoL, fontSize:8, letterSpacing:"0.1em", color:CL.dim2}}>
                    {s.label.slice(0,3)}
                  </div>
                ))}
              </div>
            </div>

            <button style={{
              marginTop:20, width:"100%",
              ...monoL, fontSize:11, letterSpacing:"0.22em", fontWeight:500,
              background:"transparent", color:CL.inkHi,
              border:`1px solid ${CL.line2}`, padding:"12px", borderRadius:1,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}>
              <I.Sparks/> AI · GENERATE STRUCTURE
            </button>

            <div style={{marginTop:22}}>
              <MetaTagL>03 · ADD SECTION</MetaTagL>
              <div style={{marginTop:10, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6}}>
                {["intro","a","b","chorus","bridge","solo","interlude","outro"].map(t=>(
                  <div key={t} style={{
                    padding:"10px 4px", border:`1px solid ${CL.line}`, borderRadius:1,
                    background:"#fbf9f4",
                    display:"flex", flexDirection:"column", alignItems:"center", gap:6, cursor:"pointer",
                  }}>
                    <div style={{width:18, height:18, background:secColor(t), borderRadius:1}}/>
                    <div style={{...monoL, fontSize:8, letterSpacing:"0.18em", color:CL.dim}}>{t.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTIONS column */}
          <div style={{padding:"22px 28px"}}>
            <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:14}}>
              <MetaTagL>04 · SECTIONS</MetaTagL>
              <div style={{flex:1, height:1, background:CL.line}}/>
              <MetaTagL>{String(SECTIONS.length).padStart(2,"0")} TOTAL</MetaTagL>
            </div>

            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              {SECTIONS.map((s,i)=>(
                <div key={i} style={{
                  border:`1px solid ${CL.line2}`, borderLeft:`3px solid ${secColor(s.type)}`,
                  background:"#fbf9f4", padding:"12px 16px", borderRadius:1,
                }}>
                  <div style={{display:"grid", gridTemplateColumns:"18px 36px 1fr 140px 90px 90px 28px", alignItems:"center", gap:10}}>
                    <div style={{color:CL.dim2}}><I.Drag/></div>
                    <div style={{...monoL, fontSize:11, letterSpacing:"0.2em", color:CL.dim, fontWeight:500}}>
                      {String(i+1).padStart(2,"0")}
                    </div>
                    <div style={{display:"flex", alignItems:"baseline", gap:12}}>
                      <div style={{...sansL, fontSize:15, fontWeight:600, color:CL.inkHi}}>{s.label}</div>
                      <div style={{...monoL, fontSize:9, letterSpacing:"0.22em", color:secColor(s.type)}}>
                        {s.type.toUpperCase()}
                      </div>
                    </div>
                    <div style={{...monoL, fontSize:13, letterSpacing:"0.15em", color:CL.ink, fontWeight:500}}>{s.chord}</div>
                    <div style={{...monoL, fontSize:11, color:secColor(s.type), letterSpacing:"0.08em", fontWeight:600, textAlign:"right"}}>
                      {String(s.bars).padStart(2,"0")} BARS
                    </div>
                    <div style={{...monoL, fontSize:10, color:CL.dim2, letterSpacing:"0.08em", textAlign:"right"}}>
                      {s.bars*4}b
                    </div>
                    <div style={{color:CL.dim3, textAlign:"right"}}><I.Trash/></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.SongsPCLight = SongsPCLight;
