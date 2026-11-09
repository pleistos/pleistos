// =====================================================================
//  3-in-1 desk charging station
//  Pixel 10 Pro XL  |  Pixel Watch 5  |  Soundcore Liberty 4 NC
//
//  Layout (front view):   [ watch pillar ] [ phone stand ] [ buds well ]
//
//  The station holds your OWN chargers - it does not contain electronics:
//   * Phone : a magnetic Qi2 puck (e.g. Google Pixelsnap Charger) sits in a
//             recess on the angled face. The phone's Pixelsnap magnets hold it.
//   * Watch : the official Pixel Watch 4/5 Quick Charge Dock drops into a
//             pocket on top of a raised pillar so the band can hang free.
//   * Buds  : a thin round Qi pad sits at the bottom of a well; the
//             earbud case lies on top of it, held in place by the well walls.
//  All cables drop through the base into grooves on the underside and exit
//  at the back.
//
//  EVERYTHING IS PARAMETRIC. Measure your own parts (with your phone case
//  on!) and edit the values below before printing.  Values marked (!) are
//  estimates and MUST be checked.
//
//  Print: as-is, flat on the bed, no supports needed. 0.2 mm layers,
//  3 walls, 15 % gyroid infill, PETG or PLA.  Footprint is printed in the
//  console (fits a 220 x 220 mm bed with the defaults).
// =====================================================================

/* [General] */
$fn        = 96;
clr        = 0.6;     // fit clearance added around pockets
margin     = 5;       // base border around the modules
gap        = 7;       // gap between modules
base_t     = 8;       // base plate thickness
corner_r   = 8;       // base corner radius

/* [Phone - Pixel 10 Pro XL] */
phone_w        = 82;    // width WITH case (bare phone ~76.6)
phone_t        = 12;    // thickness at the bottom edge WITH case (bare ~8.5)
phone_angle    = 68;    // stand angle from horizontal
coil_from_bot  = 88;    // (!) centre of Pixelsnap magnet ring, measured from
                        //     the bottom edge of the phone(+case)
tower_w        = 70;    // width of the wedge (phone may overhang it)
lip_h          = 10;    // height of the front lip holding the phone bottom
lip_t          = 4;
usb_gap_w      = 22;    // cut-out in the lip for the phone's USB-C port

/* [Phone charger puck] */
puck_d          = 60;   // (!) diameter of your magnetic Qi2 puck
puck_t          = 7.5;  // (!) thickness of the puck
puck_proud      = 0.4;  // puck stands this much proud of the face
puck_cable_exit = "side"; // "side" = cable leaves the puck edge
                          // "back" = cable leaves the centre of the back
puck_cable_w    = 7;    // width of the strain-relief / cable slot

/* [Watch - Pixel Watch 5 Quick Charge Dock] */
dock_l       = 41;    // official dock is 41 x 27 x 9.6 mm
dock_w       = 27;
dock_h       = 9.6;
dock_sink    = 6;     // how deep the dock sits in the pocket
dock_cable_w = 5;     // cable slot at the dock's rear end
pillar_h     = 45;    // pillar height above the base (band clearance)
pillar_wall  = 4;

/* [Earbuds - Soundcore Liberty 4 NC] */
case_l     = 66;    // (!) case footprint, lying on its back
case_w     = 48;    // (!)
case_hold  = 10;    // height of the well wall around the case
qi_pad_d   = 60;    // (!) diameter of your round Qi pad
qi_pad_t   = 6;     // (!) thickness of the Qi pad
well_wall  = 4;

/* [Cables] */
plug_w    = 14.5;   // pass-through holes must fit the USB-C plug
plug_h    = 8.5;
groove_w  = 5;      // underside cable grooves (fit a ~3.5-4.5 mm cable)
groove_d  = 5;
feet_d    = 10.5;   // recesses for 10 mm self-adhesive rubber feet
feet_t    = 1.2;

// ---------------------------------------------------------------------
//  Derived geometry
// ---------------------------------------------------------------------
a  = phone_angle;
ca = cos(a);  sa = sin(a);

face_len   = coil_from_bot + puck_d/2 + 10;   // along the sloped face
top_flat   = 8;
wedge_run  = face_len*ca + top_flat;          // horizontal depth of wedge
wedge_h    = face_len*sa;

pillar_l   = dock_l + 2*clr + 2*pillar_wall;  // along Y (front-back)
pillar_w   = dock_w + 2*clr + 2*pillar_wall;  // along X

well_x     = max(case_l, qi_pad_d) + 2*clr + 2*well_wall;
well_y     = max(case_w, qi_pad_d) + 2*clr + 2*well_wall;
well_h     = qi_pad_t + case_hold;

phone_depth = lip_t + phone_t + clr + wedge_run;

// X positions (left edge of each column)
x_watch = margin;
x_phone = x_watch + pillar_w + gap + (phone_w - tower_w)/2;  // room for overhang
x_buds  = x_phone + tower_w + (phone_w - tower_w)/2 + gap;

W = x_buds + well_x + margin;
D = max(phone_depth, well_y, pillar_l) + 2*margin;

// Y positions
y_lip   = margin;
y_face  = y_lip + lip_t + phone_t + clr;   // bottom of the sloped face
y_watch = (D - pillar_l)/2;
y_buds  = (D - well_y)/2;

xc_phone = x_phone + tower_w/2;
xc_watch = x_watch + pillar_w/2;
xc_buds  = x_buds + well_x/2;
yc_watch = y_watch + pillar_l/2;
yc_buds  = y_buds + well_y/2;

echo(str("Footprint: ", W, " x ", D, " mm, height ", base_t + wedge_h, " mm"));

