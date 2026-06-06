/* ================================================================
   Tidsbrev.no — Decorative scroll journeys (journeys.js)
   ----------------------------------------------------------------
   Two illustrated stories scatter DOWN and ACROSS the page as you
   scroll, connected by hand-drawn, self-drawing dashed gold lines
   that swirl like a bumblebee's flight path (loops + gentle curves,
   no insect drawn).

     LETTER JOURNEY (5 stages, in order)
       1 write   → quill writing the letter
       2 fold    → the page folded into an envelope
       3 seal    → the envelope sealed with the wax stamp
       4 post    → the envelope posted / flying / sent
       5 arrive  → collected in the future (mailbox)

     TIME-CAPSULE JOURNEY (3 stages, in order)
       1 film    → the camera filming the moment (record dot)
       2 store   → the footage stored / sealed away (years pass)
       3 play    → replayed in the future (glowing playback frame)

   The stages are scattered left ↔ right across the whole screen and
   GLIDE as you scroll (each drifts dx/dy px through the viewport), so
   they feel alive and moving around — not parked in the gutters. They
   are large (scaled to the viewport), sit above the page as a light
   pointer-events:none overlay, and the swirly dashed connectors swoop
   ACROSS the page between them. Sizes scale down on smaller screens;
   below 760px everything is hidden.

   Driven by a lightweight passive scroll listener + requestAnimation-
   Frame (NO ScrollTrigger pin / scrub, NO scroll hijacking — native
   scroll speed untouched). Only transform, opacity and stroke-dash-
   offset are animated, with will-change on the wrappers. Adds NO page
   sections, text or vertical space. Respects reduced-motion.
   ================================================================ */

