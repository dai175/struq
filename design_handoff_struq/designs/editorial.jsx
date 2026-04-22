// Direction 1 — Editorial Mono
// Print/typography aesthetic. Oversized section glyph, monospace metadata,
// section grid as a newspaper-style index.
function EditorialPerform({ width=1280, height=720, currentIndex=2 }) {
  const { SONG, SECTIONS, SEC_COLOR } = window;
  const cur = SECTIONS[currentIndex];
  const next = SECTIONS[currentIndex+1];
  const barDone = Math.round(cur.bars * 0.35);

  const mono = { fontFamily:"'JetBrains Mono', ui-monospace, monospace" };
  const serif = { fontFamily:"Fraunces, serif", fontOpticalSizing:"auto" };

  return (
    <div style={{
      width, height, background:"#0b0b0c", color:"#e8e6e0",
      fontFamily:"Inter, sans-serif",
      display:"grid", gridTemplateRows:"auto 1fr auto",
      overflow:"hidden", position:"relative",
    }}>
      {/* Top bar */}
      <div style={{display:"flex", alignItems:"center", padding:"18px 28px", borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{...mono, fontSize:11, letterSpacing:"0.18em", color:"rgba(255,255,255,0.4)"}}>STRUQ / PERFORM</div>
        <div style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center"}}>
          <div style={{...serif, fontSize:16, fontWeight:500}}>{SONG.title}</div>
          <div style={{...mono, fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:2, letterSpacing:"0.15em"}}>
            {SONG.artist.toUpperCase()} · {SONG.bpm} BPM · KEY OF {SONG.key}
          </div>
        </div>
        <div style={{...mono, fontSize:11, letterSpacing:"0.18em", color:"rgba(255,255,255,0.4)"}}>
          {String(currentIndex+1).padStart(2,"0")} / {String(SECTIONS.length).padStart(2,"0")}
        </div>
      </div>

      {/* Section ticker — newspaper-style index row */}
      <div style={{display:"flex", padding:"14px 28px", gap:2, borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        {SECTIONS.map((s,i)=>{
          const active = i===currentIndex;
          const past = i<currentIndex;
          return (
            <div key={i} style={{flex:s.bars, display:"flex", flexDirection:"column", gap:6}}>
              <div style={{height:2, background: active? SEC_COLOR[s.type] : past? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)"}} />
              <div style={{
                ...mono, fontSize:10, letterSpacing:"0.12em",
                color: active? SEC_COLOR[s.type] : past? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)",
                textAlign:"center", fontWeight: active?600:400,
              }}>
                {String(i+1).padStart(2,"0")} · {s.label.toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main stage */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1.3fr 1fr", alignItems:"center", padding:"0 28px"}}>
        {/* Left — previous */}
        <div style={{...mono, color:"rgba(255,255,255,0.3)", fontSize:11, letterSpacing:"0.2em"}}>
          <div style={{marginBottom:10}}>PREV</div>
          <div style={{...serif, fontFamily:"Fraunces", fontSize:28, color:"rgba(255,255,255,0.35)", letterSpacing:0, fontWeight:400}}>
            {currentIndex>0? SECTIONS[currentIndex-1].label : "—"}
          </div>
        </div>

        {/* Center — current section */}
        <div style={{textAlign:"center", position:"relative"}}>
          <div style={{...mono, fontSize:11, letterSpacing:"0.25em", color:SEC_COLOR[cur.type], opacity:0.75}}>
            NOW PLAYING
          </div>
          <div style={{
            ...serif, fontWeight:600, fontSize: 200, lineHeight:0.95, marginTop:14,
            color:"#f4f2ec", letterSpacing:"-0.03em",
          }}>
            {cur.label}
          </div>
          {/* Bar counter — mono */}
          <div style={{...mono, marginTop:24, fontSize:16, letterSpacing:"0.18em", color:"rgba(255,255,255,0.55)"}}>
            <span style={{color:SEC_COLOR[cur.type], fontWeight:600, fontSize:22}}>{String(barDone).padStart(2,"0")}</span>
            <span style={{color:"rgba(255,255,255,0.3)", margin:"0 8px"}}>/</span>
            <span>{String(cur.bars).padStart(2,"0")} BARS</span>
          </div>
          {/* Bar tick row */}
          <div style={{display:"flex", gap:8, justifyContent:"center", marginTop:18}}>
            {Array.from({length:cur.bars}).map((_,i)=>(
              <div key={i} style={{
                width: i<barDone? 28: 20, height:2,
                background: i<barDone? SEC_COLOR[cur.type] : "rgba(255,255,255,0.12)",
                transition:"all .2s",
              }}/>
            ))}
          </div>
          {/* Chord progression */}
          <div style={{...mono, marginTop:30, fontSize:22, letterSpacing:"0.3em", color:"rgba(255,255,255,0.85)", fontWeight:500}}>
            {cur.chord}
          </div>
        </div>

        {/* Right — next */}
        <div style={{...mono, color:"rgba(255,255,255,0.3)", fontSize:11, letterSpacing:"0.2em", textAlign:"right"}}>
          <div style={{marginBottom:10}}>NEXT</div>
          <div style={{...serif, fontFamily:"Fraunces", fontSize:28, color:"rgba(255,255,255,0.5)", letterSpacing:0, fontWeight:400}}>
            {next? next.label : "END"}
          </div>
          {next && <div style={{...mono, fontSize:10, marginTop:6, color:"rgba(255,255,255,0.3)"}}>{next.bars} BARS</div>}
        </div>
      </div>

      {/* Foot — transport */}
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 28px", borderTop:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{...mono, fontSize:11, letterSpacing:"0.2em", color:"rgba(255,255,255,0.4)"}}>◁  BACK</div>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <div style={{width:8, height:8, borderRadius:"50%", background:SEC_COLOR.solo, boxShadow:`0 0 12px ${SEC_COLOR.solo}`}}/>
          <div style={{...mono, fontSize:11, letterSpacing:"0.2em", color:"rgba(255,255,255,0.55)"}}>AUTO · {SONG.bpm} BPM</div>
        </div>
        <div style={{...mono, fontSize:11, letterSpacing:"0.2em", color:"rgba(255,255,255,0.4)"}}>RESET  ▷</div>
      </div>
    </div>
  );
}

// Mobile portrait variant
function EditorialPerformMobile({ width=390, height=844, currentIndex=2 }) {
  const { SONG, SECTIONS, SEC_COLOR } = window;
  const cur = SECTIONS[currentIndex];
  const next = SECTIONS[currentIndex+1];
  const barDone = Math.round(cur.bars * 0.35);
  const mono = { fontFamily:"'JetBrains Mono', ui-monospace, monospace" };
  const serif = { fontFamily:"Fraunces, serif" };

  return (
    <div style={{
      width, height, background:"#0b0b0c", color:"#e8e6e0",
      display:"grid", gridTemplateRows:"auto auto 1fr auto",
      overflow:"hidden", position:"relative",
    }}>
      <div style={{padding:"16px 18px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <div style={{...mono, fontSize:10, letterSpacing:"0.2em", color:"rgba(255,255,255,0.4)"}}>◁</div>
        <div style={{textAlign:"center"}}>
          <div style={{...serif, fontSize:15, fontWeight:500}}>{SONG.title}</div>
          <div style={{...mono, fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.15em", marginTop:2}}>
            {SONG.artist.toUpperCase()} · {SONG.bpm} BPM
          </div>
        </div>
        <div style={{...mono, fontSize:10, letterSpacing:"0.2em", color:"rgba(255,255,255,0.4)"}}>↻</div>
      </div>

      <div style={{display:"flex", padding:"4px 14px 10px", gap:3}}>
        {SECTIONS.map((s,i)=>{
          const active = i===currentIndex; const past = i<currentIndex;
          return <div key={i} style={{flex:s.bars, height:2, background: active? SEC_COLOR[s.type]: past? "rgba(255,255,255,0.4)":"rgba(255,255,255,0.1)"}}/>;
        })}
      </div>

      <div style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 20px"}}>
        <div style={{...mono, fontSize:9, letterSpacing:"0.25em", color:SEC_COLOR[cur.type]}}>
          {String(currentIndex+1).padStart(2,"0")} / {String(SECTIONS.length).padStart(2,"0")} · NOW
        </div>
        <div style={{...serif, fontWeight:600, fontSize:132, lineHeight:0.9, marginTop:16, color:"#f4f2ec", letterSpacing:"-0.03em"}}>
          {cur.label}
        </div>
        <div style={{...mono, marginTop:18, fontSize:13, letterSpacing:"0.18em", color:"rgba(255,255,255,0.55)"}}>
          <span style={{color:SEC_COLOR[cur.type], fontWeight:600}}>{String(barDone).padStart(2,"0")}</span>
          <span style={{color:"rgba(255,255,255,0.3)", margin:"0 6px"}}>/</span>
          <span>{String(cur.bars).padStart(2,"0")} BARS</span>
        </div>
        <div style={{display:"flex", gap:6, justifyContent:"center", marginTop:12}}>
          {Array.from({length:cur.bars}).map((_,i)=>(
            <div key={i} style={{width: i<barDone? 20:14, height:2, background: i<barDone? SEC_COLOR[cur.type]:"rgba(255,255,255,0.12)"}}/>
          ))}
        </div>
        <div style={{...mono, marginTop:26, fontSize:14, letterSpacing:"0.28em", color:"rgba(255,255,255,0.8)", textAlign:"center"}}>
          {cur.chord}
        </div>

        <div style={{marginTop:48, ...mono, fontSize:10, letterSpacing:"0.25em", color:"rgba(255,255,255,0.3)", textAlign:"center"}}>NEXT</div>
        <div style={{...serif, fontSize:22, color:"rgba(255,255,255,0.5)", marginTop:4}}>{next? next.label : "END"}</div>
      </div>

      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{...mono, fontSize:10, letterSpacing:"0.2em", color:"rgba(255,255,255,0.4)"}}>BACK</div>
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <div style={{width:6, height:6, borderRadius:"50%", background:SEC_COLOR.solo, boxShadow:`0 0 10px ${SEC_COLOR.solo}`}}/>
          <div style={{...mono, fontSize:10, letterSpacing:"0.18em", color:"rgba(255,255,255,0.5)"}}>AUTO</div>
        </div>
        <div style={{...mono, fontSize:10, letterSpacing:"0.2em", color:"rgba(255,255,255,0.4)"}}>RESET</div>
      </div>
    </div>
  );
}

window.EditorialPerform = EditorialPerform;
window.EditorialPerformMobile = EditorialPerformMobile;
