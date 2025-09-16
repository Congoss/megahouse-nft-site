/* --- Демонстраційні контейнери --- */
const tiles = [
  { id:"cont-blue",   title:"Blue Container",   owner:"demo.near", src:"img/container_blue.png",   number:"#0001", rarity:"Common" },
  { id:"cont-brown",  title:"Brown Container",  owner:"demo.near", src:"img/container_brown.png",  number:"#0002", rarity:"Uncommon" },
  { id:"cont-gold",   title:"Gold Container",   owner:"demo.near", src:"img/container_gold.png",   number:"#0003", rarity:"Epic" },
  { id:"cont-gray",   title:"Gray Container",   owner:"demo.near", src:"img/container_gray.png",   number:"#0004", rarity:"Common" },
  { id:"cont-orange", title:"Orange Container", owner:"demo.near", src:"img/container_orange.png", number:"#0005", rarity:"Rare" },
  { id:"cont-violet", title:"Violet Container", owner:"demo.near", src:"img/container_violet.png", number:"#0006", rarity:"Rare" }
];

/* --- Сцена --- */
let COLS=10, MAX_ROWS=60;
const scene=document.getElementById('scene');
const slots=document.getElementById('slots');
const placed=document.getElementById('placed');

const occ=new Map();
const key=(x,y)=>`${x},${y}`;

function slotSize(){
  const usable=COLS+1;
  const w=Math.floor(scene.clientWidth/usable);
  const h=Math.round(w*3/7);
  scene.style.setProperty('--slot-w',w+'px');
  scene.style.setProperty('--slot-h',h+'px');
  return {w,h};
}
function getMaxY(){ let m=0; for(const k of occ.keys()){ const gy=+k.split(',')[1]; if(gy>m)m=gy; } return m; }
function groundY(H,h){ return H - h*0.3; }
function ensureSceneHeight(){
  const {h}=slotSize();
  const needH=Math.ceil((90 + h*(1 - 0.5 + getMaxY() + 2)) / 0.7);
  scene.style.minHeight=Math.max(window.innerHeight,needH)+'px';
}
function cellToPx(x,y,w,h){
  const gy=groundY(scene.clientHeight,h);
  const baseTop=gy - h*(1-0.5) - h*1 + 8;
  const totalW=(COLS+1*2)*w;
  const left0=(scene.clientWidth-totalW)/2 + 1*w;
  return {left:left0+x*w,top:baseTop-y*h};
}
function available(x,y){
  if(occ.has(key(x,y))) return false;
  return y===0 || occ.has(key(x,y-1));
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
      Object.assign(s.style,{left:left+'px',top:top+'px',width:w+'px',height:h+'px'});
      s.onclick=()=>openPicker(x,y);
      slots.appendChild(s);
    }
  }
}
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

/* --- Place / Unstake --- */
function placeTile(x,y,tile){
  const {w,h}=slotSize();
  const {left,top}=cellToPx(x,y,w,h);
  const wrap=document.createElement('div');
  wrap.className='tile-wrap';
  Object.assign(wrap.style,{left:left+'px',top:top+'px',width:w+'px',height:h+'px'});
  wrap.dataset.x=x; wrap.dataset.y=y;
  wrap.innerHTML=`<img class="tile-img" src="${tile.src}" alt="${tile.title}"><div class="tile-badge">${tile.number||tile.id}</div>`;
  wrap.onclick=()=>openInterior(tile,true);
  placed.appendChild(wrap);
  occ.set(key(x,y),{type:'tile',data:tile});
  renderAll();
}
function unstake(x,y,wrap){
  wrap.remove(); occ.delete(key(x,y)); renderAll();
}

/* --- Picker контейнерів --- */
const pickerModal=document.getElementById('pickerModal');
const pickerGrid=document.getElementById('pickerGrid');
function openPicker(x,y){
  pickerGrid.innerHTML='';
  tiles.forEach(t=>{
    const card=document.createElement('div');
    card.className='picker-card';
    card.innerHTML=`<img src="${t.src}" alt="${t.title}"><div class="meta"><div>${t.title}</div><button>Place</button></div>`;
    card.querySelector('button').onclick=()=>{placeTile(x,y,t);closeModal(pickerModal);};
    pickerGrid.appendChild(card);
  });
  openModal(pickerModal);
}

/* --- Interior --- */
const interiorModal=document.getElementById('interiorModal');
const roomOverlays=document.getElementById('roomOverlays');
const hotspots=document.getElementById('hotspots');
const btnClearSector=document.getElementById('btnClearSector');
const btnClearAll=document.getElementById('btnClearAll');
const btnCloseInterior=document.getElementById('btnCloseInterior');
let currentTile=null, currentSector=null, interiorEditable=false;
const interiors=new Map(JSON.parse(localStorage.getItem('interiors')||'[]'));
const SECTORS=["s1","s2","s3","s4","s5","s6"];

