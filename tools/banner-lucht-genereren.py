#!/usr/bin/env python3
"""Maakt assets/banner-lucht.svg: de lucht achter de banner.

Een blauwe hemel, wolken en een trap die oploopt naar het licht. Draai
`python3 tools/banner-lucht-genereren.py` om het bestand opnieuw te maken;
pas de SVG niet met de hand aan, want die is uitvoer.

De tekst van de banner zit hier bewust niet in. Die staat in index.html en
demo-artifact.html, zodat ze meeschaalt met het scherm en te selecteren en
voor te lezen is.

Het doek is breed en laag (2000 x 480) en de banner toont het met
`background-position: 50% 100%`: de onderrand blijft dus altijd in beeld,
en daar staat de trap. Wat er bovenaan af valt is alleen lucht.
"""

import math
import random

random.seed(20260915)

W, H = 2000, 480
SX, SY = 1330.0, 200.0          # het licht: waar de trap naartoe loopt

uit = []
add = uit.append

add('<?xml version="1.0" encoding="UTF-8"?>')
add('<!-- Gegenereerd door tools/banner-lucht-genereren.py. Niet met de hand -->')
add('<!-- aanpassen: draai het script opnieuw.                              -->')
add('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d"'
    ' preserveAspectRatio="xMidYMax slice" role="presentation">' % (W, H, W, H))

# ------------------------------------------------------------------ verlopen
add('<defs>')
add('  <linearGradient id="lucht" x1="0.05" y1="0" x2="0.6" y2="1">')
add('    <stop offset="0" stop-color="#2b87d2"/>')
add('    <stop offset="0.42" stop-color="#6cb3e8"/>')
add('    <stop offset="1" stop-color="#c3e1f7"/>')
add('  </linearGradient>')
add('  <radialGradient id="gloed" cx="%.0f" cy="%.0f" r="620" gradientUnits="userSpaceOnUse">' % (SX, SY))
add('    <stop offset="0" stop-color="#ffffff" stop-opacity="1"/>')
add('    <stop offset="0.12" stop-color="#ffffff" stop-opacity="0.94"/>')
add('    <stop offset="0.3" stop-color="#ffffff" stop-opacity="0.44"/>')
add('    <stop offset="0.6" stop-color="#ffffff" stop-opacity="0.12"/>')
add('    <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>')
add('  </radialGradient>')
add('  <radialGradient id="pluk">')
add('    <stop offset="0" stop-color="#ffffff" stop-opacity="1"/>')
add('    <stop offset="0.6" stop-color="#ffffff" stop-opacity="0.9"/>')
add('    <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>')
add('  </radialGradient>')
add('  <radialGradient id="onderkant">')
add('    <stop offset="0" stop-color="#8fc0e7" stop-opacity="0.5"/>')
add('    <stop offset="1" stop-color="#8fc0e7" stop-opacity="0"/>')
add('  </radialGradient>')
add('  <linearGradient id="sluier" x1="0" y1="0" x2="1" y2="0">')
add('    <stop offset="0" stop-color="#ffffff" stop-opacity="0.3"/>')
add('    <stop offset="0.42" stop-color="#ffffff" stop-opacity="0.12"/>')
add('    <stop offset="0.7" stop-color="#ffffff" stop-opacity="0"/>')
add('  </linearGradient>')
add('  <filter id="zacht" x="-25%" y="-25%" width="150%" height="150%">')
add('    <feGaussianBlur stdDeviation="7"/>')
add('  </filter>')
add('  <filter id="ver" x="-30%" y="-30%" width="160%" height="160%">')
add('    <feGaussianBlur stdDeviation="15"/>')
add('  </filter>')
add('  <filter id="randje" x="-20%" y="-20%" width="140%" height="140%">')
add('    <feGaussianBlur stdDeviation="1.8"/>')
add('  </filter>')
add('  <filter id="waas" x="-20%" y="-20%" width="140%" height="140%">')
add('    <feGaussianBlur stdDeviation="10"/>')
add('  </filter>')
add('</defs>')

add('<rect width="%d" height="%d" fill="url(#lucht)"/>' % (W, H))

