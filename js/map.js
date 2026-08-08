import { VEHICLE_TYPES } from './data.js';

export function initMap(center) {
  const map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
    worldCopyJump: true,
  }).setView([center.lat, center.lng], 14);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);
  return map;
}

export function vehicleIcon(vehicle, selected) {
  const color = VEHICLE_TYPES[vehicle.type].color;
  const ring = selected ? `<div class="unit-ring" style="border-color:${color}"></div>` : '';
  return L.divIcon({
    className: 'unit-icon',
    html: `
      ${ring}
      <div class="unit-triangle" style="border-bottom-color:${color}; color:${color}; transform: rotate(${vehicle.heading}deg)"></div>
      <div class="unit-tag" style="color:${color}">${vehicle.callsign}</div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

export function createMarker(map, vehicle, onSelect) {
  const marker = L.marker([vehicle.lat, vehicle.lng], { icon: vehicleIcon(vehicle, false) }).addTo(map);
  marker.on('click', (e) => {
    L.DomEvent.stopPropagation(e);
    onSelect(vehicle.id, e.originalEvent.shiftKey);
  });
  return marker;
}

export function updateMarker(vehicle, selected) {
  if (!vehicle.marker) return;
  vehicle.marker.setLatLng([vehicle.lat, vehicle.lng]);
  vehicle.marker.setIcon(vehicleIcon(vehicle, selected));
}
