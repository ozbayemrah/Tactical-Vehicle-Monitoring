export function createHud(state) {
  const selPanel = document.getElementById('selection-panel');
  const logPanel = document.getElementById('log-panel');
  const clockEl = document.getElementById('clock');
  const formationEl = document.getElementById('formation-mode');
  const alertBar = document.getElementById('alert-bar');

  function fmt(n, d = 1) {
    return Number(n).toFixed(d);
  }

  function pushLog(message, level = 'info') {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
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

  function setFormation(mode) {
    formationEl.textContent = mode;
  }

  function tickClock() {
    clockEl.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
  }

  return { pushLog, renderSelection, setFormation, tickClock };
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
