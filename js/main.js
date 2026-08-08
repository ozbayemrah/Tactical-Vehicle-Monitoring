import { VEHICLE_TYPES, generateFleet, generateSatellites } from './data.js';
import { initMap, createMarker } from './map.js';
import { createHud, runBootSequence } from './hud.js';
import { createInput } from './input.js';
import { createSimulation } from './sim.js';

const CENTER = { lat: 52.52, lng: 13.405 }; // Berlin AO

function boot() {
  const map = initMap(CENTER);
  const fleet = generateFleet(CENTER, 10);
  const state = {
    fleet,
    types: VEHICLE_TYPES,
    selected: new Set(),
    squads: {},
    satellites: generateSatellites(),
    logEntries: [],
    modalOpen: false,
    modalVehicleId: null,
  };
  const hud = createHud(state);
  const input = createInput(map, state, hud);
  state.onRosterClick = (id, shift) => {
    input.onVehicleClick(id, shift);
    hud.openModal(id);
  };

  fleet.forEach((v) => {
    v.marker = createMarker(map, v, input.onVehicleClick);
  });

  const sim = createSimulation(state, { onLog: hud.pushLog, render: hud.render });
  sim.start();

  hud.render();
  hud.setFormation('LINE');
  hud.tickClock();
  setInterval(hud.tickClock, 1000);
  hud.pushLog(`Uplink established. ${fleet.length} units reporting in.`, 'info');
}

runBootSequence(boot);
