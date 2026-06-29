// Team Avatar promo — Lottie (Bodymovin v5.7.0) generator.
// Text is vectorized via opentype.js (no font dependency at playback);
// avatar art is embedded as base64 image layers.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const __dirnameShim = path.dirname(new URL(import.meta.url).pathname);
// opentype.js lives in the sibling text-to-lottie checkout (override via TEXT_TO_LOTTIE).
const REPO = process.env.TEXT_TO_LOTTIE || '/Users/tmcfarlane/repo/text-to-lottie';
const opentype = require(path.join(REPO, 'node_modules/opentype.js'));

const IMG = path.join(__dirnameShim, 'src-img');
const OUT = __dirnameShim;
const dims = JSON.parse(fs.readFileSync(path.join(__dirnameShim, 'dims.json'), 'utf8'));

const W = 1280, H = 720, FR = 30, DUR = 460;

// ---- fonts ----
const loadFont = (p) => opentype.parse(fs.readFileSync(p).buffer.slice(fs.readFileSync(p).byteOffset || 0));
const ld = (p) => { const b = fs.readFileSync(p); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const fBlack = ld('/Library/Fonts/Lato-Black.ttf');
const fBold  = ld('/Library/Fonts/Lato-Bold.ttf');
const fHeavy = ld('/Library/Fonts/Lato-Heavy.ttf');
const fMono  = ld('/System/Library/Fonts/Supplemental/Courier New Bold.ttf');

// ---- color ----
const hex = (h) => {
  h = h.replace('#', '');
  return [parseInt(h.slice(0,2),16)/255, parseInt(h.slice(2,4),16)/255, parseInt(h.slice(4,6),16)/255];
};
const C = {
  white:  hex('#F6F1E6'),
  cream:  hex('#EBE3D2'),
  gold:   hex('#E8B04B'),
  ember:  hex('#FF8A3D'),
  emberLt:hex('#FFC074'),
  green:  hex('#7FC24B'),
  blue:   hex('#5BB6E8'),
  red:    hex('#E8453C'),
  gray:   hex('#7C8390'),
  bgIn:   hex('#3A1C0A'),
  bgOut:  hex('#06080C'),
  term:   hex('#0D1017'),
  termHd: hex('#171B24'),
  border: hex('#2A313E'),
};

// ---- easing ----
const EO = { x:[0.16], y:[1] };   // arriving (ease-out)
const EI = { x:[0.3],  y:[0] };   // leaving
const POPI = { x:[0.34], y:[1] };
const POPO = { x:[0.0],  y:[0] };

// build animated scalar/vector property from keyframe list
function anim(keys) {
  const k = keys.map((kk, idx) => {
    const o = { t: kk.t, s: kk.s };
    if (idx < keys.length - 1) { o.o = kk.o || EI; o.i = kk.i || EO; }
    return o;
  });
  return { a: 1, k };
}
const stat = (v) => ({ a: 0, k: v });

function opIn(a, b)            { return anim([{ t:a, s:[0] }, { t:b, s:[100] }]); }
function opOut(a, b)          { return anim([{ t:a, s:[100] }, { t:b, s:[0] }]); }
function opInOut(a,b,c,d)     { return anim([{ t:a, s:[0] }, { t:b, s:[100] }, { t:c, s:[100] }, { t:d, s:[0] }]); }
function popS(a, b, from, two) {
  const m = Math.round(a + (b - a) * 0.62);
  return anim([
    { t:a, s:[from, from], o:POPO, i:POPI },
    { t:m, s:[104, 104] },
    { t:b, s:two || [100, 100] },
  ]);
}
// pop scaled relative to a target scale (for "cover" image scales)
function popTo(a, b, target) {
  const m = Math.round(a + (b - a) * 0.62);
  return anim([
    { t:a, s:[target*0.4, target*0.4], o:POPO, i:POPI },
    { t:m, s:[target*1.04, target*1.04] },
    { t:b, s:[target, target] },
  ]);
}

// ---- glyph path -> lottie bezier contours ----
function pathToContours(cmds) {
  const contours = [];
  let c = null, px = 0, py = 0;
  const open = (x, y) => { c = { v:[[x,y]], i:[[0,0]], o:[[0,0]], c:true }; contours.push(c); px=x; py=y; };
  for (const cmd of cmds) {
    if (cmd.type === 'M') { open(cmd.x, cmd.y); }
    else if (cmd.type === 'L') { c.v.push([cmd.x,cmd.y]); c.i.push([0,0]); c.o.push([0,0]); px=cmd.x; py=cmd.y; }
    else if (cmd.type === 'C') {
      const li = c.o.length-1; c.o[li] = [cmd.x1-px, cmd.y1-py];
      c.v.push([cmd.x,cmd.y]); c.i.push([cmd.x2-cmd.x, cmd.y2-cmd.y]); c.o.push([0,0]); px=cmd.x; py=cmd.y;
    } else if (cmd.type === 'Q') {
      const c1x = px + 2/3*(cmd.x1-px), c1y = py + 2/3*(cmd.y1-py);
      const c2x = cmd.x + 2/3*(cmd.x1-cmd.x), c2y = cmd.y + 2/3*(cmd.y1-cmd.y);
      const li = c.o.length-1; c.o[li] = [c1x-px, c1y-py];
      c.v.push([cmd.x,cmd.y]); c.i.push([c2x-cmd.x, c2y-cmd.y]); c.o.push([0,0]); px=cmd.x; py=cmd.y;
    } else if (cmd.type === 'Z') {
      if (c) {
        const f = c.v[0], l = c.v[c.v.length-1];
        if (Math.abs(f[0]-l[0]) < 0.01 && Math.abs(f[1]-l[1]) < 0.01) {
          c.i[0] = c.i[c.v.length-1]; c.v.pop(); c.i.pop(); c.o.pop();
        }
      }
    }
  }
  return contours;
}

// text -> { contours, w, h } centered at origin. tracking in px.
function textShapes(font, text, size, tracking = 0) {
  let penX = 0;
  let all = [];
  for (const ch of text) {
    if (ch === ' ') { penX += font.getAdvanceWidth(' ', size) + tracking; continue; }
    const gp = font.getPath(ch, penX, 0, size);
    all = all.concat(pathToContours(gp.commands));
    penX += font.getAdvanceWidth(ch, size) + tracking;
  }
  // bbox over vertices
  let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  for (const ct of all) for (const v of ct.v) { minX=Math.min(minX,v[0]); maxX=Math.max(maxX,v[0]); minY=Math.min(minY,v[1]); maxY=Math.max(maxY,v[1]); }
  const cx = (minX+maxX)/2, cy = (minY+maxY)/2;
  for (const ct of all) {
    for (const v of ct.v) { v[0]-=cx; v[1]-=cy; }
  }
  return { contours: all, w: maxX-minX, h: maxY-minY };
}

let _ind = 0;
const nextInd = () => ++_ind;

// shape layer from vectorized text
function textLayer(name, font, text, size, color, pos, ks, tracking = 0) {
  const ts = textShapes(font, text, size, tracking);
  const it = ts.contours.map((ct) => ({
    ty:'sh', hd:false, ks:{ a:0, k:{ c:true, v:ct.v, i:ct.i, o:ct.o } }
  }));
  it.push({ ty:'fl', c:stat(color), o:stat(100), r:1, nm:'fill' });
  it.push({ ty:'tr', p:stat([0,0]), a:stat([0,0]), s:stat([100,100]), r:stat(0), o:stat(100) });
  const grp = { ty:'gr', nm:name, it };
  return layer(4, name, { shapes:[grp], pos, ks });
}

// generic layer
function layer(ty, nm, opts) {
  const ks = opts.ks || {};
  const L = {
    ddd:0, ind: nextInd(), ty, nm, sr:1,
    ks: {
      o: ks.o || stat(100),
      r: ks.r || stat(0),
      p: ks.p || stat([ (opts.pos&&opts.pos[0])||0, (opts.pos&&opts.pos[1])||0, 0 ]),
      a: ks.a || stat([0,0,0]),
      s: ks.s || stat([100,100,100]),
    },
    ao:0, ip: opts.ip != null ? opts.ip : 0, op: opts.op != null ? opts.op : DUR, st:0, bm:0,
  };
  if (ty === 4) L.shapes = opts.shapes;
  if (ty === 2) L.refId = opts.refId;
  if (ty === 1) { L.sc = opts.sc; L.sw = opts.sw; L.sh = opts.sh; }
  if (opts.masksProperties) { L.hasMask = true; L.masksProperties = opts.masksProperties; }
  return L;
}

// circle bezier path for masks (layer space)
function circlePath(cx, cy, r) {
  const k = r * 0.5522847498;
  return {
    c:true,
    v: [[cx,cy-r],[cx+r,cy],[cx,cy+r],[cx-r,cy]],
    o: [[k,0],[0,k],[-k,0],[0,-k]],
    i: [[-k,0],[0,-k],[k,0],[0,k]],
  };
}

// rounded-rect shape group helper (returns "gr" item)
function rrect(w, h, round, fillColor, strokeColor, strokeW) {
  const it = [{ ty:'rc', d:1, s:stat([w,h]), p:stat([0,0]), r:stat(round) }];
  if (fillColor) it.push({ ty:'fl', c:stat(fillColor), o:stat(100), r:1 });
  if (strokeColor) it.push({ ty:'st', c:stat(strokeColor), o:stat(100), w:stat(strokeW||2), lc:2, lj:2 });
  it.push({ ty:'tr', p:stat([0,0]), a:stat([0,0]), s:stat([100,100]), r:stat(0), o:stat(100) });
  return { ty:'gr', it, nm:'rrect' };
}
function ellipseItem(d, fillColor, strokeColor, strokeW) {
  const it = [{ ty:'el', d:1, s:stat([d,d]), p:stat([0,0]) }];
  if (fillColor) it.push({ ty:'fl', c:stat(fillColor), o:stat(100), r:1 });
  if (strokeColor) it.push({ ty:'st', c:stat(strokeColor), o:stat(100), w:stat(strokeW||3), lc:2, lj:2 });
  it.push({ ty:'tr', p:stat([0,0]), a:stat([0,0]), s:stat([100,100]), r:stat(0), o:stat(100) });
  return { ty:'gr', it, nm:'ell' };
}

// ---- assets (embedded images) ----
const assets = [];
function imgAsset(id, file, mime) {
  const b64 = fs.readFileSync(path.join(IMG, file)).toString('base64');
  const [w, h] = dims[file];
  assets.push({ id, w, h, u:'', p:`data:${mime};base64,${b64}`, e:1 });
  return { id, w, h };
}
const heroA = imgAsset('img_hero', 'hero.jpg', 'image/jpeg');

const layers = [];
const add = (...ls) => ls.forEach(l => layers.push(l));

// ============================================================
// BACKGROUND (full duration)
// ============================================================
// gradient radial bg
add(layer(4, 'bg', {
  shapes: [{
    ty:'gr', nm:'bg', it:[
      { ty:'rc', d:1, s:stat([W,H]), p:stat([0,0]), r:stat(0) },
      { ty:'gf', o:stat(100), r:1, bm:0, t:2,
        s:stat([0,160]), e:stat([0,540]),
        g:{ p:3, k:stat([0, ...C.bgIn, 0.55, ...hex('#160B05'), 1, ...C.bgOut]) } },
      { ty:'tr', p:stat([W/2, H/2]), a:stat([0,0]), s:stat([100,100]), r:stat(0), o:stat(100) },
    ]
  }],
  pos:[0,0],
}));

// embers
function rng(seed){ let s=seed; return ()=> (s = (s*1103515245+12345)&0x7fffffff)/0x7fffffff; }
const rnd = rng(7);
for (let i=0;i<14;i++){
  const x = 90 + Math.floor(rnd()*1100);
  const startF = Math.floor(rnd()*220);
  const dur = 200 + Math.floor(rnd()*140);
  const yFrom = 690 + Math.floor(rnd()*30);
  const yTo = 150 + Math.floor(rnd()*320);
  const d = 3 + Math.floor(rnd()*5);
  const peak = 28 + Math.floor(rnd()*34);
  const end = Math.min(DUR, startF+dur);
  const mid = Math.round(startF + (end-startF)*0.35);
  add(layer(4, 'ember'+i, {
    shapes:[ ellipseItem(d, C.emberLt) ],
    ks:{
      o: anim([{t:startF,s:[0]},{t:mid,s:[peak]},{t:end,s:[0]}]),
      p: anim([{t:startF,s:[x,yFrom],o:{x:[0.4],y:[0]},i:{x:[0.6],y:[1]}},{t:end,s:[x+ (rnd()*40-20),yTo]}]),
    },
  }));
}

// ============================================================
// SCENE 1 — TITLE (0–110)  hero backdrop + wordmark
// ============================================================
const heroScale = 1280/heroA.w*100; // cover width
add(layer(2, 'hero', {
  refId:'img_hero',
  ip:4, op:114,
  ks:{
    o: opInOut(6, 30, 96, 112),
    p: stat([W/2, H/2, 0]),
    a: stat([heroA.w/2, heroA.h/2, 0]),
    s: anim([{t:4,s:[heroScale,heroScale,100]},{t:114,s:[heroScale+10,heroScale+10,100]}]),
  },
}));
// dark overlay over hero
add(layer(4, 'heroDim', {
  shapes:[{ ty:'gr', it:[
    { ty:'rc', d:1, s:stat([W,H]), p:stat([0,0]), r:stat(0) },
    { ty:'fl', c:stat(hex('#06080C')), o:stat(100), r:1 },
    { ty:'tr', p:stat([W/2,H/2]), a:stat([0,0]), s:stat([100,100]), r:stat(0), o:stat(100) },
  ]}],
  ip:4, op:114,
  ks:{ o: opInOut(6, 30, 96, 112).a ? scaleOpacity(62, 6,30,96,112) : null },
}));

// helper to make an inOut opacity capped at a max value
function scaleOpacity(max, a,b,c,d){ return anim([{t:a,s:[0]},{t:b,s:[max]},{t:c,s:[max]},{t:d,s:[0]}]); }
// fix heroDim opacity (built above before fn defined at runtime? hoisted) — reassign cleanly:
layers[layers.length-1].ks.o = scaleOpacity(76, 6,30,96,112);

add(textLayer('kicker', fBold, 'OH-MY-CURSOR  ·  PRESENTS', 38, C.gold, [W/2, 232], {
  o: opInOut(18,36,96,108), s: popS(18,40,80),
}, 9));
add(textLayer('wordmark', fBlack, 'TEAM AVATAR', 156, C.white, [W/2, 376], {
  o: opInOut(30,58,96,108), s: popS(30,62,55),
}, 2));
add(textLayer('sub1', fHeavy, 'An Avatar-themed AI dev team for Cursor', 44, C.cream, [W/2, 486], {
  o: opInOut(56,74,96,108), s: popS(56,78,86),
}));

// ============================================================
// SCENE 2 — ROSTER (105–235)
// ============================================================
const agents = [
  { id:'aang',   name:'AANG',   role:'The Avatar',       col:C.gold,  },
  { id:'sokka',  name:'SOKKA',  role:'The Strategist',   col:C.blue,  },
  { id:'katara', name:'KATARA', role:'The Healer',       col:C.blue,  },
  { id:'zuko',   name:'ZUKO',   role:'The Firebender',   col:C.ember, },
  { id:'toph',   name:'TOPH',   role:'The Seer',         col:C.green, },
  { id:'appa',   name:'APPA',   role:'Heavy Lifter',     col:hex('#C9A26B'), },
  { id:'momo',   name:'MOMO',   role:'The Scout',        col:hex('#E8D9A0'), },
  { id:'iroh',   name:'IROH',   role:'The Storyteller',  col:C.gold,  },
];
const colsX = [280, 520, 760, 1000];
const rowsY = [288, 522];
const D = 124;
agents.forEach((ag, i) => {
  const a = imgAsset('img_'+ag.id, ag.id+'.png', 'image/png');
  const col = colsX[i % 4], row = rowsY[Math.floor(i/4)];
  const cover = D / Math.min(a.w, a.h) * 100;
  const inF = 116 + i*8;
  const o = opInOut(inF, inF+14, 222, 234);
  // colored ring
  add(layer(4, 'ring_'+ag.id, {
    shapes:[ ellipseItem(D+10, null, ag.col, 4) ],
    ip:110, op:236,
    ks:{ o, p:stat([col,row,0]), s:popS(inF,inF+18,40) },
  }));
  // avatar (circular masked)
  add(layer(2, 'av_'+ag.id, {
    refId:'img_'+ag.id, ip:110, op:236,
    ks:{
      o, p:stat([col,row,0]), a:stat([a.w/2,a.h/2,0]),
      s: popTo(inF,inF+18,cover),
    },
    masksProperties:[{ inv:false, mode:'a', o:stat(100), x:stat(0),
      pt:{ a:0, k: circlePath(a.w/2, a.h/2, Math.min(a.w,a.h)/2) }, nm:'circ' }],
  }));
  // name + role
  add(textLayer('nm_'+ag.id, fBlack, ag.name, 34, C.white, [col, row+102], {
    o, s:popS(inF+4,inF+20,70),
  }, 1));
  add(textLayer('role_'+ag.id, fHeavy, ag.role, 22, ag.col, [col, row+134], {
    o, s:popS(inF+6,inF+22,70),
  }, 1));
});
add(textLayer('rosterLabel', fHeavy, '8 SPECIALIST AGENTS  ·  REAL PER-MODEL ROUTING', 32, C.gold, [W/2, 84], {
  o: opInOut(110,124,222,234), s:popS(110,128,84),
}, 5));

// ============================================================
// SCENE 3 — INSTALL (228–330)
// ============================================================
add(textLayer('installHead', fHeavy, 'ONE COMMAND TO INSTALL', 46, C.white, [W/2, 122], {
  o: opInOut(234,248,318,330), s:popS(234,252,84),
}, 4));
// terminal window
const TW = 1244, TH = 212, TX = W/2, TY = 404, THTOP = TY - TH/2;
add(layer(4, 'term', {
  shapes:[ rrect(TW, TH, 18, C.term, C.border, 2) ],
  ip:236, op:332,
  ks:{ o: opInOut(238,254,318,330), p:stat([TX,TY,0]), s:popS(238,258,80) },
}));
// header bar + traffic lights
const dotX = -(TW/2 - 42);
add(layer(4, 'termHdr', {
  shapes:[
    { ty:'gr', it:[ { ty:'el', d:1, s:stat([16,16]), p:stat([dotX,0]) }, { ty:'fl', c:stat(hex('#FF5F56')), o:stat(100), r:1 }, { ty:'tr', p:stat([0,0]), a:stat([0,0]), s:stat([100,100]), r:stat(0), o:stat(100) } ] },
    { ty:'gr', it:[ { ty:'el', d:1, s:stat([16,16]), p:stat([dotX+27,0]) }, { ty:'fl', c:stat(hex('#FFBD2E')), o:stat(100), r:1 }, { ty:'tr', p:stat([0,0]), a:stat([0,0]), s:stat([100,100]), r:stat(0), o:stat(100) } ] },
    { ty:'gr', it:[ { ty:'el', d:1, s:stat([16,16]), p:stat([dotX+54,0]) }, { ty:'fl', c:stat(hex('#27C93F')), o:stat(100), r:1 }, { ty:'tr', p:stat([0,0]), a:stat([0,0]), s:stat([100,100]), r:stat(0), o:stat(100) } ] },
    { ty:'gr', it:[ { ty:'rc', d:1, s:stat([TW,52]), p:stat([0,0]), r:stat(0) }, { ty:'fl', c:stat(C.termHd), o:stat(100), r:1 }, { ty:'tr', p:stat([0,0]), a:stat([0,0]), s:stat([100,100]), r:stat(0), o:stat(100) } ] },
  ],
  ip:236, op:332,
  ks:{ o: opInOut(240,256,318,330), p:stat([TX, THTOP+26, 0]), s:popS(238,258,80) },
}));
add(textLayer('termTitle', fBold, 'bash', 18, C.gray, [TX, THTOP+30], {
  o: opInOut(242,258,318,330),
}, 2));
// the real install command on one line (mono), sized to fit
const CMDSZ = 20, CMDY = 382;
const CMD = '$  curl -fsSL https://raw.githubusercontent.com/tmcfarlane/oh-my-cursor/main/install.sh | bash';
const cmdW = textShapes(fMono, CMD, CMDSZ, 0).w;
add(textLayer('cmd', fMono, CMD, CMDSZ, C.emberLt, [TX, CMDY], { o: opInOut(252,266,318,330) }, 0));
// blinking caret at end of command
add(layer(4, 'caret', {
  shapes:[{ ty:'gr', it:[ { ty:'rc', d:1, s:stat([12,27]), p:stat([0,0]), r:stat(1) }, { ty:'fl', c:stat(C.emberLt), o:stat(100), r:1 }, { ty:'tr', p:stat([0,0]), a:stat([0,0]), s:stat([100,100]), r:stat(0), o:stat(100) } ] }],
  ip:264, op:332,
  ks:{ p:stat([TX + cmdW/2 + 13, CMDY, 0]),
    o: anim([{t:264,s:[0]},{t:266,s:[100]},{t:276,s:[100],o:{x:[0.9],y:[0]},i:{x:[0.1],y:[1]}},{t:277,s:[0]},{t:288,s:[0]},{t:289,s:[100]},{t:300,s:[100]},{t:301,s:[0]},{t:312,s:[0]},{t:313,s:[100]},{t:330,s:[0]}]) },
}));
// success output line + drawn checkmark
const OKT = 'Team Avatar ready — 8 agents, hooks armed', OKSZ = 28, OKY = 446;
const okW = textShapes(fBold, OKT, OKSZ, 1).w;
const okO = opInOut(286,298,318,330);
add(layer(4, 'okcheck', {
  shapes:[{ ty:'gr', it:[
    { ty:'sh', ks:{ a:0, k:{ c:false, v:[[-12,2],[-4,11],[15,-12]], i:[[0,0],[0,0],[0,0]], o:[[0,0],[0,0],[0,0]] } } },
    { ty:'st', c:stat(C.green), o:stat(100), w:stat(5), lc:2, lj:2 },
    { ty:'tr', p:stat([0,0]), a:stat([0,0]), s:stat([100,100]), r:stat(0), o:stat(100) },
  ]}],
  ip:284, op:332,
  ks:{ o: okO, p:stat([TX - okW/2 - 30, OKY-3, 0]), s:popS(286,300,40) },
}));
add(textLayer('ok', fBold, OKT, OKSZ, C.green, [TX, OKY], {
  o: okO, s:popS(286,300,90),
}, 1));

// ============================================================
// SCENE 4 — ENFORCEMENT (324–400)
// ============================================================
add(textLayer('hookHead', fHeavy, 'HOOKS THAT BLOCK BAD COMMITS', 46, C.white, [W/2, 124], {
  o: opInOut(330,344,388,400), s:popS(330,348,84),
}, 4));
add(textLayer('codeline', fMono, 'git commit -m "quick fix"   # uses: as any', 32, C.gray, [W/2, 372], {
  o: opInOut(336,350,388,400),
}, 0));
// red BLOCKED stamp = border box + text, rotated
add(layer(4, 'stampBox', {
  shapes:[ rrect(600, 158, 12, null, C.red, 9) ],
  ip:346, op:402,
  ks:{ o: opInOut(350,360,388,400), r:stat(-9), p:stat([W/2, 372, 0]),
    s: popS(348,368,230,[100,100]) },
}));
add(textLayer('stampTxt', fBlack, 'COMMIT BLOCKED', 64, C.red, [W/2, 372], {
  o: opInOut(350,360,388,400), r:stat(-9), s:popS(348,368,230),
}, 3));

// ============================================================
// SCENE 5 — OUTRO / CTA (394–460)
// ============================================================
add(textLayer('outWord', fBlack, 'TEAM AVATAR', 124, C.white, [W/2, 300], {
  o: opInOut(398,414,448,460), s:popS(398,416,72),
}, 2));
add(textLayer('outGh', fBold, 'github.com/tmcfarlane/oh-my-cursor', 38, C.gold, [W/2, 396], {
  o: opInOut(410,424,448,460), s:popS(410,426,86),
}, 1));
add(textLayer('outTag', fHeavy, 'pure config  ·  no runtime  ·  MIT', 27, C.gray, [W/2, 448], {
  o: opInOut(418,430,448,460),
}, 2));

// ============================================================
// Lottie paints layers[0] on TOP. We authored back-to-front
// (background first), so reverse to put background last (bottom).
layers.reverse();
const anim_doc = {
  v:'5.7.0', fr:FR, ip:0, op:DUR, w:W, h:H, nm:'team-avatar-promo', ddd:0,
  assets, layers, markers:[],
};
fs.mkdirSync(OUT, { recursive:true });
fs.writeFileSync(path.join(OUT, 'team-avatar-promo.json'), JSON.stringify(anim_doc));
const kb = (fs.statSync(path.join(OUT,'team-avatar-promo.json')).size/1024).toFixed(0);
console.log('wrote team-avatar-promo.json  ('+kb+' KB)  layers='+layers.length+'  assets='+assets.length);
