export const VEHICLE_TYPES = {
  APC: { label: 'APC', speed: 6, fuelBurn: 1.2, color: '#00e5ff' },
  DRONE: { label: 'RECON DRONE', speed: 14, fuelBurn: 0.8, color: '#ff2fd0' },
  TRANSPORT: { label: 'TRANSPORT', speed: 5, fuelBurn: 1.5, color: '#ffb300' },
  BIKE: { label: 'RECON BIKE', speed: 11, fuelBurn: 0.6, color: '#39ff6a' },
};

const CALLSIGNS = ['RAVEN', 'WOLF', 'VIPER', 'GHOST', 'SPECTER', 'FALCON', 'COBRA', 'JACKAL', 'HORNET', 'LYNX'];

const LOADOUTS = {
  APC: { crew: [6, 8], ammo: '7.62MM AP / SMOKE', armor: 'COMPOSITE PLATE' },
  DRONE: { crew: [0, 0], ammo: 'NONE — ISR PAYLOAD', armor: 'UNARMORED' },
  TRANSPORT: { crew: [10, 14], ammo: 'SIDEARMS ONLY', armor: 'LIGHT KEVLAR' },
  BIKE: { crew: [1, 2], ammo: '5.56MM STANDARD', armor: 'UNARMORED' },
};

const RANKS = ['CPT', 'LT', 'SGT', 'MAJ'];
const SURNAMES = ['REYES', 'KOVACS', 'NAKAMURA', 'OKAFOR', 'PETROV', 'SINGH', 'DUARTE', 'VASQUEZ', 'MORALES', 'LINDQVIST'];

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function pickCaptain(type, index) {
  const surname = SURNAMES[index % SURNAMES.length];
  if (type === 'DRONE') return `REMOTE OP: ${surname}`;
  const rank = RANKS[index % RANKS.length];
  return `${rank}. ${surname}`;
}

export function offsetLatLng(lat, lng, angleRad, meters) {
  const dLat = (meters * Math.cos(angleRad)) / 111320;
  const dLng = (meters * Math.sin(angleRad)) / (111320 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

const SATELLITE_NAMES = ['GPS-14', 'MILSTAR-2', 'NOAA-9', 'IRIDIUM-88'];

export function generateSatellites() {
  return SATELLITE_NAMES.map((id) => ({ id, status: 'LOCKED' }));
}

export function generateFleet(center, count = 10) {
  const types = Object.keys(VEHICLE_TYPES);
  const fleet = [];
  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const angle = Math.random() * Math.PI * 2;
    const dist = 400 + Math.random() * 1800;
    const { lat, lng } = offsetLatLng(center.lat, center.lng, angle, dist);
    const loadout = LOADOUTS[type];
    fleet.push({
      id: `UNIT-${(i + 1).toString().padStart(2, '0')}`,
      callsign: `${CALLSIGNS[i % CALLSIGNS.length]}-${i + 1}`,
      type,
      lat,
      lng,
      heading: Math.random() * 360,
      fuel: 70 + Math.random() * 30,
      hull: 100,
      comms: true,
      crew: randInt(loadout.crew[0], loadout.crew[1]),
      captain: pickCaptain(type, i),
      ammo: loadout.ammo,
      armor: loadout.armor,
      route: [],
      path: [],
      patrol: false,
      squad: null,
      order: 'HOLDING POSITION',
      lowFuelWarned: false,
      marker: null,
    });
  }
  return fleet;
}
