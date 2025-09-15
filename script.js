/* -------------------- DEMO NFT -------------------- */
const tiles = [
  { id:"cont-blue",   title:"Blue Container",   owner:"demo.near", src:"img/container_blue.png",   number:"#0001", rarity:"Common" },
  { id:"cont-brown",  title:"Brown Container",  owner:"demo.near", src:"img/container_brown.png",  number:"#0002", rarity:"Uncommon" },
  { id:"cont-gold",   title:"Gold Container",   owner:"demo.near", src:"img/container_gold.png",   number:"#0003", rarity:"Epic" },
  { id:"cont-gray",   title:"Gray Container",   owner:"demo.near", src:"img/container_gray.png",   number:"#0004", rarity:"Common" },
  { id:"cont-orange", title:"Orange Container", owner:"demo.near", src:"img/container_orange.png", number:"#0005", rarity:"Rare" },
  { id:"cont-violet", title:"Violet Container", owner:"demo.near", src:"img/container_violet.png", number:"#0006", rarity:"Rare" }
];

/* -------------------- GRID (7 колонок) -------------------- */
let COLS = 7, MAX_ROWS = 60;                 // рівно 7 у ряд
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
  const sceneW = scene.clientWidth || window.innerWidth;
  const w = Math.floor(sceneW/usable);
  const h = Math.round(w*3/7);     // пропорція 7:3
  scene.style.setProperty('--slot-w', w+'px');
  scene.style.setProperty('--slot-h', h+'px');
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

  // клік по ВЕСЬОМУ контейнеру
  wrap.addEventListener('click', ()=>openInfo(tile,x,y,wrap));

  placed.appendChild(wrap);
  occ.set(key(x,y),{type:'tile',data:tile});

  renderAll();

  // якщо є оверлеї — намалюємо
  renderTileOverlays(tile.id, wrap.querySelector('.tile-overlays'));
}
function unstake(x,y,wrap){
  wrap.remove();
  occ.delete(key(x,y));
  renderAll();
}

/* picker (контейнери плиткою) */
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

/* -------------------- INFO -------------------- */
const infoModal  = document.getElementById('infoModal');
const infoImg    = document.getElementById('infoImg');
const infoOver   = document.getElementById('infoOverlays');
const infoTitle  = document.getElementById('infoTitle');
const infoOwner  = document.getElementById('infoOwner');
const infoToken  = document.getElementById('infoToken');
const infoCoords = document.getElementById('infoCoords');
const infoRarity = document.getElementById('infoRarity');
const infoNumber = document.getElementById('infoNumber');
const btnUnstake = document.getElementById('btnUnstake');
const btnDecorate= document.getElementById('btnDecorate');
const btnClear   = document.getElementById('btnClear');

function openInfo(tile,x,y,wrap){
  infoImg.src = tile.src;
  infoTitle.textContent = tile.title;
  infoOwner.textContent = tile.owner;
  infoToken.textContent = tile.id;
  infoCoords.textContent= `${x},${y}`;
  infoRarity.textContent= tile.rarity||'Common';
  infoNumber.textContent= tile.number||tile.id;

  if(infoOver){ infoOver.innerHTML=''; renderTileOverlays(tile.id, infoOver); }

  btnUnstake.onclick=()=>{
    if(confirm('Unstake?')){ unstake(x,y,wrap); closeModal(infoModal); }
  };
  btnDecorate.onclick=()=>alert('Decorate: відкриємо інтер’єр у наступному кроці 😉');
  btnClear.onclick=()=>{
    const map=new Map(JSON.parse(localStorage.getItem('interiors_v2')||'[]'));
    map.delete(tile.id);
    localStorage.setItem('interiors_v2', JSON.stringify([...map.entries()]));
    if(infoOver) infoOver.innerHTML='';
  };

  openModal(infoModal);
}

/* -------------------- Оверлеї (для інтер’єру) -------------------- */
function renderTileOverlays(tokenId, container){
  if(!container) return;
  const interiors = new Map(JSON.parse(localStorage.getItem('interiors_v2')||'[]'));
  const SECTORS   = ["s1","s2","s3","s4","s5","s6"];
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

/* -------------------- MODALS -------------------- */
function openModal(n){
  n.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
}
function closeModal(n){
  n.setAttribute('aria-hidden','true');
  const anyOpen = [...document.querySelectorAll('.modal')].some(m => m.getAttribute('aria-hidden')==='false');
  if(!anyOpen) document.body.classList.remove('modal-open');
}
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',e=>closeModal(e.target.closest('.modal'))));
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{ if(e.target===m) closeModal(m); }));

/* -------------------- INIT -------------------- */
function renderAll(){
  ensureSceneHeight();
  renderSlots();
  positionPlaced();
}
window.addEventListener('resize', renderAll);
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

/* утиліта для ручної зміни колонок у DevTools (за бажання) */
window.setCols = n => { COLS = Math.max(3, Math.min(12, Math.floor(n))); renderAll(); };