(function () {
  'use strict';

  if (!document.body) return;

  var de = document.documentElement;
  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ════════════════════════════════════════════════════════════════
  //  1.  CSS  (all selectors prefixed .tb-deco / .tb-cn / .tb-st /
  //      .tb-cam / .tb-vd / .tb-j1 — nothing leaks into page styles)
  // ════════════════════════════════════════════════════════════════

  var css = document.createElement('style');
  css.textContent = [
    /* stage wrappers — absolutely positioned down the document, scaled
       to fit a side band; left/right + width set inline per element. */
    '.tb-deco{position:absolute;z-index:5;opacity:0;pointer-events:none;',
      'will-change:transform,opacity}',

    /* connector wrappers sit just under the stages */
    '.tb-cn{z-index:4}',

    '.tb-deco .tb-st-svg{display:block;width:100%;height:auto;overflow:visible}',
    '.tb-cn-svg{display:block;width:100%;height:100%;overflow:visible}',

    '.tb-vd-glow,.tb-cam-grp,.tb-vd-card{will-change:transform}',

    /* blinking record light — only when motion is allowed */
    '@media (prefers-reduced-motion: no-preference){',
      '.tb-cam-rec{animation:tbRecPulse 1.5s ease-in-out infinite;',
        'transform-origin:center}',
    '}',
    '@keyframes tbRecPulse{0%,100%{opacity:1}50%{opacity:.18}}',

    /* phones: no room — hide entirely, never overlap small-screen text */
    '@media(max-width:759px){.tb-deco{display:none!important}}'
  ].join('');
  document.head.appendChild(css);

  // ════════════════════════════════════════════════════════════════
  //  2.  LETTER SVGs
  // ════════════════════════════════════════════════════════════════

  // 1 — the letter is WRITTEN, then FOLDED into an envelope, on a loop
  //     (time-driven so it keeps replaying in the hero)
  var SVG_WRITE = [
    '<svg viewBox="0 0 400 440" fill="none" xmlns="http://www.w3.org/2000/svg">',
    '  <g class="tb-let-inner">',
    '    <rect x="90" y="250" width="220" height="156" rx="10" fill="#f6efe3" stroke="#e8dcc4" stroke-width="1.5"/>',
    '    <g class="tb-let-paper">',
    '      <rect x="116" y="20" width="168" height="216" rx="7" fill="#fff" stroke="#e8dcc4" stroke-width="1.5"/>',
    '      <line class="tb-let-write" x1="140" y1="60"  x2="244" y2="60"  stroke="#6b1f2a" stroke-width="2"   stroke-linecap="round"/>',
    '      <line class="tb-let-write" x1="140" y1="92"  x2="262" y2="92"  stroke="#6b1f2a" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>',
    '      <line class="tb-let-write" x1="140" y1="124" x2="252" y2="124" stroke="#6b1f2a" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>',
    '      <line class="tb-let-write" x1="140" y1="156" x2="262" y2="156" stroke="#6b1f2a" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>',
    '      <line class="tb-let-write" x1="140" y1="188" x2="224" y2="188" stroke="#6b1f2a" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>',
    '      <path class="tb-let-write" d="M140 214q22-12 44 0t44-8" stroke="#6b1f2a" stroke-width="1.8" stroke-linecap="round"/>',
    '    </g>',
    '    <g class="tb-let-quill">',
    '      <path d="M300 32c12-18 6-40-2-50c4 14-2 28-12 38l-8 28z" fill="#b08a3e" opacity=".85"/>',
    '      <line x1="284" y1="42" x2="278" y2="78" stroke="#4e141c" stroke-width="2.2" stroke-linecap="round"/>',
    '      <path d="M274 78l4 10 4-10" fill="#4e141c"/>',
    '    </g>',
    '    <path d="M90 406 V286 L200 372 L310 286 V406 Z" fill="#fbf6ec" stroke="#e8dcc4" stroke-width="1.5"/>',
    '    <g class="tb-let-flap">',
    '      <path d="M90 250 L200 338 L310 250 Z" fill="#f0e6d2" stroke="#e8dcc4" stroke-width="1.5"/>',
    '    </g>',
    '  </g>',
    '</svg>'
  ].join('');

  // 2 — the page folded into an envelope (paper slides in, flap closes)
  var SVG_FOLD = [
    '<svg viewBox="0 0 400 360" fill="none" xmlns="http://www.w3.org/2000/svg">',
    '  <rect x="74" y="176" width="252" height="150" rx="10" fill="#f6efe3" stroke="#e8dcc4" stroke-width="1.5"/>',
    '  <g class="tb-j1-fold-paper">',
    '    <rect x="128" y="44" width="144" height="150" rx="6" fill="#fff" stroke="#e8dcc4" stroke-width="1.5"/>',
    '    <line x1="150" y1="78"  x2="250" y2="78"  stroke="#6b1f2a" stroke-width="2"   stroke-linecap="round"/>',
    '    <line x1="150" y1="104" x2="250" y2="104" stroke="#6b1f2a" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>',
    '    <line x1="150" y1="128" x2="250" y2="128" stroke="#6b1f2a" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>',
    '    <line x1="150" y1="152" x2="226" y2="152" stroke="#6b1f2a" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>',
    '  </g>',
    '  <path d="M74 326 V214 L200 300 L326 214 V326 Z" fill="#fbf6ec" stroke="#e8dcc4" stroke-width="1.5"/>',
    '  <g class="tb-j1-fold-flap">',
    '    <path d="M74 176 L200 262 L326 176 Z" fill="#f0e6d2" stroke="#e8dcc4" stroke-width="1.5"/>',
    '  </g>',
    '</svg>'
  ].join('');

  // 3 — sealed envelope (wax seal stamps in)
  var SVG_SEAL = [
    '<svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">',
    '  <rect x="68" y="118" width="264" height="170" rx="8" fill="#f6efe3" stroke="#e8dcc4" stroke-width="1.5"/>',
    '  <path d="M68 126l132 86 132-86" stroke="#d4c8aa" stroke-width="1.2" fill="none"/>',
    '  <path d="M68 118l132 90 132-90" fill="#fbf6ec" stroke="#e8dcc4" stroke-width="1.5"/>',
    '  <g class="tb-j1-seal-g">',
    '    <circle cx="200" cy="245" r="26" fill="#6b1f2a"/>',
    '    <text x="200" y="252" text-anchor="middle" fill="#f6efe3" font-family="Playfair Display,serif" font-size="20" font-weight="700">T</text>',
    '    <circle cx="200" cy="245" r="22" fill="none" stroke="#f6efe3" stroke-width=".8" opacity=".4"/>',
    '  </g>',
    '</svg>'
  ].join('');

  // 4 — posted / flying / sent (BIG winged envelope soars up-right with
  //     a clear dashed speed-trail; wings flap as it flies)
  var SVG_POST = [
    '<svg viewBox="0 0 400 360" fill="none" xmlns="http://www.w3.org/2000/svg">',
    '  <g class="tb-j1-post-trail">',
    '    <path d="M24 326 C 110 314, 152 256, 212 196" stroke="#b08a3e" stroke-width="2.8" stroke-dasharray="2 9" stroke-linecap="round" fill="none"/>',
    '    <path d="M40 300 C 112 290, 150 244, 196 196" stroke="#b08a3e" stroke-width="2"   stroke-dasharray="2 9" stroke-linecap="round" fill="none" opacity=".6"/>',
    '    <path d="M52 346 C 142 334, 198 286, 246 238" stroke="#b08a3e" stroke-width="2"   stroke-dasharray="2 9" stroke-linecap="round" fill="none" opacity=".5"/>',
    '  </g>',
    '  <g class="tb-j1-post-env">',
    '    <g class="tb-j1-post-wing">',
    '      <path d="M-44 -8 q-48 -24 -82 -4 q36 10 82 20 z" fill="#fbf6ec" stroke="#e8dcc4" stroke-width="1.4"/>',
    '    </g>',
    '    <rect x="-52" y="-35" width="104" height="70" rx="8" fill="#f6efe3" stroke="#e8dcc4" stroke-width="1.8"/>',
    '    <path d="M-52 -35 L0 9 L52 -35" fill="none" stroke="#d4c8aa" stroke-width="1.8"/>',
    '    <path d="M-52 35 L-12 3 M52 35 L12 3" stroke="#e8dcc4" stroke-width="1.4"/>',
    '    <circle cx="0" cy="-4" r="12" fill="#6b1f2a"/>',
    '    <text x="0" y="1" text-anchor="middle" fill="#f6efe3" font-family="Playfair Display,serif" font-size="14" font-weight="700">T</text>',
    '  </g>',
    '</svg>'
  ].join('');

  // 5 — arrival at the mailbox (envelope flies into the slot, flag pops)
  var SVG_ARRIVE = [
    '<svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">',
    '  <rect x="175" y="220" width="30" height="120" rx="3" fill="#4e141c"/>',
    '  <rect x="115" y="145" width="150" height="85" rx="12" fill="#6b1f2a"/>',
    '  <rect x="135" y="178" width="110" height="10" rx="3" fill="#4e141c"/>',
    '  <path d="M115 160a75 75 0 01150 0" fill="#7a2636"/>',
    '  <g class="tb-j1-flag" transform="translate(265,155)">',
    '    <rect x="0" y="0" width="5"  height="36" rx="1.5" fill="#b08a3e"/>',
    '    <rect x="5" y="2" width="22" height="14" rx="3"   fill="#b08a3e"/>',
    '  </g>',
    '  <g class="tb-j1-fly-env">',
    '    <rect x="-30" y="-18" width="60" height="36" rx="4" fill="#f6efe3" stroke="#e8dcc4" stroke-width="1"/>',
    '    <path d="M-30-18l30 22 30-22" fill="none" stroke="#d4c8aa" stroke-width="1"/>',
    '  </g>',
    '</svg>'
  ].join('');

  // ════════════════════════════════════════════════════════════════
  //  3.  CAMERA / MEMORY SVGs
  // ════════════════════════════════════════════════════════════════

  // A — vintage camera, FILMING (red record light pulses)
  var SVG_FILM = [
    '<svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg">',
    '  <g class="tb-cam-grp">',
    '    <rect x="34" y="66" width="172" height="104" rx="16" fill="#1f3a2e"/>',
    '    <rect x="34" y="60" width="172" height="22"  rx="9"  fill="#f6efe3"/>',
    '    <rect x="34" y="118" width="172" height="20" fill="#162c22" opacity=".5"/>',
    '    <rect x="92" y="42" width="56"  height="26"  rx="6"  fill="#e8dcc4"/>',
    '    <rect x="46" y="48" width="28"  height="14"  rx="3"  fill="#1f3a2e" stroke="#b08a3e" stroke-width="1.5"/>',
    '    <rect x="166" y="48" width="15" height="11"  rx="3"  fill="#b08a3e"/>',
    '    <circle cx="196" cy="55" r="8" fill="#6b1f2a"/>',
    '    <circle cx="120" cy="122" r="42" fill="#4e141c"/>',
    '    <circle cx="120" cy="122" r="35" fill="none" stroke="#b08a3e" stroke-width="3.5"/>',
    '    <circle cx="120" cy="122" r="26" fill="#13261d"/>',
    '    <circle cx="120" cy="122" r="15" fill="#28503f"/>',
    '    <circle cx="111" cy="113" r="5.5" fill="#f6efe3" opacity=".5"/>',
    '    <g class="tb-cam-rec"><circle cx="150" cy="71" r="6" fill="#6b1f2a"/></g>',
    '  </g>',
    '</svg>'
  ].join('');

  // B — the footage is STORED over the years (cassette into archive, clock turns)
  var SVG_STORE = [
    '<svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg">',
    '  <rect x="48" y="120" width="144" height="58" rx="11" fill="#6b1f2a"/>',
    '  <rect x="48" y="120" width="144" height="15" rx="7"  fill="#7a2636"/>',
    '  <rect x="86" y="121" width="68"  height="6"  rx="3"  fill="#1f3a2e" opacity=".5"/>',
    '  <rect x="96" y="150" width="48"  height="6"  rx="3"  fill="#b08a3e"/>',
    '  <g class="tb-st-tape">',
    '    <rect x="92" y="58" width="56" height="44" rx="6" fill="#1f3a2e"/>',
    '    <circle cx="106" cy="80" r="9" fill="#28503f" stroke="#b08a3e" stroke-width="1.5"/>',
    '    <circle cx="134" cy="80" r="9" fill="#28503f" stroke="#b08a3e" stroke-width="1.5"/>',
    '    <rect x="92" y="58" width="56" height="44" rx="6" fill="none" stroke="#b08a3e" stroke-width="2"/>',
    '  </g>',
    '  <g opacity=".6">',
    '    <circle cx="190" cy="56" r="21" fill="none" stroke="#b08a3e" stroke-width="2"/>',
    '    <circle cx="190" cy="56" r="2.5" fill="#b08a3e"/>',
    '    <line class="tb-st-hand" x1="190" y1="56" x2="190" y2="41" stroke="#6b1f2a" stroke-width="2.6" stroke-linecap="round"/>',
    '    <line x1="190" y1="56" x2="202" y2="56" stroke="#6b1f2a" stroke-width="2" stroke-linecap="round"/>',
    '  </g>',
    '</svg>'
  ].join('');

  // C — the memory RETURNS & replays (frame warms, play, figures, photos fan)
  var SVG_PLAY = [
    '<svg viewBox="0 0 240 210" fill="none" xmlns="http://www.w3.org/2000/svg">',
    '  <defs>',
    '    <radialGradient id="tbDecoGlow" cx="50%" cy="50%" r="50%">',
    '      <stop offset="0%"   stop-color="#b08a3e" stop-opacity=".55"/>',
    '      <stop offset="100%" stop-color="#b08a3e" stop-opacity="0"/>',
    '    </radialGradient>',
    '  </defs>',
    '  <circle class="tb-vd-glow" cx="120" cy="92" r="88" fill="url(#tbDecoGlow)" opacity="0"/>',
    '  <g class="tb-vd-card" data-fx="74"  data-fy="178" data-fr="-13">',
    '    <rect x="-28" y="-21" width="56" height="42" rx="5" fill="#f6efe3" stroke="#e8dcc4" stroke-width="2"/>',
    '    <circle cx="-11" cy="-5" r="7" fill="#b08a3e" opacity=".5"/>',
    '    <path d="M-24 13l13-13 10 10 8-7 17 10" stroke="#1f3a2e" stroke-width="1.6" opacity=".4" fill="none"/>',
    '  </g>',
    '  <g class="tb-vd-card" data-fx="120" data-fy="192" data-fr="8">',
    '    <rect x="-28" y="-21" width="56" height="42" rx="5" fill="#f6efe3" stroke="#e8dcc4" stroke-width="2"/>',
    '    <circle cx="-11" cy="-5" r="7" fill="#6b1f2a" opacity=".4"/>',
    '    <path d="M-24 13l13-13 10 10 8-7 17 10" stroke="#1f3a2e" stroke-width="1.6" opacity=".4" fill="none"/>',
    '  </g>',
    '  <g class="tb-vd-card" data-fx="166" data-fy="174" data-fr="20">',
    '    <rect x="-28" y="-21" width="56" height="42" rx="5" fill="#f6efe3" stroke="#e8dcc4" stroke-width="2"/>',
    '    <circle cx="-11" cy="-5" r="7" fill="#b08a3e" opacity=".5"/>',
    '    <path d="M-24 13l13-13 10 10 8-7 17 10" stroke="#1f3a2e" stroke-width="1.6" opacity=".4" fill="none"/>',
    '  </g>',
    '  <rect x="42" y="40" width="156" height="104" rx="12" fill="#1f3a2e"/>',
    '  <rect class="tb-vd-warm" x="42" y="40" width="156" height="104" rx="12" fill="#f6efe3" opacity="0"/>',
    '  <g class="tb-vd-fig" opacity="0">',
    '    <circle cx="100" cy="78" r="11" fill="#1f3a2e"/>',
    '    <path d="M78 116q22-30 44 0z" fill="#1f3a2e"/>',
    '    <circle cx="140" cy="88" r="8" fill="#1f3a2e" opacity=".8"/>',
    '    <path d="M124 116q16-22 32 0z" fill="#1f3a2e" opacity=".8"/>',
    '  </g>',
    '  <rect x="58" y="132" width="124" height="4" rx="2" fill="#1f3a2e" opacity=".25"/>',
    '  <rect class="tb-vd-pbar" x="58" y="132" width="124" height="4" rx="2" fill="#b08a3e"/>',
    '  <path class="tb-vd-play" d="M104 70 L104 102 L132 86 Z" fill="#6b1f2a" opacity="0"/>',
    '  <rect x="42" y="40" width="156" height="104" rx="12" fill="none" stroke="#b08a3e" stroke-width="2.5"/>',
    '</svg>'
  ].join('');

  // ════════════════════════════════════════════════════════════════
  //  4.  HELPERS
  // ════════════════════════════════════════════════════════════════

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function setT(el, t) { if (el) el.setAttribute('transform', t); }
  function setO(el, o) { if (el) el.style.opacity = o; }

  function primeStroke(el) {
    var len;
    if (el.tagName.toLowerCase() === 'line') {
      var dx = parseFloat(el.getAttribute('x2')) - parseFloat(el.getAttribute('x1'));
      var dy = parseFloat(el.getAttribute('y2')) - parseFloat(el.getAttribute('y1'));
      len = Math.sqrt(dx * dx + dy * dy);
    } else {
      try { len = el.getTotalLength(); } catch (e) { len = 200; }
    }
    el._len = len;
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
  }

  // ---- swirly bee-flight path generator ---------------------------
  // Catmull-Rom spline through a set of points → smooth cubic path.
  function crPath(pts) {
    if (pts.length < 2) return '';
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6;
      var c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6;
      var c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += 'C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' +
                 c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' +
                 p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  // Sample points from (x1,y1)→(x2,y2) with a tapering perpendicular
  // wobble plus one small loop near the start third — reads as a
  // bumblebee meander when splined.
  function beePoints(x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / len, uy = dy / len;     // along
    var px = -uy, py = ux;                // perpendicular
    var amp = Math.min(58, Math.max(26, len * 0.14));
    var pts = [];
    var N = 7;
    for (var i = 0; i <= N; i++) {
      var t = i / N;
      var bx = x1 + dx * t, by = y1 + dy * t;
      var env = Math.sin(t * Math.PI);    // 0 at ends, 1 at middle
      var wob = Math.sin(t * Math.PI * 2.3 + 0.6) * amp * env;
      pts.push([bx + px * wob, by + py * wob]);
      if (i === 3) {                      // insert a small loop/curl
        var r = amp * 0.55;
        var cx = bx + px * wob, cy = by + py * wob;
        pts.push([cx + ux * r * 0.4 + px * r,     cy + uy * r * 0.4 + py * r]);
        pts.push([cx + ux * r * 1.1,              cy + uy * r * 1.1]);
        pts.push([cx + ux * r * 0.4 - px * r * 0.7, cy + uy * r * 0.4 - py * r * 0.7]);
      }
    }
    return pts;
  }

  // ════════════════════════════════════════════════════════════════
  //  5.  STAGE DEFINITIONS
  //      story + ord  = which journey & sequence (for connectors)
  //      xf           = horizontal CENTRE as a fraction of viewport width
  //      frac         = vertical position as a fraction of doc height
  //      baseW        = target width in px on a wide screen (scales down)
  //      dx, dy       = scroll-tied drift range in px — the illustration
  //                     glides this far across the screen as it passes
  //                     through the viewport (the "moving around" feel)
  //
  //      Both journeys are interleaved and scattered left ↔ right down
  //      the page so the eye moves across the whole screen; the swirly
  //      dashed connectors swoop between them.
  // ════════════════════════════════════════════════════════════════

  // The LETTER journey flows straight down the LEFT, the CAMERA / time-
  // capsule journey straight down the RIGHT — so each story is easy to
  // follow and both illustrations + connectors stay clear of the centred
  // text column. `loop` (ms) marks a time-driven repeating stage.
  var STAGE_DEFS = [
    { story: 'letter',  ord: 1, xf: 0.130, frac: 0.045, baseW: 250, dx: -26, dy: -20, loop: 6200, svg: SVG_WRITE,  build: buildWrite  },
    { story: 'capsule', ord: 1, xf: 0.870, frac: 0.105, baseW: 245, dx:  28, dy: -20,             svg: SVG_FILM,   build: buildFilm   },
    { story: 'letter',  ord: 2, xf: 0.130, frac: 0.190, baseW: 215, dx: -26, dy: -22,             svg: SVG_FOLD,   build: buildFold   },
    { story: 'letter',  ord: 3, xf: 0.150, frac: 0.320, baseW: 210, dx: -24, dy: -20,             svg: SVG_SEAL,   build: buildSeal   },
    { story: 'capsule', ord: 2, xf: 0.875, frac: 0.345, baseW: 225, dx:  26, dy: -22,             svg: SVG_STORE,  build: buildStore  },
    { story: 'letter',  ord: 4, xf: 0.155, frac: 0.490, baseW: 320, dx: -28, dy: -26,             svg: SVG_POST,   build: buildPost   },
    { story: 'capsule', ord: 3, xf: 0.865, frac: 0.575, baseW: 255, dx:  26, dy: -24,             svg: SVG_PLAY,   build: buildPlay   },
    { story: 'letter',  ord: 5, xf: 0.130, frac: 0.660, baseW: 235, dx: -24, dy: -22,             svg: SVG_ARRIVE, build: buildArrive }
  ];

  // ---- per-stage builders return an apply(sp) closure -------------

  // Hero letter — interprets its argument as a LOOP PHASE (0..1):
  // write → fold into the envelope → close flap → brief hold → fade & repeat.
  function buildWrite(el) {
    var inner  = el.querySelector('.tb-let-inner');
    var paper  = el.querySelector('.tb-let-paper');
    var flap   = el.querySelector('.tb-let-flap');
    var quill  = el.querySelector('.tb-let-quill');
    var writes = el.querySelectorAll('.tb-let-write');
    writes.forEach(primeStroke);
    return function (ph) {
      var writeP = clamp(ph / 0.40, 0, 1);
      var foldP  = clamp((ph - 0.46) / 0.22, 0, 1);
      var flapP  = clamp((ph - 0.62) / 0.18, 0, 1);
      var resetP = clamp((ph - 0.90) / 0.10, 0, 1);
      setO(quill, clamp(ph / 0.08, 0, 1) * (1 - foldP));
      setT(quill, 'translate(0 ' + lerp(-26, 0, clamp(ph / 0.12, 0, 1)) + ')');
      writes.forEach(function (w) {
        w.style.strokeDashoffset = w._len * (1 - writeP);
        w.style.opacity = (1 - foldP);
      });
      setT(paper, 'translate(0 ' + lerp(0, 238, foldP) + ') scale(1 ' + lerp(1, 0.86, foldP) + ')');
      setT(flap, 'translate(200 250) scale(1 ' + flapP + ') translate(-200 -250)');
      if (inner) inner.style.opacity = (1 - resetP);
    };
  }

  function buildFold(el) {
    var paper = el.querySelector('.tb-j1-fold-paper');
    var flap  = el.querySelector('.tb-j1-fold-flap');
    return function (sp) {
      var slide = clamp(sp / 0.6, 0, 1);
      setT(paper, 'translate(0 ' + lerp(-40, 46, slide) + ')');
      var f = clamp((sp - 0.55) / 0.4, 0, 1);
      setT(flap, 'translate(200 176) scale(1 ' + f + ') translate(-200 -176)');
    };
  }

  function buildSeal(el) {
    var seal = el.querySelector('.tb-j1-seal-g');
    return function (sp) {
      var s = clamp((sp - 0.05) / 0.7, 0, 1);
      setT(seal, 'translate(200 245) scale(' + s + ') translate(-200 -245)');
    };
  }

  function buildPost(el) {
    var env   = el.querySelector('.tb-j1-post-env');
    var trail = el.querySelector('.tb-j1-post-trail');
    var wing  = el.querySelector('.tb-j1-post-wing');
    return function (sp) {
      var t = clamp(sp / 0.92, 0, 1);
      setT(env, 'translate(' + lerp(96, 322, t) + ' ' + lerp(312, 112, t) +
                ') rotate(' + lerp(14, -24, t) + ')');
      setO(env, clamp(sp / 0.12, 0, 1));
      setO(trail, clamp((sp - 0.08) / 0.4, 0, 1));
      if (wing) setT(wing, 'rotate(' + (Math.sin(sp * Math.PI * 5) * 16).toFixed(2) + ' -44 -8)');
    };
  }

  function buildArrive(el) {
    var fly  = el.querySelector('.tb-j1-fly-env');
    var flag = el.querySelector('.tb-j1-flag');
    return function (sp) {
      var t = clamp(sp / 0.85, 0, 1);
      setT(fly, 'translate(' + lerp(300, 190, t) + ' ' + lerp(20, 178, t) +
                ') rotate(' + lerp(-28, 0, t) + ')');
      setO(fly, clamp(sp / 0.15, 0, 1));
      setO(flag, clamp((sp - 0.8) / 0.2, 0, 1));
    };
  }

  function buildFilm(el) {
    var grp = el.querySelector('.tb-cam-grp');
    return function (sp) {
      var a = clamp(sp / 0.35, 0, 1);
      setT(grp, 'translate(120 116) scale(' + lerp(0.82, 1, a) + ') translate(-120 -116)');
    };
  }

  function buildStore(el) {
    var tape = el.querySelector('.tb-st-tape');
    var hand = el.querySelector('.tb-st-hand');
    return function (sp) {
      var slide = clamp(sp / 0.6, 0, 1);
      setT(tape, 'translate(0 ' + lerp(-58, 0, slide) + ')');
      setO(tape, 1 - clamp((sp - 0.7) / 0.3, 0, 1) * 0.45);
      setT(hand, 'rotate(' + lerp(0, 300, clamp(sp, 0, 1)) + ' 190 56)');
    };
  }

  function buildPlay(el) {
    var glow = el.querySelector('.tb-vd-glow');
    var warm = el.querySelector('.tb-vd-warm');
    var fig  = el.querySelector('.tb-vd-fig');
    var play = el.querySelector('.tb-vd-play');
    var pbar = el.querySelector('.tb-vd-pbar');
    var cards = el.querySelectorAll('.tb-vd-card');
    return function (sp) {
      var g    = clamp(sp / 0.5, 0, 1);
      var wm   = clamp((sp - 0.1) / 0.55, 0, 1);
      var pl   = clamp((sp - 0.15) / 0.25, 0, 1) * (1 - clamp((sp - 0.6) / 0.2, 0, 1));
      var fg   = clamp((sp - 0.5) / 0.3, 0, 1);
      var bar  = clamp((sp - 0.55) / 0.45, 0, 1);
      var card = clamp((sp - 0.55) / 0.45, 0, 1);
      setT(glow, 'translate(120 92) scale(' + lerp(0.4, 1, g) + ') translate(-120 -92)');
      setO(glow, 0.9 * g);
      setO(warm, wm);
      setO(play, pl);
      setO(fig, fg);
      setT(pbar, 'translate(58 0) scale(' + bar + ' 1) translate(-58 0)');
      for (var c = 0; c < cards.length; c++) {
        var ce = cards[c];
        var dfx = parseFloat(ce.getAttribute('data-fx'));
        var dfy = parseFloat(ce.getAttribute('data-fy'));
        var dfr = parseFloat(ce.getAttribute('data-fr'));
        setT(ce, 'translate(' + lerp(120, dfx, card) + ' ' + lerp(150, dfy, card) +
                 ') rotate(' + lerp(0, dfr, card) + ') scale(' + lerp(0.5, 1, card) + ')');
        setO(ce, card);
      }
    };
  }

  // ════════════════════════════════════════════════════════════════
  //  6.  BUILD STAGE ELEMENTS + CONNECTOR POOL
  // ════════════════════════════════════════════════════════════════

  var stages = [];
  STAGE_DEFS.forEach(function (def) {
    var el = document.createElement('div');
    el.className = 'tb-deco';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = def.svg;
    var svg = el.querySelector('svg');
    if (svg) svg.classList.add('tb-st-svg');
    document.body.appendChild(el);
    stages.push({
      el: el, story: def.story, ord: def.ord,
      xf: def.xf, frac: def.frac, baseW: def.baseW, dx: def.dx, dy: def.dy,
      loop: def.loop || 0,
      apply: def.build(el),
      visible: true, w: def.baseW, cx: 0, top: 0, h: 0
    });
  });

  // Connector pool — at most (stages - 1) needed; reused across resizes.
  var conns = [];
  var MAXC = stages.length - 1;
  for (var ci = 0; ci < MAXC; ci++) {
    var ce = document.createElement('div');
    ce.className = 'tb-deco tb-cn';
    ce.setAttribute('aria-hidden', 'true');
    ce.innerHTML =
      '<svg class="tb-cn-svg" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<defs>' +
          '<mask id="tbcnm' + ci + '" maskUnits="userSpaceOnUse">' +
            '<path class="tb-cn-mask" fill="none" stroke="#fff" stroke-width="16" ' +
              'stroke-linecap="round" stroke-linejoin="round"/>' +
          '</mask>' +
        '</defs>' +
        '<path class="tb-cn-dots" mask="url(#tbcnm' + ci + ')" fill="none" stroke="#b08a3e" ' +
          'stroke-width="2.2" stroke-dasharray="1.5 9" stroke-linecap="round"/>' +
      '</svg>';
    ce.style.display = 'none';
    document.body.appendChild(ce);
    conns.push({
      el: ce,
      svg:  ce.querySelector('.tb-cn-svg'),
      mask: ce.querySelector('.tb-cn-mask'),
      dots: ce.querySelector('.tb-cn-dots'),
      active: false, top: 0
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  7.  LAYOUT  (place stages in side bands; wire connectors across)
  // ════════════════════════════════════════════════════════════════

  var vh = de.clientHeight;

  function layout() {
    var docH = de.scrollHeight;
    vh = de.clientHeight;
    var vw = de.clientWidth;

    // Illustrations scale with the viewport — big on desktop, smaller on
    // narrower screens (hidden < 760px via CSS).
    var scale = clamp(vw / 1500, 0.6, 1.08);

    stages.forEach(function (s) {
      var w = Math.round(s.baseW * scale);
      s.visible = true;
      s.el.style.display = '';
      s.w = w;
      s.el.style.width = w + 'px';

      // Centre on xf · viewport-width, then keep fully on-screen.
      var left = s.xf * vw - w / 2;
      left = clamp(left, 6, Math.max(6, vw - w - 6));
      s.el.style.left = left + 'px';
      s.el.style.right = 'auto';
      s.cx = left + w / 2;

      var top = s.frac * docH;
      top = Math.min(top, docH - 360);
      if (top < 0) top = 0;
      s.top = top;
      s.el.style.top = top + 'px';
      s.h = s.el.getBoundingClientRect().height || w;
    });

    // Pair consecutive VISIBLE stages within each story, assign to pool.
    var pairs = [];
    ['letter', 'capsule'].forEach(function (story) {
      var vis = stages.filter(function (s) { return s.story === story && s.visible; })
                      .sort(function (a, b) { return a.ord - b.ord; });
      for (var k = 0; k < vis.length - 1; k++) pairs.push([vis[k], vis[k + 1]]);
    });

    conns.forEach(function (c, idx) {
      if (idx >= pairs.length) {
        c.active = false;
        c.el.style.display = 'none';
        return;
      }
      c.active = true;
      c.el.style.display = '';

      var A = pairs[idx][0], B = pairs[idx][1];
      var ax = A.cx, ay = A.top + A.h * 0.66;
      var bx = B.cx, by = B.top + B.h * 0.34;
      var pad = 34;
      var left = Math.min(ax, bx) - pad;
      var top  = Math.min(ay, by) - pad;
      var W = Math.abs(bx - ax) + pad * 2;
      var H = Math.abs(by - ay) + pad * 2;

      c.top = top;
      c.el.style.left = left + 'px';
      c.el.style.top = top + 'px';
      c.el.style.width = W + 'px';
      c.el.style.height = H + 'px';
      c.svg.setAttribute('viewBox', '0 0 ' + W.toFixed(1) + ' ' + H.toFixed(1));

      var d = crPath(beePoints(ax - left, ay - top, bx - left, by - top));
      c.mask.setAttribute('d', d);
      c.dots.setAttribute('d', d);
      primeStroke(c.mask);                 // dasharray/offset = full length
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  8.  RENDER
  // ════════════════════════════════════════════════════════════════

  function frame() {
    var sy = window.scrollY || de.scrollTop || 0;

    stages.forEach(function (s) {
      if (!s.visible) return;
      var enter = clamp((sy + vh - s.top) / (vh * 0.32), 0, 1);
      var sp    = clamp((sy + vh - s.top) / (vh * 0.85), 0, 1);
      // rel ≈ +0.5 (entering, low) → -0.5 (leaving, high) as it crosses
      // the viewport — drives the drift so the stage glides across screen.
      var rel = clamp(((s.top + s.h / 2) - (sy + vh / 2)) / vh, -1, 1);
      s.el.style.transform =
        'translate(' + (rel * s.dx).toFixed(1) + 'px,' +
                       (rel * s.dy).toFixed(1) + 'px) ' +
        'rotate(' + (rel * 1.5).toFixed(2) + 'deg)';
      s.el.style.opacity = 0.92 * enter;
      if (!s.loop) s.apply(sp);          // loop stages are driven by loopTick
    });

    conns.forEach(function (c) {
      if (!c.active) return;
      var cp = clamp((sy + vh - c.top) / (vh * 0.8), 0, 1);
      if (c.mask._len) c.mask.style.strokeDashoffset = c.mask._len * (1 - cp);
      c.el.style.opacity = 0.42 * clamp(cp / 0.1, 0, 1);   // subtle, sits behind the eye
    });
  }

  function staticFrame() {
    stages.forEach(function (s) {
      if (!s.visible) return;
      s.el.style.transform = 'none';
      s.el.style.opacity = 0.92;
      s.apply(s.loop ? 0.42 : 0.85);     // loop stages: written, mid-journey
    });
    conns.forEach(function (c) {
      if (!c.active) return;
      if (c.mask._len) c.mask.style.strokeDashoffset = 0;
      c.el.style.opacity = 0.5;
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  9.  DRIVER  (passive scroll + rAF — no hijacking, native speed)
  // ════════════════════════════════════════════════════════════════

  layout();

  if (reducedMotion) {
    staticFrame();
    return;
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { frame(); ticking = false; });
  }
  function onResize() {
    layout();
    onScroll();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });

  // Continuous loop for time-driven stages (the hero letter write→fold).
  // Lightweight: only touches looping stages, animating transform/opacity.
  var loopStages = stages.filter(function (s) { return s.loop; });
  if (loopStages.length) {
    (function loopTick(now) {
      for (var i = 0; i < loopStages.length; i++) {
        var s = loopStages[i];
        if (s.visible) s.apply((now % s.loop) / s.loop);
      }
      requestAnimationFrame(loopTick);
    })(0);
  }

  frame(); // initial paint
})();
