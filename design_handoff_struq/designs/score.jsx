// Direction 3 — Score Minimal
// Quiet, print-like, reads like a music chart. Desaturated section colors,
// typographic hierarchy does the heavy lifting. Serif-free, black on cream
// for a neutral-warm feel. "Silence as texture."
function ScorePerform({ width=1280, height=720, currentIndex=2 }) {
  const { SONG, SECTIONS, SEC_COLOR } = window;
  const cur = SECTIONS[currentIndex];
  const next = SECTIONS[currentIndex+1];
  const prev = currentIndex>0? SECTIONS[currentIndex-1]: null;
  const barDone = Math.round(cur.bars*0.35);

  const mono = { fontFamily:"'JetBrains Mono', monospace" };

  return (
    <div style={{
      width, height, background:"#0d0d0e", color:"rgba(240,239,235,0.92)",
      fontFamily:"Inter, sans-serif", position:"relative", overflow:"hidden",
      display:"grid", gridTemplateRows:"auto 1fr auto",
    }}>
      {/* subtle staff lines as background texture */}
      <div aria-hidden style={{
        position:"absolute", inset:0, pointerEvents:"none",
        backgroundImage:"repeating-linear-gradient(to bottom, transparent 0, transparent 59px, rgba(255,255,255,0.025) 59px, rgba(255,255,255,0.025) 60px)",
      }}/>

      {/* Header */}
      <div style={{display:"grid", gridTemplateColumns:"1fr auto 1fr", padding:"22px 34px", alignItems:"center", borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{...mono, fontSize:11, letterSpacing:"0.2em", color:"rgba(255,255,255,0.32)"}}>← EXIT</div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:17, fontWeight:500, letterSpacing:"0.02em"}}>{SONG.title}</div>
          <div style={{...mono, fontSize:10, letterSpacing:"0.18em", color:"rgba(255,255,255,0.35)", marginTop:3}}>
            {SONG.artist} · ♩ = {SONG.bpm} · {SONG.key}
          </div>
        </div>
        <div style={{...mono, fontSize:11, letterSpacing:"0.2em", color:"rgba(255,255,255,0.32)", textAlign:"right"}}>RESET ↻</div>
      </div>

      {/* Main — a chart-like layout */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 2.4fr 1fr", alignItems:"center", padding:"0 34px", gap:28, position:"relative"}}>
        {/* Prev */}
        <div style={{textAlign:"right", opacity:prev?1:0.3}}>
          <div style={{...mono, fontSize:10, letterSpacing:"0.25em", color:"rgba(255,255,255,0.3)"}}>PREV</div>
          <div style={{fontSize:30, fontWeight:500, color:"rgba(255,255,255,0.45)", marginTop:8, letterSpacing:"-0.01em"}}>
            {prev? prev.label : "—"}
          </div>
        </div>

        {/* Center — section label + bar ruler */}
        <div style={{textAlign:"center"}}>
          <div style={{...mono, fontSize:11, letterSpacing:"0.32em", color:SEC_COLOR[cur.type]}}>
            {String(currentIndex+1).padStart(2,"0")} · NOW
          </div>
          <div style={{
            fontFamily:"Inter", fontWeight:700, fontSize: 180, lineHeight:0.92, letterSpacing:"-0.045em",
            color:"#f4f3ee", marginTop:14,
          }}>
            {cur.label}
          </div>
          {/* color underline — only accent, very restrained */}
          <div style={{
            height:3, width:"55%", margin:"18px auto 0",
            background: SEC_COLOR[cur.type], opacity:0.85,
          }}/>

          {/* bar ruler: numbered bars, sans frills */}
          <div style={{display:"grid", gridTemplateColumns:`repeat(${cur.bars}, 1fr)`, marginTop:26, gap:0}}>
            {Array.from({length:cur.bars}).map((_,i)=>{
              const filled = i<barDone;
              const current = i===barDone;
              return (
                <div key={i} style={{
                  padding:"10px 0 6px",
                  borderLeft:"1px solid rgba(255,255,255,0.1)",
                  borderRight: i===cur.bars-1? "1px solid rgba(255,255,255,0.1)":"none",
                  borderTop: filled || current? `3px solid ${SEC_COLOR[cur.type]}`: "3px solid rgba(255,255,255,0.08)",
                  opacity: filled? 1: current? 1: 0.55,
                }}>
                  <div style={{...mono, fontSize:10, letterSpacing:"0.1em", color: current? SEC_COLOR[cur.type]: filled? "rgba(255,255,255,0.6)":"rgba(255,255,255,0.28)"}}>
                    {String(i+1).padStart(2,"0")}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{...mono, fontSize:11, letterSpacing:"0.22em", color:"rgba(255,255,255,0.38)", marginTop:12}}>
            BAR <span style={{color:SEC_COLOR[cur.type], fontWeight:600}}>{String(barDone+1).padStart(2,"0")}</span> OF {String(cur.bars).padStart(2,"0")}
          </div>

          {/* chord line — laid out like a chart */}
          <div style={{marginTop:34, display:"inline-flex", gap:22, padding:"14px 30px", border:"1px solid rgba(255,255,255,0.1)"}}>
            {cur.chord.split(" ").map((ch,i)=>(
              <div key={i} style={{...mono, fontSize:22, fontWeight:600, letterSpacing:"0.05em", color:"rgba(255,255,255,0.88)"}}>
                {ch}
              </div>
            ))}
          </div>
        </div>

        {/* Next */}
        <div style={{opacity:next?1:0.3}}>
          <div style={{...mono, fontSize:10, letterSpacing:"0.25em", color:"rgba(255,255,255,0.3)"}}>NEXT</div>
          <div style={{fontSize:30, fontWeight:500, color:"rgba(255,255,255,0.65)", marginTop:8, letterSpacing:"-0.01em"}}>
            {next? next.label: "END"}
          </div>
          {next && <div style={{...mono, fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:6, letterSpacing:"0.15em"}}>{next.bars} bars · {next.chord}</div>}
        </div>
      </div>

      {/* Foot — full section strip, minimalist */}
      <div style={{padding:"18px 34px", borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex", gap:4, marginBottom:8}}>
          {SECTIONS.map((s,i)=>{
            const active = i===currentIndex; const past = i<currentIndex;
            return (
              <div key={i} style={{flex:s.bars, display:"flex", flexDirection:"column", gap:4}}>
                <div style={{height:3, background: active? SEC_COLOR[s.type]: past? "rgba(255,255,255,0.35)":"rgba(255,255,255,0.08)"}}/>
                <div style={{...mono, fontSize:9, letterSpacing:"0.1em", color: active? SEC_COLOR[s.type]: past? "rgba(255,255,255,0.5)":"rgba(255,255,255,0.22)", textAlign:"center", fontWeight:active?600:400}}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex", justifyContent:"space-between", ...mono, fontSize:10, letterSpacing:"0.22em", color:"rgba(255,255,255,0.3)", marginTop:6}}>
          <span>◁ BACK</span>
          <span>TAP OR SPACE TO ADVANCE</span>
          <span>RESET ▷</span>
        </div>
      </div>
    </div>
  );
}

// Mobile portrait variant — chart-like, spacious
function ScorePerformMobile({ width=390, height=844, currentIndex=2 }) {
  const { SONG, SECTIONS, SEC_COLOR } = window;
  const cur = SECTIONS[currentIndex];
  const next = SECTIONS[currentIndex+1];
  const prev = currentIndex>0? SECTIONS[currentIndex-1]: null;
  const barDone = Math.round(cur.bars*0.35);
  const mono = { fontFamily:"'JetBrains Mono', monospace" };

  return (
    <div style={{
      width, height, background:"#0d0d0e", color:"rgba(240,239,235,0.92)",
      fontFamily:"Inter, sans-serif", overflow:"hidden",
      display:"flex", flexDirection:"column", position:"relative",
    }}>
      <div aria-hidden style={{
        position:"absolute", inset:0, pointerEvents:"none",
        backgroundImage:"repeating-linear-gradient(to bottom, transparent 0, transparent 44px, rgba(255,255,255,0.025) 44px, rgba(255,255,255,0.025) 45px)",
      }}/>

      <div style={{display:"grid", gridTemplateColumns:"auto 1fr auto", alignItems:"center", padding:"16px 18px", borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{...mono, fontSize:10, color:"rgba(255,255,255,0.35)"}}>←</div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:15, fontWeight:500}}>{SONG.title}</div>
          <div style={{...mono, fontSize:9, letterSpacing:"0.18em", color:"rgba(255,255,255,0.35)", marginTop:3}}>♩ = {SONG.bpm} · {SONG.key}</div>
        </div>
        <div style={{...mono, fontSize:10, color:"rgba(255,255,255,0.35)"}}>↻</div>
      </div>

      <div style={{flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 22px", position:"relative"}}>
        <div style={{...mono, fontSize:10, letterSpacing:"0.3em", color:SEC_COLOR[cur.type], textAlign:"center"}}>
          {String(currentIndex+1).padStart(2,"0")} · NOW
        </div>
        <div style={{
          fontFamily:"Inter", fontWeight:700, fontSize:130, lineHeight:0.9, letterSpacing:"-0.045em",
          color:"#f4f3ee", marginTop:10, textAlign:"center",
        }}>
          {cur.label}
        </div>
        <div style={{height:2, width:"40%", margin:"14px auto 0", background: SEC_COLOR[cur.type], opacity:0.85}}/>

        {/* bar ruler */}
        <div style={{display:"grid", gridTemplateColumns:`repeat(${cur.bars},1fr)`, marginTop:20, gap:0}}>
          {Array.from({length:cur.bars}).map((_,i)=>{
            const filled = i<barDone; const current = i===barDone;
            return (
              <div key={i} style={{
                padding:"8px 0 5px",
                borderLeft:"1px solid rgba(255,255,255,0.1)",
                borderRight: i===cur.bars-1? "1px solid rgba(255,255,255,0.1)":"none",
                borderTop: filled||current? `2px solid ${SEC_COLOR[cur.type]}`: "2px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{...mono, fontSize:9, color: current? SEC_COLOR[cur.type]: filled? "rgba(255,255,255,0.6)":"rgba(255,255,255,0.28)", textAlign:"center"}}>
                  {String(i+1).padStart(2,"0")}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{...mono, fontSize:10, letterSpacing:"0.22em", color:"rgba(255,255,255,0.38)", marginTop:10, textAlign:"center"}}>
          BAR <span style={{color:SEC_COLOR[cur.type], fontWeight:600}}>{String(barDone+1).padStart(2,"0")}</span> / {String(cur.bars).padStart(2,"0")}
        </div>

        <div style={{marginTop:26, display:"flex", justifyContent:"center"}}>
          <div style={{display:"inline-flex", gap:14, padding:"12px 20px", border:"1px solid rgba(255,255,255,0.1)"}}>
            {cur.chord.split(" ").map((ch,i)=>(
              <div key={i} style={{...mono, fontSize:16, fontWeight:600, letterSpacing:"0.05em", color:"rgba(255,255,255,0.88)"}}>{ch}</div>
            ))}
          </div>
        </div>

        <div style={{marginTop:36, display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
          <div>
            <div style={{...mono, fontSize:9, letterSpacing:"0.25em", color:"rgba(255,255,255,0.3)"}}>PREV</div>
            <div style={{fontSize:18, color:"rgba(255,255,255,0.5)", marginTop:4}}>{prev? prev.label: "—"}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{...mono, fontSize:9, letterSpacing:"0.25em", color:"rgba(255,255,255,0.3)"}}>NEXT</div>
            <div style={{fontSize:18, color:"rgba(255,255,255,0.65)", marginTop:4}}>{next? next.label: "END"}</div>
          </div>
        </div>
      </div>

      <div style={{padding:"14px 22px", borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex", gap:3, marginBottom:8}}>
          {SECTIONS.map((s,i)=>{
            const active = i===currentIndex; const past = i<currentIndex;
            return <div key={i} style={{flex:s.bars, height:3, background: active? SEC_COLOR[s.type]: past? "rgba(255,255,255,0.35)":"rgba(255,255,255,0.08)"}}/>;
          })}
        </div>
        <div style={{display:"flex", justifyContent:"space-between", ...mono, fontSize:10, letterSpacing:"0.22em", color:"rgba(255,255,255,0.3)"}}>
          <span>◁ BACK</span>
          <span>{String(currentIndex+1).padStart(2,"0")}/{String(SECTIONS.length).padStart(2,"0")}</span>
          <span>RESET ▷</span>
        </div>
      </div>
    </div>
  );
}

window.ScorePerform = ScorePerform;
window.ScorePerformMobile = ScorePerformMobile;
