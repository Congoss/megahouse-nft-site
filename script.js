/* -------------------- DEMO NFT -------------------- */
const tiles = [
  { id:"cont-blue",   title:"Blue Container",   owner:"demo.near", src:"img/container_blue.png",   number:"#0001", rarity:"Common" },
  { id:"cont-brown",  title:"Brown Container",  owner:"demo.near", src:"img/container_brown.png",  number:"#0002", rarity:"Uncommon" },
  { id:"cont-gold",   title:"Gold Container",   owner:"demo.near", src:"img/container_gold.png",   number:"#0003", rarity:"Epic" },
  { id:"cont-gray",   title:"Gray Container",   owner:"demo.near", src:"img/container_gray.png",   number:"#0004", rarity:"Common" },
  { id:"cont-orange", title:"Orange Container", owner:"demo.near", src:"img/container_orange.png", number:"#0005", rarity:"Rare" },
  { id:"cont-violet", title:"Violet Container", owner:"demo.near", src:"img/container_violet.png", number:"#0006", rarity:"Rare" }
];

/* -------------------- GRID (менші тайли, адаптив) -------------------- */
let COLS=12, MAX_ROWS=60;
function recalcCols(){
  const w = (scene?.clientWidth)||window.innerWidth;
  COLS = w>=1600 ? 16 : w>=1280 ? 14 : w>=900 ? 12 : 10;
}
const BURY=0.5, SIDE_GAP_SLOTS=0.5, TOP_SAFE=90, EXTRA_TOP_ROWS=2, GROUND_RATIO=0.22, BASE_OFFSET=1;
const GROUND_FUDGE=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--ground-fudge'))||8;

/* DOM */
const scene=document.getElementById('scene');
const slots=document.getElementById('slots');
const placed=document.getElementById('placed');

/* OCC */
const occ=new Map();
const key=(x,y)=>`${x},${y}`;

/* geometry */
function slotSize(){
  const usable=COLS + SIDE_GAP_SLOTS*2;
  const w=Math.floor(scene.clientWidth/usable);
  const h=Math.round(w*3/7); // 7:3
  scene.style.setProperty('--slot-w',w+'px');
  scene.style.setProperty('--slot-h',h+'px');
  return {w,h};
}
function getMaxY(){ let m=0; for(const k of occ.keys()){ const gy=+k.split(',')[1]; if(gy>m) m=gy; } return m; }
function groundY(H,h){ return H - h*GROUND_RATIO; }
function ensureSceneHeight(){
  const {h}=slotSize();
  const needH=Math.ceil((TOP_SAFE + h*(1 - BURY + getMaxY() + EXTRA_TOP_ROWS)) / ((1-GROUND_RATIO)||0.78));
  scene.style.minHeight=Math.max(window.innerHeight,needH)+'px';
}
function cellToPx(x,y,w,h){
  const gy=groundY(scene.clientHeight||window.innerHeight,h);
  const baseTop=gy - h*(1-BURY) - h*BASE_OFFSET + GROUND_FUDGE;
  const totalW=(COLS + SIDE_GAP_SLOTS*2)*w;
  const left0=(scene.clientWidth-totalW)/2 + SIDE_GAP_SLOTS*w;
  return { left:left0 + x*w, top: baseTop - y*h };
}
function available(x,y){
  if(occ.has(key(x,y))) return false;
  return y===0 || occ.has(key(x,y-1));
}

/* render */
function positionPlaced(){
  const {w,h}=slotSize();
  Array.from(placed.children).forEach(el=>{
    const gx=+el.dataset.x, gy=+el.dataset.y;
    if(Number.isFinite(gx)&&Number.isFinite(gy)){
      const {left,top}=cellToPx(gx,gy,w,h);
      Object.assign(el.style,{left:left+'px',top:top+'px',width:w+'px',height:h+'px'});
    }
  });
}
function renderSlots(){
  slots.innerHTML='';
  const {w,h}=slotSize();
  for(let y=0;y<MAX_ROWS;y++){
    for(let x=0;x<COLS;x++){
      if(!available(x,y)) continue;
      const {left,top}=cellToPx(x,y,w,h);
      const s=document.createElement('div');
      s.className='slot';
      s.style.left=left+'px';
      s.style.top =top +'px';
      s.onclick=()=>openPicker(x,y);
      slots.appendChild(s);
    }
  }
  positionPlaced();
}

