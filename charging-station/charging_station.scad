// =====================================================================
//  3-in-1 desk charging station
//  Pixel 10 Pro XL  |  Pixel Watch 5  |  Soundcore Liberty 4 NC
//
//  Layout (front view):   [ watch pillar ] [ phone stand ] [ buds stand ]
//
//  The station holds your OWN chargers - it does not contain electronics:
//   * Phone : a magnetic Qi2 puck (e.g. Google Pixelsnap Charger) sits in a
//             recess on the angled face. The phone's Pixelsnap magnets hold it.
//   * Watch : the official Pixel Watch 4/5 Quick Charge Dock drops into a
//             pocket on top of a raised pillar so the band can hang free.
//   * Buds  : the earbud case stands upright on its bottom edge, leaning
//             back against a sloped face with a thin round Qi pad in it.
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

/* [Earbuds - Soundcore Liberty 4 NC, standing upright] */
case_w       = 66;    // (!) case width, standing upright (left-right)
case_h       = 48;    // (!) case height, standing upright
case_t       = 30;    // (!) case thickness (front-back)
case_coil    = 24;    // (!) coil centre above the case's bottom edge
                      //     (usually the middle of the back face)
case_angle   = 75;    // lean angle from horizontal
case_lip_h   = 10;
qi_pad_d     = 60;    // (!) diameter of your round Qi pad
qi_pad_t     = 6;     // (!) thickness of the Qi pad
qi_pad_proud = 0;     // pad face flush with the sloped face
qi_cable_exit = "side";
buds_wall    = 4;     // wedge extends this much past the case each side

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
// A "stand" = front lip + slot + sloped wedge with a charger recess.
// Phone and earbuds use the same generic stand.

// length of the sloped face needed for a given coil height / charger size
function face_len(coil, chg_d) = coil + chg_d/2 + 10;
// raise the stand floor if the charger would reach below the face bottom
function shelf_h(coil, chg_d, ang) = max(0, chg_d/2 + clr + 2 - coil) * sin(ang);
function stand_depth(item_t, coil, chg_d, ang) =
    lip_t + item_t + clr + face_len(coil, chg_d)*cos(ang) + 8;

pillar_l   = dock_l + 2*clr + 2*pillar_wall;  // along Y (front-back)
pillar_w   = dock_w + 2*clr + 2*pillar_wall;  // along X

buds_w     = max(case_w, qi_pad_d) + 2*clr + 2*buds_wall;

phone_depth = stand_depth(phone_t, coil_from_bot, puck_d, phone_angle);
buds_depth  = stand_depth(case_t, case_coil, qi_pad_d, case_angle);

// X positions
x_watch  = margin;
xc_watch = x_watch + pillar_w/2;
xc_phone = x_watch + pillar_w + gap + phone_w/2;
xc_buds  = xc_phone + phone_w/2 + gap + buds_w/2;

W = xc_buds + buds_w/2 + margin;
D = max(phone_depth, buds_depth, pillar_l) + 2*margin;

// Y positions
y_lip    = margin;
yc_watch = D/2;

echo(str("Footprint: ", W, " x ", D, " mm, height ",
         base_t + face_len(coil_from_bot, puck_d)*sin(phone_angle), " mm"));

// ---------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------
module rrect(x, y, r) {
    offset(r) offset(-r) square([x, y]);
}
module rrect_c(x, y, r) translate([-x/2, -y/2]) rrect(x, y, r);
module obround(w, h) {           // centred stadium shape
    hull() for (s = [-1, 1]) translate([s*(w-h)/2, 0]) circle(d = h);
}
module vertical_pass(x, y, z_top, rot = 0) {
    translate([x, y, -1]) rotate(rot)
        linear_extrude(z_top + 1) obround(plug_w, plug_h);
}
module groove_to_back(x, y) {     // underside groove from (x,y) to rear edge
    translate([x - groove_w/2, y, -1]) cube([groove_w, D, groove_d + 1]);
}

