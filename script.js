/* =====  DEMO ТАЙЛИ (підстав свої шляхи 400×300)  ===== */
const tiles = [
  { id: "bar-001", title: "Bar Container", owner: "demo.near", src: "img/bar.png" },
  { id: "aquarium-001", title: "Aquarium Container", owner: "demo.near", src: "img/aquarium.png" },
  { id: "tv-001", title: "TV Room Container", owner: "demo.near", src: "img/tv.png" }
];

/* =====  ПАРАМЕТРИ СЦЕНИ  ===== */
const COLS = 21;           // 21 слот у ряд
const ROWS_VISIBLE = 16;   // скільки рядів показуємо одразу (можеш збільшити)
const GROUND_RATIO = 0.22; // 22% висоти — «земля»
const BURY_FIRST = 0.5;    // 1-й ряд занурено на 50%

const scene   = document.getElementById('scene');
const layerSlots  = document.getElementById('slots');
const layerPlaced = document.getElementById('placed');

/* стейт зайнятих клітин */
const occupied = new Set(); // ключ "x,y"
/* обраний тайл для розміщення (простий prompt; заміниш на модалку/вибір) */
function askTile() {
  const names = tiles.map((t,i)=>`${i+1}. ${t.title}`).join('\n');
  const idx = +prompt(`Choose a tile:\n${names}`, "1");
  if (!idx || idx<1 || idx>tiles.length) return null;
  return tiles[idx-1];
}

/* підрахунок розмірів слоту з урахуванням ширини вьюпорта */
function computeSlotSize(){
  const w = scene.clientWidth;
  let slotW = Math.floor((w - 32) / COLS); // відступи
  // зберігаємо пропорцію 400×300 => 4:3
  let slotH = Math.round(slotW * (3/4));
  // зробимо трохи крупніші на високих екранах
  if(slotH < 90){ slotH = 90; slotW = Math.round(slotH * (4/3)); }
  scene.style.setProperty('--slot-w', slotW+'px');
  scene.style.setProperty('--slot-h', slotH+'px');
  return {slotW, slotH};
}

/* конвертер координат клітинки у px */
function cellToPx(x, y, slotW, slotH){
  const sceneH = scene.clientHeight;
  const groundY = Math.round(sceneH * (1 - GROUND_RATIO)); // лінія «земля/небо»
  // top для 0-го ряду: половина занурена
  const top0 = groundY - Math.round(slotH * (1 - BURY_FIRST));
  const top = top0 - y * slotH;
  const left = Math.round((scene.clientWidth - COLS*slotW)/2) + x*slotW;
  return {left, top};
}

/* чи слот доступний для клік-плейсу */
function isAvailable(x, y){
  const key = `${x},${y}`;
  if(occupied.has(key)) return false;
  // базовий ряд — завжди доступний
  if(y === 0) return true;
  // підтримка знизу
  if(!occupied.has(`${x},${y-1}`)) return false;
  return true;
}

/* перемалювати рамки доступних слотів */
function renderSlots(){
  layerSlots.innerHTML = '';
  const {slotW, slotH} = computeSlotSize();
  for(let y=0; y<ROWS_VISIBLE; y++){
    for(let x=0; x<COLS; x++){
      if(!isAvailable(x,y)) continue;
      const {left, top} = cellToPx(x,y,slotW,slotH);
      const div = document.createElement('div');
      div.className = 'slot';
      div.style.left = left+'px';
      div.style.top  = top +'px';
      div.style.width = slotW+'px';
      div.style.height= slotH+'px';
      div.title = `Place at [${x},${y}]`;
      div.onclick = () => placeTile(x,y);
      layerSlots.appendChild(div);
    }
  }
}

/* розмістити тайл у клітинку */
function placeTile(x,y){
  const tile = askTile();
  if(!tile) return;
  const {slotW, slotH} = computeSlotSize();
  const {left, top} = cellToPx(x,y,slotW,slotH);

  const img = document.createElement('img');
  img.src = tile.src;
  img.alt = tile.title;
  img.className = 'tile-img';
  img.style.left = left+'px';
  img.style.top  = top +'px';
  img.width  = slotW;
  img.height = slotH;

  const badge = document.createElement('div');
  badge.className='tile-badge';
  badge.textContent = `${tile.title} — ${tile.owner}`;

  const wrap = document.createElement('div');
  wrap.style.position='absolute';
  wrap.style.left = left+'px';
  wrap.style.top  = top +'px';
  wrap.style.width = slotW+'px';
  wrap.style.height= slotH+'px';
  wrap.appendChild(img);
  wrap.appendChild(badge);

  layerPlaced.appendChild(wrap);
  occupied.add(`${x},${y}`);
  renderSlots(); // оновити доступні рамки
}

/* ресайз/ініт */
function initScene(){
  renderSlots();
  window.addEventListener('resize', ()=>renderSlots());
}
initScene();

/* (кнопки зверху лишилися як у твоїй версії) */
document.getElementById('connect')?.addEventListener('click', ()=> alert('Connect wallet (stub)'));
document.getElementById('mint')?.addEventListener('click', ()=> alert('Mint (stub)'));