/* place/unstake */
function placeTile(x,y,tile){
  const {w,h}=slotSize();
  const {left,top}=cellToPx(x,y,w,h);

  const wrap=document.createElement('div');
  wrap.className='tile-wrap';
  Object.assign(wrap.style,{left:left+'px',top:top+'px',width:w+'px',height:h+'px'});
  wrap.dataset.x=x; wrap.dataset.y=y;

  // шар: базовий контейнер
  const baseImg = `<img class="tile-img" src="${tile.src}" alt="${tile.title}">`;
  // шар: оверлеї 7:3
  const overlays = `<div class="tile-overlays" data-token="${tile.id}"></div>`;
  // бейдж
  const badge = `<div class="tile-badge">${tile.number||tile.id}</div>`;

  wrap.innerHTML = baseImg + overlays + badge;
  wrap.onclick=()=>openInfo(tile,x,y,wrap);

  placed.appendChild(wrap);
  occ.set(key(x,y),{type:'tile',data:tile});

  renderSlots(); ensureSceneHeight(); renderSlots();
  requestAnimationFrame(()=>wrap.scrollIntoView({behavior:'smooth',block:'center'}));

  // відрендерити оверлеї, якщо були збережені раніше
  renderTileOverlays(tile.id, wrap.querySelector('.tile-overlays'));
}
function unstake(x,y,wrap){
  wrap.remove();
  occ.delete(key(x,y));
  renderSlots();
}

/* picker (контейнери, компактна плитка) */
const pickerModal=document.getElementById('pickerModal');
const pickerGrid =document.getElementById('pickerGrid');
let pickTarget=null;

function openPicker(x,y){
  pickTarget={x,y};
  pickerGrid.innerHTML='';
  tiles.forEach(t=>{
    const card=document.createElement('div');
    card.className='picker-card';
    card.innerHTML=`<img src="${t.src}" alt="${t.title}">
                    <div class="meta"><div>${t.title}</div><button>Place</button></div>`;
    card.querySelector('button').onclick=()=>{
      placeTile(pickTarget.x,pickTarget.y,t);
      closeModal(pickerModal);
    };
    pickerGrid.appendChild(card);
  });
  openModal(pickerModal);
}

/* -------------------- СЕКТОРИ ТА ДЕКОР -------------------- */
const SECTORS = ["s1","s2","s3","s4","s5","s6"]; // 2×3 (зліва направо, зверху вниз)
const ALLOWED = {
  s1: ["poster","neon","monitor"],
  s2: ["poster","neon","monitor"],
  s3: ["poster","neon","monitor"],
  s4: ["pet","small","box"],
  s5: ["sofa","rig","table","pet"],
  s6: ["rig","cabinet","box"]
};

// Повнорозмірні PNG 7:3 з прозорістю поза межами секторів
const ASSETS = {
  poster:  [{id:"poster-near", title:"Poster NEAR", src:"img/overlays/poster/poster_near.png"}],
  neon:    [{id:"neon-hodl",   title:"Neon HODL",   src:"img/overlays/neon/neon_hodl.png", neon:true}],
  monitor: [{id:"monitor",     title:"Monitor",     src:"img/overlays/monitor/monitor.png", monitor:true}],
  sofa:    [{id:"sofa-ledger", title:"Sofa Ledger", src:"img/overlays/sofa/sofa_ledger.png"}],
  rig:     [{id:"rig1",        title:"Rig x1",      src:"img/overlays/rig/rig1.png"}],
  pet:     [{id:"doge",        title:"Shiba Doge",  src:"img/overlays/pet/dog.png"}],
  table:   [{id:"table1",      title:"Table",       src:"img/overlays/table/table1.png"}],
  box:     [{id:"box1",        title:"Box",         src:"img/overlays/box/box1.png"}],
  cabinet: [{id:"cabinet1",    title:"Cabinet",     src:"img/overlays/cabinet/cabinet1.png"}],
  small:   [{id:"plant1",      title:"Plant",       src:"img/overlays/small/plant1.png"}],
};

