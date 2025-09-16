/* ===================== CONFIG ===================== */
const CURRENT_ACCOUNT = 'demo.near';      // заміниш на реальний акаунт
const SHOW_SCENE_PREVIEW = false;         // прев’ю декору поверх закритого контейнера

/* ===================== DEMO NFT ===================== */
const tiles = [
  { id:"cont-blue",   title:"Blue Container",   owner:"demo.near", src:"img/container_blue.png",   number:"#0001", rarity:"Common" },
  { id:"cont-brown",  title:"Brown Container",  owner:"demo.near", src:"img/container_brown.png",  number:"#0002", rarity:"Uncommon" },
  { id:"cont-gold",   title:"Gold Container",   owner:"demo.near", src:"img/container_gold.png",   number:"#0003", rarity:"Epic" },
  { id:"cont-gray",   title:"Gray Container",   owner:"demo.near", src:"img/container_gray.png",   number:"#0004", rarity:"Common" },
  { id:"cont-orange", title:"Orange Container", owner:"demo.near", src:"img/container_orange.png", number:"#0005", rarity:"Rare" },
  { id:"cont-violet", title:"Violet Container", owner:"demo.near", src:"img/container_violet.png", number:"#0006", rarity:"Rare" }
];

/* ===================== GRID (7 колонок, 7:3) ===================== */
let COLS = 7;
const MAX_ROWS = 60;

const BURY=0.5, SIDE_GAP_SLOTS=0.5, TOP_SAFE=90, EXTRA_TOP_ROWS=2, GROUND_RATIO=0.28, BASE_OFFSET=1;
const GROUND_FUDGE=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--ground-fudge'))||8;

/* DOM */
const scene  = document.getElementById('scene');
const slots  = document.getElementById('slots');
const placed = document.getElementById('placed');

/* OCC */
const occ=new Map();
const key=(x,y)=>`${x},${y}`;

/* geometry */
function slotSize(){
  const usable = COLS + SIDE_GAP_SLOTS*2;
  const sceneW = (scene && scene.clientWidth) || window.innerWidth;
  const w = Math.floor(sceneW/usable);
  const h = Math.round(w*3/7);
  if (scene){
    scene.style.setProperty('--slot-w', w+'px');
    scene.style.setProperty('--slot-h', h+'px');
  }
  return {w,h};
}
function getMaxY(){ let m=0; for(const k of occ.keys()){ const gy=+k.split(',')[1]; if(gy>m) m=gy; } return m; }
function groundY(H,h){ return H - h*GROUND_RATIO; }
function ensureSceneHeight(){
  if(!scene) return;
  const {h}=slotSize();
  const needH=Math.ceil((TOP_SAFE + h*(1 - BURY + getMaxY() + EXTRA_TOP_ROWS)) / ((1-GROUND_RATIO)||0.78));
  scene.style.minHeight=Math.max(window.innerHeight,needH)+'px';
}
function cellToPx(x,y,w,h){
  const H = (scene && scene.clientHeight) || window.innerHeight;
  const gy=groundY(H,h);
  const baseTop=gy - h*(1-BURY) - h*BASE_OFFSET + GROUND_FUDGE;
  const sceneW = (scene && scene.clientWidth) || window.innerWidth;
  const totalW=(COLS + SIDE_GAP_SLOTS*2)*w;
  const left0=(sceneW-totalW)/2 + SIDE_GAP_SLOTS*w;
  return { left:left0 + x*w, top: baseTop - y*h };
}
function available(x,y){
  if(occ.has(key(x,y))) return false;
  return y===0 || occ.has(key(x,y-1));
}

/* render */
function positionPlaced(){
  if(!placed) return;
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
  if(!slots) return;
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
      s.style.width=w+'px';
      s.style.height=h+'px';
      s.onclick=()=>openPicker(x,y);
      slots.appendChild(s);
    }
  }
}

