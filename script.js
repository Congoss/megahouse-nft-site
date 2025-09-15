/* ----- DEMO NFT tiles ----- */
const tiles = [
  { id:"cont-blue",   title:"Blue Container",   owner:"demo.near", src:"img/container_blue.png",   number:"#0001", rarity:"Common" },
  { id:"cont-brown",  title:"Brown Container",  owner:"demo.near", src:"img/container_brown.png",  number:"#0002", rarity:"Uncommon" },
  { id:"cont-gold",   title:"Gold Container",   owner:"demo.near", src:"img/container_gold.png",   number:"#0003", rarity:"Epic" },
  { id:"cont-gray",   title:"Gray Container",   owner:"demo.near", src:"img/container_gray.png",   number:"#0004", rarity:"Common" },
  { id:"cont-orange", title:"Orange Container", owner:"demo.near", src:"img/container_orange.png", number:"#0005", rarity:"Rare" },
  { id:"cont-violet", title:"Violet Container", owner:"demo.near", src:"img/container_violet.png", number:"#0006", rarity:"Rare" }
];

/* ----- GRID ----- */
let COLS=10, MAX_ROWS=60;
const BURY=0.5, SIDE_GAP_SLOTS=0.5, TOP_SAFE=90, EXTRA_TOP_ROWS=2, GROUND_RATIO=0.22, BASE_OFFSET=1;
const GROUND_FUDGE=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--ground-fudge'))||8;

const scene=document.getElementById('scene'), slots=document.getElementById('slots'), placed=document.getElementById('placed');
const occ=new Map(); const key=(x,y)=>`${x},${y}`;

function slotSize(){ const usable=COLS+SIDE_GAP_SLOTS*2; const w=Math.floor(scene.clientWidth/usable); const h=Math.round(w*3/7); scene.style.setProperty('--slot-w',w+'px'); scene.style.setProperty('--slot-h',h+'px'); return {w,h}; }
function getMaxY(){ let m=0; for(const k of occ.keys()){ const gy=+k.split(',')[1]; if(gy>m)m=gy; } return m; }
function groundY(H,h){ return H - h*GROUND_RATIO; }
function ensureSceneHeight(){ const {h}=slotSize(); const denom=(1-GROUND_RATIO)||0.78; const needH=Math.ceil((TOP_SAFE + h*(1 - BURY + getMaxY() + EXTRA_TOP_ROWS))/denom); const newH=Math.max(window.innerHeight, needH); scene.style.minHeight=newH+'px'; }
function cellToPx(x,y,w,h){ const gy=groundY(scene.clientHeight,h); const baseTop=gy - h*(1-BURY) - h*BASE_OFFSET + GROUND_FUDGE; const totalW=(COLS + SIDE_GAP_SLOTS*2)*w; const left0=(scene.clientWidth-totalW)/2 + SIDE_GAP_SLOTS*w; return { left:left0 + x*w, top: baseTop - y*h }; }
function available(x,y){ if(occ.has(key(x,y))) return false; return y===0 || occ.has(key(x,y-1)); }

function positionPlaced(){ const {w,h}=slotSize(); Array.from(placed.children).forEach(el=>{ const gx=+el.dataset.x, gy=+el.dataset.y; if(Number.isFinite(gx)&&Number.isFinite(gy)){ const {left,top}=cellToPx(gx,gy,w,h); el.style.left=left+'px'; el.style.top=top+'px'; el.style.width=w+'px'; el.style.height=h+'px'; } }); }
function renderSlots(){ slots.innerHTML=''; const {w,h}=slotSize(); for(let y=0;y<MAX_ROWS;y++){ for(let x=0;x<COLS;x++){ if(!available(x,y)) continue; const {left,top}=cellToPx(x,y,w,h); const s=document.createElement('div'); s.className='slot'; s.style.left=left+'px'; s.style.top=top+'px'; s.onclick=()=>openPicker(x,y); slots.appendChild(s);} } positionPlaced(); }

