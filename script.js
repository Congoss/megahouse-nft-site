/************ DEMO NFT ************/
const tiles = [
  {id:"bar-001",      title:"Bar Container", owner:"demo.near", src:"img/bar.png"},
  {id:"aquarium-001", title:"Aquarium",      owner:"demo.near", src:"img/aquarium.png"},
  {id:"tv-001",       title:"TV Room",       owner:"demo.near", src:"img/tv.png"}
];

/************ СЦЕНА ************/
const COLS = 10;            // 10 на поверх
const ROWS = 12;
const BURY = 0.5;           // перший ряд наполовину в "землі"
const BOTTOM_MARGIN = 40;   // відступ від низу екрана
const TOP_MARGIN = 80;      // мінімальний відступ від верху (щоб «+» не зникали зверху)

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

/************ NEAR (опц.) ************/
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

/************ РОЗМІРИ ************/
function slotSize(){
  // 4:3 під 400×300
  let w = Math.floor(scene.clientWidth / COLS);
  let h = Math.round(w * 3/4);

  // якщо ряд не влазить у висоту — зменшуємо h (і w)
  const H = scene.clientHeight;
  const maxHForRow0 = (H - TOP_MARGIN - BOTTOM_MARGIN) / (1 + BURY); // щоб y=0 був між відступами
  if (h > maxHForRow0) {
    h = Math.floor(maxHForRow0);
    w = Math.round(h * 4/3);
  }

  scene.style.setProperty("--slot-w", w + "px");
  scene.style.setProperty("--slot-h", h + "px");
  return { w, h };
}

/************ ПОЗИЦІОНУВАННЯ (із клампом) ************/
function cellToPx(x,y,w,h){
  const H = scene.clientHeight;

  // базово прив’язуємо до низу
  let top0 = H - (1 + BURY) * h - BOTTOM_MARGIN;

  // кламп: перший ряд завжди між TOP_MARGIN і (H - h - BOTTOM_MARGIN)
  const minTop = TOP_MARGIN;
  const maxTop = H - h - BOTTOM_MARGIN;
  top0 = Math.max(minTop, Math.min(maxTop, top0));

  const left = (scene.clientWidth - COLS * w) / 2 + x * w;
  const top  = top0 - y * h;
  return { left, top };
}

function available(x,y){
  if (occ.has(`${x},${y}`)) return false;
  return y === 0 || occ.has(`${x},${y-1}`);
}

/************ ЛЕЙАУТ РОЗМІЩЕНИХ ************/
function layoutPlaced(){
  const {w,h} = slotSize();
  [...placed.children].forEach(el=>{
    const x = +el.dataset.x;
    const y = +el.dataset.y;
    const {left, top} = cellToPx(x,y,w,h);
    el.style.left   = left + "px";
    el.style.top    = top  + "px";
    el.style.width  = w + "px";
    el.style.height = h + "px";
  });
}

/************ РЕНДЕР СЛОТІВ ************/
function renderSlots(){
  slotsEl.innerHTML = "";
  const {w,h} = slotSize();

  let count = 0;
  for (let y=0; y<ROWS; y++){
    for (let x=0; x<COLS; x++){
      if (!available(x,y)) continue;
      const {left, top} = cellToPx(x,y,w,h);
      // малюємо тільки ті, що реально в кадрі по горизонталі
      if (left < -w || left > scene.clientWidth) continue;

      const s = document.createElement("div");
      s.className = "slot";
      s.style.left = left + "px";
      s.style.top  = top  + "px";
      s.addEventListener("click", ()=> openPicker(x,y));
      slotsEl.appendChild(s);
      count++;
    }
  }

  // простий дебаг-лічильник (видаляй, якщо не треба)
  debugCounter(count);

  layoutPlaced();
}

/************ ВСТАНОВЛЕННЯ NFT ************/
function place(x,y,tile){
  const {w,h} = slotSize();
  const {left, top} = cellToPx(x,y,w,h);

  const wrap = document.createElement("div");
  wrap.className = "tile-wrap";
  wrap.dataset.x = String(x);
  wrap.dataset.y = String(y);
  wrap.style = `left:${left}px;top:${top}px;width:${w}px;height:${h}px;opacity:0;transition:.15s opacity ease-out;`;
  wrap.innerHTML = `<img class="tile-img" src="${tile.src}" alt="${tile.title}">
                    <div class="tile-badge">${tile.title}</div>`;
  placed.appendChild(wrap);

  occ.add(`${x},${y}`);
  renderSlots();                 // «+» на цій клітинці зникне, зверху з’являться нові
  requestAnimationFrame(()=> wrap.style.opacity = 1);
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

/************ ДЕБАГ: лічильник слотів ************/
function debugCounter(n){
  let el = document.getElementById("slotCountDebug");
  if (!el){
    el = document.createElement("div");
    el.id = "slotCountDebug";
    el.style.cssText = "position:fixed;right:12px;top:12px;z-index:2000;background:rgba(0,0,0,.5);padding:6px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.2);font:12px/1.2 system-ui;color:#fff";
    document.body.appendChild(el);
  }
  el.textContent = `slots: ${n}`;
}

/************ ПОДІЇ ************/
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
