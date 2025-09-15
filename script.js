/* ... решта коду без змін ... */

function placeTile(x,y,tile){
  const {w,h}=slotSize(); const {left,top}=cellToPx(x,y,w,h);
  const wrap=document.createElement('div'); wrap.className='tile-wrap';
  Object.assign(wrap.style,{left:left+'px',top:top+'px',width:w+'px',height:h+'px'});
  wrap.dataset.x=x; wrap.dataset.y=y;
  wrap.innerHTML=`<img class="tile-img" src="${tile.src}" alt="${tile.title}"><div class="tile-badge">${tile.number||tile.id}</div>`;
  wrap.onclick=()=>openInterior(tile); // одразу відкриває інтер’єр
  placed.appendChild(wrap); occ.set(key(x,y),{type:'tile',data:tile});
  renderSlots(); ensureSceneHeight(); renderSlots(); requestAnimationFrame(()=>wrap.scrollIntoView({behavior:'smooth',block:'center'}));
}

/* ---- INTERIOR ---- */
function renderRoom(){
  room.innerHTML = `<img class="bg" src="${INTERIOR_BG}" alt="">`;
  const state = interiors.get(currentTile.id) || {};
  HOTSPOTS.forEach(h=>{
    const placed = state[h.id];
    if(placed){
      const node=document.createElement('div');
      let cls='decor';
      if(placed.neon) cls+=' neon';
      if(h.type==='monitor') cls+=' monitor';
      node.className=cls;
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

/* ---- openInfo тепер зайвий ---- */
function openInfo(tile,x,y,wrap){
  openInterior(tile);
}
