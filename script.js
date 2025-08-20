// ======= DEMO NFT LIST (поклади картинки у ./img/) =======
const tiles = [
  {id:"bar-001", title:"Bar Container", owner:"demo.near", src:"img/bar.png"},
  {id:"aquarium-001", title:"Aquarium", owner:"demo.near", src:"img/aquarium.png"},
  {id:"tv-001", title:"TV Room", owner:"demo.near", src:"img/tv.png"}
];

// ======= GRID SETTINGS =======
const COLS = 10;            // 10 контейнерів на поверх
const ROWS = 12;
const GROUND_RATIO = 0.22;  // частка "землі"
const BURY = 0.5;           // перший ряд наполовину в землі

const scene   = document.getElementById('scene');
const slotsEl = document.getElementById('slots');
const placed  = document.getElementById('placed');

const pickerBackdrop = document.getElementById('pickerBackdrop');
const pickerModal    = document.getElementById('pickerModal');
const pickerGrid     = document.getElementById('pickerGrid');
const pickerClose    = document.getElementById('pickerClose');
const pickerCancel   = document.getElementById('pickerCancel');

const occ = new Set();         // зайняті клітинки
let pendingSlot = null;        // {x,y} — куди вставляємо вибране NFT

// ======= NEAR TESTNET WALLET (для демо статусу) =======
let near, wallet, accountId = null;

async function initNear(){
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
function connectWallet(){ wallet.requestSignIn(); }
function disconnectWallet(){ wallet.signOut(); accountId=null; refreshWalletUI(); }

// ======= GRID UTILS =======
function slotSize(){
  let w = Math.floor(scene.clientWidth / COLS);
  let h = Math.round(w * 3/4); // 4:3
  scene.style.setProperty("--slot-w", w + "px");
  scene.style.setProperty("--slot-h", h + "px");
  return { w, h };
}
function cellToPx(x,y,w,h){
  const groundY = scene.clientHeight * (1 - GROUND_RATIO);
  const adjust = 50; // невелике підняття, щоб нижній ряд точно був видимий
  const top0 = groundY - h * (1 - BURY) - adjust;
  return { left:(scene.clientWidth - COLS*w)/2 + x*w, top: top0 - y*h };
}
function available(x,y){
  if (occ.has(`${x},${y}`)) return false;
  return y === 0 || occ.has(`${x},${y-1}`);
}

// ======= RENDER SLOTS =======
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
      s.onclick = () => openPicker(x,y);
      slotsEl.appendChild(s);
    }
  }
}

// ======= PLACE TILE =======
function place(x,y,tile){
  const {w,h} = slotSize();
  const {left, top} = cellToPx(x,y,w,h);

  const wrap = document.createElement("div");
  wrap.className = "tile-wrap";
  wrap.style = `left:${left}px;top:${top}px;width:${w}px;height:${h}px;opacity:0;transition:.15s opacity ease-out;`;
  wrap.innerHTML = `<img class="tile-img" src="${tile.src}" alt="${tile.title}">
                    <div class="tile-badge">${tile.title}</div>`;
  placed.appendChild(wrap);

  occ.add(`${x},${y}`);        // позначаємо клітинку зайнятою
  renderSlots();               // “+” зникає, відкриваються верхні
  requestAnimationFrame(()=> wrap.style.opacity = 1);
}

// ======= MODAL PICKER =======
function renderPickerGrid(){
  pickerGrid.innerHTML = "";
  tiles.forEach((t, idx)=>{
    const card = document.createElement("div");
    card.className = "nft-card";
    card.innerHTML = `
      <img src="${t.src}" alt="${t.title}">
      <div class="meta">
        <div class="title" title="${t.title}">${t.title}</div>
        <button data-idx="${idx}">Place</button>
      </div>
    `;
    card.querySelector("button").onclick = (e)=>{
      const i = +e.currentTarget.dataset.idx;
      if (!pendingSlot) return;
      closePicker();
      place(pendingSlot.x, pendingSlot.y, tiles[i]);
      pendingSlot = null;
    };
    pickerGrid.appendChild(card);
  });
}
function openPicker(x,y){
  pendingSlot = {x,y};
  renderPickerGrid();
  pickerBackdrop.hidden = false;
  pickerModal.hidden = false;
  const firstBtn = pickerGrid.querySelector("button");
  if (firstBtn) firstBtn.focus();
}
function closePicker(){
  pickerBackdrop.hidden = true;
  pickerModal.hidden = true;
  pendingSlot = null;
}

// керування модалкою
pickerClose.addEventListener("click", closePicker);
pickerCancel.addEventListener("click", closePicker);
pickerBackdrop.addEventListener("click", closePicker);
window.addEventListener("keydown", (e)=>{ if(!pickerModal.hidden && e.key === "Escape") closePicker(); });

// ======= BOOT =======
window.addEventListener("resize", renderSlots);
window.addEventListener("DOMContentLoaded", async ()=>{
  // гаманці
  const c = document.getElementById("connectBtn");
  const d = document.getElementById("disconnectBtn");
  if (c) c.addEventListener("click", connectWallet);
  if (d) d.addEventListener("click", disconnectWallet);

  await initNear();
  renderSlots();
});
