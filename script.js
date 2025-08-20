/************ DEMO NFT ************/
const tiles = [
  {id:"bar-001",      title:"Bar Container", owner:"demo.near", src:"img/bar.png"},
  {id:"aquarium-001", title:"Aquarium",      owner:"demo.near", src:"img/aquarium.png"},
  {id:"tv-001",       title:"TV Room",       owner:"demo.near", src:"img/tv.png"}
];

/************ GRID SETTINGS ************/
const COLS = 10;
const ROWS = 12;
const GROUND_RATIO = 0.22;
const BURY = 0.5;

const scene   = document.getElementById('scene');
const slotsEl = document.getElementById('slots');
const placed  = document.getElementById('placed');

/* Modal refs (перевір, що ці id є в index.html) */
const pickerBackdrop = document.getElementById('pickerBackdrop');
const pickerModal    = document.getElementById('pickerModal');
const pickerGrid     = document.getElementById('pickerGrid');
const pickerClose    = document.getElementById('pickerClose');
const pickerCancel   = document.getElementById('pickerCancel');

const occ = new Set();

/************ NEAR testnet status (опц.) ************/
let near, wallet, accountId = null;
async function initNear(){ try{
  if (!window.nearApi) return;
  const nearApi = window.nearApi;
  near = await nearApi.connect({
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
    walletUrl: "https://wallet.testnet.near.org",
    helperUrl: "https://helper.testnet.near.org",
  });
  wallet = new nearApi.WalletConnection(near, null);
  if (wallet.isSignedIn()) accountId = wallet.getAccountId();
}catch(e){} refreshWalletUI();}
function refreshWalletUI(){
  const s = document.getElementById("accountStatus");
  const c = document.getElementById("connectBtn");
  const d = document.getElementById("disconnectBtn");
  if(!(s&&c&&d)) return;
  if(accountId){ s.textContent=`Signed in: ${accountId}`; c.hidden=true; d.hidden=false; }
  else { s.textContent="Not connected"; c.hidden=false; d.hidden=true; }
}
function connectWallet(){ wallet?.requestSignIn(); }
function disconnectWallet(){ wallet?.signOut(); accountId=null; refreshWalletUI(); }

/************ GRID UTILS ************/
function slotSize(){
  let w = Math.floor(scene.clientWidth / COLS);
  let h = Math.round(w * 3/4);
  scene.style.setProperty("--slot-w", w + "px");
  scene.style.setProperty("--slot-h", h + "px");
  return { w, h };
}
function cellToPx(x,y,w,h){
  const groundY = scene.clientHeight * (1 - GROUND_RATIO);
  const adjust = 50;
  const top0 = groundY - h * (1 - BURY) - adjust;
  return { left:(scene.clientWidth - COLS*w)/2 + x*w, top: top0 - y*h };
}
function available(x,y){
  if (occ.has(`${x},${y}`)) return false;
  return y === 0 || occ.has(`${x},${y-1}`);
}

/************ RENDER SLOTS ************/
function renderSlots(){
  slotsEl.innerHTML = "";
  const {w,h} = slotSize();
  for (let y=0; y<ROWS; y++){
    for (let x=0; x<COLS; x++){
      if (!available(x,y)) continue;
      const {left, top} = cellToPx(x,y,w,h);
      if (left < -w || left > scene.clientWidth) continue;
      const s = document.createElement("div");
      s.className = "slot";
      s.style.left = left + "px";
      s.style.top  = top  + "px";
      s.addEventListener("click", ()=> openPicker(x,y));   // координати передаємо тут
      slotsEl.appendChild(s);
    }
  }
}

/************ PLACE TILE ************/
function place(x,y,tile){
  const {w,h} = slotSize();
  const {left, top} = cellToPx(x,y,w,h);
  const wrap = document.createElement("div");
  wrap.className = "tile-wrap";
  wrap.style = `left:${left}px;top:${top}px;width:${w}px;height:${h}px;opacity:0;transition:.15s opacity;`;
  wrap.innerHTML = `<img class="tile-img" src="${tile.src}" alt="${tile.title}">
                    <div class="tile-badge">${tile.title}</div>`;
  placed.appendChild(wrap);
  occ.add(`${x},${y}`);
  renderSlots();
  requestAnimationFrame(()=> wrap.style.opacity = 1);
}

/************ MODAL PICKER ************/
// Рендеримо модалку, замкнувши x,y у замиканні:
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
      place(x, y, tiles[i]);     // тут уже точно є координати
    });
    pickerGrid.appendChild(card);
  });
}
function openPicker(x,y){
  if(!(pickerBackdrop&&pickerModal&&pickerGrid)) return;  // якщо модалки нема в HTML
  renderPickerGrid(x,y);
  pickerBackdrop.hidden = false;
  pickerModal.hidden = false;
  pickerGrid.querySelector("button")?.focus();
}
function closePicker(){
  if(pickerBackdrop) pickerBackdrop.hidden = true;
  if(pickerModal)    pickerModal.hidden = true;
}

/* керування модалкою */
pickerClose?.addEventListener("click", closePicker);
pickerCancel?.addEventListener("click", closePicker);
pickerBackdrop?.addEventListener("click", closePicker);
window.addEventListener("keydown", (e)=>{ if(pickerModal && !pickerModal.hidden && e.key === "Escape") closePicker(); });

/************ BOOT ************/
window.addEventListener("resize", renderSlots);
window.addEventListener("DOMContentLoaded", async ()=>{
  document.getElementById("connectBtn")?.addEventListener("click", connectWallet);
  document.getElementById("disconnectBtn")?.addEventListener("click", disconnectWallet);
  await initNear();
  renderSlots();
});
