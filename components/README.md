# Components

| File | What it is |
| --- | --- |
| `bka30d.pdf`, `bka30d.png` | BKA30D-R5 dual-shaft stepper motor datasheet and mechanical drawing |
| `tcrt5000.pdf` | Vishay TCRT5000 reflective optical sensor datasheet |

## TCRT5000 ECAD library (not in git)

`LIB_TCRT5000/` is gitignored on purpose. It is a SamacSys library export, and
its license (clause 3) forbids distributing the models in a form usable as a PCB
library component, so it must not be committed or published.

To get it again: open the Vishay TCRT5000 product page on Mouser, use the
**ECAD Model** download (SamacSys), and unzip it here as
`components/LIB_TCRT5000/`. The KiCad footprint/symbol are in
`TCRT5000/KiCad/` and the 3D model is `TCRT5000/3D/TCRT5000.stp`.