/* place/unstake */
function placeTile(x,y,tile){
  const {w,h}=slotSize();
  const {left,top}=cellToPx(x,y,w,h);

  const wrap=document.createElement('div');
  wrap.className='tile-wrap';
  Object.assign(wrap.style,{left:left+'px',top:top+'px',width:w+'px',height:h+'px'});
  wrap.dataset.x=x; wrap.dataset.y=y;

  wrap.innerHTML = `
    <img class="tile-img" src="${tile.src}" alt="${tile.title}">
    <div class="tile-overlays" data-token="${tile.id}"></div>
    <div class="tile-badge">${tile.number||tile.id}</div>
  `;

  wrap.addEventListener('click', (e)=>{
    e.stopPropagation();              // не проклікуємо «плюс» під контейнером
    openInterior(tile, x, y);
  });

  placed.appendChild(wrap);
  occ.set(key(x,y),{type:'tile',data:tile});

  renderAll();
  renderTileOverlays(tile.id, wrap.querySelector('.tile-overlays'));
}
function unstake(x,y,wrap){
  wrap.remove();
  occ.delete(key(x,y));
  renderAll();
}

/* ===================== Picker контейнерів ===================== */
const pickerModal=document.getElementById('pickerModal');
const pickerGrid =document.getElementById('pickerGrid');
let pickTarget=null;