/* place/unstake */
function placeTile(x,y,tile){
  const {w,h}=slotSize(); const {left,top}=cellToPx(x,y,w,h);
  const wrap=document.createElement('div'); wrap.className='tile-wrap';
  Object.assign(wrap.style,{left:left+'px',top:top+'px',width:w+'px',height:h+'px'});
  wrap.dataset.x=x; wrap.dataset.y=y;
  wrap.innerHTML=`<img class="tile-img" src="${tile.src}" alt="${tile.title}"><div class="tile-badge">${tile.number||tile.id}</div>`;
  wrap.onclick=()=>openInfo(tile,x,y,wrap);
  placed.appendChild(wrap); occ.set(key(x,y),{type:'tile',data:tile});
  renderSlots(); ensureSceneHeight(); renderSlots(); requestAnimationFrame(()=>wrap.scrollIntoView({behavior:'smooth',block:'center'}));
}
function unstake(x,y,wrap){ wrap.remove(); occ.delete(key(x,y)); renderSlots(); }

/* picker */
const pickerModal=document.getElementById('pickerModal'); const pickerGrid=document.getElementById('pickerGrid'); let pickTarget=null;
function openPicker(x,y){ pickTarget={x,y}; pickerGrid.innerHTML=''; tiles.forEach(t=>{ const card=document.createElement('div'); card.className='picker-card'; card.innerHTML=`<img src="${t.src}" alt="${t.title}"><div class="meta"><div class="title">${t.title}</div><button>Place</button></div>`; card.querySelector('button').onclick=()=>{ placeTile(pickTarget.x,pickTarget.y,t); closeModal(pickerModal); }; pickerGrid.appendChild(card); }); openModal(pickerModal); }

/* info */
const infoModal=document.getElementById('infoModal'); const infoImg=document.getElementById('infoImg'); const infoRarity=document.getElementById('infoRarity'); const infoNumber=document.getElementById('infoNumber'); const infoTitle=document.getElementById('infoTitle'); const infoOwner=document.getElementById('infoOwner'); const infoToken=document.getElementById('infoToken'); const infoCoords=document.getElementById('infoCoords'); const btnUnstake=document.getElementById('btnUnstake'); const btnDecorate=document.getElementById('btnDecorate');
function openInfo(tile,x,y,wrap){
  infoImg.src=tile.src; infoTitle.textContent=tile.title; infoOwner.textContent=tile.owner; infoToken.textContent=tile.id; infoCoords.textContent=`${x},${y}`; infoRarity.textContent=tile.rarity; infoNumber.textContent=tile.number;
  btnUnstake.onclick=()=>{ if(confirm('Unstake?')){ unstake(x,y,wrap); closeModal(infoModal);} };
  btnDecorate.onclick=()=>openInterior(tile);
  openModal(infoModal);
}

/* ---------- INTERIOR ---------- */
const interiorModal=document.getElementById('interiorModal'); const room=document.getElementById('room'); const decorGrid=document.getElementById('decorGrid'); const decorTabs=document.getElementById('decorTabs'); const btnCloseInterior=document.getElementById('btnCloseInterior');

const HOTSPOTS = [ // 6 точок як на твоєму макеті
  {id:'p-left',  x:25, y:30, w:16, type:'poster'},
  {id:'p-mid',   x:50, y:30, w:16, type:'poster'},
  {id:'p-right', x:75, y:30, w:16, type:'poster'},
  {id:'sofa',    x:35, y:78, w:34, type:'sofa'},
  {id:'rig',     x:67, y:78, w:22, type:'rig'},
  {id:'walltv',  x:65, y:46, w:22, type:'monitor'}
];

const ASSETS = {
  sofa:    [{id:'hot-sofa-ledger', title:'Hot Wallet Sofa', src:'img/decor/hot sofa ledger.png'}],
  rig:     [{id:'rig1',            title:'Rig x1',          src:'img/decor/rig1.png'}],
  pet:     [{id:'dog',             title:'Shiba Doge',      src:'img/decor/dog.png'}],
  poster:  [{id:'poster-near',     title:'Poster NEAR',     src:'img/decor/poster near.png'}],
  neon:    [{id:'neon-hodl',       title:'Neon HODL',       src:'img/decor/neon hodl.png', neon:true}],
  monitor: [{id:'monitor',         title:'Wall Monitor',    src:'img/decor/monitor.png'}],
};

