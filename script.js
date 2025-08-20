// Демо-список NFT (картинки поклади у ./img/)
const tiles = [
  {id:"bar-001", title:"Bar Container", owner:"demo.near", src:"img/bar.png"},
  {id:"aquarium-001", title:"Aquarium", owner:"demo.near", src:"img/aquarium.png"},
  {id:"tv-001", title:"TV Room", owner:"demo.near", src:"img/tv.png"}
];

const COLS=21, ROWS=12, GROUND_RATIO=0.22, BURY=0.5;

const scene   = document.getElementById('scene');
const slotsEl = document.getElementById('slots');
const placed  = document.getElementById('placed');

// Елементи модалки (можуть бути відсутні)
const pickerBackdrop = document.getElementById('pickerBackdrop');
const pickerModal    = document.getElementById('pickerModal');
const pickerGrid     = document.getElementById('pickerGrid');
const pickerClose    = document.getElementById('pickerClose');
const pickerCancel   = document.getElementById('pickerCancel');

const occ = new Set();
let pendingSlot = null; // {x,y}

/* ==== утиліти сітки ==== */
function slotSize(){
  let w=Math.floor(scene.clientWidth/COLS);
  let h=Math.round(w*3/4);
  scene.style.setProperty("--slot-w", w+"px");
  scene.style.setProperty("--slot-h", h+"px");
  return {w,h};
}
function cellToPx(x,y,w,h){
  const groundY = scene.clientHeight*(1-GROUND_RATIO);
  const top0    = groundY - h*(1-BURY);
  return { left:(scene.clientWidth-COLS*w)/2 + x*w, top: top0 - y*h };
}
function available(x,y){
  if(occ.has(`${x},${y}`)) return false;
  return y===0 || occ.has(`${x},${y-1}`);
}

/* ==== рендер слотів ==== */
function renderSlots(){
  slotsEl.innerHTML="";
  const {w,h}=slotSize();
  for(let y=0;y<ROWS;y++){
    for(let x=0;x<COLS;x++){
      if(!available(x,y)) continue;
      const {left,top}=cellToPx(x,y,w,h);
      if(left<-w || left>scene.clientWidth) continue;
      const s=document.createElement("div");
      s.className="slot";
      s.style.left=left+"px";
      s.style.top=top+"px";
      s.onclick=()=>openPicker(x,y);
      slotsEl.appendChild(s);
    }
  }
}

/* ==== вставка NFT ==== */
function place(x,y,tile){
  const {w,h}=slotSize(); const {left,top}=cellToPx(x,y,w,h);
  const wrap=document.createElement("div");
  wrap.className="tile-wrap";
  wrap.style=`left:${left}px;top:${top}px;width:${w}px;height:${h}px`;
  wrap.innerHTML=`<img class="tile-img" src="${tile.src}" alt="${tile.title}">
                  <div class="tile-badge">${tile.title}</div>`;
  placed.appendChild(wrap);
  occ.add(`${x},${y}`);
  renderSlots();
}

/* ==== модалка (працює, якщо є у index.html) ==== */
function renderPickerGrid(){
  if(!pickerGrid) return;
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
      if(!pendingSlot) return;
      closePicker();
      place(pendingSlot.x, pendingSlot.y, tiles[i]);
      pendingSlot = null;
    };
    pickerGrid.appendChild(card);
  });
}
function openPicker(x,y){
  pendingSlot = {x,y};
  // Якщо модалки немає в HTML — fallback на prompt
  if(!(pickerModal && pickerBackdrop && pickerGrid)){
    const t = chooseTilePrompt();
    if(t){ place(x,y,t); }
    pendingSlot = null;
    return;
  }
  renderPickerGrid();
  pickerBackdrop.hidden = false;
  pickerModal.hidden = false;
  const firstBtn = pickerGrid.querySelector("button");
  if (firstBtn) firstBtn.focus();
}
function closePicker(){
  if(pickerBackdrop) pickerBackdrop.hidden = true;
  if(pickerModal)    pickerModal.hidden = true;
  pendingSlot = null;
}

/* ==== fallback prompt ==== */
function chooseTilePrompt(){
  const list = tiles.map((t,i)=>`${i+1}. ${t.title}`).join("\\n");
  const pick = +prompt("Choose an NFT:\\n"+list, "1");
  return tiles[pick-1];
}

/* події модалки — тільки якщо вона є */
if(pickerClose)  pickerClose.addEventListener("click", closePicker);
if(pickerCancel) pickerCancel.addEventListener("click", closePicker);
if(pickerBackdrop) pickerBackdrop.addEventListener("click", closePicker);
window.addEventListener("keydown", (e)=>{
  if(pickerModal && !pickerModal.hidden && e.key === "Escape") closePicker();
});

/* старт */
window.addEventListener("resize", renderSlots);
renderSlots();
