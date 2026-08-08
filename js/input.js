import { offsetLatLng } from './data.js';
import { updateMarker } from './map.js';

export function createInput(map, state, hud) {
  let formation = 'LINE'; // LINE | COLUMN | WEDGE
  let boxStart = null;
  let boxSelectDiv = null;

  function selectedVehicles() {
    return state.fleet.filter((v) => state.selected.has(v.id));
  }

  function refreshSelectionVisuals() {
    state.fleet.forEach((v) => updateMarker(v, state.selected.has(v.id)));
  }

  function select(ids, additive) {
    if (!additive) state.selected.clear();
    ids.forEach((id) => {
      if (additive && state.selected.has(id)) state.selected.delete(id);
      else state.selected.add(id);
    });
    refreshSelectionVisuals();
    hud.render();
  }

  function clearSelection() {
    if (state.selected.size === 0) return;
    state.selected.clear();
    refreshSelectionVisuals();
    hud.render();
  }

  function onVehicleClick(id, shift) {
    select([id], shift);
  }

  function averageHeading(units) {
    if (!units.length) return 0;
    return units.reduce((a, v) => a + v.heading, 0) / units.length;
  }

  function formationPoints(center, count) {
    if (count === 1) return [center];
    const spacing = 35; // meters
    const heading = averageHeading(selectedVehicles());
    const angle = (heading * Math.PI) / 180;
    const points = [];
    for (let i = 0; i < count; i++) {
      const idx = i - (count - 1) / 2;
      let dx = 0;
      let dy = 0;
      if (formation === 'LINE') { dx = idx * spacing; dy = 0; }
      else if (formation === 'COLUMN') { dx = 0; dy = idx * spacing; }
      else { dx = idx * spacing; dy = -Math.abs(idx) * spacing * 0.6; } // WEDGE, trails behind flanks

      const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
      const ry = dx * Math.sin(angle) + dy * Math.cos(angle);
      const bearing = Math.atan2(rx, ry);
      const dist = Math.hypot(rx, ry);
      points.push(dist < 0.001 ? { ...center } : offsetLatLng(center.lat, center.lng, bearing, dist));
    }
    return points;
  }

  function issueMove(latlng, queue) {
    const units = selectedVehicles();
    if (units.length === 0) return;
    const points = formationPoints(latlng, units.length);
    units.forEach((v, i) => {
      const wp = { lat: points[i].lat, lng: points[i].lng };
      if (queue && v.route.length) {
        v.route.push(wp);
        v.path.push(wp);
      } else {
        v.route = [wp];
        v.path = [wp];
        v.patrol = false;
      }
      v.order = queue ? `WAYPOINT QUEUED (${v.path.length})` : 'EN ROUTE';
    });
    hud.pushLog(`${queue ? 'Waypoint queued for' : 'Move order issued to'} ${units.length} unit(s).`, 'info');
    hud.renderSelection();
  }

  function holdSelected() {
    const units = selectedVehicles();
    if (!units.length) return;
    units.forEach((v) => {
      v.path = [];
      v.route = [];
      v.patrol = false;
      v.order = 'HOLDING POSITION';
    });
    hud.pushLog(`Hold position ordered for ${units.length} unit(s).`, 'info');
    hud.renderSelection();
  }

  function togglePatrol() {
    const units = selectedVehicles();
    if (!units.length) return;
    units.forEach((v) => {
      v.patrol = !v.patrol;
      if (v.patrol && v.path.length === 0 && v.route.length) v.path = v.route.map((p) => ({ ...p }));
    });
    hud.pushLog(`Patrol ${units[0].patrol ? 'ENABLED' : 'DISABLED'} for ${units.length} unit(s).`, 'info');
    hud.renderSelection();
  }

  function flavorAction(label) {
    const units = selectedVehicles();
    if (!units.length) return;
    units.forEach((v) => hud.pushLog(`${v.callsign}: ${label}`, 'info'));
  }

  function setFormation(mode) {
    formation = mode;
    hud.setFormation(mode);
  }

  // -- map interactions --
  map.getContainer().addEventListener('contextmenu', (e) => e.preventDefault());
  map.on('click', clearSelection);
  map.on('contextmenu', (e) => issueMove(e.latlng, e.originalEvent.shiftKey));

  // -- keybindings --
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    const key = e.key.toLowerCase();
    if (key === 'h') holdSelected();
    else if (key === 'p') togglePatrol();
    else if (key === 'e') flavorAction('ENGAGING SIMULATED CONTACT');
    else if (key === 's') flavorAction('SCANNING SECTOR');
    else if (key === 'l') setFormation('LINE');
    else if (key === 'c') setFormation('COLUMN');
    else if (key === 'v') setFormation('WEDGE');
    else if (/^[1-9]$/.test(key)) {
      if (e.ctrlKey) {
        e.preventDefault();
        state.squads[key] = new Set(state.selected);
        hud.pushLog(`Squad ${key} assigned (${state.selected.size} unit(s)).`, 'info');
      } else {
        const squad = state.squads[key];
        if (squad && squad.size) select([...squad], false);
      }
    }
  });

  // -- box select (shift + drag) --
  const container = map.getContainer();
  container.addEventListener('mousedown', (e) => {
    if (!e.shiftKey || e.button !== 0) return;
    map.dragging.disable();
    boxStart = { x: e.clientX, y: e.clientY };
    boxSelectDiv = document.createElement('div');
    boxSelectDiv.className = 'select-box';
    document.body.appendChild(boxSelectDiv);
  });

  window.addEventListener('mousemove', (e) => {
    if (!boxSelectDiv) return;
    const x = Math.min(boxStart.x, e.clientX);
    const y = Math.min(boxStart.y, e.clientY);
    const w = Math.abs(e.clientX - boxStart.x);
    const h = Math.abs(e.clientY - boxStart.y);
    Object.assign(boxSelectDiv.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  });

  window.addEventListener('mouseup', (e) => {
    if (!boxSelectDiv) return;
    const rect = container.getBoundingClientRect();
    const p1 = map.containerPointToLatLng(L.point(boxStart.x - rect.left, boxStart.y - rect.top));
    const p2 = map.containerPointToLatLng(L.point(e.clientX - rect.left, e.clientY - rect.top));
    const bounds = L.latLngBounds(p1, p2);
    const ids = state.fleet.filter((v) => bounds.contains([v.lat, v.lng])).map((v) => v.id);
    if (ids.length) select(ids, e.shiftKey);
    boxSelectDiv.remove();
    boxSelectDiv = null;
    map.dragging.enable();
  });

  return { onVehicleClick };
}
