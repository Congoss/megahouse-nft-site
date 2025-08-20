// було: ensureSceneMinHeightFor(layout)
// стало: резервуємо місце під nextFloor = highest + 1 (щоб "+" не був під HUD)
function ensureSceneMinHeightFor(layout){
  const h = layout.h;
  const nextFloor = highestFloor() + 1; // <-- головна правка
  const need = Math.ceil( (1 + BURY) * h + nextFloor * h + BOTTOM_MARGIN + TOP_SAFE );
  const base = Math.max(window.innerHeight, need);
  const current = parseInt(scene.style.minHeight || 0) || 0;
  if (current < base) {
    scene.style.minHeight = base + "px";
    return true;
  }
  return false;
}
