// Register your tiles here. Each must be exactly 400×300 pixels.
const tiles = [
  { id: "bar-001", title: "Bar Container", owner: "demo.near", src: "img/bar.png", attrs: { type: "bar", format: "400x300" } },
  { id: "aquarium-001", title: "Aquarium Container", owner: "demo.near", src: "img/aquarium.png", attrs: { type: "aquarium", format: "400x300" } },
  { id: "tv-001", title: "TV Room Container", owner: "demo.near", src: "img/tv.png", attrs: { type: "tv", format: "400x300" } }
];

const grid = document.getElementById('grid');
tiles.forEach(t => {
  const card = document.createElement('article');
  card.className = 'tile';
  const img = document.createElement('img');
  img.src = t.src;
  img.alt = t.title;
  card.appendChild(img);
  const b = document.createElement('div');
  b.className = 'badge';
  b.textContent = `${t.title} — ${t.owner}`;
  card.appendChild(b);
  card.addEventListener('click', ()=> openMeta(t));
  grid.appendChild(card);
});

const modal = document.getElementById('modal');
const meta = document.getElementById('meta');
const closeBtn = document.getElementById('close');
function openMeta(data){
  meta.textContent = JSON.stringify(data, null, 2);
  modal.classList.remove('hidden');
}
closeBtn.addEventListener('click', ()=> modal.classList.add('hidden'));
modal.addEventListener('click', (e)=>{ if(e.target===modal) modal.classList.add('hidden'); });

document.getElementById('connect').onclick = ()=> alert('Connect wallet (stub)');
document.getElementById('mint').onclick = ()=> alert('Mint (stub)');
