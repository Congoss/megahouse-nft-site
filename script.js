/************ Demo NFTs ************/
const tiles = [
  { id: "bar-001",      title: "Bar Container", owner: "demo.near", src: "img/bar.png" },
  { id: "aquarium-001", title: "Aquarium",      owner: "demo.near", src: "img/aquarium.png" },
  { id: "tv-001",       title: "TV Room",       owner: "demo.near", src: "img/tv.png" }
];

/************ Config ************/
const COLS = 10, ROWS = 12;
const BURY = 0.5, BOTTOM_MARGIN = 40, SIDE = 64;
const GAP  = 0, SLOT_INSET = 2, TOP_SAFE = 72;

// ► шлях до згенерованих лісів (плейсхолдер після Unstake)
const BEAMS_SRC = "img/scaffold.png";

/************ DOM ************/
const scene   = document.getElementById("scene");
const slotsEl = document.getElementById("slots");
const placed  = document.getElementById("placed");

const pickerBackdrop = document.getElementById("pickerBackdrop");
const pickerModal    = document.getElementById("pickerModal");
const pickerGrid     = document.getElementById("pickerGrid");
const pickerClose    = document.getElementById("pickerClose");
const pickerCancel   = document.getElementById("pickerCancel");

const unitBackdrop = document.getElementById("unitBackdrop");
const unitModal    = document.getElementById("unitModal");
const unitClose    = document.getElementById("unitClose");
const btnUnstake   = document.getElementById("btnUnstake");

const occ = new Set();        // зайняті "x,y" (у т.ч. плейсхолдер)
const unitMeta = new Map();   // дані юнітів по ключу "x,y"
let currentUnitKey = null;

/************ (optional) NEAR ************/
let near, wallet;
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
  } catch (_) {}
}
document.getElementById("connectBtn")?.addEventListener("click", ()=> wallet?.requestSignIn());

/************ Helpers ************/
function highestFloor(){
  let maxY = 0;
  occ.forEach(k => { const y = +k.split(",")[1]; if (y > maxY) maxY = y; });
  return maxY;
}
function ensureSceneMinHeightFor(layout){
  const h = layout.h;
  const nextFloor = highestFloor() + 1;
  const need = Math.ceil( (1 + BURY) * h + nextFloor * h + BOTTOM_MARGIN + TOP_SAFE );
  const base = Math.max(window.innerHeight, need);
  const current = parseInt(scene.style.minHeight || 0) || 0;
  if (current < base) { scene.style.minHeight = base + "px"; return true; }
  return false;
}
function getLayout(){
  const W = scene.clientWidth, H = scene.clientHeight;
  const innerW = W - 2*SIDE - (COLS - 1)*GAP;
  let w = Math.floor(innerW / COLS);
  let h = Math.round(w * 3/4);

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
  const top0 = H - (1 + BURY) * h - BOTTOM_MARGIN;
  return { left: leftBase + x * (w + GAP), top: top0 - y * h };
}
function available(x,y){
  if (occ.has(`${x},${y}`)) return false;
  return y === 0 || occ.has(`${x},${y-1}`);
}

/************ Layout placed ************/
function layoutPlaced(layout){
  [...placed.children].forEach(el=>{
    const x = +el.dataset.x, y = +el.dataset.y;
    const {left, top} = cellToPx(x,y,layout);
    el.style.left = left + "px";
    el.style.top  = top  + "px";
    el.style.width  = layout.w + "px";
    el.style.height = layout.h + "px";
  });
}

/************ Slots ************/
function renderSlots(){
  let layout = getLayout();
  if (ensureSceneMinHeightFor(layout)) layout = getLayout();

  slotsEl.innerHTML = "";
  for (let y=0; y<ROWS; y++){
    for (let x=0; x<COLS; x++){
      if (!available(x,y)) continue;
      const {left, top} = cellToPx(x,y,layout);
      const s = document.createElement("div");
      s.className = "slot";
      s.style.width  = (layout.w - 2*SLOT_INSET) + "px";
      s.style.height = (layout.h - 2*SLOT_INSET) + "px";
      s.style.left   = (left + SLOT_INSET) + "px";
      s.style.top    = (top + SLOT_INSET) + "px";
      s.textContent  = "+";
      s.addEventListener("click", ()=> openPicker(x,y));
      slotsEl.appendChild(s);
    }
  }
  layoutPlaced(layout);
}

