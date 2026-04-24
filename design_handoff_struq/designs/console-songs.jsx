// ─── Songs list ─────────────────────────────────────────
function SongsList({ width=390, height=844 }) {
  const { C, mono, sans, MetaTag, BottomNav, SEC_COLOR, SECTIONS, TopBar, IconPlus, IconSearch } = window;

  const songs = [
    { title:"Love Me Do", artist:"The Beatles", bpm:120, key:"G", secs:SECTIONS.slice(0,10) },
    { title:"Come Together", artist:"The Beatles", bpm:82, key:"Dm", secs:SECTIONS.slice(2,10) },
    { title:"Yesterday", artist:"The Beatles", bpm:97, key:"F", secs:SECTIONS.slice(0,6) },
    { title:"Here Comes the Sun", artist:"The Beatles", bpm:129, key:"A", secs:SECTIONS.slice(1,10) },
    { title:"Let It Be", artist:"The Beatles", bpm:72, key:"C", secs:SECTIONS.slice(0,7) },
    { title:"Hey Jude", artist:"The Beatles", bpm:73, key:"F", secs:SECTIONS.slice(0,10) },
  ];

  return (
    <div style={{width, height, background:C.bg, color:C.text, ...sans, display:"flex", flexDirection:"column", overflow:"hidden"}}>
      <TopBar title="Songs" subtitle="32 TOTAL · 6 SHOWN"
        left={<MetaTag>STRUQ</MetaTag>}
        right={<button style={{...mono, fontSize:10, letterSpacing:"0.22em", background:C.text, color:C.bg, border:"none", padding:"6px 10px", display:"flex", alignItems:"center", gap:4, borderRadius:1}}><IconPlus/>NEW</button>}
      />

      {/* Search */}
      <div style={{padding:"12px 18px", borderBottom:`1px solid ${C.line}`, display:"flex", alignItems:"center", gap:10}}>
        <div style={{color:C.dim}}><IconSearch/></div>
        <input placeholder="Search title, artist, key…" style={{
          flex:1, background:"transparent", border:"none", outline:"none",
          ...sans, fontSize:14, color:"#fff",
        }}/>
        <MetaTag>A–Z</MetaTag>
      </div>

      {/* List */}
      <div style={{flex:1, overflow:"auto"}}>
        {songs.map((s,i)=>(
          <div key={i} style={{padding:"16px 18px", borderBottom:`1px solid ${C.line}`, display:"flex", gap:14}}>
            <div style={{...mono, fontSize:10, letterSpacing:"0.18em", color:C.dim2, paddingTop:4, width:22}}>
              {String(i+1).padStart(2,"0")}
            </div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{display:"flex", alignItems:"baseline", gap:10, flexWrap:"wrap"}}>
                <div style={{...sans, fontSize:16, fontWeight:600, color:"#fff"}}>{s.title}</div>
                <div style={{...mono, fontSize:10, letterSpacing:"0.18em", color:C.dim}}>{s.artist.toUpperCase()}</div>
              </div>
              {/* structure + counts */}
              <div style={{marginTop:10, display:"flex", alignItems:"center", gap:10}}>
                <div style={{flex:1, display:"flex", gap:1.5}}>
                  {s.secs.map((sec,k)=>(
                    <div key={k} style={{flex:sec.bars, height:5, background:SEC_COLOR[sec.type]}}/>
                  ))}
                </div>
                <div style={{...mono, fontSize:9, letterSpacing:"0.15em", color:C.dim, whiteSpace:"nowrap"}}>
                  {String(s.secs.length).padStart(2,"0")} SEC
                </div>
              </div>
              <div style={{display:"flex", gap:14, marginTop:8, ...mono, fontSize:10, letterSpacing:"0.18em", color:C.dim}}>
                <span>{s.bpm} BPM</span>
                <span>KEY {s.key.toUpperCase()}</span>
                <span>{s.secs.reduce((a,x)=>a+x.bars,0)} BARS</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomNav active="songs"/>
    </div>
  );
}

// ─── Song editor ────────────────────────────────────────
function SongEdit({ width=390, height=844 }) {
  const { C, mono, sans, MetaTag, BottomNav, SEC_COLOR, SECTIONS, TopBar, IconBack, IconPlay, IconTrash, IconDrag, IconExt, IconSparkles, ConsoleField } = window;

  const secs = SECTIONS.slice(0,5);

  return (
    <div style={{width, height, background:C.bg, color:C.text, ...sans, display:"flex", flexDirection:"column", overflow:"hidden"}}>
      <TopBar title="Love Me Do" subtitle="EDITING · 10 SECTIONS"
        left={<button style={{background:"transparent", border:"none", color:C.text, padding:4}}><IconBack/></button>}
        right={
          <div style={{display:"flex", gap:4}}>
            <button style={{background:"transparent", border:"none", color:C.dim, padding:4}}><IconTrash/></button>
            <button style={{...mono, fontSize:10, letterSpacing:"0.22em", background:C.accent, color:"#000", border:"none", padding:"6px 10px", display:"flex", alignItems:"center", gap:4, borderRadius:1, fontWeight:600}}><IconPlay/>PERFORM</button>
          </div>
        }
      />

      <div style={{flex:1, overflow:"auto", padding:"16px 18px"}}>
        {/* Meta block */}
        <div>
          <MetaTag>01 · TRACK META</MetaTag>
          <div style={{marginTop:10, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <div style={{gridColumn:"span 2"}}>
              <ConsoleField label="Title" value="Love Me Do" required/>
            </div>
            <div style={{gridColumn:"span 2"}}>
              <ConsoleField label="Artist" value="The Beatles"/>
            </div>
            <ConsoleField label="BPM" value="120" mono/>
            <ConsoleField label="Key" value="G" mono/>
          </div>
          <div style={{marginTop:10, display:"flex", alignItems:"center", gap:8}}>
            <div style={{flex:1}}>
              <ConsoleField label="Reference" value="https://open.spotify.com/…" mono/>
            </div>
            <button style={{padding:"12px 12px", border:`1px solid ${C.line2}`, color:C.dim, background:"transparent", borderRadius:1, marginTop:24}}><IconExt/></button>
          </div>
        </div>

        {/* Structure preview */}
        <div style={{marginTop:24}}>
          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
            <MetaTag>02 · STRUCTURE</MetaTag>
            <div style={{flex:1, height:1, background:C.line}}/>
            <MetaTag>60 BARS</MetaTag>
          </div>
          <div style={{display:"flex", gap:2}}>
            {SECTIONS.map((s,i)=>(
              <div key={i} style={{flex:s.bars, height:8, background:SEC_COLOR[s.type]}}/>
            ))}
          </div>
        </div>

        {/* AI button */}
        <button style={{
          marginTop:16, width:"100%",
          ...mono, fontSize:11, letterSpacing:"0.22em", fontWeight:500,
          background:"transparent", color:"#fff",
          border:`1px solid ${C.line2}`, padding:"12px", borderRadius:1,
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        }}>
          <IconSparkles/> AI · GENERATE STRUCTURE
        </button>

        {/* Palette */}
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
                <div style={{...mono, fontSize:9, letterSpacing:"0.18em", color:C.dim}}>{t.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div style={{marginTop:24}}>
          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
            <MetaTag>04 · SECTIONS</MetaTag>
            <div style={{flex:1, height:1, background:C.line}}/>
            <MetaTag>{String(SECTIONS.length).padStart(2,"0")}</MetaTag>
          </div>
          {secs.map((s,i)=>(
            <div key={i} style={{
              border:`1px solid ${C.line}`, borderLeft:`3px solid ${SEC_COLOR[s.type]}`,
              background:"rgba(255,255,255,0.02)", padding:"12px 14px", borderRadius:1,
              marginBottom:8,
            }}>
              <div style={{display:"flex", alignItems:"center", gap:10}}>
                <div style={{color:C.dim2}}><IconDrag/></div>
                <div style={{...mono, fontSize:11, letterSpacing:"0.2em", color:C.dim}}>{String(i+1).padStart(2,"0")}</div>
                <div style={{...sans, fontSize:15, fontWeight:600, color:"#fff", flex:1}}>{s.label}</div>
                <div style={{...mono, fontSize:11, color:SEC_COLOR[s.type], letterSpacing:"0.1em", fontWeight:600}}>
                  {String(s.bars).padStart(2,"0")} BARS
                </div>
              </div>
              <div style={{marginTop:8, ...mono, fontSize:12, letterSpacing:"0.15em", color:C.dim, fontWeight:500}}>
                {s.chord}
              </div>
            </div>
          ))}
          <div style={{textAlign:"center", padding:"10px", ...mono, fontSize:10, letterSpacing:"0.22em", color:C.dim2}}>
            +5 MORE BELOW
          </div>
        </div>
      </div>

      {/* Sticky save */}
      <div style={{borderTop:`1px solid ${C.line}`, padding:"12px 18px", background:C.bg}}>
        <button style={{
          width:"100%", background:"#fff", color:"#000", border:"none",
          padding:"14px", ...mono, fontSize:12, letterSpacing:"0.25em", fontWeight:600,
          borderRadius:1,
        }}>
          SAVE CHANGES
        </button>
      </div>

      <BottomNav active="songs"/>
    </div>
  );
}

window.SongsList = SongsList;
window.SongEdit = SongEdit;
