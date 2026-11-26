import math, sys
OUT = sys.argv[1]
def pt(r, a):
    return 512 + r * math.cos(math.radians(a)), 512 + r * math.sin(math.radians(a))

def dial(mono=False):
    """Kadran: krom çerçeve, siyah yüz, 270° çizgiler, amber ibre (1024 kutusunda, merkez 512)."""
    A0, SW = 135, 270
    ticks = []
    for i in range(0, 28):
        a = A0 + SW * i / 27
        big = i % 3 == 0
        x1, y1 = pt(348, a); x2, y2 = pt(298 if big else 322, a)
        col = '#FFFFFF' if mono else ('#F4EAD5' if i < 23 else '#FF4A3D')
        ticks.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{col}" stroke-width="{20 if big else 9}" stroke-linecap="round"/>')
    na = A0 + SW * 0.62
    nx, ny = pt(318, na); tx, ty = pt(-70, na)
    px, py = math.cos(math.radians(na + 90)), math.sin(math.radians(na + 90))
    w1, w2 = 22, 6
    needle = f'M{tx + px*w1:.1f} {ty + py*w1:.1f} L{nx + px*w2:.1f} {ny + py*w2:.1f} L{nx - px*w2:.1f} {ny - py*w2:.1f} L{tx - px*w1:.1f} {ty - py*w1:.1f} Z'
    if mono:
        return f'''<circle cx="512" cy="512" r="430" fill="none" stroke="#FFF" stroke-width="40"/>{''.join(ticks)}
<path d="{needle}" fill="#FFF"/><circle cx="512" cy="512" r="58" fill="#FFF"/>'''
    # amber hız yayı (0 → ibre)
    ax0, ay0 = pt(372, A0); ax1, ay1 = pt(372, na)
    large = 1 if SW * 0.62 > 180 else 0
    return f'''
<circle cx="512" cy="512" r="446" fill="url(#chrome)"/>
<circle cx="512" cy="512" r="414" fill="#2A2724"/>
<circle cx="512" cy="512" r="404" fill="url(#face)"/>
<path d="M{ax0:.1f} {ay0:.1f} A372 372 0 {large} 1 {ax1:.1f} {ay1:.1f}" stroke="#FF8A2A" stroke-width="16" fill="none" stroke-linecap="round" opacity="0.9"/>
{''.join(ticks)}
<g transform="translate(6 10)" opacity="0.45"><path d="{needle}" fill="#000"/></g>
<path d="{needle}" fill="url(#needle)"/>
<circle cx="512" cy="512" r="62" fill="url(#chrome)"/>
<circle cx="512" cy="512" r="34" fill="#141210"/>
<circle cx="498" cy="496" r="12" fill="#FFF" opacity="0.35"/>
<rect x="436" y="742" width="152" height="54" rx="10" fill="#0A0806" stroke="#C9C2B4" stroke-width="5"/>
<rect x="452" y="754" width="26" height="30" fill="#F4EAD5"/><rect x="488" y="754" width="26" height="30" fill="#F4EAD5"/><rect x="524" y="754" width="26" height="30" fill="#F4EAD5"/><rect x="560" y="754" width="18" height="30" fill="#FF8A2A"/>
<path d="M150 400 A380 380 0 0 1 700 150 Q480 240 150 400 Z" fill="#FFF" opacity="0.07"/>'''

DEFS = '''<defs>
<radialGradient id="bg" cx="0.5" cy="0.4" r="0.75"><stop offset="0" stop-color="#3A2414"/><stop offset="1" stop-color="#0B0806"/></radialGradient>
<linearGradient id="chrome" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.45" stop-color="#6E6A64"/><stop offset="0.55" stop-color="#D9D6CF"/><stop offset="1" stop-color="#4A4640"/></linearGradient>
<radialGradient id="face" cx="0.5" cy="0.42" r="0.6"><stop offset="0" stop-color="#1E1B18"/><stop offset="1" stop-color="#050505"/></radialGradient>
<linearGradient id="needle" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB347"/><stop offset="1" stop-color="#FF6A10"/></linearGradient>
</defs>'''

def svg(body, bg=True):
    back = '<rect width="1024" height="1024" fill="url(#bg)"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">{DEFS}{back}{body}</svg>'

def scaled(body, k):
    return f'<g transform="translate({512-512*k} {512-512*k}) scale({k})">{body}</g>'

files = {
    'icon': svg(scaled(dial(), 0.86)),                      # iOS/genel: tam kare (köşeleri sistem yuvarlar)
    'maskable': svg(scaled(dial(), 0.66)),                  # güvenli bölge içinde
    'fg': svg(scaled(dial(), 0.6), bg=False),               # Android uyarlanabilir: ön katman
    'bgonly': svg(''),                                      # Android uyarlanabilir: arka katman
    'mono': svg(scaled(dial(True), 0.6), bg=False),         # Android tek renk
    'splash': svg(scaled(dial(), 0.98), bg=False),          # açılış ekranı
}
for k, v in files.items():
    open(f'{OUT}/{k}.svg', 'w').write(v)