// ---------------------------------------------------------------------
//  Generic leaning stand
//   xc       centre X          wedge_w  wedge width     lip_w  lip width
//   item_t   item thickness    ang      lean angle      coil   coil height on item
//   chg_d/t  charger disc      proud    charger proud   exit   "side"/"back"
// ---------------------------------------------------------------------
module stand_solid(xc, wedge_w, lip_w, item_t, ang, coil, chg_d, lip_hh) {
    L  = face_len(coil, chg_d);
    sh = shelf_h(coil, chg_d, ang);
    z0 = base_t + sh;
    yf = y_lip + lip_t + item_t + clr;
    run = L*cos(ang) + 8;
    // wedge (profile in Y-Z, extruded along X)
    translate([xc - wedge_w/2, 0, 0]) rotate([90, 0, 90])
        linear_extrude(wedge_w)
            polygon([
                [yf,               base_t - 0.01],
                [yf,               z0],
                [yf + L*cos(ang),  z0 + L*sin(ang)],
                [yf + run,         z0 + L*sin(ang)],
                [yf + run,         base_t - 0.01]
            ]);
    // raised floor under the item
    if (sh > 0)
        translate([xc - lip_w/2, y_lip, 0]) cube([lip_w, yf - y_lip + 0.01, z0]);
    // front lip
    translate([xc - lip_w/2, y_lip, 0]) cube([lip_w, lip_t, z0 + lip_hh]);
}

module stand_cuts(xc, item_t, ang, coil, chg_d, chg_t, proud, exit,
                  cable_w, usb_w = 0, lip_hh = 10) {
    L  = face_len(coil, chg_d);
    sh = shelf_h(coil, chg_d, ang);
    z0 = base_t + sh;
    yf = y_lip + lip_t + item_t + clr;
    rec = chg_t - proud;
    module on_face(s)
        translate([xc, yf, z0]) rotate([ang, 0, 0]) translate([0, s, 0]) children();

    // charger recess (+ cable slot down the face for "side" exit).
    // A charger larger than the item can extend below the item's bottom
    // edge; the floor the item stands on is kept intact.
    difference() {
        union() {
            on_face(coil) translate([0, 0, -rec]) cylinder(d = chg_d + 2*clr, h = rec + 5);
            if (exit == "side")
                on_face(0) translate([-cable_w/2, -5, -rec]) cube([cable_w, coil + 5, rec + 5]);
        }
        translate([xc - 200, y_lip - 1, -1]) cube([400, yf - y_lip + 1, z0 + 1]);
    }

    if (exit == "side") {
        // ...then down through the base just behind the face
        vertical_pass(xc, yf + plug_h/2 + 2, z0 + 22, 0);
        groove_to_back(xc, yf + 2);
    } else {
        p = [xc, yf + coil*cos(ang), z0 + coil*sin(ang)];
        translate(p) rotate([-90, 0, 0]) linear_extrude(L) obround(plug_w, plug_h);
    }
    // optional gap in the lip (e.g. phone USB-C port)
    if (usb_w > 0)
        translate([xc - usb_w/2, y_lip - 1, z0]) cube([usb_w, lip_t + 2, lip_hh + 1]);
}

// ---------------------------------------------------------------------
//  Watch pillar
// ---------------------------------------------------------------------
module watch_pillar() {
    translate([xc_watch, yc_watch, 0])
        linear_extrude(base_t + pillar_h) rrect_c(pillar_w, pillar_l, 5);
}
module watch_cuts() {
    zt = base_t + pillar_h - dock_sink;
    translate([xc_watch, yc_watch, zt])
        linear_extrude(dock_sink + 1) rrect_c(dock_w + 2*clr, dock_l + 2*clr, 2);
    // cable slot at the rear end of the dock
    translate([xc_watch - dock_cable_w/2, yc_watch, zt])
        cube([dock_cable_w, pillar_l, dock_sink + 1]);
    vertical_pass(xc_watch, yc_watch, zt + 0.01, 90);
    groove_to_back(xc_watch, yc_watch);
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
        linear_extrude(base_t) rrect(W, D, corner_r);
        // phone
        stand_solid(xc_phone, tower_w, phone_w, phone_t, phone_angle,
                    coil_from_bot, puck_d, lip_h);
        // earbuds (upright)
        stand_solid(xc_buds, buds_w, buds_w, case_t, case_angle,
                    case_coil, qi_pad_d, case_lip_h);
        watch_pillar();
    }
    stand_cuts(xc_phone, phone_t, phone_angle, coil_from_bot, puck_d, puck_t,
               puck_proud, puck_cable_exit, puck_cable_w, usb_gap_w, lip_h);
    stand_cuts(xc_buds, case_t, case_angle, case_coil, qi_pad_d, qi_pad_t,
               qi_pad_proud, qi_cable_exit, puck_cable_w, 0, case_lip_h);
    watch_cuts();
    feet();
}
