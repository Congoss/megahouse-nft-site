/* -------------------- DEMO DATA -------------------- */
const tiles = [
  {id:"bar-001", title:"Bar Container", owner:"demo.near", src:"img/bar.png", rarity:"Rare", number:"#0042"},
  {id:"aquarium-001", title:"Aquarium", owner:"demo.near", src:"img/aquarium.png", rarity:"Epic", number:"#1177"},
  {id:"tv-001", title:"TV Room", owner:"demo.near", src:"img/tv.png", rarity:"Uncommon", number:"#0890"}
];

/* -------------------- GRID SETTINGS -------------------- */
const COLS = 10;
const MAX_ROWS = 60;
const BURY = 0.5;
const SIDE_GAP_SLOTS = 0.5;
const TOP_SAFE = 90;
const EXTRA_TOP_ROWS = 2; // буфер зверху, щоб не впиратись

/* DOM */
const scene  = document.getElementById('scene');
const slots  = document.getElementById('slots');
const placed = document.getElementById('placed');

/* OCCUPANCY */
const occ = new Map(); // key "x,y" -> {type:'tile'|'scaffold', data:{}}
const key = (x,y)=>`${x},${y}`;

/* -------------------- FARM (demo) -------------------- */
let farmPool=0, farmTarget=20, tickRate=0.04, farmTimer=null;

const farmAmountEl=document.getElementById('farmAmount');
const farmInEl=document.getElementById('farmProgress');
const claimBtn=document.getElementById('btnClaim');
const chipsWrap=document.getElementById('farmChips');

function renderFarmBar(){
  farmAmountEl.textContent = `${farmPool.toFixed(2)} N`;
  const pct=Math.min(100, Math.round((farmPool/farmTarget)*100));
  farmInEl.style.height = pct + "%";       // VERTICAL
  claimBtn.disabled = pct < 100;
  chipsWrap.innerHTML = `
    <span class="chip">Rarity +10%</span>
    <span class="chip">Neighbors +0%</span>
    <span class="chip">Floor +4%</span>
    <span class="chip">Set +0%</span>
  `;
}
claimBtn.addEventListener('click', ()=>{
  if(farmPool>=farmTarget){
    alert(`Claimed ${farmTarget} N (demo)`);
    farmPool-=farmTarget;
    renderFarmBar();
  }
});
function startFarm(){
  if(farmTimer) clearInterval(farmTimer);
  farmTimer=setInterval(()=>{ farmPool+=tickRate; renderFarmBar(); },1000);
}

/* -------------------- GEOMETRY -------------------- */
function slotSize(){
  const usableCols = COLS + SIDE_GAP_SLOTS*2;
  const w = Math.floor(scene.clientWidth/usableCols);
  const h = Math.round(w*3/4);
  scene.style.setProperty("--slot-w",w+"px");
  scene.style.setProperty("--slot-h",h+"px");
  return {w,h};
}
function getMaxY(){
  let m=0;
  for(const k of occ.keys()){
    const gy=+k.split(",")[1];
    if(gy>m) m=gy;
  }
  return m;
}
function ensureSceneHeight(prevH=null){
  const {h}=slotSize();
  const groundRatio=0.22; // має збігатися з CSS
  const denom=(1-groundRatio); // 0.78
  const maxY=getMaxY();

  // додаємо EXTRA_TOP_ROWS як запас зверху
  const needH=Math.ceil((TOP_SAFE + h*(1 - BURY + maxY + EXTRA_TOP_ROWS)) / (denom>0?denom:0.78));
  const newH=Math.max(window.innerHeight, needH);
  const before= prevH ?? scene.clientHeight;
  scene.style.minHeight = newH+"px";

  // тут БІЛЬШЕ не скролимо на "дельту висоти":
  // скрол до конкретної плитки робимо у placeTile()
}
function cellToPx(x,y,w,h){
  const sceneH=scene.clientHeight;
  const groundY=sceneH*(1-0.22);
  const top0=groundY - h*(1-BURY);
  const totalW=(COLS + SIDE_GAP_SLOTS*2)*w;
  const left0=(scene.clientWidth - totalW)/2 + SIDE_GAP_SLOTS*w;
  return {left:left0 + x*w, top: top0 - y*h};
}
function available(x,y){
  if(occ.has(key(x,y))) return false;
  if(y===0) return true;
  return occ.has(key(x,y-1)); // опора знизу
}

/* -------------------- RENDER -------------------- */
function renderSlots(){
  slots.innerHTML="";
  const {w,h}=slotSize();

  for(let y=0;y<MAX_ROWS;y++){
    for(let x=0;x<COLS;x++){
      if(!available(x,y)) continue;
      const {left,top}=cellToPx(x,y,w,h);
      const s=document.createElement("div");
      s.className="slot";
      s.style.left=left+"px"; s.style.top=top+"px";
      s.onclick=()=>openPicker(x,y);
      slots.appendChild(s);
    }
  }

  // перелайаут існуючих
  Array.from(placed.children).forEach(el=>{
    const gx=+el.dataset.x, gy=+el.dataset.y;
    if(Number.isFinite(gx) && Number.isFinite(gy)){
      const {left,top}=cellToPx(gx,gy,w,h);
      el.style.left=left+"px"; el.style.top=top+"px";
      el.style.width=w+"px"; el.style.height=h+"px";
    }
  });
}