function openPicker(x,y){
  if(!pickerGrid || !pickerModal) return;
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

/* ===================== Інтер’єр (6 секторів) ===================== */
const roomBg        = document.getElementById('interiorBg');  // id у розмітці
const roomOverlays  = document.getElementById('roomOverlays');
const hotspotsEl    = document.getElementById('hotspots');

const intTitle      = document.getElementById('intTitle');
const intOwner      = document.getElementById('intOwner');
const intToken      = document.getElementById('intToken');
const intCoords     = document.getElementById('intCoords');

const btnClearSector= document.getElementById('btnClearSector');
const btnClearAll   = document.getElementById('btnClearAll');
const btnCloseInt   = document.getElementById('btnCloseInterior');

let currentTokenId = null;
let currentSector  = null;
let interiorEditable = false;

/* сектор → категорія */
const SECTOR_CATEGORIES = {
  s1:'poster', s2:'neon', s3:'monitor',
  s4:'pet',    s5:'sofa', s6:'rig'
};

/* каталог активів (thumb 1:1 у меню, src — повний 7:3 у сам контейнер) */
const ASSETS = {
  poster:  [{ id:'poster-near',     title:'Poster NEAR',     src:'img/decor/poster near.png',     thumb:'img/icons/poster_near.png' }],
  neon:    [{ id:'neon-hodl',       title:'Neon HODL',       src:'img/decor/neon hodl.png',       thumb:'img/icons/neon_hodl.png', neon:true }],
  monitor: [{ id:'monitor',         title:'Wall Monitor',    src:'img/decor/monitor.png',         thumb:'img/icons/monitor.png',   monitor:true }],
  pet:     [{ id:'dog',             title:'Shiba Doge',      src:'img/decor/dog.png',             thumb:'img/icons/dog.png' }],
  sofa:    [{ id:'hot-sofa-ledger', title:'Hot Wallet Sofa', src:'img/decor/hot sofa ledger.png', thumb:'img/icons/sofa.png' }],
  rig:     [{ id:'rig1',            title:'Rig x1',          src:'img/decor/rig1.png',            thumb:'img/icons/rig1.png' }],
};


/* state у localStorage */
function loadInteriors(){
  const raw = localStorage.getItem('interiors_v4');
  return raw ? new Map(JSON.parse(raw)) : new Map();
}
function saveInteriors(map){
  localStorage.setItem('interiors_v4', JSON.stringify([...map.entries()]));
}

function openInterior(tile, x, y){
  currentTokenId = tile.id;
  currentSector  = null;

  // редагувати може тільки власник
  interiorEditable = (tile.owner === CURRENT_ACCOUNT);

  // мета-дані
  if (intTitle)  intTitle.textContent  = tile.title ?? '';
  if (intOwner)  intOwner.textContent  = tile.owner ?? '';
  if (intToken)  intToken.textContent  = tile.id ?? '';
  if (intCoords) intCoords.textContent = `${x},${y}`;

  // фон інтер’єру (за потреби підмінюй за кольором контейнера)
  if (roomBg) roomBg.src = 'img/decor/container_orange_in.png';

  // доступність елементів
  if (btnClearSector) btnClearSector.disabled = !interiorEditable;
  if (btnClearAll)    btnClearAll.disabled    = !interiorEditable;
  if (hotspotsEl)     hotspotsEl.style.pointerEvents = interiorEditable ? 'auto' : 'none';

  const modal = document.getElementById('interiorModal');
  const hint  = modal?.querySelector('.small');
  if (hint) hint.textContent = interiorEditable
    ? 'Клік по вже розміщеному предмету — прибирає його.'
    : 'Перегляд (без змін).';

  renderInteriorOverlays();
  openModal(modal);
}

function renderInteriorOverlays(){
  if(!roomOverlays) return;
  const interiors = loadInteriors();
  const state = interiors.get(currentTokenId) || {};
  roomOverlays.innerHTML = '';

  // предмети (повний 7:3 шар)
  Object.keys(SECTOR_CATEGORIES).forEach(sid=>{
    const it = state[sid];
    if(!it) return;
    const img=document.createElement('img');
    img.src = it.src;
    if(it.neon)    img.classList.add('neon-glow');
    if(it.monitor) img.classList.add('monitor-fx');

    if (interiorEditable) {
      img.title='Клік — прибрати';
      img.style.cursor='pointer';
      img.onclick=()=>{ 
        delete state[sid];
        const m=loadInteriors(); m.set(currentTokenId,state); saveInteriors(m);
        renderInteriorOverlays(); 
      };
    }
    roomOverlays.appendChild(img);
  });
function deriveThumb(src){
  try {
    const file = src.split('/').pop().replace(/\s+/g, '_'); // "neon hodl.png" -> "neon_hodl.png"
    return 'img/icons/' + file;
  } catch { 
    return src;
  }
}

  // хот-споти «+»: приховуємо зайняті/чужі БЕЗ зсуву
  if (hotspotsEl) {
    hotspotsEl.innerHTML = '';
    ['s1','s2','s3','s4','s5','s6'].forEach(sid=>{
      const b=document.createElement('button');
      b.className='hotspot';
      b.textContent='+';
      b.dataset.sector=sid;

      const hidden = (!interiorEditable || state[sid]);
      b.style.visibility    = hidden ? 'hidden' : 'visible';
      b.style.pointerEvents = hidden ? 'none'   : 'auto';
      b.style.opacity       = hidden ? '0'      : '1';

      if (!hidden) {
        b.onclick=()=>{
          currentSector = sid;
          if (btnClearSector) btnClearSector.disabled = false;
          openSectorPicker(SECTOR_CATEGORIES[currentSector]);
        };
      }
      hotspotsEl.appendChild(b);
    });
  }

  if (!interiorEditable && btnClearSector) btnClearSector.disabled = true;

  // оновити прев’ю на сцені (якщо ввімкнено)
  const wrap = [...document.querySelectorAll('.tile-overlays[data-token]')]
    .find(d => d.getAttribute('data-token') === currentTokenId);
  renderTileOverlays(currentTokenId, wrap);
}

/* міні-пікер сектору (іконки 1:1) */
const sectorPicker = document.getElementById('sectorPicker');
const sectorTitle  = document.getElementById('sectorTitle');
const sectorGrid   = document.getElementById('sectorGrid');

function openSectorPicker(cat){
  if (!interiorEditable || !sectorGrid || !sectorPicker) return;
  if (sectorTitle) sectorTitle.textContent = 'Вибір: ' + cat;
  sectorGrid.innerHTML='';

  (ASSETS[cat]||[]).forEach(item=>{
    const thumbUrl = item.thumb || deriveThumb(item.src);

    const card=document.createElement('div');
    card.className='picker-card';
    card.innerHTML=`
      <div class="thumb" style="width:100%;aspect-ratio:1/1;display:grid;place-items:center;background:#0c1014;border-bottom:1px solid rgba(255,255,255,.08)">
        <img alt="${item.title}" style="max-width:80%;max-height:80%;object-fit:contain;display:block">
      </div>
      <div class="meta"><div>${item.title}</div><button>Place</button></div>`;

    const imgEl = card.querySelector('img');
    imgEl.src = thumbUrl;
    imgEl.onerror = () => { imgEl.src = item.src; }; // якщо іконка відсутня — підставимо повний оверлей

    card.querySelector('button').onclick=()=>{
      const m = loadInteriors();
      const s = m.get(currentTokenId) || {};
      s[currentSector] = {id:item.id,title:item.title,src:item.src,neon:!!item.neon,monitor:!!item.monitor};
      m.set(currentTokenId, s); saveInteriors(m);
      renderInteriorOverlays();
      closeModal(sectorPicker);
    };
    sectorGrid.appendChild(card);
  });

  openModal(sectorPicker);
}
    

/* прев’ю на сцені */
function renderTileOverlays(tokenId, container){
  if(!container || !SHOW_SCENE_PREVIEW) return;
  const map = loadInteriors();
  const state = map.get(tokenId) || {};
  container.innerHTML="";
  Object.values(state).forEach(it=>{
    const img=document.createElement('img');
    img.src = it.src;
    if(it.neon)    img.classList.add('neon-glow');
    if(it.monitor) img.classList.add('monitor-fx');
    container.appendChild(img);
  });
}

/* кнопки інтер’єру */
if (btnClearSector) btnClearSector.onclick=()=>{
  if(!interiorEditable || !currentSector) return;
  const m = loadInteriors();
  const s = m.get(currentTokenId) || {};
  delete s[currentSector];
  m.set(currentTokenId, s); saveInteriors(m);
  renderInteriorOverlays();
  btnClearSector.disabled = true;
};
if (btnClearAll) btnClearAll.onclick=()=>{
  if(!interiorEditable) return;
  const m = loadInteriors();
  m.delete(currentTokenId); saveInteriors(m);
  renderInteriorOverlays();
};
if (btnCloseInt) btnCloseInt.onclick=()=>{
  const interiorModal = document.getElementById('interiorModal');
  closeModal(interiorModal);
};

/* ===================== MODALS ===================== */
function openModal(n){
  if (!n) return;
  n.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
}
function closeModal(n){
  if (!n) return;
  n.setAttribute('aria-hidden','true');
  const anyOpen = [...document.querySelectorAll('.modal')].some(m => m.getAttribute('aria-hidden')==='false');
  if(!anyOpen) document.body.classList.remove('modal-open');
}
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',e=>closeModal(e.target.closest('.modal'))));
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{ if(e.target===m) closeModal(m); }));