/************ Place & Unstake ************/
function place(x,y,tile){
  let layout = getLayout();

  const prevHighest = highestFloor();
  const next = Math.max(prevHighest, y) + 1;
  const need = Math.ceil( (1 + BURY) * layout.h + next * layout.h + BOTTOM_MARGIN + TOP_SAFE );
  const curMin = parseInt(scene.style.minHeight || 0) || 0;
  const base = Math.max(window.innerHeight, need);
  if (curMin < base) { scene.style.minHeight = base + "px"; layout = getLayout(); }

  const {left, top} = cellToPx(x,y,layout);

  const wrap = document.createElement("div");
  wrap.className = "tile-wrap";
  wrap.dataset.x = String(x);
  wrap.dataset.y = String(y);
  wrap.style = `left:${left}px;top:${top}px;width:${layout.w}px;height:${layout.h}px;opacity:0;transition:.15s opacity ease-out;`;
  wrap.innerHTML = `<img class="tile-img" src="${tile.src}" alt="${tile.title}">
                    <div class="tile-badge">${tile.title}</div>`;
  wrap.addEventListener("click", ()=> openUnitInfo(x,y));
  placed.appendChild(wrap);

  const key = `${x},${y}`;
  const tokenId = `${tile.id}-${Date.now().toString(36).slice(-5)}`;
  unitMeta.set(key, {
    tokenId,
    title: tile.title,
    owner: tile.owner,
    src: tile.src,
    x, y,
    placeholder: false,
    buyNow: null,
    highestBid: null,
    auctionEnds: null
  });

  occ.add(key);
  renderSlots();
  requestAnimationFrame(()=> { wrap.style.opacity = 1; });
}

function unstakeUnit(key){
  const meta = unitMeta.get(key);
  if (!meta) return;
  // Знаходимо DOM елемент
  const el = [...placed.children].find(n => `${n.dataset.x},${n.dataset.y}` === key);
  if (!el) return;

  // Перетворюємо на плейсхолдер (ліса)
  el.classList.add("placeholder");
  el.querySelector(".tile-img").src = BEAMS_SRC;
  const badge = el.querySelector(".tile-badge");
  badge.textContent = "Under maintenance";
  badge.title = "This slot is supported by scaffolding";

  // оновлюємо мета
  meta.placeholder = true;
  meta.title = "Scaffolding";
  meta.owner = null;
  meta.src = BEAMS_SRC;
  unitMeta.set(key, meta);

  // occ залишається зайнятим — плейсхолдер тримає поверхи
  closeUnit();
}

/************ Picker ************/
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
  pickerBackdrop.hidden = false;
  pickerModal.hidden = false;
  renderPickerGrid(x,y);
  pickerGrid.querySelector("button")?.focus();
}
function closePicker(){
  pickerBackdrop.hidden = true;
  pickerModal.hidden = true;
}
pickerClose?.addEventListener("click", closePicker);
pickerCancel?.addEventListener("click", closePicker);
pickerBackdrop?.addEventListener("click", closePicker);

/************ Unit Info ************/
function openUnitInfo(x,y){
  const key = `${x},${y}`;
  const data = unitMeta.get(key);
  if (!data) return;
  currentUnitKey = key;

  // заповнення
  document.getElementById("unitImg").src = data.src;
  document.getElementById("unitMetaTitle").textContent = data.title;
  document.getElementById("unitToken").textContent = data.placeholder ? "—" : data.tokenId;
  document.getElementById("unitOwner").textContent = data.owner ?? "—";
  document.getElementById("unitCoords").textContent = `x:${x+1}  y:${y+1}`;
  const bonus = y === 0 ? "+50%" : y === 1 ? "+35%" : y === 2 ? "+25%" : y === 3 ? "+15%" : "+0%";
  document.getElementById("unitBonus").textContent = bonus;
  document.getElementById("unitBuy").textContent = data.buyNow ? `${data.buyNow} Ⓝ` : "—";
  document.getElementById("unitBid").textContent = data.highestBid ? `${data.highestBid} Ⓝ` : "—";
  document.getElementById("unitEnds").textContent = data.auctionEnds ? new Date(data.auctionEnds).toLocaleString() : "—";

  // кнопки: якщо плейсхолдер — ховаємо торгові дії
  document.getElementById("btnMakeOffer").disabled = data.placeholder;
  document.getElementById("btnBid").disabled       = data.placeholder;
  document.getElementById("btnBuyNow").disabled    = data.placeholder;

  unitBackdrop.hidden = false;
  unitModal.hidden = false;

  document.getElementById("btnMakeOffer").onclick = ()=> alert("Offer modal (stub)");
  document.getElementById("btnBid").onclick       = ()=> alert("Bid modal (stub)");
  document.getElementById("btnBuyNow").onclick    = ()=> alert("Buy now (stub)");
}
function closeUnit(){
  unitBackdrop.hidden = true;
  unitModal.hidden = true;
  currentUnitKey = null;
}
unitBackdrop?.addEventListener("click", closeUnit);
unitClose?.addEventListener("click", closeUnit);
btnUnstake?.addEventListener("click", ()=>{
  if (!currentUnitKey) return;
  // тут може бути виклик контракту unstake; поки що — локальна дія:
  unstakeUnit(currentUnitKey);
});

/************ Init ************/
window.addEventListener("resize", ()=>{ scene.style.minHeight = ""; renderSlots(); });
window.addEventListener("DOMContentLoaded", async ()=>{
  await initNear();
  renderSlots();
});