# -------------------------------------------------------------------- stralen
add('<g filter="url(#waas)" fill="#ffffff">')
hoek = 0.0
while hoek < 360:
    breedte = random.uniform(0.4, 2.8)
    lengte = random.uniform(1100, 2100)
    dekking = random.uniform(0.14, 0.44)
    b1 = math.radians(hoek - breedte)
    b2 = math.radians(hoek + breedte)
    add('  <polygon points="%.0f,%.0f %.0f,%.0f %.0f,%.0f" opacity="%.2f"/>' % (
        SX, SY,
        SX + lengte * math.cos(b1), SY + lengte * math.sin(b1),
        SX + lengte * math.cos(b2), SY + lengte * math.sin(b2),
        dekking))
    hoek += random.uniform(5.0, 12.0)
add('</g>')


def wolk(cx, cy, breed, hoog, plukken):
    """Eén wolk: overlappende zachte plukken, bol van boven, plat van onderen."""
    regels = []
    for i in range(plukken):
        f = (i + 0.5) / plukken - 0.5
        dx = (f + random.uniform(-0.09, 0.09)) * breed
        krimp = 1 - 0.55 * abs(dx) / (0.5 * breed)      # smaller naar de randen
        straal = random.uniform(0.2, 0.34) * breed * max(krimp, 0.25)
        dy = random.uniform(-0.3, 0.2) * hoog * krimp
        regels.append('  <ellipse cx="%.0f" cy="%.0f" rx="%.0f" ry="%.0f" fill="url(#pluk)"/>'
                      % (cx + dx, cy + dy, straal, straal * random.uniform(0.6, 0.9)))
    return '\n'.join(regels)


# --------------------------------------------------- wolken achter de trap
add('<g filter="url(#ver)">')
for cx, cy, breed, hoog, dek in [
        (90, 80, 640, 150, 0.85), (560, 40, 540, 120, 0.6),
        (1810, 80, 720, 190, 0.85), (2020, 250, 540, 170, 0.6),
        (250, 330, 720, 170, 0.7), (640, 300, 420, 120, 0.4)]:
    add('<g opacity="%.2f">%s</g>' % (dek, wolk(cx, cy, breed, hoog, 7)))
add('</g>')

# --------------------------------------------------------------------- trap
STAPPEN = 17
add('<g filter="url(#randje)">')
for i in range(STAPPEN):
    t = i / float(STAPPEN - 1)
    e = t ** 1.45                               # bovenin lopen de treden dichter
    cx = 1300 + (SX - 1300) * t
    half = 252 - 232 * e ** 0.6
    top = 492 - 258 * e ** 0.56
    dik = 27 - 22 * e ** 0.5
    diep = dik * 0.66
    licht = 0.6 + 0.38 * t
    # de stootrand valt weg in de wolk, het bovenvlak vangt het licht
    add('  <rect x="%.0f" y="%.0f" width="%.0f" height="%.0f" fill="#ffffff" opacity="%.2f"/>'
        % (cx - half, top, half * 2, dik, min(licht, 0.95)))
    add('  <rect x="%.0f" y="%.0f" width="%.0f" height="%.0f" fill="url(#onderkant)"/>'
        % (cx - half, top + dik * 0.5, half * 2, dik))
    add('  <rect x="%.0f" y="%.0f" width="%.0f" height="%.0f" fill="#ffffff" opacity="%.2f"/>'
        % (cx - half * 1.05, top - diep, half * 2.1, diep, min(licht + 0.3, 1.0)))
add('</g>')

# de bovenste treden lopen op in het licht
add('<rect width="%d" height="%d" fill="url(#gloed)"/>' % (W, H))

# ------------------------------------------------------ wolken vóór de trap
add('<g filter="url(#zacht)">')
for cx, cy, breed, hoog, dek in [
        (1210, 505, 880, 210, 0.95), (1700, 470, 700, 190, 0.85),
        (930, 450, 600, 170, 0.75), (1960, 420, 560, 160, 0.7),
        (430, 480, 780, 190, 0.7), (1460, 320, 300, 90, 0.35),
        (1160, 250, 240, 80, 0.3)]:
    add('<g opacity="%.2f">%s</g>' % (dek, wolk(cx, cy, breed, hoog, 8)))
add('</g>')

# een lichte sluier links, zodat de donkerblauwe tekst op rustige lucht staat
add('<rect width="%d" height="%d" fill="url(#sluier)"/>' % (W, H))

add('</svg>')

with open('assets/banner-lucht.svg', 'w') as f:
    f.write('\n'.join(uit) + '\n')