/* -------------------- PLACE / UNSTAKE -------------------- */
function placeTile(x,y,tile){
  const prevH = scene.clientHeight;

  const {w,h}=slotSize();
  const {left,top}=cellToPx(x,y,w,h);

  const wrap=document.createElement("div");
  wrap.className="tile-wrap";
  wrap.style.left=left+"px"; wrap.style.top=top+"px";
  wrap.style.width=w+"px"; wrap.style.height=h+"px";
  wrap.dataset.x=x; wrap.dataset.y=y;

  wrap.innerHTML=`
    <img class="tile-img" src="${tile.src}" alt="${tile.title}">
    <div class="tile-badge">${tile.title || "Scaffold"}</div>
  `;
  if(tile.type!=="scaffold"){
    wrap.onclick=()=>openInfo(tile,x,y,wrap);
  }

  placed.appendChild(wrap);
  occ.set(key(x,y), {type:tile.type||"tile", data:tile});

  // оновлюємо сітку і висоту з буфером
  renderSlots();
  ensureSceneHeight(prevH);

  // скролимо плавно САМЕ ДО цієї плитки
  requestAnimationFrame(()=>{
    wrap.scrollIntoView({ behavior:'smooth', block:'center' });
  });
}

function unstake(x,y,wrap){
  const scaffold={id:`scaff-${x}-${y}`, title:"Scaffold", owner:"system", src:"img/scaffold.png", type:"scaffold"};
  wrap.innerHTML=`<img class="tile-img" src="${scaffold.src}" alt="Scaffold"><div class="tile-badge">Scaffold</div>`;
  wrap.onclick=null;
  occ.set(key(x,y), {type:"scaffold", data:scaffold});
  renderSlots();
}

/* -------------------- PICKER -------------------- */
const pickerModal=document.getElementById('pickerModal');
const pickerGrid=document.getElementById('pickerGrid');
let pickTarget=null;

function openPicker(x,y){
  pickTarget={x,y};
  pickerGrid.innerHTML="";
  tiles.forEach(t=>{
    const card=document.createElement("div");
    card.className="picker-card";
    card.innerHTML=`
      <img src="${t.src}" alt="${t.title}">
      <div class="meta"><div class="title">${t.title}</div><button>Place</button></div>
    `;
    card.querySelector("button").onclick=()=>{
      placeTile(pickTarget.x,pickTarget.y,t);
      closeModal(pickerModal);
    };
    pickerGrid.appendChild(card);
  });
  openModal(pickerModal);
}

/* -------------------- INFO MODAL -------------------- */
const infoModal=document.getElementById('infoModal');
const infoImg=document.getElementById('infoImg');
const infoRarity=document.getElementById('infoRarity');
const infoNumber=document.getElementById('infoNumber');
const infoTitle=document.getElementById('infoTitle');
const infoOwner=document.getElementById('infoOwner');
const infoToken=document.getElementById('infoToken');
const infoCoords=document.getElementById('infoCoords');
const baseRateE=document.getElementById('baseRate');
const rarityBonusE=document.getElementById('rarityBonus');
const neighborsBonusE=document.getElementById('neighborsBonus');
const floorBonusE=document.getElementById('floorBonus');
const btnUnstake=document.getElementById('btnUnstake');

function openInfo(tile,x,y,wrap){
  infoImg.src=tile.src;
  infoTitle.textContent=tile.title;
  infoOwner.textContent=tile.owner||"–";
  infoToken.textContent=tile.id||"–";
  infoCoords.textContent=`${x},${y}`;
  infoRarity.textContent=tile.rarity||"Common";
  infoNumber.textContent=tile.number||"#0000";

  // демо
  baseRateE.textContent="1.00";
  rarityBonusE.textContent="+10%";
  neighborsBonusE.textContent="+0%";
  floorBonusE.textContent= y<=1?"+8%":(y<=3?"+4%":"+0%");

  btnUnstake.onclick=()=>{
    if(confirm("Unstake? Поставимо будівельні ліси.")){
      unstake(x,y,wrap);
      closeModal(infoModal);
    }
  };

  openModal(infoModal);
}

/* -------------------- MODAL helpers -------------------- */
function openModal(n){ n.setAttribute("aria-hidden","false"); }
function closeModal(n){ n.setAttribute("aria-hidden","true"); }
document.querySelectorAll('[data-close]').forEach(btn=>{
  btn.addEventListener('click', e=> closeModal(e.target.closest('.modal')));
});
document.querySelectorAll('.modal').forEach(m=>{
  m.addEventListener('click', e=>{ if(e.target===m) closeModal(m); });
});
window.addEventListener('keydown', e=>{
  if(e.key==='Escape'){
    document.querySelectorAll('.modal[aria-hidden="false"]').forEach(m=> closeModal(m));
  }
});

/* -------------------- INIT -------------------- */
function renderAll(){ renderSlots(); ensureSceneHeight(); }
window.addEventListener('resize', renderAll);
renderAll();
startFarm();
