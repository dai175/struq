// Full canvas — Login / Setlists / Songs / Settings / Perform
function App() {
  return (
    <DesignCanvas bg="#0a0a0a" gridColor="rgba(255,255,255,0.03)">

      <DCSection id="auth" title="01 · Authentication" subtitle="Sign in — desktop and phone">
        <DCArtboard id="login-pc"     label="PC · Sign in"     width={1280} height={800}><LoginConsole/></DCArtboard>
        <DCArtboard id="login-mobile" label="Mobile · Sign in" width={390}  height={844}><LoginConsoleMobile/></DCArtboard>
      </DCSection>

      <DCSection id="setlists" title="02 · Setlists" subtitle="PC 2-column + mobile drill">
        <DCArtboard id="setlists-pc"     label="PC · Library + Detail"  width={1440} height={900}><SetlistsPC/></DCArtboard>
        <DCArtboard id="setlists-list"   label="Mobile · list"          width={390}  height={844}><SetlistsList/></DCArtboard>
        <DCArtboard id="setlists-detail" label="Mobile · detail"        width={390}  height={844}><SetlistDetail/></DCArtboard>
      </DCSection>

      <DCSection id="songs" title="03 · Songs" subtitle="PC 2-column editor + mobile">
        <DCArtboard id="songs-pc"   label="PC · Library + Editor"  width={1440} height={900}><SongsPC/></DCArtboard>
        <DCArtboard id="songs-list" label="Mobile · list"          width={390}  height={844}><SongsList/></DCArtboard>
        <DCArtboard id="song-edit"  label="Mobile · editor"        width={390}  height={844}><SongEdit/></DCArtboard>
      </DCSection>

      <DCSection id="perform" title="04 · Perform" subtitle="Landscape console + pocket monitor">
        <DCArtboard id="perform-desktop" label="PC / iPad landscape" width={1280} height={720}><ConsolePerform/></DCArtboard>
        <DCArtboard id="perform-mobile"  label="iPhone portrait"     width={390}  height={844}><ConsolePerformMobile/></DCArtboard>
      </DCSection>

      <DCSection id="settings" title="05 · Settings" subtitle="PC sub-nav + mobile list">
        <DCArtboard id="settings-pc"     label="PC · Settings"     width={1440} height={900}><SettingsPC/></DCArtboard>
        <DCArtboard id="settings-mobile" label="Mobile · Settings" width={390}  height={844}><SettingsPanel/></DCArtboard>
      </DCSection>

      <DCSection id="system" title="06 · System" subtitle="Shared design tokens">
        <DCArtboard id="tokens" label="Type + palette" width={1280} height={720}><TokenSheet/></DCArtboard>
      </DCSection>

    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
