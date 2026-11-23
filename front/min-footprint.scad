// BKA30D-R5 PCB fit-check plate  (0.8 mm "PCB" with the peg / shaft / screw / lead holes)
// Units: mm. Origin = centre of the part. View from the top (PCB side): +X right, +Y up.
// The shaft hole is on the right (+9.5, 0); the single peg hole is at the bottom (0, -12).
// Do not flip the plate over when checking: that mirrors the hole pattern.

board_w = 79.5;     // part 59.5 + 2 x 10 mm buffer
board_h = 51.5;     // part 31.5 + 2 x 10 mm buffer
t       = 0.8;      // PCB thickness

peg_d   = 3.8;      // 3 x peg holes (pegs are OD 2.50)
shaft_d = 6.8;      // output shaft hole
screw_d = 2.3;      // 4 x M2 clearance holes
lead_d  = 1.2;      // 8 x lead holes (leads are OD 0.40)

comp    = 0.0;      // extra diameter added to every hole to offset FDM shrinkage (try 0.1-0.2 if holes print small)

pegs   = [[-25, 9.25], [25, 9.25], [0, -12]];
shaft  = [[9.5, 0]];
screws = [for (x = [-15.5, 15.5], y = [-13.5, 13.5]) [x, y]];
leads  = [for (x = [-19.375, -11.625, 11.625, 19.375], y = [-11.45, 11.45]) [x, y]];

module holes(pts, d) {
    for (p = pts) translate([p[0], p[1], -1]) cylinder(d = d + comp, h = t + 2, $fn = d > 2 ? 96 : 32);
}

difference() {
    translate([-board_w/2, -board_h/2, 0]) cube([board_w, board_h, t]);
    holes(pegs,   peg_d);
    holes(shaft,  shaft_d);
    holes(screws, screw_d);
    holes(leads,  lead_d);
}

