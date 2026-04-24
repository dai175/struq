// Direction 2 — Broadcast Console
// Reference: broadcast truck / studio rack. Precise monospace, segment displays,
// clear zones. Uses the full landscape canvas with a left "timeline" rail.
function ConsolePerform({ width=1280, height=720, currentIndex=2 }) {
  const { SONG, SECTIONS, SEC_COLOR } = window;
  const cur = SECTIONS[currentIndex];
  const next = SECTIONS[currentIndex+1];
  const prev = currentIndex>0? SECTIONS[currentIndex-1]: null;
  const barDone = Math.round(cur.bars * 0.35);
  const beat = 2; // currently on beat 3 of 4

  const mono = { fontFamily:"'JetBrains Mono', ui-monospace, monospace" };

  const totalBars = SECTIONS.reduce((a,s)=>a+s.bars,0);
  const doneBars = SECTIONS.slice(0,currentIndex).reduce((a,s)=>a+s.bars,0) + barDone;

  return (
    <div style={{
      width, height, background:"#080808", color:"#dcdcdc",
      fontFamily:"Inter, sans-serif",
      display:"grid", gridTemplateColumns:"280px 1fr",
      overflow:"hidden",
    }}>
      {/* ── LEFT RAIL — timeline ─────────────────── */}
      <div style={{borderRight:"1px solid rgba(255,255,255,0.08)", display:"flex", flexDirection:"column"}}>
        <div style={{padding:"16px 18px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", gap:10}}>
          <div style={{width:6, height:6, borderRadius:"50%", background:"#ef4444", boxShadow:"0 0 8px #ef4444"}}/>
          <div style={{...mono, fontSize:10, letterSpacing:"0.22em"}}>LIVE</div>
          <div style={{flex:1}}/>
          <div style={{...mono, fontSize:10, letterSpacing:"0.22em", color:"rgba(255,255,255,0.4)"}}>ESC</div>
        </div>

        <div style={{padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{...mono, fontSize:9, letterSpacing:"0.22em", color:"rgba(255,255,255,0.4)"}}>TRACK</div>
          <div style={{fontFamily:"Inter", fontSize:16, fontWeight:600, marginTop:4}}>{SONG.title}</div>
          <div style={{...mono, fontSize:10, color:"rgba(255,255,255,0.5)", marginTop:4, letterSpacing:"0.1em"}}>
            {SONG.artist}
          </div>
        </div>

        <div style={{flex:1, overflow:"auto", padding:"10px 10px"}}>
          {SECTIONS.map((s,i)=>{
            const active = i===currentIndex;
            const past = i<currentIndex;
            return (
              <div key={i} style={{
                display:"flex", alignItems:"center", gap:10, padding:"7px 8px",
                borderLeft:`3px solid ${active? SEC_COLOR[s.type]: "transparent"}`,
                background: active? "rgba(255,255,255,0.04)": "transparent",
                marginBottom:2, borderRadius:2,
              }}>
                <div style={{...mono, fontSize:10, width:22, color: active? "#fff" : past? "rgba(255,255,255,0.5)": "rgba(255,255,255,0.25)", letterSpacing:"0.1em"}}>
                  {String(i+1).padStart(2,"0")}
                </div>
                <div style={{width:8, height:8, background: past||active? SEC_COLOR[s.type]: "rgba(255,255,255,0.15)"}}/>
                <div style={{flex:1, fontSize:13, fontWeight: active?600:400, color: active? "#fff": past? "rgba(255,255,255,0.55)":"rgba(255,255,255,0.3)"}}>
                  {s.label}
                </div>
                <div style={{...mono, fontSize:10, color: active? SEC_COLOR[s.type] : "rgba(255,255,255,0.3)"}}>
                  {s.bars}b
                </div>
              </div>
            );
          })}
        </div>

        <div style={{padding:"12px 18px", borderTop:"1px solid rgba(255,255,255,0.08)", display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
          <Stat label="BPM" value={SONG.bpm}/>
          <Stat label="KEY" value={SONG.key}/>
        </div>
      </div>

      {/* ── MAIN STAGE ─────────────────────────── */}
      <div style={{display:"grid", gridTemplateRows:"auto 1fr auto", position:"relative"}}>
        {/* meter strip */}
        <div style={{padding:"16px 28px", borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{display:"flex", alignItems:"center", gap:14, marginBottom:10}}>
            <div style={{...mono, fontSize:10, letterSpacing:"0.22em", color:"rgba(255,255,255,0.4)"}}>
              SECTION {String(currentIndex+1).padStart(2,"0")} OF {String(SECTIONS.length).padStart(2,"0")}
            </div>
            <div style={{flex:1, height:4, background:"rgba(255,255,255,0.06)", position:"relative"}}>
              <div style={{position:"absolute", inset:0, width: `${doneBars/totalBars*100}%`, background:SEC_COLOR[cur.type]}}/>
            </div>
            <div style={{...mono, fontSize:10, letterSpacing:"0.22em", color:"rgba(255,255,255,0.4)"}}>
              {String(Math.round(doneBars/totalBars*100)).padStart(2,"0")}%
            </div>
          </div>
          {/* segmented per-section row */}
          <div style={{display:"flex", gap:2}}>
            {SECTIONS.map((s,i)=>{
              const active = i===currentIndex; const past = i<currentIndex;
              return <div key={i} style={{flex:s.bars, height:6, background: active? SEC_COLOR[s.type]: past? "rgba(255,255,255,0.3)":"rgba(255,255,255,0.08)"}}/>;
            })}
          </div>
        </div>

        {/* Main readout */}
        <div style={{display:"grid", gridTemplateColumns:"1.2fr 1fr", alignItems:"center", padding:"0 40px", gap:30}}>
          {/* left — big section + bar meter */}
          <div>
            <div style={{display:"flex", alignItems:"baseline", gap:16}}>
              <div style={{...mono, fontSize:13, letterSpacing:"0.25em", color:SEC_COLOR[cur.type]}}>● NOW</div>
              {prev && <div style={{...mono, fontSize:11, color:"rgba(255,255,255,0.3)", letterSpacing:"0.15em"}}>← {prev.label.toUpperCase()}</div>}
            </div>
            <div style={{
              fontFamily:"Inter", fontWeight:800, fontSize: 160, lineHeight:0.92, letterSpacing:"-0.04em",
              color:SEC_COLOR[cur.type], marginTop:8, textShadow:`0 0 30px ${SEC_COLOR[cur.type]}33`,
            }}>
              {cur.label}
            </div>

            {/* bar grid */}
            <div style={{marginTop:28, display:"grid", gridTemplateColumns:`repeat(${cur.bars}, 1fr)`, gap:6}}>
              {Array.from({length:cur.bars}).map((_,i)=>{
                const filled = i<barDone;
                const current = i===barDone;
                return (
                  <div key={i} style={{
                    height:22, borderRadius:1,
                    background: filled? SEC_COLOR[cur.type] : current? "rgba(255,255,255,0.18)":"rgba(255,255,255,0.06)",
                    border: current? `1px solid ${SEC_COLOR[cur.type]}`:"1px solid transparent",
                  }}/>
                );
              })}
            </div>
            <div style={{display:"flex", justifyContent:"space-between", marginTop:8, ...mono, fontSize:10, letterSpacing:"0.18em", color:"rgba(255,255,255,0.45)"}}>
              <span><span style={{color:SEC_COLOR[cur.type], fontWeight:600}}>BAR {String(barDone+1).padStart(2,"0")}</span> OF {String(cur.bars).padStart(2,"0")}</span>
              <span>{cur.bars*4} BEATS TOTAL</span>
            </div>
          </div>

          {/* right — detail readouts */}
          <div style={{display:"flex", flexDirection:"column", gap:18}}>
            <Card label="CHORD PROGRESSION">
              <div style={{...mono, fontSize:28, letterSpacing:"0.22em", fontWeight:600, color:"#fff"}}>
                {cur.chord}
              </div>
            </Card>

            <Card label="BEAT">
              <div style={{display:"flex", gap:10, alignItems:"center"}}>
                {[0,1,2,3].map(b=>(
                  <div key={b} style={{
                    width:38, height:38, borderRadius:4,
                    background: b===beat? SEC_COLOR[cur.type]: b<beat? "rgba(255,255,255,0.14)":"rgba(255,255,255,0.05)",
                    border: b===beat? `1px solid ${SEC_COLOR[cur.type]}`:"1px solid rgba(255,255,255,0.06)",
                    boxShadow: b===beat? `0 0 14px ${SEC_COLOR[cur.type]}88`:"none",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    ...mono, fontSize:13, fontWeight:600,
                    color: b===beat? "#000":"rgba(255,255,255,0.4)",
                  }}>{b+1}</div>
                ))}
                <div style={{flex:1}}/>
                <div style={{...mono, fontSize:11, letterSpacing:"0.18em", color:"rgba(255,255,255,0.45)"}}>{SONG.bpm} BPM</div>
              </div>
            </Card>

            <Card label="UP NEXT" tone="dim">
              <div style={{display:"flex", alignItems:"baseline", gap:14}}>
                <div style={{width:10, height:10, background: next? SEC_COLOR[next.type]:"rgba(255,255,255,0.3)"}}/>
                <div style={{fontSize:26, fontWeight:700, color:"rgba(255,255,255,0.85)"}}>
                  {next? next.label: "END OF TRACK"}
                </div>
                {next && <div style={{flex:1}}/>}
                {next && <div style={{...mono, fontSize:12, letterSpacing:"0.14em", color:"rgba(255,255,255,0.45)"}}>{next.bars} BARS</div>}
              </div>
            </Card>
          </div>
        </div>

        {/* Foot */}
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 40px", borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <ConsoleBtn>◁ BACK</ConsoleBtn>
          <div style={{...mono, fontSize:10, letterSpacing:"0.22em", color:"rgba(255,255,255,0.35)"}}>
            SPACE · TAP TO ADVANCE
          </div>
          <ConsoleBtn>RESET</ConsoleBtn>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{fontFamily:"'JetBrains Mono'", fontSize:9, letterSpacing:"0.22em", color:"rgba(255,255,255,0.4)"}}>{label}</div>
      <div style={{fontFamily:"'JetBrains Mono'", fontSize:22, fontWeight:600, color:"#fff", marginTop:2}}>{value}</div>
    </div>
  );
}

function Card({ label, children, tone }) {
  return (
    <div style={{
      border:"1px solid rgba(255,255,255,0.08)", borderRadius:2,
      background: tone==="dim"? "transparent" : "rgba(255,255,255,0.015)",
      padding:"14px 18px",
    }}>
      <div style={{fontFamily:"'JetBrains Mono'", fontSize:9, letterSpacing:"0.24em", color:"rgba(255,255,255,0.38)", marginBottom:10}}>{label}</div>
      {children}
    </div>
  );
}

function ConsoleBtn({ children }) {
  return (
    <div style={{
      fontFamily:"'JetBrains Mono'", fontSize:10, letterSpacing:"0.22em",
      border:"1px solid rgba(255,255,255,0.12)", padding:"8px 16px",
      color:"rgba(255,255,255,0.7)", borderRadius:2,
    }}>{children}</div>
  );
}

// Mobile portrait variant
function ConsolePerformMobile({ width=390, height=844, currentIndex=2 }) {
  const { SONG, SECTIONS, SEC_COLOR } = window;
  const cur = SECTIONS[currentIndex];
  const next = SECTIONS[currentIndex+1];
  const barDone = Math.round(cur.bars*0.35);
  const beat = 2;
  const mono = { fontFamily:"'JetBrains Mono', ui-monospace, monospace" };

  return (
    <div style={{
      width, height, background:"#080808", color:"#dcdcdc",
      display:"flex", flexDirection:"column", overflow:"hidden",
    }}>
      <div style={{padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", gap:12}}>
        <div style={{...mono, fontSize:10, color:"rgba(255,255,255,0.4)"}}>◁</div>
        <div style={{flex:1, textAlign:"center"}}>
          <div style={{fontFamily:"Inter", fontSize:14, fontWeight:600}}>{SONG.title}</div>
          <div style={{...mono, fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.18em", marginTop:2}}>{SONG.artist.toUpperCase()} · {SONG.bpm} BPM · {SONG.key}</div>
        </div>
        <div style={{...mono, fontSize:10, color:"rgba(255,255,255,0.4)"}}>↻</div>
      </div>

      <div style={{padding:"10px 16px 12px"}}>
        <div style={{display:"flex", justifyContent:"space-between", ...mono, fontSize:9, letterSpacing:"0.22em", color:"rgba(255,255,255,0.4)", marginBottom:6}}>
          <span>SECTION {String(currentIndex+1).padStart(2,"0")} / {String(SECTIONS.length).padStart(2,"0")}</span>
          <span style={{color:SEC_COLOR[cur.type]}}>● LIVE</span>
        </div>
        <div style={{display:"flex", gap:2}}>
          {SECTIONS.map((s,i)=>{
            const active = i===currentIndex; const past = i<currentIndex;
            return <div key={i} style={{flex:s.bars, height:4, background: active? SEC_COLOR[s.type]: past? "rgba(255,255,255,0.3)":"rgba(255,255,255,0.08)"}}/>;
          })}
        </div>
      </div>

      <div style={{flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 20px"}}>
        <div style={{...mono, fontSize:10, letterSpacing:"0.25em", color:SEC_COLOR[cur.type]}}>● NOW</div>
        <div style={{
          fontFamily:"Inter", fontWeight:800, fontSize:120, lineHeight:0.9, letterSpacing:"-0.04em",
          color:SEC_COLOR[cur.type], marginTop:6,
        }}>{cur.label}</div>

        {/* bar grid */}
        <div style={{marginTop:22, display:"grid", gridTemplateColumns:`repeat(${cur.bars},1fr)`, gap:4}}>
          {Array.from({length:cur.bars}).map((_,i)=>{
            const filled = i<barDone; const current = i===barDone;
            return <div key={i} style={{
              height:16,
              background: filled? SEC_COLOR[cur.type]: current? "rgba(255,255,255,0.2)":"rgba(255,255,255,0.06)",
              border: current? `1px solid ${SEC_COLOR[cur.type]}`:"1px solid transparent",
            }}/>;
          })}
        </div>
        <div style={{display:"flex", justifyContent:"space-between", ...mono, fontSize:10, letterSpacing:"0.18em", color:"rgba(255,255,255,0.45)", marginTop:6}}>
          <span>BAR {String(barDone+1).padStart(2,"0")} / {String(cur.bars).padStart(2,"0")}</span>
          <span>{cur.bars*4}b total</span>
        </div>

        {/* Chord card */}
        <div style={{marginTop:26, border:"1px solid rgba(255,255,255,0.08)", padding:"14px 16px", borderRadius:2}}>
          <div style={{...mono, fontSize:9, letterSpacing:"0.24em", color:"rgba(255,255,255,0.4)"}}>CHORD</div>
          <div style={{...mono, fontSize:22, letterSpacing:"0.18em", fontWeight:600, marginTop:6, color:"#fff"}}>{cur.chord}</div>
        </div>

        {/* Beat */}
        <div style={{marginTop:14, display:"flex", alignItems:"center", gap:8}}>
          {[0,1,2,3].map(b=>(
            <div key={b} style={{
              flex:1, height:36, borderRadius:3,
              background: b===beat? SEC_COLOR[cur.type]: b<beat? "rgba(255,255,255,0.14)":"rgba(255,255,255,0.05)",
              border: b===beat? `1px solid ${SEC_COLOR[cur.type]}`:"1px solid rgba(255,255,255,0.06)",
              display:"flex", alignItems:"center", justifyContent:"center",
              ...mono, fontSize:12, fontWeight:600,
              color: b===beat? "#000":"rgba(255,255,255,0.4)",
              boxShadow: b===beat? `0 0 12px ${SEC_COLOR[cur.type]}88`:"none",
            }}>{b+1}</div>
          ))}
        </div>

        {/* Up next */}
        <div style={{marginTop:18, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:10}}>
          <div style={{...mono, fontSize:9, letterSpacing:"0.24em", color:"rgba(255,255,255,0.4)"}}>NEXT</div>
          <div style={{width:8, height:8, background: next? SEC_COLOR[next.type]:"rgba(255,255,255,0.3)"}}/>
          <div style={{fontSize:18, fontWeight:700}}>{next? next.label:"END"}</div>
          <div style={{flex:1}}/>
          {next && <div style={{...mono, fontSize:10, letterSpacing:"0.15em", color:"rgba(255,255,255,0.4)"}}>{next.bars} BARS</div>}
        </div>
      </div>

      <div style={{display:"flex", justifyContent:"space-between", padding:"12px 18px", borderTop:"1px solid rgba(255,255,255,0.08)"}}>
        <ConsoleBtn>◁ BACK</ConsoleBtn>
        <ConsoleBtn>RESET</ConsoleBtn>
      </div>
    </div>
  );
}

window.ConsolePerform = ConsolePerform;
window.ConsolePerformMobile = ConsolePerformMobile;
