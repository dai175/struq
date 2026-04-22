// ─── Setlists list ──────────────────────────────────────
function SetlistsList({ width=390, height=844 }) {
  const { C, mono, sans, MetaTag, BottomNav, SEC_COLOR, SECTIONS, TopBar, IconTrash, IconPin, IconCal, IconPlus } = window;

  const items = [
    { title:"Spring Tour 2026 · Night 1", venue:"Shimokitazawa CLUB Que", date:"2026.04.18", count:8, color:"a" },
    { title:"Weekly Rehearsal", venue:"Studio 246 · Rm B", date:"2026.04.15", count:12, color:"chorus" },
    { title:"Acoustic Session", venue:"Home", date:"2026.04.12", count:5, color:"bridge" },
    { title:"Wedding — K&Y", venue:"Omotesando Hills", date:"2026.05.02", count:14, color:"solo" },
  ];

  return (
    <div style={{width, height, background:C.bg, color:C.text, ...sans, display:"flex", flexDirection:"column", overflow:"hidden"}}>
      <TopBar title="Setlists" subtitle="04 ACTIVE · 12 ARCHIVED"
        left={<MetaTag>STRUQ</MetaTag>}
        right={<button style={{...mono, fontSize:10, letterSpacing:"0.22em", background:C.text, color:C.bg, border:"none", padding:"6px 10px", display:"flex", alignItems:"center", gap:4, borderRadius:1}}><IconPlus/>NEW</button>}
      />

      {/* Search line */}
      <div style={{padding:"14px 18px", borderBottom:`1px solid ${C.line}`, display:"flex", alignItems:"center", gap:10}}>
        <div style={{width:6, height:6, borderRadius:"50%", background:C.accent, boxShadow:`0 0 6px ${C.accent}`}}/>
        <input placeholder="Filter setlists…" style={{
          flex:1, background:"transparent", border:"none", outline:"none",
          ...sans, fontSize:14, color:"#fff",
        }}/>
        <MetaTag>⌘K</MetaTag>
      </div>

      {/* List */}
      <div style={{flex:1, overflow:"auto"}}>
        {items.map((it,i)=>(
          <div key={i} style={{
            padding:"16px 18px", borderBottom:`1px solid ${C.line}`,
            display:"flex", gap:14, alignItems:"flex-start",
          }}>
            {/* Index column */}
            <div style={{...mono, fontSize:10, letterSpacing:"0.18em", color:C.dim2, paddingTop:4, width:22}}>
              {String(i+1).padStart(2,"0")}
            </div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{...sans, fontSize:16, fontWeight:600, color:"#fff"}}>{it.title}</div>
              <div style={{display:"flex", gap:14, marginTop:6, ...mono, fontSize:10, letterSpacing:"0.15em", color:C.dim}}>
                <span style={{display:"flex", alignItems:"center", gap:4}}><IconCal/>{it.date}</span>
                <span style={{display:"flex", alignItems:"center", gap:4}}><IconPin/>{it.venue.toUpperCase()}</span>
              </div>
              {/* mini structure preview */}
              <div style={{display:"flex", gap:2, marginTop:10, height:4}}>
                {Array.from({length:it.count}).map((_,k)=>{
                  const t = SECTIONS[k % SECTIONS.length].type;
                  return <div key={k} style={{flex:1, background:SEC_COLOR[t], opacity:0.85}}/>;
                })}
              </div>
              <div style={{...mono, fontSize:9, letterSpacing:"0.22em", color:C.dim2, marginTop:6}}>
                {String(it.count).padStart(2,"0")} SONGS
              </div>
            </div>
            <button style={{background:"transparent", border:"none", color:C.dim2, padding:4, cursor:"pointer"}}><IconTrash/></button>
          </div>
        ))}
      </div>

      <BottomNav active="setlists"/>
    </div>
  );
}

