// Login screens — Broadcast Console tone
function LoginConsole({ width=1280, height=800 }) {
  const { C, mono, sans, MetaTag, SEC_COLOR, SECTIONS } = window;

  return (
    <div style={{
      width, height, background:C.bg, color:C.text, ...sans,
      display:"grid", gridTemplateColumns:"1.1fr 1fr", overflow:"hidden",
    }}>
      {/* LEFT — identity plaque */}
      <div style={{padding:"40px 56px", borderRight:`1px solid ${C.line}`, display:"flex", flexDirection:"column", justifyContent:"space-between", position:"relative"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <svg width="32" height="32" viewBox="0 0 24 24">
              <rect x="2"  y="4"  width="6"  height="3" fill="oklch(0.72 0.02 250)"/>
              <rect x="10" y="4"  width="8"  height="3" fill="oklch(0.72 0.14 250)"/>
              <rect x="2"  y="10" width="12" height="3" fill="oklch(0.74 0.16 65)"/>
              <rect x="2"  y="16" width="5"  height="3" fill="oklch(0.72 0.14 160)"/>
              <rect x="9"  y="16" width="11" height="3" fill="oklch(0.70 0.18 25)"/>
            </svg>
            <div style={{...sans, fontSize:22, fontWeight:700, letterSpacing:"-0.01em"}}>Struq</div>
          </div>
          <MetaTag>V 2.0 · FOCUSWAVE</MetaTag>
        </div>

        <div>
          <MetaTag color={C.accent}>STRUCTURE · REHEARSAL · LIVE</MetaTag>
          <div style={{...sans, fontSize:68, fontWeight:800, letterSpacing:"-0.04em", lineHeight:1.0, marginTop:22}}>
            Song structures,<br/>
            <span style={{color:"rgba(255,255,255,0.5)"}}>always at hand.</span>
          </div>
          <p style={{fontSize:14, color:C.dim, marginTop:20, maxWidth:460, lineHeight:1.6}}>
            A rehearsal & stage console for musicians. Map sections, drive click, and keep every setlist in reach — from iPhone pocket to iPad monitor.
          </p>
        </div>

        <div>
          <MetaTag>EXAMPLE · LOVE ME DO / 10 SECTIONS / 60 BARS</MetaTag>
          <div style={{display:"flex", gap:3, marginTop:14}}>
            {SECTIONS.map((s,i)=>(
              <div key={i} style={{flex:s.bars, height:10, background:SEC_COLOR[s.type]}}/>
            ))}
          </div>
          <div style={{display:"flex", gap:3, marginTop:6}}>
            {SECTIONS.map((s,i)=>(
              <div key={i} style={{flex:s.bars, textAlign:"center", ...mono, fontSize:9, letterSpacing:"0.12em", color:"rgba(255,255,255,0.4)"}}>
                {s.label.slice(0,3)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — sign in */}
      <div style={{display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"40px 56px"}}>
        <div style={{display:"flex", justifyContent:"space-between"}}>
          <MetaTag>ACCESS</MetaTag>
          <MetaTag>EN / JA</MetaTag>
        </div>

        <div style={{maxWidth:420}}>
          <div style={{...sans, fontSize:32, fontWeight:700, letterSpacing:"-0.02em"}}>Sign in</div>
          <p style={{fontSize:13, color:C.dim, marginTop:10, lineHeight:1.6}}>
            Use your Google account. Struq syncs sections, setlists and preferences across every device you sign in on.
          </p>

          <button style={{
            width:"100%", marginTop:32, display:"flex", alignItems:"center", justifyContent:"center", gap:12,
            background:"#fff", color:"#111", border:"none", padding:"16px 20px", borderRadius:2,
            ...sans, fontSize:14, fontWeight:600, cursor:"pointer",
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <div style={{marginTop:22, display:"flex", gap:12, ...mono, fontSize:10, letterSpacing:"0.22em", color:C.dim2}}>
            <span>SECURE</span><span>·</span><span>NO PASSWORD</span><span>·</span><span>SSO</span>
          </div>
        </div>

        <div style={{display:"flex", justifyContent:"space-between"}}>
          <MetaTag>STRUQ.FOCUSWAVE.CC</MetaTag>
          <MetaTag>© 2026</MetaTag>
        </div>
      </div>
    </div>
  );
}

function LoginConsoleMobile({ width=390, height=844 }) {
  const { C, mono, sans, MetaTag, SEC_COLOR, SECTIONS } = window;
  return (
    <div style={{width, height, background:C.bg, color:C.text, ...sans, display:"flex", flexDirection:"column", overflow:"hidden"}}>
      <div style={{padding:"18px 22px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${C.line}`}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <svg width="22" height="22" viewBox="0 0 24 24">
            <rect x="2"  y="4"  width="6"  height="3" fill="oklch(0.72 0.02 250)"/>
            <rect x="10" y="4"  width="8"  height="3" fill="oklch(0.72 0.14 250)"/>
            <rect x="2"  y="10" width="12" height="3" fill="oklch(0.74 0.16 65)"/>
            <rect x="2"  y="16" width="5"  height="3" fill="oklch(0.72 0.14 160)"/>
            <rect x="9"  y="16" width="11" height="3" fill="oklch(0.70 0.18 25)"/>
          </svg>
          <div style={{...sans, fontSize:16, fontWeight:700}}>Struq</div>
        </div>
        <MetaTag size={9}>V 2.0</MetaTag>
      </div>

      <div style={{flex:1, padding:"40px 22px", display:"flex", flexDirection:"column", justifyContent:"center"}}>
        <MetaTag color={C.accent} size={10}>STRUCTURE · REHEARSAL · LIVE</MetaTag>
        <div style={{...sans, fontSize:44, fontWeight:800, letterSpacing:"-0.04em", lineHeight:1.0, marginTop:14}}>
          Song<br/>structures,<br/>
          <span style={{color:"rgba(255,255,255,0.55)"}}>at hand.</span>
        </div>

        <div style={{marginTop:42}}>
          <MetaTag size={9}>EXAMPLE STRUCTURE</MetaTag>
          <div style={{display:"flex", gap:2, marginTop:10}}>
            {SECTIONS.map((s,i)=>(
              <div key={i} style={{flex:s.bars, height:6, background:SEC_COLOR[s.type]}}/>
            ))}
          </div>
        </div>

        <button style={{
          marginTop:42, width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10,
          background:"#fff", color:"#111", border:"none", padding:"16px 20px", borderRadius:2,
          ...sans, fontSize:14, fontWeight:600,
        }}>
          <svg width="17" height="17" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <div style={{marginTop:20, textAlign:"center", ...mono, fontSize:9, letterSpacing:"0.22em", color:C.dim2}}>
          SECURE · NO PASSWORD · SSO
        </div>
      </div>

      <div style={{padding:"14px 22px", borderTop:`1px solid ${C.line}`, display:"flex", justifyContent:"space-between"}}>
        <MetaTag size={9}>FOCUSWAVE</MetaTag>
        <MetaTag size={9}>EN / JA</MetaTag>
      </div>
    </div>
  );
}

window.LoginConsole = LoginConsole;
window.LoginConsoleMobile = LoginConsoleMobile;
