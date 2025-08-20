const tiles = [
  {id:"bar-001", title:"Bar Container", owner:"demo.near", src:"img/bar.png"},
  {id:"aquarium-001", title:"Aquarium", owner:"demo.near", src:"img/aquarium.png"},
  {id:"tv-001", title:"TV Room", owner:"demo.near", src:"img/tv.png"}
];

const COLS=10, ROWS=60, GROUND_RATIO=0.22, BURY=0.5;
const scene=document.getElementById('scene');
const slots=document.getElementById('slots');
const placed=document.getElementById('placed');
const occ=new Map();
const BEAMS_SRC = "img/scaffold.png";

let farmProgress=0;

function chooseTile(){
  const list=tiles.map((t,i)=>`${i+1}. ${t.title}`).join("\n");
  const pick=+prompt("Choose:\n"+list,"1");
  return tiles[pick-1];
}
function slotSize(){
  let w=Math.floor(scene.clientWidth/COLS);
  let h=Math.round(w*3/4);
  scene.style.setProperty("--slot-w",w+"px");
  scene.style.setProperty("--slot-h",h+"px");
  return {w,h};
}
function cellToPx(x,y,w,h){
  const groundY=scene.clientHeight*(1-GROUND_RATIO);
  const top0=groundY-h*(1-BURY);
  return {left:(scene.clientWidth-COLS*w)/2+x*w, top:top0-y*h};
}
function available(x,y){
  if(occ.has(`${x},${y}`))return false;
  return y===0 || occ.has(`${x},${y-1}`);
}
function renderSlots(){
  slots.innerHTML="";
  const {w,h}=slotSize();
  for(let y=0;y<ROWS;y++){
    for(let x=0;x<COLS;x++){
      if(!available(x,y)) continue;
      const {left,top}=cellToPx(x,y,w,h);
      const s=document.createElement("div");
      s.className="slot"; s.style.left=left+"px"; s.style.top=top+"px";
      s.onclick=()=>place(x,y);
      slots.appendChild(s);
    }
  }
}
function place(x,y){
  const t=chooseTile(); if(!t)return;
  const {w,h}=slotSize(); const {left,top}=cellToPx(x,y,w,h);
  const wrap=document.createElement("div");
  wrap.className="tile-wrap"; wrap.style=`left:${left}px;top:${top}px;width:${w}px;height:${h}px`;
  wrap.innerHTML=`<img class="tile-img" src="${t.src}" alt="${t.title}">
                  <div class="tile-badge">${t.title}</div>`;
  wrap.onclick=()=>showInfo(t,x,y,wrap);
  placed.appendChild(wrap);
  occ.set(`${x},${y}`, {tile:t,wrap:wrap});
  renderSlots();
  updateFarm(5);
}
function updateFarm(val){
  farmProgress+=val;
  if(farmProgress>100) farmProgress=100;
  document.getElementById("farm-fill").style.width=farmProgress+"%";
  document.getElementById("farm-value").textContent=farmProgress+" N";
}

// Popup
const infoBox=document.getElementById("infoBox");
const infoTitle=document.getElementById("infoTitle");
const infoOwner=document.getElementById("infoOwner");
const infoClose=document.getElementById("infoClose");
const unstakeBtn=document.getElementById("unstakeBtn");

function showInfo(tile,x,y,wrap){
  infoBox.classList.remove("hidden");
  infoTitle.textContent=tile.title;
  infoOwner.textContent="Owner: "+tile.owner;
  unstakeBtn.onclick=()=>unstake(x,y,wrap);
}
infoClose.onclick=()=>infoBox.classList.add("hidden");

function unstake(x,y,wrap){
  wrap.querySelector("img").src=BEAMS_SRC;
  wrap.querySelector(".tile-badge").textContent="Scaffold";
  occ.set(`${x},${y}`, {tile:{title:"Scaffold"},wrap:wrap});
  infoBox.classList.add("hidden");
}
window.addEventListener("resize",renderSlots);
renderSlots();
