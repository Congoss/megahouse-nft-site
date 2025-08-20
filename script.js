/************ DEMО NFT ************/
const tiles = [
  {id:"bar-001",      title:"Bar Container", owner:"demo.near", src:"img/bar.png"},
  {id:"aquarium-001", title:"Aquarium",      owner:"demo.near", src:"img/aquarium.png"},
  {id:"tv-001",       title:"TV Room",       owner:"demo.near", src:"img/tv.png"}
];

/************ ПАРАМЕТРИ СЦЕНИ ************/
const COLS = 10;              // 10 на поверх
const ROWS = 12;
const GAP  = 10;              // відстань між контейнерами (px)
const SIDE_MIN = 32;          // мін. бічний відступ (щоб бачити фон)
const SIDE_MAX = 96;          // макс. бічний відступ
const BURY = 0.5;             // перший ряд наполовину в "землі"
const BOTTOM_MARGIN = 40;     // відступ від низу

const scene   = document.getElementById('scene');
const slotsEl = document.getElementById('slots');
const placed  = document.getElementById('placed');

/* Modal */
const pickerBackdrop = document.getElementById('pickerBackdrop');
const pickerModal    = document.getElementById('pickerModal');
const pickerGrid     = document.getElementById('pickerGrid');
const pickerClose    = document.getElementById('pickerClose');
const pickerCancel   = document.getElementById('pickerCancel');

const occ = new Set();

/************ NEAR (опц.) ************/
let near, wallet, accountId = null;
async function initNear(){ try{
  if (!window.nearApi) return;
  const nearApi = window.nearApi;
  near = await nearApi.connect({
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
   
