// ─── Settings ───────────────────────────────────────────
function SettingsPanel({ width=390, height=844 }) {
  const { C, mono, sans, MetaTag, BottomNav, TopBar } = window;

  return (
    <div style={{width, height, background:C.bg, color:C.text, ...sans, display:"flex", flexDirection:"column", overflow:"hidden"}}>
      <TopBar title="Settings" subtitle="ACCOUNT · PREFERENCES · ABOUT"
        left={<MetaTag>STRUQ</MetaTag>}
        right={<MetaTag>V 2.0</MetaTag>}
      />

      <div style={{flex:1, overflow:"auto"}}>
        {/* Identity row */}
        <div style={{padding:"20px 18px", borderBottom:`1px solid ${C.line}`, display:"flex", gap:14, alignItems:"center"}}>
          <div style={{
            width:48, height:48, background:C.accent, color:"#000",
            display:"flex", alignItems:"center", justifyContent:"center",
            ...sans, fontSize:20, fontWeight:700, letterSpacing:"-0.02em",
          }}>MK</div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{...sans, fontSize:15, fontWeight:600, color:"#fff"}}>Makoto Kuroda</div>
            <div style={{...mono, fontSize:10, letterSpacing:"0.18em", color:C.dim, marginTop:3}}>MAKOTO@FOCUSWAVE.CC</div>
          </div>
          <button style={{...mono, fontSize:10, letterSpacing:"0.22em", color:"oklch(0.70 0.18 25)", border:`1px solid ${C.line2}`, background:"transparent", padding:"6px 10px", borderRadius:1}}>
            SIGN OUT
          </button>
        </div>

        {/* Language */}
        <div style={{padding:"18px 18px", borderBottom:`1px solid ${C.line}`}}>
          <MetaTag>01 · LANGUAGE</MetaTag>
          <div style={{marginTop:12, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
            {[
              { code:"EN", label:"English",  active:false },
              { code:"JA", label:"日本語",     active:true  },
            ].map(l=>(
              <div key={l.code} style={{
                padding:"14px 14px", border:`1px solid ${l.active? C.text: C.line}`,
                background: l.active? "rgba(255,255,255,0.05)":"transparent", borderRadius:1,
              }}>
                <div style={{...mono, fontSize:10, letterSpacing:"0.22em", color: l.active? C.accent:C.dim}}>
                  {l.code}{l.active && " · ACTIVE"}
                </div>
                <div style={{...sans, fontSize:14, fontWeight:600, marginTop:4, color:"#fff"}}>{l.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Audio / Click */}
        <div style={{padding:"18px 18px", borderBottom:`1px solid ${C.line}`}}>
          <MetaTag>02 · AUDIO</MetaTag>

          <div style={{marginTop:14, padding:"14px", border:`1px solid ${C.line}`, borderRadius:1, display:"flex", alignItems:"center", gap:12}}>
            <div style={{flex:1}}>
              <div style={{...sans, fontSize:14, fontWeight:600, color:"#fff"}}>Click track</div>
              <div style={{fontSize:12, color:C.dim, marginTop:3}}>Play metronome in Auto mode</div>
            </div>
            {/* Toggle ON */}
            <div style={{width:44, height:22, background:C.accent, borderRadius:12, padding:2, position:"relative"}}>
              <div style={{width:18, height:18, background:"#000", borderRadius:"50%", position:"absolute", right:2, top:2}}/>
            </div>
          </div>

          <div style={{marginTop:10, padding:"14px", border:`1px solid ${C.line}`, borderRadius:1, display:"flex", alignItems:"center", gap:12}}>
            <div style={{flex:1}}>
              <div style={{...sans, fontSize:14, fontWeight:600, color:"#fff"}}>Count-in</div>
              <div style={{fontSize:12, color:C.dim, marginTop:3}}>Play 4 beats before Auto starts</div>
            </div>
            <div style={{width:44, height:22, background:"rgba(255,255,255,0.1)", borderRadius:12, padding:2, position:"relative"}}>
              <div style={{width:18, height:18, background:"rgba(255,255,255,0.35)", borderRadius:"50%", position:"absolute", left:2, top:2}}/>
            </div>
          </div>

          {/* Click volume */}
          <div style={{marginTop:10, padding:"14px", border:`1px solid ${C.line}`, borderRadius:1}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <div style={{...sans, fontSize:14, fontWeight:600, color:"#fff"}}>Click volume</div>
              <div style={{...mono, fontSize:11, letterSpacing:"0.15em", color:C.accent, fontWeight:600}}>062</div>
            </div>
            <div style={{marginTop:12, height:4, background:"rgba(255,255,255,0.08)", position:"relative"}}>
              <div style={{position:"absolute", left:0, top:0, bottom:0, width:"62%", background:C.accent}}/>
              <div style={{position:"absolute", left:"62%", top:-4, width:2, height:12, background:"#fff"}}/>
            </div>
            <div style={{display:"flex", justifyContent:"space-between", marginTop:6, ...mono, fontSize:9, letterSpacing:"0.18em", color:C.dim2}}>
              <span>000</span><span>100</span>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div style={{padding:"18px 18px", borderBottom:`1px solid ${C.line}`}}>
          <MetaTag>03 · APPEARANCE</MetaTag>

          <div style={{marginTop:14, display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8}}>
            {[
              { name:"DARK", bg:"#080808", fg:"#e8e6e0", active:true },
              { name:"AUTO", bg:"linear-gradient(90deg,#080808 50%,#f8f7f5 50%)", fg:"#555", active:false },
              { name:"LIGHT", bg:"#f8f7f5", fg:"#1a1a1a", active:false },
            ].map(t=>(
              <div key={t.name} style={{
                padding:"14px 8px", border:`1px solid ${t.active? C.text: C.line}`,
                background:"rgba(255,255,255,0.02)", borderRadius:1,
                display:"flex", flexDirection:"column", alignItems:"center", gap:10,
              }}>
                <div style={{width:36, height:36, background:t.bg, border:`1px solid ${C.line2}`, borderRadius:1}}/>
                <div style={{...mono, fontSize:10, letterSpacing:"0.22em", color: t.active? C.accent: C.dim, fontWeight:600}}>
                  {t.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div style={{padding:"18px 18px"}}>
          <MetaTag>04 · ABOUT</MetaTag>
          <div style={{marginTop:14, display:"flex", flexDirection:"column", gap:12}}>
            {[
              ["Version",   "2.0.3 · build 204"],
              ["Released",  "2026.04.12"],
              ["Channel",   "Stable"],
              ["Made by",   "focuswave"],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <div style={{...mono, fontSize:11, letterSpacing:"0.2em", color:C.dim}}>{k.toUpperCase()}</div>
                <div style={{...sans, fontSize:13, color:"#fff", fontWeight:500}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:20, display:"flex", gap:6, flexWrap:"wrap"}}>
            {["PRIVACY","TERMS","FEEDBACK","CHANGELOG"].map(l=>(
              <div key={l} style={{
                ...mono, fontSize:10, letterSpacing:"0.22em", color:C.dim,
                border:`1px solid ${C.line2}`, padding:"7px 10px", borderRadius:1,
              }}>{l}</div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav active="settings"/>
    </div>
  );
}

window.SettingsPanel = SettingsPanel;