// ─── Setlist detail ─────────────────────────────────────
function SetlistDetail({ width=390, height=844 }) {
  const { C, mono, sans, MetaTag, BottomNav, SEC_COLOR, SECTIONS, TopBar, IconBack, IconPlay, IconDrag } = window;

  const songs = [
    { title:"Love Me Do",         artist:"The Beatles",     bpm:120, key:"G",  count:10 },
    { title:"Come Together",      artist:"The Beatles",     bpm:82,  key:"Dm", count:8  },
    { title:"Yesterday",          artist:"The Beatles",     bpm:97,  key:"F",  count:6  },
    { title:"Here Comes the Sun", artist:"The Beatles",     bpm:129, key:"A",  count:9  },
    { title:"Let It Be",          artist:"The Beatles",     bpm:72,  key:"C",  count:7  },
    { title:"Hey Jude",           artist:"The Beatles",     bpm:73,  key:"F",  count:11 },
  ];

  return (
    <div style={{width, height, background:C.bg, color:C.text, ...sans, display:"flex", flexDirection:"column", overflow:"hidden"}}>
      <TopBar title="Spring Tour 2026" subtitle="NIGHT 01 · 06 SONGS"
        left={<button style={{background:"transparent", border:"none", color:C.text, padding:4}}><IconBack/></button>}
        right={<button style={{...mono, fontSize:10, letterSpacing:"0.22em", background:C.accent, color:"#000", border:"none", padding:"6px 10px", display:"flex", alignItems:"center", gap:4, borderRadius:1, fontWeight:600}}><IconPlay/>START</button>}
      />

      {/* Venue metadata */}
      <div style={{padding:"14px 18px", borderBottom:`1px solid ${C.line}`, display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
        <div>
          <MetaTag>VENUE</MetaTag>
          <div style={{...sans, fontSize:14, fontWeight:500, marginTop:4, color:"#fff"}}>Shimokitazawa CLUB Que</div>
        </div>
        <div>
          <MetaTag>DATE</MetaTag>
          <div style={{...mono, fontSize:14, fontWeight:500, marginTop:4, color:"#fff", letterSpacing:"0.05em"}}>2026.04.18 · 19:30</div>
        </div>
      </div>

      {/* Total structure bar */}
      <div style={{padding:"12px 18px", borderBottom:`1px solid ${C.line}`}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
          <MetaTag>TOTAL STRUCTURE · 51 SECTIONS</MetaTag>
          <MetaTag>≈ 28 MIN</MetaTag>
        </div>
        <div style={{display:"flex", gap:1}}>
          {songs.flatMap((s,si)=>
            Array.from({length:s.count}).map((_,k)=>{
              const t = SECTIONS[k % SECTIONS.length].type;
              return <div key={`${si}-${k}`} style={{flex:1, height:6, background:SEC_COLOR[t]}}/>;
            })
          )}
        </div>
      </div>

      {/* Song list */}
      <div style={{flex:1, overflow:"auto"}}>
        {songs.map((s,i)=>(
          <div key={i} style={{
            padding:"14px 18px", borderBottom:`1px solid ${C.line}`,
            display:"flex", gap:12, alignItems:"center",
          }}>
            <div style={{color:C.dim2, cursor:"grab"}}><IconDrag/></div>
            <div style={{...mono, fontSize:20, fontWeight:600, color:"#fff", width:28, letterSpacing:"0.02em"}}>
              {String(i+1).padStart(2,"0")}
            </div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:15, fontWeight:600, color:"#fff"}}>{s.title}</div>
              <div style={{...mono, fontSize:10, letterSpacing:"0.15em", color:C.dim, marginTop:3}}>
                {s.artist.toUpperCase()} · {s.bpm} BPM · {s.key.toUpperCase()} · {String(s.count).padStart(2,"0")} SEC
              </div>
            </div>
            <div style={{width:40, height:3, display:"flex", gap:1}}>
              {Array.from({length:Math.min(s.count,6)}).map((_,k)=>{
                const t = SECTIONS[k % SECTIONS.length].type;
                return <div key={k} style={{flex:1, background:SEC_COLOR[t]}}/>;
              })}
            </div>
          </div>
        ))}

        <button style={{
          margin:"14px 18px", padding:"14px", width:"calc(100% - 36px)",
          background:"transparent", border:`1px dashed ${C.line2}`, color:C.dim,
          ...mono, fontSize:11, letterSpacing:"0.22em", borderRadius:1,
          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
        }}>+ ADD SONG FROM LIBRARY</button>
      </div>

      <BottomNav active="setlists"/>
    </div>
  );
}

window.SetlistsList = SetlistsList;
window.SetlistDetail = SetlistDetail;
