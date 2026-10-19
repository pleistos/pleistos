# Bratislava → Athens trip planner

A mobile, one-hand web app built from the Claude Design prototype
(`project/Bratislava to Athens.dc.html`) using the Broadsheet design system.
It is plain HTML, CSS and JavaScript, with no build step and no dependencies.

## Run

Open `index.html` in a browser, or serve the folder (for a phone, put it on any static host):

```sh
python3 -m http.server -d app 8000
```

Query options, which replace the prototype's design-tool tweaks:

- `?tab=days|route|fees|hotels` sets the tab the app opens on.
- `?numerals=plain` shows plain day numbers instead of the CMYK plate numerals.

## Files

- `model.js` holds the plan data (countries, day splits, fees, tolls, hotels) and the pure cost and time maths.
- `app.js` handles state, rendering and events. Settings, purchases, paid booths and hotel picks persist in `localStorage` (`bta-trip-v1`).
- `app.css` is the app layer on top of `vendor/broadsheet/styles.css`.
- `vendor/broadsheet/` is the Broadsheet stylesheet and bundle, copied unchanged from the design export.

## Test

```sh
node --test app/test/*.test.js
```

The tests check the model against the brief's figures. One known difference: the brief lists Romania fuel as €80, but 695 km × 6.2 L/100 km × €1.87 = €80.58, so the app shows €81. The trip total is still €289.
