// ======= DEMO NFT LIST =======
const tiles = [
  {id:"bar-001", title:"Bar Container", owner:"demo.near", src:"img/bar.png"},
  {id:"aquarium-001", title:"Aquarium", owner:"demo.near", src:"img/aquarium.png"},
  {id:"tv-001", title:"TV Room", owner:"demo.near", src:"img/tv.png"}
];

// ======= GRID SETTINGS =======
// 10 контейнерів на поверх
const COLS = 10;
const ROWS = 12;
const GROUND_RATIO = 0.22;
const BURY = 0.5;

const scene   = document.getElementById('scene');
const slotsEl = document.getElementById('slots');
const placed  = document.getElementById('placed');

const occ = new Set();         // зайняті клітинки
let pendingSlot = null;        // {x,y} для модалки (залишено гак, якщо захочеш)

// ======= NEAR TESTNET WALLET =======
let near, wallet, accountId = null;

async function initNear(){
  const nearApi = window.nearApi;
  near = await nearApi.connect({
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
    walletUrl: "https://wallet.testnet.near.org",
    helperUrl: "https://helper.testnet.near.org",
    headers: {}
  });
  wallet = new nearApi.WalletConnection(near, null);
  if (wallet.isSignedIn()) {
    accountId = wallet.getAccountId();
  }
  refreshWalletUI();
}

function refreshWalletUI(){
  const status = document.getElementById("accountStatus");
  const btnConnect = document.getElementById("connectBtn");
  const btnDisconnect = document.getElementById("disconnectBtn");

  if (accountId){
    status.textContent = `Signed in: ${accountId}`;
    btnConnect.hidden = true;
    btnDisconnect.hidden = false;
  } else {
    status.textContent = "Not connected";
    btnConnect.hidden = false;
    btnDisconnect.hidden = true;
  }
}

async function connectWallet(){
  // redirect у testnet wallet із запитом підпису (без контракту — просто логін)
  wallet.requestSignIn(); // якщо треба контрактId: wallet.requestSignIn({ contractId: "your-contract.testnet" })
}

function disconnectWallet(){
  wallet.signOut();
  accountId = null;
  refreshWalletUI();
}

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
  const top0    = groundY - h * (1 - BURY);
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
      s.onclick = () => onSlotClick(x,y);
      slotsEl.appendChild(s);
    }
  }
}

function onSlotClick(x,y){
  // DEMO: простий вибір через prompt (можемо підключити красиву модалку пізніше)
  const list = tiles.map((t,i)=>`${i+1}. ${t.title}`).join("\n");
  const pick = +prompt("Choose an NFT:\n"+list, "1");
  const tile = tiles[pick-1];
  if (!tile) return;
  place(x,y,tile);
}

// ======= PLACE TILE =======
function place(x,y,tile){
  const {w,h} = slotSize();
  const {left, top} = cellToPx(x,y,w,h);
  const wrap = document.createElement("div");
  wrap.className = "tile-wrap";
  wrap.style = `left:${left}px;top:${top}px;width:${w}px;height:${h}px`;
  wrap.innerHTML = `<img class="tile-img" src="${tile.src}" alt="${tile.title}">
                    <div class="tile-badge">${tile.title}</div>`;
  placed.appendChild(wrap);
  occ.add(`${x},${y}`);
  renderSlots();
}

// ======= BOOT =======
window.addEventListener("resize", renderSlots);
window.addEventListener("DOMContentLoaded", async ()=>{
  // кнопки гаманця
  document.getElementById("connectBtn").addEventListener("click", connectWallet);
  document.getElementById("disconnectBtn").addEventListener("click", disconnectWallet);
  await initNear();
  renderSlots();
});
