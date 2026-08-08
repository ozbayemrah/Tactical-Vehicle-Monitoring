# Tactical Vehicle Monitoring

A dystopian cyberpunk HMI/FUI prototype: a tactical map HUD showing a fleet of
simulated vehicles, with RTS-style selection and command control. Static site,
no backend, no build step — deploys straight to GitHub Pages.

## Run locally

Any static file server works (ES modules require `http://`, not `file://`):

```
npx serve .
```

## Controls

- **Click** a unit to select it, **Shift+Click** to add/remove from selection
- **Shift+Drag** on the map for an RTS-style box select
- **Right-click** the map to issue a move order to the current selection
- **Shift+Right-click** to queue an additional waypoint
- **H** hold position &middot; **P** toggle patrol loop
- **E** engage &middot; **S** scan sector (simulated flavor events)
- **L / C / V** set formation to line / column / wedge
- **Ctrl+1-9** assign selection to a squad slot &middot; **1-9** recall a squad

## Stack

Leaflet (dark CARTO tiles) + vanilla JS ES modules for a client-side vehicle
simulation (movement, fuel, comms) and a hand-built cyberpunk HUD (scanlines,
alert flashes, boot sequence).

## Status

Early prototype — shaping as we go. Next ideas: minimap, real combat/threat
events, road-aware routing, richer squad UI.