const interiors = new Map(JSON.parse(localStorage.getItem('interiors_v2')||'[]')); // tokenId -> {s1:{...},...}
function persistInteriors(){ localStorage.setItem('interiors_v2', JSON.stringify([...interiors.entries()])); }

/* Інфо-модал (показує відразу наповнення) */
const infoModal   = document.getElementById('infoModal');
const infoBaseImg = document.getElementById('infoBaseImg');
const infoOverlays= document.getElementById('infoOverlays');
const infoTitle   = document.getElementById('infoTitle');
const infoOwner   = document.getElementById('infoOwner');
const infoToken   = document.getElementById('infoToken');
const infoCoords  = document.getElementById('infoCoords');
const infoNumber  = document.getElementById('infoNumber');
const sectorList  = document.getElementById('sectorList');
const sectorGrid  = document.getElementById('sectorGrid');
const btnUnstake  = document.getElementById('btnUnstake');
const btnClearAll = document.getElementById('btnClearAll');

let currentTile=null, currentWrap=null, currentXY=null;

function openInfo(tile,x,y,wrap){
  currentTile = tile; currentWrap = wrap; currentXY = {x,y};
  infoBaseImg.src = tile.src;
  infoTitle.textContent = tile.title;
  infoOwner.textContent = tile.owner;
  infoToken.textContent = tile.id;
  infoCoords.textContent= `${x},${y}`;
  infoNumber.textContent = tile.number || tile.id;

  // рендер оверлеїв у модалці
  renderInfoOverlays(tile.id);

  // сітка 2×3 для швидкого додавання
  sectorGrid.innerHTML = "";
  SECTORS.forEach((sid,i)=>{
    const b=document.createElement('button');
    b.title=`Додати/замінити в ${sid.toUpperCase()}`;
    b.onclick=()=>openSectorPicker(sid);
    sectorGrid.appendChild(b);
  });

  // список наповнення
  renderSectorList(tile.id);

  btnUnstake.onclick=()=>{ if(confirm('Unstake?')){ unstake(x,y,wrap); closeModal(infoModal); } };
  btnClearAll.onclick=()=>{
    interiors.set(tile.id, {});
    persistInteriors();
    renderInfoOverlays(tile.id);
    renderTileOverlays(tile.id, wrap.querySelector('.tile-overlays'));
    renderSectorList(tile.id);
  };

  openModal(infoModal);
}

function renderInfoOverlays(tokenId){
  infoOverlays.innerHTML="";
  const state = interiors.get(tokenId) || {};
  SECTORS.forEach(sid=>{
    const it = state[sid];
    if(!it) return;
    const img=document.createElement('img');
    img.src = it.src;
    if(it.neon)    img.classList.add('neon-glow');
    if(it.monitor) img.classList.add('monitor-fx');
    infoOverlays.appendChild(img);
  });
}

function renderTileOverlays(tokenId, container){
  if(!container) return;
  container.innerHTML="";
  const state = interiors.get(tokenId) || {};
  SECTORS.forEach(sid=>{
    const it = state[sid];
    if(!it) return;
    const img=document.createElement('img');
    img.src = it.src;
    if(it.neon)    img.classList.add('neon-glow');
    if(it.monitor) img.classList.add('monitor-fx');
    container.appendChild(img);
  });
}

function renderSectorList(tokenId){
  sectorList.innerHTML="";
  const state = interiors.get(tokenId) || {};
  SECTORS.forEach((sid,idx)=>{
    const li=document.createElement('li');
    li.className='sector-item';
    const label = `<b>${sid.toUpperCase()}</b>`;
    if(state[sid]){
      const t = state[sid];
      li.innerHTML = `${label} <span class="tag">${t.title}</span>
        <button data-act="remove" data-sid="${sid}">Remove</button>`;
    }else{
      li.innerHTML = `${label} <span class="tag">порожньо</span>
        <button data-act="add" data-sid="${sid}">+</button>`;
    }
    sectorList.appendChild(li);
  });

  // делегування дій
  sectorList.onclick = (e)=>{
    const btn=e.target.closest('button'); if(!btn) return;
    const sid=btn.dataset.sid;
    if(btn.dataset.act==="remove"){
      const state = interiors.get(currentTile.id) || {};
      delete state[sid];
      interiors.set(currentTile.id, state);
      persistInteriors();
      renderInfoOverlays(currentTile.id);
      renderTileOverlays(currentTile.id, currentWrap.querySelector('.tile-overlays'));
      renderSectorList(currentTile.id);
    }else if(btn.dataset.act==="add"){
      openSectorPicker(sid);
    }
  };
}