function openInterior(tile,editable){
  currentTile=tile; interiorEditable=editable;
  renderInteriorOverlays();
  openModal(interiorModal);
}
function renderInteriorOverlays(){
  roomOverlays.innerHTML=''; hotspots.innerHTML='';
  const state=interiors.get(currentTile.id)||{};
  SECTORS.forEach((sid,i)=>{
    const it=state[sid];
    if(it){
      const img=document.createElement('img');
      img.src=it.src; roomOverlays.appendChild(img);
      if(interiorEditable){
        img.onclick=()=>{delete state[sid];interiors.set(currentTile.id,state);persist();renderInteriorOverlays();};
      }
    }
    const h=document.createElement('button');
    h.className='hotspot'; h.textContent='+';
    h.dataset.sector=sid;
        if(!interiorEditable || state[sid]) {
      h.classList.add('hidden');
    }
    if(interiorEditable && !state[sid]){
      h.onclick=()=>{ currentSector=sid; openSectorPicker(sid); };
    }
    hotspots.appendChild(h);
  });

  // кнопки
  btnClearSector.onclick=()=>{
    if(currentSector){
      const st=interiors.get(currentTile.id)||{};
      delete st[currentSector]; interiors.set(currentTile.id,st); persist();
      renderInteriorOverlays();
    }
  };
  btnClearAll.onclick=()=>{
    interiors.set(currentTile.id,{}); persist(); renderInteriorOverlays();
  };
  btnCloseInterior.onclick=()=>closeModal(interiorModal);
}
function persist(){ localStorage.setItem('interiors',JSON.stringify([...interiors])); }

/* --- Каталог декору з thumb --- */
const ASSETS={
  poster:[{id:'poster-near',title:'Poster NEAR',src:'img/decor/poster near.png',thumb:'img/icons/poster_near.png'}],
  neon:[{id:'neon-hodl',title:'Neon HODL',src:'img/decor/neon hodl.png',thumb:'img/icons/neon_hodl.png',neon:true}],
  monitor:[{id:'monitor',title:'Wall Monitor',src:'img/decor/monitor.png',thumb:'img/icons/monitor.png',monitor:true}],
  pet:[{id:'dog',title:'Shiba Doge',src:'img/decor/dog.png',thumb:'img/icons/dog.png'}],
  sofa:[{id:'hot-sofa-ledger',title:'Hot Wallet Sofa',src:'img/decor/hot sofa ledger.png',thumb:'img/icons/sofa.png'}],
  rig:[{id:'rig1',title:'Rig x1',src:'img/decor/rig1.png',thumb:'img/icons/rig1.png'}],
};

/* --- Міні-пікер сектору --- */
const sectorPicker=document.getElementById('sectorPicker');
const sectorTitle=document.getElementById('sectorPickerTitle');
const sectorGrid=document.getElementById('sectorGrid');

function openSectorPicker(cat){
  if(!interiorEditable) return;
  sectorTitle.textContent='Вибір: '+cat;
  sectorGrid.innerHTML='';
  (ASSETS[cat]||[]).forEach(item=>{
    const card=document.createElement('div');
    card.className='picker-card';
    card.innerHTML=`
      <div class="thumb"><img src="${item.thumb||item.src}" alt="${item.title}"></div>
      <div class="meta"><div>${item.title}</div><button>Place</button></div>`;
    card.querySelector('button').onclick=()=>{
      const state=interiors.get(currentTile.id)||{};
      state[currentSector]={id:item.id,title:item.title,src:item.src,neon:!!item.neon,monitor:!!item.monitor};
      interiors.set(currentTile.id,state); persist(); renderInteriorOverlays(); closeModal(sectorPicker);
    };
    sectorGrid.appendChild(card);
  });
  openModal(sectorPicker);
}

/* --- Модалки --- */
function openModal(m){ m.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open'); }
function closeModal(m){ m.setAttribute('aria-hidden','true'); const any=[...document.querySelectorAll('.modal')].some(x=>x.getAttribute('aria-hidden')==='false'); if(!any) document.body.classList.remove('modal-open'); }
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.closest('.modal')));

/* --- Init --- */
function renderAll(){ ensureSceneHeight(); renderSlots(); positionPlaced(); }
window.addEventListener('resize',renderAll);
document.addEventListener('DOMContentLoaded',()=>{ renderAll(); requestAnimationFrame(renderAll); });

/* --- Демо Farm + Баланси --- */
let near=0.01,nTok=0.1,farmPool=0,farmTarget=20;
const nearValue=document.getElementById('nearValue');
const nValue=document.getElementById('nValue');
const farmFill=document.getElementById('farmFill');
const farmAmount=document.getElementById('farmAmount');
const btnClaim=document.getElementById('btnClaim');
setInterval(()=>{ near+=0.001;nTok+=0.01;nearValue.textContent=near.toFixed(3);nValue.textContent=nTok.toFixed(2);},1500);
setInterval(()=>{
  farmPool+=0.04;
  const pct=Math.min(100,Math.round((farmPool/farmTarget)*100));
  farmFill.style.width=pct+'%'; farmAmount.textContent=farmPool.toFixed(2)+' N'; btnClaim.disabled=pct<100;
},1000);
btnClaim.onclick=()=>{ if(farmPool>=farmTarget){ alert(`Claimed ${farmTarget} N`); farmPool-=farmTarget; } };
