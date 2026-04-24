// PC (landscape) versions of Setlists / Songs / Settings.
// Shared rail pattern: fixed 64-72px side rail with tabs + main 2-column body.
// Reuses console-kit tokens and section colors.

function SideRail({ active }) {
  const { C, mono } = window;
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
      width:76, background:C.bg, borderRight:`1px solid ${C.line}`,
      display:"flex", flexDirection:"column", alignItems:"stretch",
    }}>
      <div style={{padding:"18px 0", textAlign:"center", borderBottom:`1px solid ${C.line}`}}>
        <svg width="26" height="26" viewBox="0 0 24 24">
          <rect x="2"  y="4"  width="6"  height="3" fill="oklch(0.72 0.02 250)"/>
          <rect x="10" y="4"  width="8"  height="3" fill="oklch(0.72 0.14 250)"/>
          <rect x="2"  y="10" width="12" height="3" fill="oklch(0.74 0.16 65)"/>
          <rect x="2"  y="16" width="5"  height="3" fill="oklch(0.72 0.14 160)"/>
          <rect x="9"  y="16" width="11" height="3" fill="oklch(0.70 0.18 25)"/>
        </svg>
      </div>
      <div style={{flex:1, display:"flex", flexDirection:"column", paddingTop:6}}>
        {items.map(it=>{
          const on = it.id===active;
          return (
            <div key={it.id} style={{
              padding:"18px 0 16px", textAlign:"center",
              borderLeft: on? `2px solid ${C.accent}`:"2px solid transparent",
              color: on? "#fff": C.dim2,
              display:"flex", flexDirection:"column", alignItems:"center", gap:6,
            }}>
              {it.icon}
              <div style={{...mono, fontSize:8, letterSpacing:"0.22em", fontWeight: on?600:400}}>{it.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{padding:"14px 0", borderTop:`1px solid ${C.line}`, textAlign:"center"}}>
        <div style={{
          width:32, height:32, margin:"0 auto", background:C.accent, color:"#000",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"Inter", fontSize:13, fontWeight:700, letterSpacing:"-0.02em",
        }}>MK</div>
      </div>
    </div>
  );
}

function TopRail({ title, subtitle, right }) {
  const { C, mono, sans } = window;
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:18,
      padding:"14px 28px", borderBottom:`1px solid ${C.line}`, background:C.bg,
    }}>
      <div style={{flex:1}}>
        <div style={{...sans, fontSize:20, fontWeight:700, letterSpacing:"-0.01em"}}>{title}</div>
        {subtitle && <div style={{...mono, fontSize:10, letterSpacing:"0.22em", color:C.dim, marginTop:3}}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

// ─── Setlists (PC) ─────────────────────────────────────
function SetlistsPC({ width=1440, height=900 }) {
  const { C, mono, sans, MetaTag, SEC_COLOR, SECTIONS, IconTrash, IconPin, IconCal, IconPlay, IconPlus, IconDrag } = window;

  const setlists = [
    { id:1, title:"Spring Tour 2026 · Night 1", venue:"Shimokitazawa CLUB Que", date:"2026.04.18", count:8, active:true },
    { id:2, title:"Weekly Rehearsal",           venue:"Studio 246 · Rm B",      date:"2026.04.15", count:12 },
    { id:3, title:"Acoustic Session",           venue:"Home",                   date:"2026.04.12", count:5  },
    { id:4, title:"Wedding — K & Y",            venue:"Omotesando Hills",       date:"2026.05.02", count:14 },
    { id:5, title:"Autumn Tour · Osaka",        venue:"Shinsaibashi BIGCAT",    date:"2025.11.04", count:10 },
  ];

  const songs = [
    { title:"Love Me Do",         artist:"The Beatles", bpm:120, key:"G",  count:10 },
    { title:"Come Together",      artist:"The Beatles", bpm:82,  key:"Dm", count:8  },
    { title:"Yesterday",          artist:"The Beatles", bpm:97,  key:"F",  count:6  },
    { title:"Here Comes the Sun", artist:"The Beatles", bpm:129, key:"A",  count:9  },
    { title:"Let It Be",          artist:"The Beatles", bpm:72,  key:"C",  count:7  },
    { title:"Hey Jude",           artist:"The Beatles", bpm:73,  key:"F",  count:11 },
  ];

  return (
    <div style={{width, height, background:C.bg, color:C.text, ...sans, display:"flex", overflow:"hidden"}}>
      <SideRail active="setlists"/>

      {/* LIST COLUMN */}
      <div style={{width:360, borderRight:`1px solid ${C.line}`, display:"flex", flexDirection:"column"}}>
        <div style={{padding:"14px 22px", borderBottom:`1px solid ${C.line}`, display:"flex", alignItems:"center"}}>
          <div style={{flex:1}}>
            <div style={{...sans, fontSize:16, fontWeight:700}}>Setlists</div>
            <div style={{...mono, fontSize:9, letterSpacing:"0.22em", color:C.dim, marginTop:2}}>05 ACTIVE · 12 ARCHIVED</div>
          </div>
          <button style={{
            ...mono, fontSize:10, letterSpacing:"0.22em", background:C.text, color:C.bg,
            border:"none", padding:"6px 10px", display:"flex", alignItems:"center", gap:4, borderRadius:1, fontWeight:600,
          }}><IconPlus/>NEW</button>
        </div>

        <div style={{padding:"10px 22px", borderBottom:`1px solid ${C.line}`, display:"flex", alignItems:"center", gap:8}}>
          <div style={{width:6, height:6, borderRadius:"50%", background:C.accent}}/>
          <input placeholder="Filter setlists…" style={{
            flex:1, background:"transparent", border:"none", outline:"none",
            ...sans, fontSize:13, color:"#fff",
          }}/>
          <MetaTag size={9}>⌘K</MetaTag>
        </div>

        <div style={{flex:1, overflow:"auto"}}>
          {setlists.map((it,i)=>(
            <div key={it.id} style={{
              padding:"14px 22px", borderBottom:`1px solid ${C.line}`,
              background: it.active? "rgba(255,255,255,0.04)":"transparent",
              borderLeft: it.active? `2px solid ${C.accent}`:"2px solid transparent",
              marginLeft: it.active? -2:0,
            }}>
              <div style={{display:"flex", gap:10}}>
                <div style={{...mono, fontSize:10, letterSpacing:"0.18em", color:C.dim2, paddingTop:3, width:18}}>
                  {String(i+1).padStart(2,"0")}
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{...sans, fontSize:14, fontWeight:600, color:it.active?"#fff":C.text}}>{it.title}</div>
                  <div style={{display:"flex", gap:10, marginTop:5, ...mono, fontSize:9, letterSpacing:"0.15em", color:C.dim}}>
                    <span style={{display:"flex", alignItems:"center", gap:3}}><IconCal/>{it.date}</span>
                    <span style={{...mono, letterSpacing:"0.18em"}}>{String(it.count).padStart(2,"0")} SONGS</span>
                  </div>
                  <div style={{display:"flex", gap:1, marginTop:8, height:3}}>
                    {Array.from({length:it.count}).map((_,k)=>{
                      const t = SECTIONS[k % SECTIONS.length].type;
                      return <div key={k} style={{flex:1, background:SEC_COLOR[t]}}/>;
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAIL COLUMN */}
      <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0}}>
        <TopRail
          title="Spring Tour 2026 · Night 1"
          subtitle="2026.04.18 · 19:30 · SHIMOKITAZAWA CLUB QUE"
          right={
            <div style={{display:"flex", gap:8, alignItems:"center"}}>
              <button style={{
                ...mono, fontSize:10, letterSpacing:"0.22em", background:"transparent", color:C.dim,
                border:`1px solid ${C.line2}`, padding:"8px 12px", borderRadius:1,
              }}>DUPLICATE</button>
              <button style={{
                ...mono, fontSize:10, letterSpacing:"0.22em", background:"transparent", color:"oklch(0.70 0.18 25)",
                border:`1px solid ${C.line2}`, padding:"8px 10px", borderRadius:1, display:"flex", alignItems:"center", gap:4,
              }}><IconTrash/>DELETE</button>
              <button style={{
                ...mono, fontSize:11, letterSpacing:"0.22em", background:C.accent, color:"#000",
                border:"none", padding:"10px 16px", borderRadius:1, display:"flex", alignItems:"center", gap:6, fontWeight:700,
              }}><IconPlay/>START PERFORM</button>
            </div>
          }
        />

        {/* Metadata row */}
        <div style={{padding:"18px 28px", borderBottom:`1px solid ${C.line}`, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:32}}>
          {[
            ["SONGS","06"],
            ["TOTAL SECTIONS","51"],
            ["EST. DURATION","28 MIN"],
            ["AVG BPM","95"],
          ].map(([k,v])=>(
            <div key={k}>
              <MetaTag>{k}</MetaTag>
              <div style={{...sans, fontSize:28, fontWeight:700, marginTop:6, letterSpacing:"-0.02em"}}>{v}</div>
            </div>
          ))}
        </div>

        {/* Total structure */}
        <div style={{padding:"16px 28px", borderBottom:`1px solid ${C.line}`}}>
          <div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}>
            <MetaTag>TOTAL STRUCTURE</MetaTag>
            <MetaTag>HOVER SEGMENT TO PREVIEW</MetaTag>
          </div>
          <div style={{display:"flex", gap:1}}>
            {songs.flatMap((s,si)=>
              Array.from({length:s.count}).map((_,k)=>{
                const t = SECTIONS[k % SECTIONS.length].type;
                return <div key={`${si}-${k}`} style={{flex:1, height:10, background:SEC_COLOR[t]}}/>;
              })
            )}
          </div>
          <div style={{display:"flex", gap:1, marginTop:3}}>
            {songs.map((s,si)=>(
              <div key={si} style={{flex:s.count, ...mono, fontSize:8, letterSpacing:"0.15em", color:C.dim2, paddingTop:4, borderTop:`1px solid ${C.line}`, textAlign:"center"}}>
                {String(si+1).padStart(2,"0")}
              </div>
            ))}
          </div>
        </div>

        {/* Song rows */}
        <div style={{flex:1, overflow:"auto"}}>
          <div style={{display:"grid", gridTemplateColumns:"28px 42px 1fr 220px 100px 80px 100px", padding:"10px 28px", borderBottom:`1px solid ${C.line}`, ...mono, fontSize:9, letterSpacing:"0.22em", color:C.dim2}}>
            <div></div><div>#</div><div>TITLE</div><div>STRUCTURE</div><div style={{textAlign:"right"}}>BPM</div><div style={{textAlign:"right"}}>KEY</div><div style={{textAlign:"right"}}>SEC</div>
          </div>
          {songs.map((s,i)=>(
            <div key={i} style={{
              display:"grid", gridTemplateColumns:"28px 42px 1fr 220px 100px 80px 100px",
              padding:"14px 28px", borderBottom:`1px solid ${C.line}`,
              alignItems:"center",
              background: i===0? "rgba(255,255,255,0.02)":"transparent",
            }}>
              <div style={{color:C.dim2}}><IconDrag/></div>
              <div style={{...mono, fontSize:16, fontWeight:600, color:"#fff"}}>{String(i+1).padStart(2,"0")}</div>
              <div>
                <div style={{...sans, fontSize:14, fontWeight:600, color:"#fff"}}>{s.title}</div>
                <div style={{...mono, fontSize:9, letterSpacing:"0.18em", color:C.dim, marginTop:3}}>{s.artist.toUpperCase()}</div>
              </div>
              <div style={{display:"flex", gap:1, height:5}}>
                {Array.from({length:s.count}).map((_,k)=>{
                  const t = SECTIONS[k % SECTIONS.length].type;
                  return <div key={k} style={{flex:1, background:SEC_COLOR[t]}}/>;
                })}
              </div>
              <div style={{...mono, fontSize:13, fontWeight:600, color:"#fff", textAlign:"right", letterSpacing:"0.05em"}}>{s.bpm}</div>
              <div style={{...mono, fontSize:13, fontWeight:600, color:"#fff", textAlign:"right"}}>{s.key}</div>
              <div style={{...mono, fontSize:13, color:C.dim, textAlign:"right"}}>{String(s.count).padStart(2,"0")}</div>
            </div>
          ))}
          <button style={{
            margin:"16px 28px", padding:"14px", width:"calc(100% - 56px)",
            background:"transparent", border:`1px dashed ${C.line2}`, color:C.dim,
            ...mono, fontSize:11, letterSpacing:"0.22em", borderRadius:1,
          }}>+ ADD SONG FROM LIBRARY</button>
        </div>
      </div>
    </div>
  );
}

// ─── Songs (PC) ────────────────────────────────────────
function SongsPC({ width=1440, height=900 }) {
  const { C, mono, sans, MetaTag, SEC_COLOR, SECTIONS, IconSearch, IconPlus, IconPlay, IconTrash, IconExt, IconSparkles, IconDrag, ConsoleField } = window;

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

  return (
    <div style={{width, height, background:C.bg, color:C.text, ...sans, display:"flex", overflow:"hidden"}}>
      <SideRail active="songs"/>

      {/* Library list */}
      <div style={{width:360, borderRight:`1px solid ${C.line}`, display:"flex", flexDirection:"column"}}>
        <div style={{padding:"14px 22px", borderBottom:`1px solid ${C.line}`, display:"flex", alignItems:"center"}}>
          <div style={{flex:1}}>
            <div style={{...sans, fontSize:16, fontWeight:700}}>Songs</div>
            <div style={{...mono, fontSize:9, letterSpacing:"0.22em", color:C.dim, marginTop:2}}>32 TOTAL · 8 SHOWN</div>
          </div>
          <button style={{
            ...mono, fontSize:10, letterSpacing:"0.22em", background:C.text, color:C.bg,
            border:"none", padding:"6px 10px", display:"flex", alignItems:"center", gap:4, borderRadius:1, fontWeight:600,
          }}><IconPlus/>NEW</button>
        </div>
        <div style={{padding:"10px 22px", borderBottom:`1px solid ${C.line}`, display:"flex", alignItems:"center", gap:8}}>
          <div style={{color:C.dim}}><IconSearch/></div>
          <input placeholder="Search title, artist, key…" style={{
            flex:1, background:"transparent", border:"none", outline:"none",
            ...sans, fontSize:13, color:"#fff",
          }}/>
          <MetaTag size={9}>A–Z</MetaTag>
        </div>

        <div style={{flex:1, overflow:"auto"}}>
          {songs.map((s,i)=>(
            <div key={i} style={{
              padding:"12px 22px", borderBottom:`1px solid ${C.line}`,
              display:"flex", gap:10,
              background: s.active? "rgba(255,255,255,0.04)":"transparent",
              borderLeft: s.active? `2px solid ${C.accent}`:"2px solid transparent",
              marginLeft: s.active? -2:0,
            }}>
              <div style={{...mono, fontSize:9, letterSpacing:"0.18em", color:C.dim2, paddingTop:4, width:18}}>
                {String(i+1).padStart(2,"0")}
              </div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{...sans, fontSize:13, fontWeight:600, color: s.active? "#fff":C.text}}>{s.title}</div>
                <div style={{display:"flex", gap:10, marginTop:3, ...mono, fontSize:9, letterSpacing:"0.18em", color:C.dim}}>
                  <span>{s.bpm}BPM</span><span>{s.key}</span><span>{String(s.secs.length).padStart(2,"0")}SEC</span>
                </div>
                <div style={{display:"flex", gap:1, marginTop:6, height:3}}>
                  {s.secs.map((sec,k)=>(
                    <div key={k} style={{flex:sec.bars, background:SEC_COLOR[sec.type]}}/>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0}}>
        <TopRail
          title="Love Me Do"
          subtitle="EDITING · 10 SECTIONS · 60 BARS"
          right={
            <div style={{display:"flex", gap:8, alignItems:"center"}}>
              <button style={{
                ...mono, fontSize:10, letterSpacing:"0.22em", background:"transparent", color:"oklch(0.70 0.18 25)",
                border:`1px solid ${C.line2}`, padding:"8px 10px", borderRadius:1, display:"flex", alignItems:"center", gap:4,
              }}><IconTrash/>DELETE</button>
              <button style={{
                ...mono, fontSize:11, letterSpacing:"0.22em", background:"#fff", color:"#000",
                border:"none", padding:"10px 16px", borderRadius:1, fontWeight:700,
              }}>SAVE CHANGES</button>
              <button style={{
                ...mono, fontSize:11, letterSpacing:"0.22em", background:C.accent, color:"#000",
                border:"none", padding:"10px 16px", borderRadius:1, display:"flex", alignItems:"center", gap:6, fontWeight:700,
              }}><IconPlay/>PERFORM</button>
            </div>
          }
        />

        <div style={{flex:1, overflow:"auto", display:"grid", gridTemplateColumns:"380px 1fr", gap:0}}>
          {/* META column */}
          <div style={{padding:"22px 26px", borderRight:`1px solid ${C.line}`}}>
            <MetaTag>01 · TRACK META</MetaTag>
            <div style={{marginTop:14, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
              <div style={{gridColumn:"span 2"}}><ConsoleField label="Title" value="Love Me Do" required/></div>
              <div style={{gridColumn:"span 2"}}><ConsoleField label="Artist" value="The Beatles"/></div>
              <ConsoleField label="BPM" value="120" mono/>
              <ConsoleField label="Key" value="G" mono/>
              <div style={{gridColumn:"span 2"}}>
                <ConsoleField label="Reference URL" value="https://open.spotify.com/…" mono/>
              </div>
            </div>

            <div style={{marginTop:24}}>
              <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
                <MetaTag>02 · STRUCTURE PREVIEW</MetaTag>
                <div style={{flex:1, height:1, background:C.line}}/>
              </div>
              <div style={{display:"flex", gap:2, height:14}}>
                {SECTIONS.map((s,i)=>(
                  <div key={i} style={{flex:s.bars, background:SEC_COLOR[s.type]}}/>
                ))}
              </div>
              <div style={{display:"flex", gap:2, marginTop:5}}>
                {SECTIONS.map((s,i)=>(
                  <div key={i} style={{flex:s.bars, textAlign:"center", ...mono, fontSize:8, letterSpacing:"0.1em", color:C.dim2}}>
                    {s.label.slice(0,3)}
                  </div>
                ))}
              </div>
            </div>

            <button style={{
              marginTop:20, width:"100%",
              ...mono, fontSize:11, letterSpacing:"0.22em", fontWeight:500,
              background:"transparent", color:"#fff",
              border:`1px solid ${C.line2}`, padding:"12px", borderRadius:1,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}>
              <IconSparkles/> AI · GENERATE STRUCTURE
            </button>

            <div style={{marginTop:22}}>
              <MetaTag>03 · ADD SECTION</MetaTag>
              <div style={{marginTop:10, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6}}>
                {["intro","a","b","chorus","bridge","solo","interlude","outro"].map(t=>(
                  <div key={t} style={{
                    padding:"10px 4px", border:`1px solid ${C.line}`, borderRadius:1,
                    background:"rgba(255,255,255,0.02)",
                    display:"flex", flexDirection:"column", alignItems:"center", gap:6, cursor:"pointer",
                  }}>
                    <div style={{width:18, height:18, background:SEC_COLOR[t], borderRadius:1}}/>
                    <div style={{...mono, fontSize:8, letterSpacing:"0.18em", color:C.dim}}>{t.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTIONS column */}
          <div style={{padding:"22px 28px"}}>
            <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:14}}>
              <MetaTag>04 · SECTIONS</MetaTag>
              <div style={{flex:1, height:1, background:C.line}}/>
              <MetaTag>{String(SECTIONS.length).padStart(2,"0")} TOTAL</MetaTag>
            </div>

            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              {SECTIONS.map((s,i)=>(
                <div key={i} style={{
                  border:`1px solid ${C.line}`, borderLeft:`3px solid ${SEC_COLOR[s.type]}`,
                  background:"rgba(255,255,255,0.02)", padding:"12px 16px", borderRadius:1,
                }}>
                  <div style={{display:"grid", gridTemplateColumns:"18px 36px 1fr 140px 90px 90px 28px", alignItems:"center", gap:10}}>
                    <div style={{color:C.dim2}}><IconDrag/></div>
                    <div style={{...mono, fontSize:11, letterSpacing:"0.2em", color:C.dim, fontWeight:500}}>
                      {String(i+1).padStart(2,"0")}
                    </div>
                    <div style={{display:"flex", alignItems:"baseline", gap:12}}>
                      <div style={{...sans, fontSize:15, fontWeight:600, color:"#fff"}}>{s.label}</div>
                      <div style={{...mono, fontSize:9, letterSpacing:"0.22em", color:SEC_COLOR[s.type]}}>
                        {s.type.toUpperCase()}
                      </div>
                    </div>
                    <div style={{...mono, fontSize:13, letterSpacing:"0.15em", color:C.dim, fontWeight:500}}>{s.chord}</div>
                    <div style={{...mono, fontSize:11, color:SEC_COLOR[s.type], letterSpacing:"0.08em", fontWeight:600, textAlign:"right"}}>
                      {String(s.bars).padStart(2,"0")} BARS
                    </div>
                    <div style={{...mono, fontSize:10, color:C.dim2, letterSpacing:"0.08em", textAlign:"right"}}>
                      {s.bars*4}b
                    </div>
                    <div style={{color:C.dim3, textAlign:"right"}}><IconTrash/></div>
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

// ─── Settings (PC) ─────────────────────────────────────
function SettingsPC({ width=1440, height=900 }) {
  const { C, mono, sans, MetaTag } = window;

  const nav = [
    { id:"account",    label:"ACCOUNT" },
    { id:"language",   label:"LANGUAGE" },
    { id:"audio",      label:"AUDIO & CLICK", active:true },
    { id:"appearance", label:"APPEARANCE" },
    { id:"shortcuts",  label:"SHORTCUTS" },
    { id:"about",      label:"ABOUT" },
  ];

  return (
    <div style={{width, height, background:C.bg, color:C.text, ...sans, display:"flex", overflow:"hidden"}}>
      <SideRail active="settings"/>

      {/* Settings sub-nav */}
      <div style={{width:260, borderRight:`1px solid ${C.line}`, padding:"18px 0"}}>
        <div style={{padding:"0 22px 18px", borderBottom:`1px solid ${C.line}`}}>
          <div style={{...sans, fontSize:16, fontWeight:700}}>Settings</div>
          <div style={{...mono, fontSize:9, letterSpacing:"0.22em", color:C.dim, marginTop:3}}>SYSTEM & PREFERENCES</div>
        </div>
        <div style={{marginTop:8}}>
          {nav.map(n=>(
            <div key={n.id} style={{
              padding:"12px 22px",
              borderLeft: n.active? `2px solid ${C.accent}`:"2px solid transparent",
              background: n.active? "rgba(255,255,255,0.04)":"transparent",
              color: n.active? "#fff":C.dim,
              ...mono, fontSize:11, letterSpacing:"0.22em", fontWeight: n.active?600:400,
              display:"flex", alignItems:"center", justifyContent:"space-between",
            }}>
              <span>{n.label}</span>
              {n.active && <span style={{color:C.accent}}>●</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0}}>
        <TopRail
          title="Audio & Click"
          subtitle="METRONOME · COUNT-IN · SOUND"
          right={
            <button style={{
              ...mono, fontSize:11, letterSpacing:"0.22em", background:"#fff", color:"#000",
              border:"none", padding:"10px 16px", borderRadius:1, fontWeight:700,
            }}>APPLY CHANGES</button>
          }
        />

        <div style={{flex:1, overflow:"auto", padding:"28px 36px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, alignContent:"flex-start"}}>

          {/* Click toggle */}
          <SettingRow
            label="CLICK TRACK"
            desc="Play metronome audio during Auto mode performance."
          >
            <Toggle on/>
          </SettingRow>

          {/* Count-in */}
          <SettingRow
            label="COUNT-IN"
            desc="Play 4 beats before the song starts in Auto mode."
          >
            <Toggle/>
          </SettingRow>

          {/* Click volume */}
          <SettingRow
            label="CLICK VOLUME"
            desc="Level of the metronome audio output."
            span={2}
          >
            <div style={{display:"flex", alignItems:"center", gap:16}}>
              <div style={{flex:1, height:4, background:"rgba(255,255,255,0.08)", position:"relative"}}>
                <div style={{position:"absolute", left:0, top:0, bottom:0, width:"62%", background:C.accent}}/>
                <div style={{position:"absolute", left:"62%", top:-5, width:2, height:14, background:"#fff"}}/>
              </div>
              <div style={{...mono, fontSize:16, fontWeight:600, color:C.accent, letterSpacing:"0.08em", width:50, textAlign:"right"}}>062</div>
            </div>
            <div style={{display:"flex", justifyContent:"space-between", marginTop:8, ...mono, fontSize:9, letterSpacing:"0.18em", color:C.dim2}}>
              <span>000 · MUTE</span><span>050</span><span>100 · MAX</span>
            </div>
          </SettingRow>

          {/* Click sound */}
          <SettingRow label="CLICK SOUND" desc="Tonal character of the metronome." span={2}>
            <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8}}>
              {[
                { id:"tick",  label:"TICK",  desc:"sharp, wood",    active:true },
                { id:"beep",  label:"BEEP",  desc:"sine tone"       },
                { id:"snap",  label:"SNAP",  desc:"analog click"    },
                { id:"rim",   label:"RIM",   desc:"drum rim"        },
              ].map(s=>(
                <div key={s.id} style={{
                  padding:"14px 14px", border:`1px solid ${s.active? C.text:C.line}`,
                  background:"rgba(255,255,255,0.02)", borderRadius:1,
                }}>
                  <div style={{...mono, fontSize:11, letterSpacing:"0.22em", color: s.active? C.accent:C.dim, fontWeight:600}}>
                    {s.label}
                  </div>
                  <div style={{fontSize:12, color:C.dim, marginTop:4}}>{s.desc}</div>
                </div>
              ))}
            </div>
          </SettingRow>

          {/* Accent on downbeat */}
          <SettingRow label="ACCENT DOWNBEAT" desc="Emphasize beat 1 of each bar.">
            <Toggle on/>
          </SettingRow>

          <SettingRow label="PRE-ROLL BARS" desc="Silent bars before Count-in (Auto).">
            <div style={{display:"flex", gap:4}}>
              {[0,1,2,4].map(n=>(
                <div key={n} style={{
                  padding:"10px 14px", border:`1px solid ${n===0? C.text:C.line}`,
                  background: n===0? "rgba(255,255,255,0.05)":"transparent",
                  ...mono, fontSize:12, letterSpacing:"0.08em", fontWeight:600,
                  color: n===0? C.accent:C.dim,
                }}>{n}</div>
              ))}
            </div>
          </SettingRow>

        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, desc, children, span=1 }) {
  const { C, mono, sans } = window;
  return (
    <div style={{
      gridColumn: span===2? "span 2": undefined,
      padding:"20px 22px", border:`1px solid ${C.line}`, background:"rgba(255,255,255,0.015)",
    }}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:20, marginBottom:16}}>
        <div style={{flex:1, minWidth:0}}>
          <div style={{...mono, fontSize:11, letterSpacing:"0.22em", color:"#fff", fontWeight:600}}>{label}</div>
          <div style={{...sans, fontSize:13, color:C.dim, marginTop:5}}>{desc}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ on }) {
  const { C } = window;
  return (
    <div style={{width:54, height:28, background: on? C.accent:"rgba(255,255,255,0.1)", borderRadius:14, padding:2, position:"relative"}}>
      <div style={{
        width:24, height:24, background: on?"#000":"rgba(255,255,255,0.35)",
        borderRadius:"50%", position:"absolute",
        left: on? "calc(100% - 26px)":2, top:2, transition:"left .15s",
      }}/>
    </div>
  );
}

Object.assign(window, { SetlistsPC, SongsPC, SettingsPC, SideRail, TopRail });
