export function createHud(state) {
  const selPanel = document.getElementById('selection-panel');
  const rosterPanel = document.getElementById('roster-panel');
  const logPanel = document.getElementById('log-panel');
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  const formationEl = document.getElementById('formation-mode');
  const alertBar = document.getElementById('alert-bar');
  const satCluster = document.getElementById('sat-cluster');

  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalClose = document.getElementById('modal-close');
  const modalEls = {
    callsign: document.getElementById('modal-callsign'),
    type: document.getElementById('modal-type'),
    icon: document.getElementById('modal-icon'),
    fuelBar: document.getElementById('modal-fuel-bar'),
    fuelVal: document.getElementById('modal-fuel-val'),
    hullBar: document.getElementById('modal-hull-bar'),
    hullVal: document.getElementById('modal-hull-val'),
    radio: document.getElementById('modal-radio'),
    pos: document.getElementById('modal-pos'),
    hdg: document.getElementById('modal-hdg'),
    order: document.getElementById('modal-order'),
    captain: document.getElementById('modal-captain'),
    crew: document.getElementById('modal-crew'),
    squad: document.getElementById('modal-squad'),
    ammo: document.getElementById('modal-ammo'),
    armor: document.getElementById('modal-armor'),
    activity: document.getElementById('modal-activity'),
  };

  rosterPanel.addEventListener('click', (e) => {
    const row = e.target.closest('.roster-row');
    if (row && state.onRosterClick) state.onRosterClick(row.dataset.id, e.shiftKey);
  });

  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  function fmt(n, d = 1) {
    return Number(n).toFixed(d);
  }

  function pushLog(message, level = 'info') {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    state.logEntries.unshift({ time, message, level });
    if (state.logEntries.length > 200) state.logEntries.pop();

    const row = document.createElement('div');
    row.className = `log-row log-${level}`;
    row.textContent = `[${time}] ${message}`;
    logPanel.prepend(row);
    while (logPanel.children.length > 60) logPanel.removeChild(logPanel.lastChild);
    if (level === 'critical' || level === 'warning') flashAlert(level);
  }

  function flashAlert(level) {
    alertBar.classList.remove('flash-critical', 'flash-warning');
    void alertBar.offsetWidth;
    alertBar.classList.add(level === 'critical' ? 'flash-critical' : 'flash-warning');
  }

  function fuelClass(fuel) {
    if (fuel <= 20) return 'crit';
    if (fuel <= 45) return 'warn';
    return 'ok';
  }

  function unitCard(v) {
    return `
      <div class="unit-card">
        <div class="unit-card-head">
          <span class="unit-name">${v.callsign}</span>
          <span class="unit-type">${state.types[v.type].label}</span>
        </div>
        <div class="stat-row"><span>FUEL</span><div class="bar"><div class="bar-fill ${fuelClass(v.fuel)}" style="width:${v.fuel}%"></div></div><span>${fmt(v.fuel, 0)}%</span></div>
        <div class="stat-row"><span>HULL</span><div class="bar"><div class="bar-fill ok" style="width:${v.hull}%"></div></div><span>${fmt(v.hull, 0)}%</span></div>
        <div class="stat-row"><span>COMMS</span><span class="${v.comms ? 'comms-ok' : 'comms-lost'}">${v.comms ? 'LINK OK' : 'NO SIGNAL'}</span></div>
        <div class="stat-row"><span>POS</span><span>${fmt(v.lat, 4)}, ${fmt(v.lng, 4)}</span></div>
        <div class="stat-row"><span>HDG</span><span>${fmt(v.heading, 0)}&deg;</span></div>
        <div class="unit-order">${v.order}</div>
      </div>`;
  }

  function renderSelection() {
    const selected = state.fleet.filter((v) => state.selected.has(v.id));
    if (selected.length === 0) {
      selPanel.innerHTML = `<div class="no-selection">NO UNIT SELECTED<br><span>Click a unit, or shift-drag to box-select.</span></div>`;
      return;
    }
    selPanel.innerHTML = selected.map(unitCard).join('');
  }

  function rosterRow(v) {
    const selected = state.selected.has(v.id) ? ' selected' : '';
    return `
      <div class="roster-row${selected}" data-id="${v.id}" style="--type-color:${state.types[v.type].color}">
        <div class="roster-head">
          <span class="roster-name">${v.callsign}</span>
          <span class="roster-type">${state.types[v.type].label}</span>
        </div>
        <div class="roster-grid">
          <div><label>CREW</label><span>${v.crew} PAX</span></div>
          <div><label>CAPTAIN</label><span>${v.captain}</span></div>
          <div><label>RADIO</label><span class="${v.comms ? 'comms-ok' : 'comms-lost'}">${v.comms ? 'ON-LINE' : 'OFF-LINE'}</span></div>
          <div><label>AMMO</label><span>${v.ammo}</span></div>
          <div><label>ARMOR</label><span>${v.armor}</span></div>
        </div>
      </div>`;
  }

  function renderRoster() {
    rosterPanel.innerHTML = state.fleet.map(rosterRow).join('');
  }

  function satLabel(status) {
    if (status === 'LOCKED') return 'ok';
    if (status === 'DEGRADED') return 'degraded';
    return 'lost';
  }

  function renderSatellites() {
    satCluster.innerHTML = (state.satellites || [])
      .map((s) => `<span class="sat-chip"><span class="sat-dot ${satLabel(s.status)}"></span>${s.id}</span>`)
      .join('');
  }

  function squadsOf(id) {
    const keys = Object.entries(state.squads || {})
      .filter(([, set]) => set.has(id))
      .map(([key]) => key);
    return keys.length ? keys.join(', ') : 'UNASSIGNED';
  }

  function renderModal() {
    if (!state.modalVehicleId) return;
    const v = state.fleet.find((u) => u.id === state.modalVehicleId);
    if (!v) return;
    const type = state.types[v.type];

    modalEls.callsign.textContent = v.callsign;
    modalEls.type.textContent = type.label;
    modalEls.icon.style.setProperty('--type-color', type.color);
    modalEls.icon.style.setProperty('--hdg', `${v.heading}deg`);
    modalEls.fuelBar.style.width = `${v.fuel}%`;
    modalEls.fuelBar.className = `bar-fill ${fuelClass(v.fuel)}`;
    modalEls.fuelVal.textContent = `${fmt(v.fuel, 0)}%`;
    modalEls.hullBar.style.width = `${v.hull}%`;
    modalEls.hullBar.className = 'bar-fill ok';
    modalEls.hullVal.textContent = `${fmt(v.hull, 0)}%`;
    modalEls.radio.textContent = v.comms ? 'LINK OK' : 'NO SIGNAL';
    modalEls.radio.className = v.comms ? 'comms-ok' : 'comms-lost';
    modalEls.pos.textContent = `${fmt(v.lat, 4)}, ${fmt(v.lng, 4)}`;
    modalEls.hdg.textContent = `${fmt(v.heading, 0)}°`;
    modalEls.order.textContent = v.order;
    modalEls.captain.textContent = v.captain;
    modalEls.crew.textContent = `${v.crew} PAX`;
    modalEls.squad.textContent = squadsOf(v.id);
    modalEls.ammo.textContent = v.ammo;
    modalEls.armor.textContent = v.armor;

    const activity = state.logEntries.filter((e) => e.message.includes(v.callsign)).slice(0, 5);
    modalEls.activity.innerHTML = activity.length
      ? activity.map((e) => `<div class="log-row log-${e.level}">[${e.time}] ${e.message}</div>`).join('')
      : `<div class="no-selection" style="padding:4px 0">No recorded activity yet.</div>`;
  }

  function openModal(id) {
    const v = state.fleet.find((u) => u.id === id);
    if (!v) return;
    state.modalVehicleId = id;
    state.modalOpen = true;
    renderModal();
    modalBackdrop.classList.remove('hidden');
  }

  function closeModal() {
    if (!state.modalOpen) return;
    state.modalOpen = false;
    state.modalVehicleId = null;
    modalBackdrop.classList.add('hidden');
  }

  function render() {
    renderSelection();
    renderRoster();
    renderSatellites();
    if (state.modalOpen) renderModal();
  }

  function setFormation(mode) {
    formationEl.textContent = mode;
  }

  function tickClock() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-GB', { hour12: false });
    dateEl.textContent = now
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .toUpperCase();
  }

  return { pushLog, render, renderSelection, renderRoster, renderSatellites, setFormation, tickClock, openModal, closeModal };
}

export function runBootSequence(onDone) {
  const boot = document.getElementById('boot-screen');
  const textEl = document.getElementById('boot-text');
  const lines = [
    'INITIALIZING TACTICAL C2 INTERFACE...',
    'ESTABLISHING SATCOM UPLINK...',
    'LOADING SECTOR MAP DATA...',
    'SYNCING UNIT TELEMETRY...',
    'ALL SYSTEMS NOMINAL',
  ];
  let i = 0;
  const interval = setInterval(() => {
    if (i >= lines.length) {
      clearInterval(interval);
      setTimeout(() => {
        boot.classList.add('boot-hide');
        setTimeout(onDone, 600);
      }, 400);
      return;
    }
    const row = document.createElement('div');
    row.textContent = lines[i];
    textEl.appendChild(row);
    i++;
  }, 350);
}