/* Попап вибору для конкретного сектора */
const sectorModal = document.getElementById('sectorModal');
const sectorGrid  = document.getElementById('sectorGrid');
const sectorTitle = document.getElementById('sectorTitle');
let activeSector  = null;

function openSectorPicker(sid){
  activeSector = sid;
  sectorTitle.textContent = sid.toUpperCase();
  sectorGrid.innerHTML = "";

  // зібрати всі дозволені категорії → карти предметів
  const cats = ALLOWED[sid] || [];
  const items = cats.flatMap(cat => (ASSETS[cat]||[]).map(x=>({...x, _cat:cat})));

  items.forEach(item=>{
    const card=document.createElement('div');
    card.className='picker-card';
    card.innerHTML=`<img src="${item.src}" alt="${item.title}">
                    <div class="meta">
                      <div>${item.title}</div>
                      <div style="display:flex;gap:6px">
                        <button data-act="place">Place</button>
                        <button data-act="remove" class="danger">Del</button>
                      </div>
                    </div>`;
    card.querySelector('[data-act="place"]').onclick=()=>{
      const state = interiors.get(currentTile.id) || {};
      state[sid] = { id:item.id, title:item.title, src:item.src, neon:!!item.neon, monitor:!!item.monitor };
      interiors.set(currentTile.id, state);
      persistInteriors();
      renderInfoOverlays(currentTile.id);
      renderTileOverlays(currentTile.id, currentWrap.querySelector('.tile-overlays'));
      renderSectorList(currentTile.id);
      closeModal(sectorModal);
    };
    card.querySelector('[data-act="remove"]').onclick=()=>{
      const state = interiors.get(currentTile.id) || {};
      delete state[sid];
      interiors.set(currentTile.id, state);
      persistInteriors();
      renderInfoOverlays(currentTile.id);
      renderTileOverlays(currentTile.id, currentWrap.querySelector('.tile-overlays'));
      renderSectorList(currentTile.id);
      closeModal(sectorModal);
    };
    sectorGrid.appendChild(card);
  });

  openModal(sectorModal);
}

/* -------------------- MODALS -------------------- */
function openModal(n){ n.setAttribute('aria-hidden','false'); }
function closeModal(n){ n.setAttribute('aria-hidden','true'); }
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',e=>closeModal(e.target.closest('.modal'))));
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{ if(e.target===m) closeModal(m); }));

/* -------------------- INIT -------------------- */
function renderAll(){ recalcCols(); renderSlots(); ensureSceneHeight(); renderSlots(); }
window.addEventListener('resize', ()=>{ renderAll(); });
document.addEventListener('DOMContentLoaded', renderAll);

/* -------------------- DEMО: баланси + фарм -------------------- */
const nearValue=document.getElementById('nearValue');
const nValue   =document.getElementById('nValue');
let near=0.011, nTok=0.11;
setInterval(()=>{ near+=0.001; nTok+=0.01; nearValue.textContent=near.toFixed(3); nValue.textContent=nTok.toFixed(2); },1500);

let farmPool=0, farmTarget=20;
const farmFill   =document.getElementById('farmFill');
const farmAmount =document.getElementById('farmAmount');
const btnClaim   =document.getElementById('btnClaim');
setInterval(()=>{
  farmPool+=0.04;
  const pct=Math.min(100, Math.round((farmPool/farmTarget)*100));
  farmFill.style.width=pct+'%';
  farmAmount.textContent=farmPool.toFixed(2)+' N';
  btnClaim.disabled=pct<100;
},1000);
btnClaim.onclick=()=>{ if(farmPool>=farmTarget){ alert(`Claimed ${farmTarget} N`); farmPool-=farmTarget; } };
