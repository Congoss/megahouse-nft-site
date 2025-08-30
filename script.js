/* Демо-тайли */
const tiles = [
  {id:"bar-001", title:"Bar Container", owner:"demo.near", src:"img/bar.png"},
  {id:"aquarium-001", title:"Aquarium", owner:"demo.near", src:"img/aquarium.png"},
  {id:"tv-001", title:"TV Room", owner:"demo.near", src:"img/tv.png"}
];

/* Сітка */
const COLS = 10;            // 10 на поверх
const ROWS = 60;            // до 60 поверхів
const GROUND_RATIO = 0.22;  // де “земля”
const BURY = 0.5;           // наскільки перший ряд вкопаний
const SIDE_GAP_SLOTS = 0.5; // відступи зліва/справа у розмірі пів-слота

/* DOM */
const scene  = document.getElementById('scene');
const slots  = document.getElementById('slots');
const placed = document.getElementById('placed');

/* Заповнені клітинки */
const occ = new Set();

/* Вибір тайла */
function chooseTile(){
  const list = tiles.map((t,i)=>`${i+1}. ${t.title}`).join("\n");
  const pick = +prompt("Choose:\n"+list,"1");
  return tiles[pick-1];
}

/* Розміри “слота” з урахуванням кількості колонок */
function slotSize(){
  // ширина слота — з урахуванням бічних відступів у слотах
  const usableCols = COLS + SIDE_GAP_SLOTS*2;
  let w = Math.floor(scene.clientWidth / usableCols);
  let h = Math.round(w * 3/4);
  scene.style.setProperty("--slot-w", w+"px");
  scene.style.setProperty("--slot-h", h+"px");
  return {w,h};
}

/* Переведення координат сітки в px */
function cellToPx(x, y, w, h){
  const groundY = scene.clientHeight * (1 - GROUND_RATIO);
  const top0    = groundY - h*(1 - BURY);

  // центруємо все полотно і додаємо бокові “щілини”
  const totalW  = (COLS + SIDE_GAP_SLOTS*2) * w;
  const left0   = (scene.clientWidth - totalW) / 2 + SIDE_GAP_SLOTS*w;

  return { left: left0 + x*w, top: top0 - y*h };
}

/* Чи доступна клітинка */
function available(x, y){
  if (occ.has(`${x},${y}`)) return false;
  return y === 0 || occ.has(`${x},${y-1}`);
}

/* Рендер доступних слотів (плюсів) */
function renderSlots(){
  slots.innerHTML = "";
  const {w,h} = slotSize();

  for(let y=0; y<ROWS; y++){
    for(let x=0; x<COLS; x++){
      if (!available(x,y)) continue;
      const {left, top} = cellToPx(x,y,w,h);
      const s = document.createElement("div");
      s.className = "slot";
      s.style.left = left + "px";
      s.style.top  = top  + "px";
      s.onclick = () => place(x,y);
      slots.appendChild(s);
    }
  }

  // Перелайаут уже розміщених плиток після ресайзу
  Array.from(placed.children).forEach(el=>{
    const gx = +el.dataset.x;
    const gy = +el.dataset.y;
    if (Number.isFinite(gx) && Number.isFinite(gy)){
      const {left, top} = cellToPx(gx,gy,w,h);
      el.style.left = left + "px";
      el.style.top  = top  + "px";
      el.style.width  = w + "px";
      el.style.height = h + "px";
    }
  });
}

/* Розміщення плитки */
function place(x,y){
  const t = chooseTile(); if (!t) return;

  const {w,h} = slotSize();
  const {left, top} = cellToPx(x,y,w,h);

  const wrap = document.createElement("div");
  wrap.className = "tile-wrap";
  wrap.style.left   = left + "px";
  wrap.style.top    = top  + "px";
  wrap.style.width  = w + "px";
  wrap.style.height = h + "px";
  wrap.dataset.x = x;  // для перелайаута
  wrap.dataset.y = y;

  wrap.innerHTML = `
    <img class="tile-img" src="${t.src}" alt="${t.title}">
    <div class="tile-badge">${t.title}</div>
  `;

  placed.appendChild(wrap);
  occ.add(`${x},${y}`);
  renderSlots();
}

/* Події */
window.addEventListener("resize", renderSlots);
renderSlots();
