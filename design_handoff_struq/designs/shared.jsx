// Shared data + color tokens
const SONG = {
  title: "Love Me Do",
  artist: "The Beatles",
  bpm: 120,
  key: "G",
};

// Simulated structure of Love Me Do (10 sections)
const SECTIONS = [
  { type:"intro",    label:"Intro",    bars:4,  chord:"G C G C G D G" },
  { type:"a",        label:"A",        bars:8,  chord:"G C G C G D G" },
  { type:"chorus",   label:"Chorus",   bars:8,  chord:"G C G C G D G" },
  { type:"a",        label:"A",        bars:8,  chord:"G C G C G D G" },
  { type:"interlude",label:"Interlude",bars:4,  chord:"G D G" },
  { type:"bridge",   label:"Bridge",   bars:8,  chord:"C G D G" },
  { type:"a",        label:"A",        bars:8,  chord:"G C G C G D G" },
  { type:"solo",     label:"Solo",     bars:8,  chord:"G C G D G" },
  { type:"chorus",   label:"Chorus",   bars:8,  chord:"G C G C G D G" },
  { type:"outro",    label:"Outro",    bars:4,  chord:"G" },
];

const SEC_COLOR = {
  intro:"var(--sec-intro)",
  a:"var(--sec-a)",
  b:"var(--sec-b)",
  chorus:"var(--sec-chorus)",
  bridge:"var(--sec-bridge)",
  solo:"var(--sec-solo)",
  outro:"var(--sec-outro)",
  interlude:"var(--sec-interlude)",
  custom:"var(--sec-custom)",
};

// Short glyph for compact views
const SEC_GLYPH = {
  intro:"I", a:"A", b:"B", chorus:"C", bridge:"Br", solo:"S", outro:"O", interlude:"In", custom:"·",
};

window.SONG = SONG;
window.SECTIONS = SECTIONS;
window.SEC_COLOR = SEC_COLOR;
window.SEC_GLYPH = SEC_GLYPH;
