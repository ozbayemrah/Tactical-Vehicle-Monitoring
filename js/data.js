export const VEHICLE_TYPES = {
  APC: { label: 'APC', speed: 6, fuelBurn: 1.2, color: '#00e5ff' },
  DRONE: { label: 'RECON DRONE', speed: 14, fuelBurn: 0.8, color: '#ff2fd0' },
  TRANSPORT: { label: 'TRANSPORT', speed: 5, fuelBurn: 1.5, color: '#ffb300' },
  BIKE: { label: 'RECON BIKE', speed: 11, fuelBurn: 0.6, color: '#39ff6a' },
};

const CALLSIGNS = ['RAVEN', 'WOLF', 'VIPER', 'GHOST', 'SPECTER', 'FALCON', 'COBRA', 'JACKAL', 'HORNET', 'LYNX'];

export function offsetLatLng(lat, lng, angleRad, meters) {
  const dLat = (meters * Math.cos(angleRad)) / 111320;
  const dLng = (meters * Math.sin(angleRad)) / (111320 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

export function generateFleet(center, count = 10) {
  const types = Object.keys(VEHICLE_TYPES);
  const fleet = [];
  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const angle = Math.random() * Math.PI * 2;
    const dist = 400 + Math.random() * 1800;
    const { lat, lng } = offsetLatLng(center.lat, center.lng, angle, dist);
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
