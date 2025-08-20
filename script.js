function onSlotClick(x,y){
  const list = tiles.map((t,i)=>`${i+1}. ${t.title}`).join("\n");
  const pick = +prompt("Choose an NFT:\n"+list, "1");
  const tile = tiles[pick-1];
  if (!tile) return;
  place(x,y,tile); // <<< це замінить саме клікнутий “+”
}

function place(x,y,tile){
  const {w,h} = slotSize();
  const {left, top} = cellToPx(x,y,w,h);

  const wrap = document.createElement("div");
  wrap.className = "tile-wrap";
  wrap.style = `left:${left}px;top:${top}px;width:${w}px;height:${h}px;opacity:0;transition:.15s opacity ease-out;`;
  wrap.innerHTML = `<img class="tile-img" src="${tile.src}" alt="${tile.title}">
                    <div class="tile-badge">${tile.title}</div>`;
  placed.appendChild(wrap);

  // помічаємо клітинку зайнятою
  occ.add(`${x},${y}`);

  // перерендеримо слоти — той самий “+” зникне
  renderSlots();

  // плавне проявлення вставленої плитки
  requestAnimationFrame(()=> wrap.style.opacity = 1);
}
