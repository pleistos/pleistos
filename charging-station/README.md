# 3-in-1 charging station: Pixel 10 Pro XL, Pixel Watch 5, Liberty 4 NC

![preview](preview.png)

A parametric OpenSCAD design. Edit `charging_station.scad`, then export
an STL. A pre-rendered `charging_station.stl` with the default values is
included.

| Slot | Charger you supply | How it holds |
|---|---|---|
| Phone (centre, 68° stand) | **Google Pixelsnap Charger** (Qi2.2 25 W, Ø56 × 5.4 mm). This is the default fit | The puck sits in a recess. The phone's Pixelsnap magnets hold it on, and a front lip catches the bottom edge. The lip has a gap for the USB-C port. |
| Watch (left pillar, 45 mm tall) | Official Pixel Watch 4/5 Quick Charge Dock (41 × 27 × 9.6 mm) | The dock sits 6 mm deep in a pocket. The pillar is tall so the band hangs free. |
| Earbuds (right stand, 75°) | Thin round Qi pad (default Ø60 × 6 mm) | The case stands upright on its bottom edge in a slot and leans back against the pad, which is set into the sloped face. A front lip stops it sliding. |

All three cables drop through holes big enough for a USB-C plug. They run
in grooves on the underside and come out at the back.

## Measure these before you print
Values marked `(!)` in the file are estimates:

1. **`coil_from_bot`**: the most important one. Put the phone (in its
   case) face-down on the magnetic puck and let it snap to centre. Then
   measure from the phone's bottom edge to the centre of the puck.
2. **`puck_d`, `puck_t`**: the defaults fit the Google Pixelsnap Charger
   (Ø56 × 5.4 mm). If you buy a different puck, enter its size.
   `puck_cable_exit = "both"` cuts a route for a cable leaving the edge
   *and* one leaving the centre of the back, so either kind works.
3. **`phone_w`, `phone_t`**: width and bottom-edge thickness of the phone
   *with its case on*.
4. **`case_w`, `case_h`, `case_t`, `case_coil`**: the earbud case standing
   upright (width, height, thickness) and the height of its charging coil
   above the bottom edge. The default puts the coil in the middle of the
   back face. Published sizes don't agree, so use calipers. If the case
   only charges when the pad is held against one particular face, that
   face goes against the sloped face.
5. **`qi_pad_d`, `qi_pad_t`**: your Qi pad.

Tip: print a test piece first. Wrap the model in
`intersection(){ ... ; translate([...]) cube(...); }` to print just
one pocket.

## Which phone puck to buy
| Puck | Size | Fit |
|---|---|---|
| **Google Pixelsnap Charger** (recommended) | Ø56 × 5.4 mm, built-in 1 m USB-C cable | Default. Gives the Pixel 10 Pro XL's full 25 W Qi2.2. |
| Samsung Magnetic Wireless Qi2 Charger Pad 25 W | ~55.4 × 4.4 mm | Set `puck_d = 55.4`, `puck_t = 4.4`. |
| Amazon Basics 25 W Qi2.2 pad | ~60 × 8.4 mm (converted from inches) | Set `puck_d = 60`, `puck_t = 8.4`. |

Measure the puck you actually get before printing. The recess fit is
0.6 mm per side.

## Print settings (Creality K1C / K1C 2025: 220 × 220 × 250 mm)
- **It prints in one piece on the K1C.** The model is 203.4 × 80.5 ×
  126.7 mm, which leaves about 8 mm on each side for a skirt or brim. A test slice
  on a 220 × 220 bed kept all extrusion between X 4.9 and 215 mm, and the top
  is at Z 126.6 of 250 mm.
- Print it flat, as oriented, with the long side along X. **No supports**: the
  charger recess ceilings are sloped so they print without them.
- 0.2 mm layers, 3 walls, 15 % gyroid infill, PLA or PETG. Expect about
  **205 g** of PLA and about **6–7 h** at K1C speeds. That's an estimate from a
  PrusaSlicer test slice with K1C-like limits; Creality Print will give its own
  figure.
- Use smooth PEI or textured PEI with glue stick for PETG. A brim isn't
  needed, but there's room for a 5 mm one if your bed is cold-cornered.
- The `.scad` file has the printer size set at the top (`bed_x/y/z`). An
  `assert` stops the render if your changes make the model too big. If
  that happens, you can still rotate it diagonally in the slicer: the
  diagonal is about 311 mm.
- Use 10 mm self-adhesive rubber feet in the four recesses. Optionally,
  add a few coins or steel washers in the wedge (pause the print) for
  extra weight.

## Render
```
openscad -o charging_station.stl charging_station.scad
```
