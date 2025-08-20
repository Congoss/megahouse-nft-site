/************ DEMO NFT ************/
const tiles = [
  { id: "bar-001",      title: "Bar Container", owner: "demo.near", src: "img/bar.png" },
  { id: "aquarium-001", title: "Aquarium",      owner: "demo.near", src: "img/aquarium.png" },
  { id: "tv-001",       title: "TV Room",       owner: "demo.near", src: "img/tv.png" }
];

/************ ПАРАМЕТРИ ************/
const COLS = 10;
const ROWS = 12;
const BURY = 0.5;
const BOTTOM_MARGIN = 40;
const SIDE = 64;   // бічні поля
const GAP  = 0;    // відстань між блоками = 0 (щільна кладка)
const SLOT_INSET = 2; // слот "+" трохи менший за NFT на 2px з кожного боку

/************ DOM ************/
const scene   = document.getElementById("scene");
const slotsEl = document.getElementById("slots");
const placed  = document.getElementById("placed");
const pickerBackdrop = document.getElementById("pickerBackdrop");
const pickerModal    = document.getElementById("pickerModal");
const pickerGrid     = document.getElementById("pickerGrid");
const pickerClose    = document.getElementById("pickerClose");
const pickerCancel   = document.getElementById("pickerCancel");

const occ = new Set();

/************ NEAR (опційно) ************/
let near, wallet, accountId = null;
async function initNear() {
  try {
    if (!window.nearApi) return;
    const nearApi = window.nearApi;
    near = await nearApi.connect({
      networkId: "testnet",
      nodeUrl: "https://rpc.testnet.near.org",
      walletUrl: "https://wallet.testnet.near.org",
      helperUrl: "https://helper.testnet.near.org"
    });
    wallet = new nearApi.WalletConnection(near, null);
    if (wallet.isSignedIn()) accountId = wallet.getAccountId();
  } catch (_) {}
  refreshWalletUI();
}
function refreshWalletUI(){
  const s = document.getElementById("accountStatus");
  const c = document.getElementById("connectBtn");
  const d = document.getElementById("disconnectBtn");
  if(!(s&&c&&d)) return;
  if(accountId){ s.textContent = `Signed in: ${accountId}`; c.hidden = true; d.hidden = false; }
  else { s.textContent = "Not connected"; c.hidden = false; d.hidden = true; }
}
function connectWallet(){ wallet?.requestSignIn(); }
function disconnectWallet(){ wallet?.signOut(); accountId=null; refreshWalletUI(); }

/************ ЛЕЙАУТ ************/
function getLayout(){
  const W = scene.clientWidth;
  const H = scene.clientHeight;

  const innerW = W - 2*SIDE - (COLS - 1)*GAP; // з GAP=0 це просто W - 2*SIDE

  let w = Math.floor(innerW / COLS);
  let h = Math.round(w * 3/4);

  // гарантія, що перший ряд у кадрі
  const minTopForRow0 = 60;
  const top0 = H - (1 + BURY) * h - BOTTOM_MARGIN;
  if (top0 < minTopForRow0) {
    const scale = (H - BOTTOM_MARGIN - minTopForRow0) / ((1 + BURY) * h);
    h = Math.max(40, Math.floor(h * scale));
    w = Math.round(h * 4/3);
  }

  const realInnerW = COLS*w + (COLS - 1)*GAP;
  const leftBase = (W - realInnerW) / 2;

  scene.style.setProperty("--slot-w", w + "px");
  scene.style.setProperty("--slot-h", h + "px");

  return { W,H,w,h,leftBase };
}

function cellToPx(x,y,layout){
  const { H,w,h,leftBase } = layout;
  const top0 = H - (1 + BURY) * h - BOTTOM_MARGIN; // якір від низу
  const left = leftBase + x * (w + GAP);
  const top  = top0 - y * h;
  return { left, top };
}

function available(x,y){
  if (occ.has(`${x},${y}`)) return false;
  return y === 0 || occ.has(`${x},${y-1}`);
}