const INTERIOR_BG = 'img/decor/container_orange_in.png'; // фон 7:3

// tokenId -> { hotspotId: {id,title,src,neon?} }
const interiors = new Map(JSON.parse(localStorage.getItem('interiors')||'[]'));

let currentTile=null;

function openInterior(tile){
  currentTile=tile;
  renderRoom();
  renderCatalog('sofa');
  openModal(interiorModal);
}
function renderRoom(){
  room.innerHTML = `<img class="bg" src="${INTERIOR_BG}" alt="">`;
  const state = interiors.get(currentTile.id) || {};
  HOTSPOTS.forEach(h=>{
    const placed = state[h.id];
    if(placed){
      const node=document.createElement('div');
      node.className='decor'+(placed.neon?' neon':'');
      node.style.setProperty('--x',h.x); node.style.setProperty('--y',h.y); node.style.setProperty('--w',h.w);
      node.innerHTML=`<img src="${placed.src}" alt="${placed.title}">`;
      node.title='Клік — прибрати';
      node.onclick=()=>{ delete state[h.id]; interiors.set(currentTile.id,state); persistInteriors(); renderRoom(); };
      room.appendChild(node);
    }else{
      const btn=document.createElement('button');
      btn.className='hotspot'; btn.style.setProperty('--x',h.x); btn.style.setProperty('--y',h.y);
      btn.onclick=()=>{ selectHotspot(h); };
      room.appendChild(btn);
    }
  });
}
function selectHotspot(h){
  [...decorTabs.querySelectorAll('button')].forEach(b=>b.classList.toggle('active', b.dataset.cat===h.type));
  renderCatalog(h.type, h);
}
function renderCatalog(cat, hotspot=null){
  decorGrid.innerHTML='';
  (ASSETS[cat]||[]).forEach(item=>{
    const card=document.createElement('div'); card.className='decor-card';
    card.innerHTML=`<img src="${item.src}" alt="${item.title}"><div class="row"><div>${item.title}</div><button>Place</button></div>`;
    card.querySelector('button').onclick=()=>{
      const state = interiors.get(currentTile.id) || {};
      const target = hotspot || HOTSPOTS.find(s=>s.type===cat) || HOTSPOTS[0];
      state[target.id] = {id:item.id,title:item.title,src:item.src,neon:item.neon};
      interiors.set(currentTile.id,state); persistInteriors(); renderRoom();
    };
    decorGrid.appendChild(card);
  });
}
decorTabs.addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  [...decorTabs.querySelectorAll('button')].forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); renderCatalog(b.dataset.cat);
});
btnCloseInterior.onclick=()=>closeModal(interiorModal);

function persistInteriors(){ localStorage.setItem('interiors', JSON.stringify([...interiors.entries()])); }

/* ----- MODALS ----- */
function openModal(n){ n.setAttribute('aria-hidden','false'); }
function closeModal(n){ n.setAttribute('aria-hidden','true'); }
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',e=>closeModal(e.target.closest('.modal'))));
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{ if(e.target===m) closeModal(m); }));

/* ----- INIT ----- */
function renderAll(){ renderSlots(); ensureSceneHeight(); renderSlots(); }
window.addEventListener('resize',renderAll);
renderAll();

/* (демо) фарм, баланси */
const nearValue=document.getElementById('nearValue'); const nValue=document.getElementById('nValue'); let near=0.011, nTok=0.11; setInterval(()=>{ near+=0.001; nTok+=0.01; nearValue.textContent=near.toFixed(3); nValue.textContent=nTok.toFixed(2); },1500);
let farmPool=0, farmTarget=20; const farmFill=document.getElementById('farmFill'), farmAmount=document.getElementById('farmAmount'), btnClaim=document.getElementById('btnClaim'); 
setInterval(()=>{ farmPool+=0.04; const pct=Math.min(100,Math.round((farmPool/farmTarget)*100)); farmFill.style.width=pct+'%'; farmAmount.textContent=farmPool.toFixed(2)+' N'; btnClaim.disabled=pct<100; },1000);
btnClaim.onclick=()=>{ if(farmPool>=farmTarget){ alert('Claimed '+farmTarget+' N'); farmPool-=farmTarget; } };
