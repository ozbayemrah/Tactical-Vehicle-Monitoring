import { updateMarker } from './map.js';

const TICK_SECONDS = 0.2;

function bearing(lat1, lng1, lat2, lng2) {
  const toRad = Math.PI / 180;
  const y = Math.sin((lng2 - lng1) * toRad) * Math.cos(lat2 * toRad);
  const x =
    Math.cos(lat1 * toRad) * Math.sin(lat2 * toRad) -
    Math.sin(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.cos((lng2 - lng1) * toRad);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function createSimulation(state, { onLog, render }) {
  function tickVehicle(v) {
    const type = state.types[v.type];
    const moving = v.path.length > 0 && v.fuel > 0;

    if (moving) {
      const target = v.path[0];
      const from = L.latLng(v.lat, v.lng);
      const to = L.latLng(target.lat, target.lng);
      const dist = from.distanceTo(to);
      const step = type.speed * TICK_SECONDS;
      v.heading = bearing(v.lat, v.lng, target.lat, target.lng);

      if (dist <= step) {
        v.lat = target.lat;
        v.lng = target.lng;
        v.path.shift();
        if (v.path.length === 0) {
          if (v.patrol && v.route.length) {
            v.path = v.route.map((p) => ({ ...p }));
            v.order = `PATROLLING - ${v.path.length} WAYPOINT(S)`;
          } else {
            v.order = 'HOLDING POSITION';
            onLog(`${v.callsign} reached final waypoint, holding.`, 'info');
          }
        } else {
          v.order = `EN ROUTE - ${v.path.length} WAYPOINT(S) REMAIN`;
        }
      } else {
        const frac = step / dist;
        v.lat += (target.lat - v.lat) * frac;
        v.lng += (target.lng - v.lng) * frac;
        v.order = v.patrol
          ? `PATROLLING - ${v.path.length} WAYPOINT(S)`
          : `EN ROUTE - ${v.path.length} WAYPOINT(S) REMAIN`;
      }
      v.fuel = Math.max(0, v.fuel - type.fuelBurn * TICK_SECONDS * 0.6);
    } else if (v.fuel > 0) {
      v.fuel = Math.max(0, v.fuel - type.fuelBurn * TICK_SECONDS * 0.05);
    }

    if (v.fuel <= 0) {
      if (v.order !== 'STRANDED - NO FUEL') {
        v.order = 'STRANDED - NO FUEL';
        v.path = [];
        onLog(`${v.callsign} is out of fuel and stranded.`, 'critical');
      }
    } else if (v.fuel <= 20 && !v.lowFuelWarned) {
      v.lowFuelWarned = true;
      onLog(`${v.callsign} fuel critical: ${v.fuel.toFixed(0)}%.`, 'warning');
    } else if (v.fuel > 25) {
      v.lowFuelWarned = false;
    }

    if (Math.random() < 0.0015) {
      v.comms = !v.comms;
      onLog(`${v.callsign} comms link ${v.comms ? 'RESTORED' : 'LOST'}.`, v.comms ? 'info' : 'warning');
    }

    updateMarker(v, state.selected.has(v.id));
  }

  function tick() {
    state.fleet.forEach(tickVehicle);
    render();
  }

  return {
    start() {
      return setInterval(tick, TICK_SECONDS * 1000);
    },
  };
}
