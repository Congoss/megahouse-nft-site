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

/* Modal refs */
const pickerBackdrop = document.getElementById('pickerBackdrop');
const pickerModal    = document.getElementById('pickerModal');
const pickerGrid     = document.getElementById('pickerGrid');
const pickerClose    = document.getElementById('pickerClose');
const pickerCancel   = document.getElementById('pickerCancel');

const occ = new Set();

/************ (опційно) NEAR testnet status ************/
let near, wallet, accountId = null;
async function initNear(){
  try{
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
  }catch(e){ console.warn("NEAR init skipped:", e); }
  refreshWalletUI();
}
function refreshWalletUI(){
  const status = document.getElementById("accountStatus");
  const btnConnect = document.getElementById("connectBtn");
  const btnDisconnect = document.getElementById("disconnectBtn");
  if (!status || !btnConnect || !btnDisconnect) return;
  if (accountId){ status.textContent = `Signed in: ${accountId}`; btnConnect.hidden=true; btnDisconnect.hidden=false; }
  else { status.textContent = "Not connected"; btnConnect.hidden=false; btnDisconnect.hidden=true; }
}
function connectWallet(){ wallet?.requestSignIn(); }
function disconnectWallet(){ wallet?.signOut(); accountId=null; refreshWalletUI(); }

/************ GRID UTILS ************/
function slotSize(){
  let w = Math.floor(scene.clientWidth / COLS);
  let h = Math.round(w * 3/4); // 4:3
  scene.style.setProperty("--slot-w", w + "px");
  scene.style.setProperty("--slot-h", h + "px");
  return { w, h };
}
function cellToPx(x,y,w,h){
  const groundY = scene.clientHeight * (1 - GROUND_RATIO);
  const adjust = 50; // щоби нижній ряд точно був видимий
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
      s.addEventListener("click", ()=> openPicker(x,y));
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
  wrap.style = `left:${left}px;top:${top}px;width:${w}px;height:${h}px;opacity:0;transition:.15s opacity ease-out;`;
  wrap.innerHTML = `<img class="tile-img" src="${tile.src}" alt="${tile.title}">
                    <div class="tile-badge">${tile.title}</div>`;
  placed.appendChild(wrap);

  occ.add(`${x},${y}`);
  renderSlots();
  requestAnimationFrame(()=> wrap.style.opacity = 1);
}

/************ MODAL PICKER ************/
function renderPickerGrid(){
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
    const btn = card.querySelector("button");
    btn.addEventListener("click", ()=>{
      // зчитуємо координати слота прямо з модалки (надійніше, ніж глобальна змінна)
      const x = Number(pickerModal.dataset.x);
      const y = Number(pickerModal.dataset.y);
      const tile = tiles[Number(btn.dataset.idx)];
      if (Number.isFinite(x) && Number.isFinite(y) && tile){
        closePicker();
        place(x, y, tile);
      } else {
        console.warn("Picker coords or tile missing", {x,y,tile});
      }
    });
    pickerGrid.appendChild(card);
  });
}
function openPicker(x,y){
  // зберігаємо координати в атрибутах модалки
  pickerModal.dataset.x = String(x);
  pickerModal.dataset.y = String(y);

  renderPickerGrid();
  pickerBackdrop.hidden = false;
  pickerModal.hidden = false;
  pickerGrid.querySelector("button")?.focus();
}
function closePicker(){
  pickerBackdrop.hidden = true;
  pickerModal.hidden = true;
  delete pickerModal.dataset.x;
  delete pickerModal.dataset.y;
}

/* керування модалкою */
pickerClose.addEventListener("click", closePicker);
pickerCancel.addEventListener("click", closePicker);
pickerBackdrop.addEventListener("click", closePicker);
window.addEventListener("keydown", (e)=>{ if(!pickerModal.hidden && e.key === "Escape") closePicker(); });

/************ BOOT ************/
window.addEventListener("resize", renderSlots);
window.addEventListener("DOMContentLoaded", async ()=>{
  document.getElementById("connectBtn")?.addEventListener("click", connectWallet);
  document.getElementById("disconnectBtn")?.addEventListener("click", disconnectWallet);
  await initNear();
  renderSlots();
});