/* ===================== INIT ===================== */
function renderAll(){
  ensureSceneHeight();
  renderSlots();
  positionPlaced();
}
window.addEventListener('resize', renderAll);
document.addEventListener('DOMContentLoaded', ()=>{
  renderAll();
  requestAnimationFrame(renderAll);
});

/* ===================== DEMО: Баланси + Фарм ===================== */
const nearValue=document.getElementById('nearValue');
const nValue   =document.getElementById('nValue');
let near=0.011, nTok=0.11;
setInterval(()=>{ if(nearValue){near+=0.001; nearValue.textContent=near.toFixed(3);} if(nValue){nTok+=0.01; nValue.textContent=nTok.toFixed(2);} },1500);

let farmPool=0, farmTarget=20;
const farmFill   = document.getElementById('farmFill');
const farmAmount = document.getElementById('farmAmount');
const btnClaim   = document.getElementById('btnClaim');
setInterval(()=>{
  farmPool+=0.04;
  const pct=Math.min(100, Math.round((farmPool/farmTarget)*100));
  if (farmFill)   farmFill.style.width=pct+'%';
  if (farmAmount) farmAmount.textContent=farmPool.toFixed(2)+' N';
  if (btnClaim)   btnClaim.disabled=pct<100;
},1000);
if (btnClaim) btnClaim.onclick=()=>{ if(farmPool>=farmTarget){ alert(`Claimed ${farmTarget} N`); farmPool-=farmTarget; } };

/* зручна утиліта у консолі */
window.setCols = n => { COLS = Math.max(3, Math.min(12, Math.floor(n))); renderAll(); };