// ---------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------
module rrect(x, y, r) {
    offset(r) offset(-r) square([x, y]);
}
module obround(w, h) {           // centred stadium shape
    hull() for (s = [-1, 1]) translate([s*(w-h)/2, 0]) circle(d = h);
}
// place children on the sloped phone face, s mm up the face from its
// bottom edge; local +Z points out of the face, local +Y up the slope
module on_face(s) {
    translate([xc_phone, y_face, base_t]) rotate([a, 0, 0])
        translate([0, s, 0]) children();
}
module vertical_pass(x, y, z_top, rot = 0) {
    translate([x, y, -1]) rotate(rot)
        linear_extrude(z_top + 1) obround(plug_w, plug_h);
}
module groove_to_back(x, y) {     // underside groove from (x,y) to rear edge
    translate([x - groove_w/2, y, -1]) cube([groove_w, D, groove_d + 1]);
}

// ---------------------------------------------------------------------
//  Solids
// ---------------------------------------------------------------------
module base() {
    linear_extrude(base_t) rrect(W, D, corner_r);
}

module phone_wedge() {
    // profile in the Y-Z plane, extruded along X
    translate([x_phone, 0, 0]) rotate([90, 0, 90])
        linear_extrude(tower_w)
            polygon([
                [y_face,                 base_t - 0.01],
                [y_face + face_len*ca,   base_t + wedge_h],
                [y_face + wedge_run,     base_t + wedge_h],
                [y_face + wedge_run,     base_t - 0.01]
            ]);
    // front lip (with USB-C gap)
    difference() {
        translate([x_phone - (phone_w - tower_w)/2, y_lip, 0])
            cube([phone_w, lip_t, base_t + lip_h]);
        translate([xc_phone - usb_gap_w/2, y_lip - 1, base_t])
            cube([usb_gap_w, lip_t + 2, lip_h + 1]);
    }
}

module watch_pillar() {
    translate([x_watch, y_watch, 0])
        linear_extrude(base_t + pillar_h)
            rrect(pillar_w, pillar_l, 5);
}

module buds_well() {
    translate([x_buds, y_buds, 0])
        linear_extrude(base_t + well_h)
            rrect(well_x, well_y, 8);
}

// ---------------------------------------------------------------------
//  Cut-outs
// ---------------------------------------------------------------------
module phone_cuts() {
    rec = puck_t - puck_proud;
    // puck recess
    on_face(coil_from_bot) translate([0, 0, -rec])
        cylinder(d = puck_d + 2*clr, h = rec + 5);

    if (puck_cable_exit == "side") {
        // slot from the puck down the face to the bottom...
        on_face(0) translate([-puck_cable_w/2, -5, -rec])
            cube([puck_cable_w, coil_from_bot + 5, rec + 5]);
        // ...then down through the base just behind the face
        vertical_pass(xc_phone, y_face + plug_h/2 + 2, base_t + 22, 0);
        groove_to_back(xc_phone, y_face + 2);
    } else {
        // straight out of the back of the wedge
        p = [xc_phone, y_face + coil_from_bot*ca, base_t + coil_from_bot*sa];
        translate(p) rotate([-90, 0, 0])
            linear_extrude(wedge_run + 5) obround(plug_w, plug_h);
    }
}

module watch_cuts() {
    // dock pocket
    translate([xc_watch, yc_watch, base_t + pillar_h - dock_sink])
        linear_extrude(dock_sink + 1)
            rrect_c(dock_w + 2*clr, dock_l + 2*clr, 2);
    // cable slot at the rear end of the dock, down into the pass-through
    translate([xc_watch - dock_cable_w/2, yc_watch, base_t + pillar_h - dock_sink])
        cube([dock_cable_w, pillar_l, dock_sink + 1]);
    // vertical cable channel inside the pillar (fits the USB-C plug)
    vertical_pass(xc_watch, yc_watch, base_t + pillar_h - dock_sink + 0.01, 90);
    groove_to_back(xc_watch, yc_watch);
}
module rrect_c(x, y, r) translate([-x/2, -y/2]) rrect(x, y, r);

module buds_cuts() {
    z0 = base_t + well_h;
    // case well
    translate([xc_buds, yc_buds, z0 - case_hold])
        linear_extrude(case_hold + 1)
            rrect_c(case_l + 2*clr, case_w + 2*clr, 10);
    // Qi pad pocket below it
    translate([xc_buds, yc_buds, z0 - case_hold - qi_pad_t])
        cylinder(d = qi_pad_d + 2*clr, h = qi_pad_t + 0.01);
    // finger notches to lift the case out
    for (s = [-1, 1])
        translate([xc_buds + s*(case_l/2 + clr), yc_buds, z0 - case_hold + 3])
            scale([1, 1.6, 1]) cylinder(d = 16, h = case_hold);
    // pad cable: pass-through + groove (pad cable usually exits at its edge)
    vertical_pass(xc_buds, yc_buds + qi_pad_d/2 - plug_w/2, z0 - case_hold, 90);
    groove_to_back(xc_buds, yc_buds);
}

module feet() {
    for (x = [corner_r + 6, W - corner_r - 6], y = [corner_r + 6, D - corner_r - 6])
        translate([x, y, -1]) cylinder(d = feet_d, h = feet_t + 1);
}

// ---------------------------------------------------------------------
//  Assembly
// ---------------------------------------------------------------------
difference() {
    union() {
        base();
        phone_wedge();
        watch_pillar();
        buds_well();
    }
    phone_cuts();
    watch_cuts();
    buds_cuts();
    feet();
}