/************ РОЗКЛАДКА ВЖЕ ВСТАНОВЛЕНИХ ************/
function layoutPlaced(layout){
  [...placed.children].forEach(el=>{
    const x = +el.dataset.x;
    const y = +el.dataset.y;
    const {left, top} = cellToPx(x,y,layout);
    el.style.left   = left + "px";
    el.style.top    = top  + "px";
    el.style.width  = layout.w + "px";
    el.style.height = layout.h + "px";
  });
}

/************ СЛОТИ ************/
function renderSlots(){
  const layout = getLayout();
  slotsEl.innerHTML = "";

  for (let y=0; y<ROWS; y++){
    for (let x=0; x<COLS; x++){
      if (!available(x,y)) continue;
      // координати центруємо по клітинці
      const {left, top} = cellToPx(x,y,layout);
      const s = document.createElement("div");
      s.className = "slot";

      // робимо рамку "+" трохи меншою за NFT
      s.style.width  = (layout.w - 2*SLOT_INSET) + "px";
      s.style.height = (layout.h - 2*SLOT_INSET) + "px";
      s.style.left   = (left + SLOT_INSET) + "px";
      s.style.top    = (top + SLOT_INSET) + "px";

      s.textContent = "+";
      s.addEventListener("click", ()=> openPicker(x,y));
      slotsEl.appendChild(s);
    }
  }
  layoutPlaced(layout);
}

/************ РОЗМІЩЕННЯ NFT ************/
function place(x,y,tile){
  const layout = getLayout();
  const {left, top} = cellToPx(x,y,layout);

  const wrap = document.createElement("div");
  wrap.className = "tile-wrap";
  wrap.dataset.x = String(x);
  wrap.dataset.y = String(y);
  wrap.style = `left:${left}px;top:${top}px;width:${layout.w}px;height:${layout.h}px;opacity:0;transition:.15s opacity ease-out;`;
  wrap.innerHTML = `<img class="tile-img" src="${tile.src}" alt="${tile.title}">
                    <div class="tile-badge">${tile.title}</div>`;
  placed.appendChild(wrap);

  occ.add(`${x},${y}`);
  renderSlots();
  requestAnimationFrame(()=> { wrap.style.opacity = 1; });
}

/************ МОДАЛКА ************/
function renderPickerGrid(x,y){
  pickerGrid.innerHTML = "";
  tiles.forEach((t, idx)=>{
    const card = document.createElement("div");
    card.className = "nft-card";
    card.innerHTML = `
      <img src="${t.src}" alt="${t.title}">
      <div class="meta">
        <div class="title" title="${t.title}">${t.title}</div>
        <button data-idx="${idx}" type="button">Place</button>
      </div>
    `;
    card.querySelector("button").addEventListener("click", (e)=>{
      const i = +e.currentTarget.dataset.idx;
      closePicker();
      place(x, y, tiles[i]);
    });
    pickerGrid.appendChild(card);
  });
}
function openPicker(x,y){
  if(!(pickerBackdrop&&pickerModal&&pickerGrid)) return;
  renderPickerGrid(x,y);
  pickerBackdrop.hidden = false;
  pickerModal.hidden = false;
  pickerGrid.querySelector("button")?.focus();
}
function closePicker(){
  if(pickerBackdrop) pickerBackdrop.hidden = true;
  if(pickerModal)    pickerModal.hidden = true;
}

/************ Події ************/
pickerClose?.addEventListener("click", closePicker);
pickerCancel?.addEventListener("click", closePicker);
pickerBackdrop?.addEventListener("click", closePicker);
window.addEventListener("keydown", (e)=>{ if(pickerModal && !pickerModal.hidden && e.key === "Escape") closePicker(); });

window.addEventListener("resize", renderSlots);
window.addEventListener("DOMContentLoaded", async ()=>{
  document.getElementById("connectBtn")?.addEventListener("click", connectWallet);
  document.getElementById("disconnectBtn")?.addEventListener("click", disconnectWallet);
  await initNear();
  renderSlots();
});
