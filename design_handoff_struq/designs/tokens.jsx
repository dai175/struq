// Design tokens card — shown first so the system is self-explanatory
function TokenSheet({ width=1280, height=720 }) {
  const mono = { fontFamily:"'JetBrains Mono', monospace" };

  const colors = [
    { name:"intro",     var:"--sec-intro",     hex:"neutral" },
    { name:"a",         var:"--sec-a",         hex:"blue" },
    { name:"b",         var:"--sec-b",         hex:"violet" },
    { name:"chorus",    var:"--sec-chorus",    hex:"amber" },
    { name:"bridge",    var:"--sec-bridge",    hex:"teal" },
    { name:"solo",      var:"--sec-solo",      hex:"coral" },
    { name:"interlude", var:"--sec-interlude", hex:"cyan" },
    { name:"custom",    var:"--sec-custom",    hex:"rose" },
  ];

  return (
    <div style={{
      width, height, background:"#0d0d0e", color:"#e8e6e0",
      fontFamily:"Inter", padding:"40px 48px", display:"grid",
      gridTemplateColumns:"1fr 1fr", gap:40, overflow:"hidden",
    }}>
      <div>
        <div style={{...mono, fontSize:11, letterSpacing:"0.25em", color:"rgba(255,255,255,0.4)"}}>01 · TYPE</div>
        <div style={{fontFamily:"Inter", fontSize:28, fontWeight:700, marginTop:10}}>Type system</div>
        <p style={{fontSize:13, color:"rgba(255,255,255,0.55)", marginTop:8, lineHeight:1.55, maxWidth:520}}>
          <b>Inter</b> for the interface, <b>JetBrains Mono</b> for numbers, labels, and meta.
          Serifs are avoided — the aesthetic is instrument panel, not editorial.
        </p>

        <div style={{marginTop:28, display:"grid", gridTemplateColumns:"auto 1fr", gap:"22px 24px", alignItems:"baseline"}}>
          <div style={{fontSize:80, fontWeight:800, letterSpacing:"-0.04em", lineHeight:1}}>Chorus</div>
          <div style={{...mono, fontSize:10, letterSpacing:"0.22em", color:"rgba(255,255,255,0.4)"}}>DISPLAY / INTER 800 / -4% / 120–180PX</div>

          <div style={{fontSize:30, fontWeight:500, letterSpacing:"-0.01em"}}>Love Me Do</div>
          <div style={{...mono, fontSize:10, letterSpacing:"0.22em", color:"rgba(255,255,255,0.4)"}}>HEADLINE / INTER 500 / 28–32PX</div>

          <div style={{fontSize:14, fontWeight:400, color:"rgba(255,255,255,0.75)"}}>The Beatles · 120 BPM · Key of G</div>
          <div style={{...mono, fontSize:10, letterSpacing:"0.22em", color:"rgba(255,255,255,0.4)"}}>BODY / INTER 400 / 13–14PX</div>

          <div style={{...mono, fontSize:14, letterSpacing:"0.22em", fontWeight:500}}>BAR 03 / 08</div>
          <div style={{...mono, fontSize:10, letterSpacing:"0.22em", color:"rgba(255,255,255,0.4)"}}>META / JBM 500 / +22% / 11–14PX</div>

          <div style={{...mono, fontSize:22, letterSpacing:"0.22em", fontWeight:600}}>G C G D G</div>
          <div style={{...mono, fontSize:10, letterSpacing:"0.22em", color:"rgba(255,255,255,0.4)"}}>CHORD / JBM 600 / +22% / 18–28PX</div>
        </div>
      </div>

      <div>
        <div style={{...mono, fontSize:11, letterSpacing:"0.25em", color:"rgba(255,255,255,0.4)"}}>02 · SECTION PALETTE</div>
        <div style={{fontFamily:"Inter", fontSize:28, fontWeight:700, marginTop:10}}>Normalized hues</div>
        <p style={{fontSize:13, color:"rgba(255,255,255,0.55)", marginTop:8, lineHeight:1.55}}>
          Same lightness (L 0.72) and chroma (C 0.14–0.18) across all section colors. The current palette
          drifts in both — normalizing gives the progress bar a cohesive rhythm instead of a color-pencil look.
        </p>

        <div style={{marginTop:22, display:"flex", flexDirection:"column", gap:10}}>
          {colors.map(c=>(
            <div key={c.name} style={{display:"flex", alignItems:"center", gap:14}}>
              <div style={{width:64, height:28, background:`var(${c.var})`, borderRadius:2}}/>
              <div style={{...mono, fontSize:12, width:90, color:"rgba(255,255,255,0.75)"}}>{c.name}</div>
              <div style={{...mono, fontSize:10, letterSpacing:"0.18em", color:"rgba(255,255,255,0.4)"}}>{c.var}</div>
            </div>
          ))}
        </div>

        <div style={{marginTop:30, ...mono, fontSize:11, letterSpacing:"0.25em", color:"rgba(255,255,255,0.4)"}}>03 · SURFACES</div>
        <div style={{display:"flex", gap:10, marginTop:14}}>
          {[
            {bg:"#080808", label:"ink"},
            {bg:"#0d0d0e", label:"ink-2"},
            {bg:"#161616", label:"ink-3"},
            {bg:"rgba(255,255,255,0.04)", label:"elev"},
          ].map(s=>(
            <div key={s.label} style={{flex:1, height:68, background:s.bg, border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"flex-end", padding:10}}>
              <div style={{...mono, fontSize:10, letterSpacing:"0.18em", color:"rgba(255,255,255,0.5)"}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.TokenSheet = TokenSheet;
