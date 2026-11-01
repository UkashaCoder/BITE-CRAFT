"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = t => document.createElement(t);

/* ---------- animation + shape constants ---------- */
const ANIMS = ["none", "fade", "slideUp", "slideDown", "slideLeft", "slideRight", "zoom", "bounce", "pulse", "spin", "shake", "float"];
const KEY = `@keyframes uc-fade{from{opacity:0}}
@keyframes uc-slideUp{from{opacity:0;transform:translateY(40px)}}
@keyframes uc-slideDown{from{opacity:0;transform:translateY(-40px)}}
@keyframes uc-slideLeft{from{opacity:0;transform:translateX(60px)}}
@keyframes uc-slideRight{from{opacity:0;transform:translateX(-60px)}}
@keyframes uc-zoom{from{opacity:0;transform:scale(.4)}}
@keyframes uc-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-24px)}}
@keyframes uc-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
@keyframes uc-spin{to{transform:rotate(360deg)}}
@keyframes uc-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
@keyframes uc-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
`;
document.head.appendChild(Object.assign(el("style"), { textContent: KEY }));
const STAR = [[50, 0], [61, 35], [98, 35], [68, 57], [79, 91], [50, 70], [21, 91], [32, 57], [2, 35], [39, 35]];
const CLIP = {
  triangle: "polygon(50% 0,100% 100%,0 100%)",
  star: "polygon(" + STAR.map(([a, b]) => a + "% " + b + "%").join(",") + ")"
};
const AN = (t, o = {}) => ({ t, d: 1, dl: 0, it: "1", tr: "load", ea: "ease", ...o });
const anim = s => `animation:uc-${s.an.t} ${s.an.d}s ${s.an.ea} ${s.an.dl}s ${s.an.it} both;`;
const hasAn = s => s.an.t !== "none";
const hex = c => /^#[0-9a-f]{6}$/i.test(c) ? c : "#ffffff";
const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---------- data model ---------- */
let uid = 1, pid = 1, cur = 0, selIds = [], anchor = null, marq = null, clip = [], pasteN = 0, dragIds = [], tool = "select", zoom = 1, history = [], future = [], codeTab = "html", playing = false;
/* `sel` = the primary (last picked) layer. Assigning a single id or null resets the selection to just that layer. */
Object.defineProperty(globalThis, "sel", {
  get() { return selIds.length ? selIds[selIds.length - 1] : null; },
  set(v) { selIds = v == null ? [] : [v]; }
});
const D = { fill: "#287A74", fill2: "#AEEED3", grad: false, ang: 135, fo: 100, nf: false, stroke: "#111827", sw: 0, shadow: 0, shc: "#000000", blur: 0, bd: 0, rot: 0, r: 0, ic: false, rtl: 0, rtr: 0, rbr: 0, rbl: 0, op: 100, text: "", fs: 16, fw: 600, color: "#ffffff", ta: "center", ff: "sans", ls: 0, lh: 0, link: "", lt: "none", hv: false, hc: "#55A9A0", hs: 105, locked: false, hidden: false, name: "", gid: "", an: AN("none") };
const mk = (type, x, y, w, h, o = {}) => ({ ...D, nf: type === "text", id: uid++, type, x, y, w, h, ...o });
const norm = s => ({ ...D, ...s, an: { ...D.an, ...s.an } });
const mkPage = (name, shapes, w = 960, h = 640) => ({ id: pid++, name, w, h, bg: "#ffffff", shapes });
let pages = [
  mkPage("Home", [
    mk("rect", 0, 0, 960, 64, { fill: "#111827", name: "Header" }),
    mk("text", 24, 14, 160, 36, { text: "My Website", fs: 20, name: "Logo" }),
    mk("rect", 0, 64, 960, 300, { fill: "#AEEED3", name: "Hero Section" }),
    mk("text", 180, 110, 600, 70, { text: "Create Something", fs: 48, color: "#111827", name: "Headline", an: AN("slideUp", { d: .8 }) }),
    mk("text", 260, 190, 440, 40, { text: "Design your imagination.", fs: 20, color: "#287A74", name: "Subtitle", an: AN("fade", { dl: .4 }) }),
    mk("button", 390, 260, 180, 50, { r: 25, text: "Get Started", name: "Get Started", link: 2, an: AN("pulse", { tr: "hover", d: .6 }) }),
    mk("rect", 60, 400, 250, 180, { fill: "#FFF8B0", r: 16, name: "Card 1", an: AN("slideUp", { dl: .2 }) }),
    mk("rect", 355, 400, 250, 180, { fill: "#55A9A0", r: 16, name: "Card 2", an: AN("slideUp", { dl: .4 }) }),
    mk("rect", 650, 400, 250, 180, { fill: "#FFF8B0", r: 16, name: "Card 3", an: AN("slideUp", { dl: .6 }) })
  ]),
  mkPage("About", [
    mk("rect", 0, 0, 960, 64, { fill: "#287A74", name: "Header" }),
    mk("text", 24, 14, 160, 36, { text: "About us", fs: 20, name: "Title" }),
    mk("star", 760, 120, 120, 120, { fill: "#FFF8B0", name: "Star", an: AN("spin", { d: 6, it: "infinite", ea: "linear" }) }),
    mk("ellipse", 120, 300, 90, 90, { fill: "#AEEED3", grad: true, fill2: "#55A9A0", name: "Orb", an: AN("float", { d: 2.5, it: "infinite", ea: "ease-in-out" }) }),
    mk("text", 120, 130, 560, 100, { text: "We build tools for designers.", fs: 34, color: "#111827", name: "Heading", an: AN("slideRight") }),
    mk("button", 120, 480, 180, 50, { r: 10, text: "Back home", name: "Back", link: 1, shadow: 16 })
  ])
];
const P = () => pages[cur], S = () => P().shapes, get = i => S().find(s => s.id === i);
const state = () => JSON.stringify({ pages, cur, uid, pid });
const snap = () => { history.push(state()); if (history.length > 40) history.shift(); future = []; };
const restore = j => { ({ pages, cur, uid, pid } = JSON.parse(j)); sel = null; render(); };
const redo = () => { if (!future.length) return; history.push(state()); restore(future.pop()); };
$("#undo").onclick = () => { if (!history.length) return; future.push(state()); restore(history.pop()); };
$("#redo").onclick = redo;

/* ---------- views ---------- */
function show(id) { $$(".view").forEach(v => v.classList.toggle("active", v.id === id)); }
$("#loginBtn").onclick = () => show("dash");
$("#home").onclick = () => show("dash");
$$("button[data-go]").forEach(b => b.onclick = () => { show("editor"); setTab(b.dataset.tab || "design"); render(); });

/* ---------- css / code generation ---------- */
const FF = { sans: '"Segoe UI",system-ui,Arial,sans-serif', serif: 'Georgia,"Times New Roman",serif', mono: 'Consolas,Menlo,monospace', round: '"Trebuchet MS","Segoe UI",sans-serif' };
const rgba = (h, a) => { h = hex(h); return `rgba(${[1, 3, 5].map(i => parseInt(h.substr(i, 2), 16))},${a})`; };
const radii = s => s.ic ? [s.rtl, s.rtr, s.rbr, s.rbl] : [s.r, s.r, s.r, s.r];
const fillCss = (c, s) => s.fo < 100 ? rgba(c, s.fo / 100) : c;
function decl(s) {
  const bg = s.type === "image" ? `url(${s.img}) center/cover no-repeat`
    : s.nf ? "transparent" : s.grad ? `linear-gradient(${s.ang}deg,${fillCss(s.fill, s)},${fillCss(s.fill2, s)})` : fillCss(s.fill, s);
  const j = s.ta === "left" ? "flex-start" : s.ta === "right" ? "flex-end" : "center";
  return `left:${s.x}px;top:${s.y}px;width:${s.w}px;height:${s.h}px;background:${bg};` +
    `border-radius:${s.type === "ellipse" ? "50%" : radii(s).map(v => v + "px").join(" ")};opacity:${s.op / 100};color:${s.color};` +
    `font-size:${s.fs}px;font-weight:${s.fw};font-family:${FF[s.ff]};letter-spacing:${s.ls}px;` + (s.lh ? `line-height:${s.lh};` : "") +
    `justify-content:${j};text-align:${s.ta};padding:0 ${s.ta === "center" ? 0 : 10}px;` + (s.rot ? `rotate:${s.rot}deg;` : "") +
    (s.sw ? `border:${s.sw}px solid ${s.stroke};` : "") +
    (s.shadow ? `box-shadow:0 ${Math.round(s.shadow / 2)}px ${s.shadow}px ${rgba(s.shc, .35)};` : "") +
    (s.blur ? `filter:blur(${s.blur}px);` : "") + (s.bd ? `backdrop-filter:blur(${s.bd}px);` : "") + (CLIP[s.type] ? `clip-path:${CLIP[s.type]};` : "");
}
const vis = p => p.shapes.filter(s => !s.hidden);
function genHTML() {
  const secs = pages.map((p, i) => `  <section class="page${i ? "" : " active"}" id="page-${p.id}">\n` +
    vis(p).map(s => {
      const tag = s.type === "button" ? "button" : "div";
      const at = (s.link ? ` data-go="page-${s.link}"${s.lt !== "none" ? ` data-tx="${s.lt}"` : ""}` : "") + (hasAn(s) && s.an.tr === "click" ? " data-click" : "");
      return `    <${tag} class="el e${s.id}"${at}>${esc(s.text)}</${tag}>`;
    }).join("\n") + "\n  </section>").join("\n");
  return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>${esc($("#fname").value)}</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n<main class="stage">\n${secs}\n</main>\n  <script src="script.js"><\/script>\n</body>\n</html>\n`;
}
function genCSS() {
  let c = `*{box-sizing:border-box}\nbody{margin:0;font-family:"Segoe UI",system-ui,Arial,sans-serif;background:#e5e7eb}\n.page{display:none;position:relative;margin:0 auto;overflow:hidden}\n.page.active{display:block}\n.el{position:absolute;display:flex;align-items:center;justify-content:center;text-align:center;border:0;padding:0;font-family:inherit;white-space:pre-wrap}\nbutton.el{cursor:pointer}\n[data-go]{cursor:pointer}\n.tx-fade{animation:uc-fade .45s both}\n.tx-slide{animation:uc-slideLeft .45s both}\n` + KEY;
  pages.forEach(p => c += `#page-${p.id}{width:${p.w}px;height:${p.h}px;background:${p.bg}}\n`);
  pages.forEach(p => vis(p).forEach(s => {
    c += `.e${s.id}{${decl(s)}${s.hv ? "transition:background .25s,transform .25s;" : ""}${hasAn(s) && s.an.tr === "load" ? anim(s) : ""}}\n`;
    const hv = (hasAn(s) && s.an.tr === "hover" ? anim(s) : "") + (s.hv ? `background:${fillCss(s.hc, s)};transform:scale(${s.hs / 100});` : "");
    if (hv) c += `.e${s.id}:hover{${hv}}\n`;
    if (hasAn(s) && s.an.tr === "click") c += `.e${s.id}.play{${anim(s)}}\n`;
  }));
  return c;
}
function genJS() {
  return `const pages = [...document.querySelectorAll(".page")];
function fit() {
  const a = document.querySelector(".page.active");
  a.style.zoom = Math.min(1, innerWidth / parseInt(getComputedStyle(a).width));
}
function go(id, tx) {
  pages.forEach(p => {
    p.classList.remove("tx-fade", "tx-slide");
    p.classList.toggle("active", p.id === id);
    if (p.id === id && tx) p.classList.add("tx-" + tx);
  });
  window.scrollTo(0, 0); fit();
}
document.querySelectorAll("[data-go]").forEach(el =>
  el.addEventListener("click", () => go(el.dataset.go, el.dataset.tx)));
document.querySelectorAll("[data-click]").forEach(el =>
  el.addEventListener("click", () => {
    el.classList.remove("play"); void el.offsetWidth; el.classList.add("play");
  }));
addEventListener("resize", fit);
fit();
`;
}
const rr = (x, y, w, h, [a, b, c, d]) => {
  const m = Math.min(w, h) / 2; [a, b, c, d] = [a, b, c, d].map(v => Math.min(v, m));
  return `M${x + a} ${y}H${x + w - b}A${b} ${b} 0 0 1 ${x + w} ${y + b}V${y + h - c}A${c} ${c} 0 0 1 ${x + w - c} ${y + h}H${x + d}A${d} ${d} 0 0 1 ${x} ${y + h - d}V${y + a}A${a} ${a} 0 0 1 ${x + a} ${y}Z`;
};
function genSVG(p = P()) {
  let defs = "";
  const items = vis(p).map(s => {
    const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
    let fill = s.nf ? "none" : s.fill;
    if (s.grad && !s.nf) {
      const a = s.ang * Math.PI / 180, dx = Math.sin(a) / 2, dy = -Math.cos(a) / 2;
      defs += `<linearGradient id="g${s.id}" x1="${.5 - dx}" y1="${.5 - dy}" x2="${.5 + dx}" y2="${.5 + dy}"><stop offset="0" stop-color="${s.fill}"/><stop offset="1" stop-color="${s.fill2}"/></linearGradient>`;
      fill = `url(#g${s.id})`;
    }
    const c = `fill="${fill}" stroke="${s.sw ? s.stroke : "none"}" stroke-width="${s.sw}" fill-opacity="${s.nf ? 1 : s.fo / 100}" opacity="${s.op / 100}"`;
    let g;
    if (s.type === "ellipse") g = `<ellipse cx="${cx}" cy="${cy}" rx="${s.w / 2}" ry="${s.h / 2}" ${c}/>`;
    else if (s.type === "triangle") g = `<polygon points="${cx},${s.y} ${s.x + s.w},${s.y + s.h} ${s.x},${s.y + s.h}" ${c}/>`;
    else if (s.type === "star") g = `<polygon points="${STAR.map(([a, b]) => (s.x + s.w * a / 100) + "," + (s.y + s.h * b / 100)).join(" ")}" ${c}/>`;
    else if (s.type === "image") g = `<image href="${s.img}" x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" preserveAspectRatio="none" opacity="${s.op / 100}"/>`;
    else g = `<path d="${rr(s.x, s.y, s.w, s.h, radii(s))}" ${c}/>`;
    if (s.text) {
      const L = s.text.split("\n"), tx = s.ta === "left" ? s.x + 10 : s.ta === "right" ? s.x + s.w - 10 : cx, an = s.ta === "left" ? "start" : s.ta === "right" ? "end" : "middle";
      g += `<text text-anchor="${an}" dominant-baseline="central" font-family="${FF[s.ff].replace(/"/g, "'")}" font-weight="${s.fw}" font-size="${s.fs}" letter-spacing="${s.ls}" fill="${s.color}">` +
        L.map((t, i) => `<tspan x="${tx}" y="${cy + (i - (L.length - 1) / 2) * s.fs * 1.3}">${esc(t)}</tspan>`).join("") + `</text>`;
    }
    let f = "";
    if (s.shadow || s.blur) {
      defs += `<filter id="f${s.id}" x="-30%" y="-30%" width="160%" height="160%">` +
        (s.shadow ? `<feDropShadow dx="0" dy="${s.shadow / 2}" stdDeviation="${s.shadow / 2}" flood-color="${s.shc}" flood-opacity=".35"/>` : `<feGaussianBlur stdDeviation="${s.blur}"/>`) + `</filter>`;
      f = ` filter="url(#f${s.id})"`;
    }
    return `<g transform="rotate(${s.rot} ${cx} ${cy})"${f}>${g}</g>`;
  }).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="${p.h}" viewBox="0 0 ${p.w} ${p.h}">\n<defs>${defs}</defs>\n<rect width="${p.w}" height="${p.h}" fill="${p.bg}"/>\n${items}\n</svg>`;
}

/* ---------- property controls (built once) ---------- */
const F = (k, l, t, o) => ({ k, l, t, o });
const TXT = new Set(["text", "fs", "fw", "color", "ta", "ff", "ls", "lh"]);
const COR = new Set(["rtl", "rtr", "rbl", "rbr"]);
const DES = [
  F("x", "X", "n"), F("y", "Y", "n"), F("w", "Width", "n"), F("h", "Height", "n"),
  F("rot", "Rotate °", "n"), F("op", "Opacity %", "n"),
  F("r", "Corner radius", "n"), F("ic", "Individual corners", "b"),
  F("rtl", "Top-left", "n"), F("rtr", "Top-right", "n"), F("rbl", "Bottom-left", "n"), F("rbr", "Bottom-right", "n"),
  F("fill", "Fill", "c"), F("fo", "Fill opacity %", "n"), F("nf", "No fill", "b"), F("grad", "Gradient", "b"), F("fill2", "Fill 2", "c"), F("ang", "Gradient °", "n"),
  F("sw", "Stroke px", "n"), F("stroke", "Stroke color", "c"),
  F("shadow", "Shadow", "n"), F("shc", "Shadow color", "c"), F("blur", "Blur", "n"), F("bd", "Glass blur", "n"),
  F("text", "Text", "s"), F("fs", "Font size", "n"), F("fw", "Weight", "o", [["400", "Regular"], ["600", "Semi-bold"], ["700", "Bold"]]), F("color", "Text color", "c"),
  F("ta", "Align", "o", [["left", "Left"], ["center", "Center"], ["right", "Right"]]), F("ff", "Font", "o", [["sans", "Sans"], ["serif", "Serif"], ["mono", "Mono"], ["round", "Rounded"]]),
  F("ls", "Letter spacing", "n"), F("lh", "Line height", "n")
];
const PRO = [
  F("hv", "Hover effect", "b"), F("hc", "Hover color", "c"), F("hs", "Hover scale %", "n"),
  F("lt", "Page transition", "o", [["none", "None"], ["fade", "Fade"], ["slide", "Slide"]])
];
const ANI = [
  F("t", "Effect", "o", ANIMS.map(a => [a, a])), F("d", "Duration (s)", "n"), F("dl", "Delay (s)", "n"),
  F("it", "Repeat", "o", [["1", "Once"], ["2", "Twice"], ["3", "3 times"], ["infinite", "Loop"]]),
  F("tr", "Trigger", "o", [["load", "On page load"], ["hover", "On hover"], ["click", "On click"]]),
  F("ea", "Easing", "o", [["ease", "Ease"], ["ease-in-out", "Ease in-out"], ["linear", "Linear"], ["cubic-bezier(.34,1.56,.64,1)", "Bouncy"]])
];
const ctl = [];
function build(box, spec, scope) {
  spec.forEach(f => {
    const lab = el("label"); lab.append(f.l); let i;
    if (f.t === "o") { i = el("select"); f.o.forEach(([v, t]) => i.add(new Option(t, v))); }
    else { i = el("input"); i.type = { n: "number", c: "color", s: "text", b: "checkbox" }[f.t]; if (f.t === "n") i.step = "any"; }
    if (f.t === "b") { lab.className = "check"; lab.prepend(i); lab.lastChild.textContent = f.l; } else lab.appendChild(i);
    if (f.t === "s") lab.className = "wide";
    i.onfocus = snap;
    i.oninput = () => {
      const s = get(sel); if (!s) return;
      const v = f.t === "n" ? (Number(i.value) || 0) : f.t === "b" ? i.checked : i.value;
      const multi = selIds.length > 1;
      if (scope === "an") selShapes().forEach(t => t.an[f.k] = v);
      else if (multi && (f.k === "x" || f.k === "y")) { const d = v - s[f.k]; selShapes().filter(t => !t.locked).forEach(t => t[f.k] += d); }
      else if (multi && (f.k === "w" || f.k === "h" || f.k === "text")) s[f.k] = v;
      else selShapes().forEach(t => t[f.k] = v);
      render();
    };
    box.appendChild(lab); ctl.push({ f, i, lab, scope });
  });
}
build($("#designFields"), DES, "s");
build($("#animFields"), ANI, "an");
build($("#protoFields"), PRO, "s");

function sync() {
  const s = get(sel);
  ["#propForm", "#animFields", "#linkRow", "#protoFields", "#protoH"].forEach(q => $(q).hidden = !s);
  ["#noSel", "#noSelA", "#noSelP"].forEach(q => $(q).hidden = !!s);
  const p = P();
  if (document.activeElement !== $("#pname")) $("#pname").value = p.name;
  $("#pbg").value = hex(p.bg);
  $("#size").value = `${p.w}x${p.h}`;
  if (!s) return;
  const txt = selShapes().some(x => x.type === "text" || x.type === "button");
  ctl.forEach(({ f, i, lab, scope }) => {
    lab.hidden = scope === "s" && ((TXT.has(f.k) && !txt) || (COR.has(f.k) && !s.ic) || (f.k === "r" && s.ic) || ((f.k === "fill2" || f.k === "ang") && !s.grad));
    if (document.activeElement === i) return;
    const v = (scope === "an" ? s.an : s)[f.k];
    f.t === "b" ? (i.checked = v) : (i.value = f.t === "c" ? hex(v) : v);
  });
  const n = selIds.length, sh = selShapes();
  $("#multiInfo").hidden = n < 2; $("#multiInfo").textContent = n + " layers selected. Changes apply to all of them.";
  $("#lockBtn").textContent = sh.every(x => x.locked) ? "Unlock" : "Lock";
  $("#grpBtn").hidden = n < 2; $("#ungrpBtn").hidden = !sh.some(x => x.gid);
  $("#dsRow").hidden = n < 3;
  $$("[data-al]").forEach(b => b.title = n > 1 ? "Align to selection" : "Align to page");
  $("#del").textContent = n > 1 ? "Delete " + n + " layers" : "Delete layer";
  const mv = $("#moveSel"); mv.innerHTML = ""; mv.add(new Option("Choose a page…", ""));
  pages.forEach((pg, i) => { if (i !== cur) mv.add(new Option(pg.name, pg.id)); });
  $("#moveRow").hidden = pages.length < 2;
  const ls = $("#linkSel"); ls.innerHTML = "";
  ls.add(new Option("Nothing", ""));
  pages.forEach(pg => ls.add(new Option(pg.name, pg.id)));
  ls.value = s.link;
  $("#linkRow").hidden = false;
}

/* ---------- render ---------- */
function render() {
  const p = P(), f = $("#frame");
  f.style.cssText = `width:${p.w}px;height:${p.h}px;background-color:${p.bg};transform:scale(${zoom});margin:0 ${p.w * (zoom - 1)}px ${p.h * (zoom - 1)}px 0`;
  f.className = "frame" + ($("#gridChk").checked ? " showgrid" : "") + ($("#wireChk").checked ? " wire" : "");
  f.innerHTML = "";
  S().forEach(s => {
    if (s.hidden) return;
    const d = el("div");
    d.className = "el" + (s.locked ? " lock" : "");
    d.style.cssText = decl(s) + (playing && hasAn(s) ? anim(s) : "");
    d.textContent = s.text;
    d.onpointerdown = e => startDrag(e, s);
    f.appendChild(d);
  });
  const shown = selShapes().filter(x => !x.hidden);
  shown.forEach(s => {
    const b = el("div"); b.className = "selbox";
    b.style.cssText = `left:${s.x}px;top:${s.y}px;width:${s.w}px;height:${s.h}px;` + (s.rot ? `rotate:${s.rot}deg;` : "");
    if (shown.length === 1 && !s.locked) { const h = el("div"); h.className = "handle"; h.onpointerdown = e => startResize(e, s); b.appendChild(h); }
    f.appendChild(b);
  });
  if (shown.length > 1) {
    const x1 = Math.min(...shown.map(s => s.x)), y1 = Math.min(...shown.map(s => s.y));
    const x2 = Math.max(...shown.map(s => s.x + s.w)), y2 = Math.max(...shown.map(s => s.y + s.h));
    const g = el("div"); g.className = "selgroup"; g.style.cssText = `left:${x1}px;top:${y1}px;width:${x2 - x1}px;height:${y2 - y1}px;`;
    f.appendChild(g);
  }
  if (marq) { const m = el("div"); m.className = "marq"; m.style.cssText = `left:${marq.x}px;top:${marq.y}px;width:${marq.w}px;height:${marq.h}px;`; f.appendChild(m); }
  $("#zlabel").textContent = Math.round(zoom * 100) + "%";
  renderPages(); renderLayers(); sync();
  if (!$("#tab-proto").hidden) renderFlow();
  if (!$("#tab-check").hidden) renderCheck();
  if (!$("#tab-code").hidden) $("#codeOut").value = { html: genHTML, css: genCSS, js: genJS }[codeTab]();
}
function renderPages() {
  const ul = $("#pageList"); ul.innerHTML = "";
  pages.forEach((p, i) => {
    const li = el("li"); li.className = i === cur ? "on" : "";
    li.innerHTML = `<span>${esc(p.name)}</span>`;
    li.onclick = () => { cur = i; sel = null; render(); };
    ul.appendChild(li);
  });
}
function renderLayers() {
  const ul = $("#layerList"); ul.innerHTML = "";
  const rows = [...S()].reverse();
  rows.forEach(s => {
    const li = el("li"); li.className = (selIds.includes(s.id) ? "on" : "") + (s.hidden ? " dim" : "");
    li.draggable = true;
    const n = el("span"); n.textContent = (s.gid ? "◫ " : "") + (s.name || s.type + " " + s.id);
    n.title = "Double-click to rename";
    n.ondblclick = e => {
      e.stopPropagation(); li.draggable = false;
      const inp = el("input"); inp.value = s.name || s.type + " " + s.id; n.replaceWith(inp); inp.focus(); inp.select();
      let done = false;
      const fin = ok => { if (done) return; done = true; const v = inp.value.trim(); if (ok && v && v !== s.name) { snap(); s.name = v; } render(); };
      inp.onkeydown = ev => { ev.stopPropagation(); if (ev.key === "Enter") fin(true); if (ev.key === "Escape") fin(false); };
      inp.onblur = () => fin(true); inp.onclick = ev => ev.stopPropagation();
    };
    const eye = el("button"); eye.textContent = s.hidden ? "○" : "◉"; eye.title = "Show or hide";
    eye.onclick = e => { e.stopPropagation(); snap(); s.hidden = !s.hidden; render(); };
    const lk = el("button"); lk.textContent = s.locked ? "🔒" : "🔓"; lk.title = "Lock or unlock";
    lk.onclick = e => { e.stopPropagation(); snap(); s.locked = !s.locked; render(); };
    li.append(n, eye, lk);
    li.onclick = e => {
      if (e.shiftKey && anchor != null && get(anchor)) {
        const ids = rows.map(r => r.id), a = ids.indexOf(anchor), b = ids.indexOf(s.id);
        selIds = grp(ids.slice(Math.min(a, b), Math.max(a, b) + 1));
      } else if (e.ctrlKey || e.metaKey) { toggleSel(s.id); anchor = s.id; }
      else { selIds = grp([s.id]); selIds = [...selIds.filter(i => i !== s.id), s.id]; anchor = s.id; }
      render();
    };
    /* drag a layer (or the whole selection) to a new place in the stack */
    li.ondragstart = e => {
      dragIds = selIds.includes(s.id) ? inOrder().map(x => x.id) : grp([s.id]);
      e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(s.id));
    };
    const upper = e => { const r = li.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; };
    li.ondragover = e => {
      if (!dragIds.length) return; e.preventDefault();
      const up = upper(e); li.classList.toggle("dropU", up); li.classList.toggle("dropD", !up);
    };
    li.ondragleave = () => li.classList.remove("dropU", "dropD");
    li.ondrop = e => { e.preventDefault(); const ids = dragIds; dragIds = []; moveLayers(ids, s.id, upper(e)); };
    li.ondragend = () => { dragIds = []; $$("#layerList li").forEach(x => x.classList.remove("dropU", "dropD")); };
    ul.appendChild(li);
  });
}

/* ---------- UX flow + checks ---------- */
function renderFlow() {
  const bw = 100, gap = 40, idx = Object.fromEntries(pages.map((p, i) => [p.id, i]));
  const seen = new Set(); let paths = "", maxH = 40;
  pages.forEach((p, i) => p.shapes.forEach(s => {
    const j = idx[s.link];
    if (j === undefined || j === i || seen.has(i + ">" + j)) return;
    seen.add(i + ">" + j);
    const x1 = 14 + i * (bw + gap) + bw / 2, x2 = 14 + j * (bw + gap) + bw / 2, h = 30 + Math.abs(j - i) * 20;
    maxH = Math.max(maxH, h);
    const o = i < j ? -8 : 8;
    paths += `<path data-h="${h}" d="M${x1 + o} @Y C${x1 + o} @Y-${h}, ${x2 + o} @Y-${h}, ${x2 + o} @Y" fill="none" stroke="currentColor" stroke-width="1.6" marker-end="url(#ah)"/>`;
  }));
  const y0 = maxH + 24;
  paths = paths.replace(/@Y-(\d+)/g, (_, h) => y0 - h).replace(/@Y/g, y0);
  const boxes = pages.map((p, i) => `<g data-i="${i}"><rect x="${14 + i * (bw + gap)}" y="${y0}" width="${bw}" height="40" rx="8" fill="${i === cur ? "#AEEED3" : "none"}" stroke="currentColor"/><text x="${14 + i * (bw + gap) + bw / 2}" y="${y0 + 24}" text-anchor="middle" font-size="12" fill="${i === cur ? "#0d3b37" : "currentColor"}">${esc(p.name.slice(0, 13))}</text></g>`).join("");
  $("#flow").innerHTML = `<svg width="${28 + pages.length * (bw + gap)}" height="${y0 + 56}"><defs><marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3 0 6z" fill="currentColor"/></marker></defs>${paths}${boxes}</svg>`;
  $$("#flow g").forEach(g => g.onclick = () => { cur = +g.dataset.i; sel = null; render(); });
}
const lum = h => { const c = [1, 3, 5].map(i => { const v = parseInt(h.substr(i, 2), 16) / 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
function renderCheck() {
  const out = [], p = P();
  vis(p).forEach(s => {
    const n = s.name || s.type + " " + s.id;
    if (s.type === "text" || s.type === "button") {
      const r = ratio(hex(s.color), hex(s.nf ? p.bg : s.fill));
      if (r < 4.5) out.push([s.id, "warn", `${n}: contrast is ${r.toFixed(1)}:1. Aim for 4.5:1 or more.`]);
      if (s.fs < 12) out.push([s.id, "warn", `${n}: text is under 12px.`]);
    }
    if (s.type === "button") {
      if (!s.link) out.push([s.id, "info", `${n}: this button doesn't open a page yet.`]);
      if (p.w <= 480 && s.h < 44) out.push([s.id, "warn", `${n}: touch target is under 44px tall.`]);
    }
    if (s.x < 0 || s.y < 0 || s.x + s.w > p.w || s.y + s.h > p.h) out.push([s.id, "warn", `${n}: extends outside the page.`]);
  });
  const ul = $("#checkList"); ul.innerHTML = "";
  if (!out.length) { const li = el("li"); li.className = "ok"; li.textContent = "No issues found on this page."; ul.appendChild(li); }
  out.forEach(([id, k, t]) => { const li = el("li"); li.className = k; li.textContent = t; li.onclick = () => { sel = id; render(); }; ul.appendChild(li); });
}

/* ---------- editing actions ---------- */
const selShapes = () => selIds.map(get).filter(Boolean);
const inOrder = () => S().filter(s => selIds.includes(s.id));
/* a layer in a group always brings its group-mates with it */
const grp = ids => {
  const g = new Set(ids.map(i => get(i)).filter(Boolean).map(s => s.gid).filter(Boolean));
  return [...new Set([...ids, ...S().filter(s => g.has(s.gid)).map(s => s.id)])];
};
const toggleSel = id => {
  const g = grp([id]);
  selIds = g.every(i => selIds.includes(i)) ? selIds.filter(i => !g.includes(i)) : [...new Set([...selIds.filter(i => !g.includes(i)), ...g])];
};
const selAll = () => { selIds = S().filter(s => !s.hidden && !s.locked).map(s => s.id); render(); };
function cloneShapes(list, off) {
  const gm = {};
  return list.map(s => {
    const c = JSON.parse(JSON.stringify(s)); c.id = uid++; c.x += off; c.y += off;
    c.name = (s.name || s.type).replace(/ copy$/, "") + " copy";
    if (c.gid) c.gid = gm[c.gid] = gm[c.gid] || "g" + uid++;
    return c;
  });
}
function del() {
  const gone = new Set(inOrder().filter(s => !s.locked).map(s => s.id)); if (!gone.size) return;
  snap(); P().shapes = S().filter(s => !gone.has(s.id)); sel = null; render();
}
function dup() {
  if (!selIds.length) return; snap();
  const c = cloneShapes(inOrder(), 20); S().push(...c); selIds = c.map(s => s.id); render();
}
function copy() { clip = JSON.parse(JSON.stringify(inOrder())); pasteN = 0; if (clip.length) toast(clip.length + " layer" + (clip.length > 1 ? "s" : "") + " copied"); }
function paste() {
  if (!clip.length) return; snap(); pasteN++;
  const c = cloneShapes(clip, 20 * pasteN); S().push(...c); selIds = c.map(s => s.id); render();
}
function move(dx, dy) {
  const a = selShapes().filter(s => !s.locked); if (!a.length) return;
  snap(); a.forEach(s => { s.x += dx; s.y += dy; }); render();
}
function group() {
  if (selIds.length < 2) return; snap(); const g = "g" + uid++;
  selShapes().forEach(s => s.gid = g); render(); toast("Grouped. Click one layer to select the whole group.");
}
function ungroup() { const a = selShapes().filter(s => s.gid); if (!a.length) return; snap(); a.forEach(s => s.gid = ""); render(); }
/* layer order: front / back / one step forward / one step backward, works on many layers at once */
function reorder(m) {
  const a = S(), ids = new Set(selIds); if (!ids.size) return; snap();
  const pick = a.filter(s => ids.has(s.id)), rest = a.filter(s => !ids.has(s.id));
  if (m === "front") P().shapes = [...rest, ...pick];
  else if (m === "back") P().shapes = [...pick, ...rest];
  else if (m === "up") { for (let i = a.length - 2; i >= 0; i--) if (ids.has(a[i].id) && !ids.has(a[i + 1].id)) [a[i], a[i + 1]] = [a[i + 1], a[i]]; }
  else { for (let i = 1; i < a.length; i++) if (ids.has(a[i].id) && !ids.has(a[i - 1].id)) [a[i], a[i - 1]] = [a[i - 1], a[i]]; }
  render();
}
/* drop layers above (above=true) or below the target layer in the stack */
function moveLayers(ids, targetId, above) {
  const set = new Set(ids); if (!set.size || set.has(targetId)) return;
  snap();
  const mv = S().filter(s => set.has(s.id)), rest = S().filter(s => !set.has(s.id));
  const ti = rest.findIndex(s => s.id === targetId);
  rest.splice(above ? ti + 1 : ti, 0, ...mv); P().shapes = rest; render();
}
function toPage(id) {
  const dest = pages.find(p => p.id === id), a = inOrder(); if (!dest || !a.length) return;
  snap(); const set = new Set(a.map(s => s.id));
  P().shapes = S().filter(s => !set.has(s.id)); dest.shapes.push(...a); sel = null; render();
  toast(a.length + " layer" + (a.length > 1 ? "s" : "") + " moved to " + dest.name);
}
/* align to the page for one layer, or to the selection box for several */
function align(k) {
  const a = selShapes().filter(s => !s.locked); if (!a.length) return; snap();
  const p = P(), m = a.length > 1;
  const L = m ? Math.min(...a.map(s => s.x)) : 0, R = m ? Math.max(...a.map(s => s.x + s.w)) : p.w;
  const T = m ? Math.min(...a.map(s => s.y)) : 0, B = m ? Math.max(...a.map(s => s.y + s.h)) : p.h;
  a.forEach(s => ({ l: () => s.x = L, c: () => s.x = Math.round((L + R - s.w) / 2), r: () => s.x = R - s.w,
    t: () => s.y = T, m: () => s.y = Math.round((T + B - s.h) / 2), b: () => s.y = B - s.h })[k]());
  render();
}
function distribute(axis) {
  const a = selShapes().filter(s => !s.locked); if (a.length < 3) return; snap();
  const [pos, len] = axis === "h" ? ["x", "w"] : ["y", "h"];
  a.sort((u, v) => u[pos] - v[pos]);
  const total = a[a.length - 1][pos] + a[a.length - 1][len] - a[0][pos];
  const gap = (total - a.reduce((t, s) => t + s[len], 0)) / (a.length - 1);
  let c = a[0][pos]; a.forEach(s => { s[pos] = Math.round(c); c += s[len] + gap; });
  render();
}
$("#del").onclick = del; $("#dup").onclick = dup;
$("#front").onclick = () => reorder("front"); $("#back").onclick = () => reorder("back");
$("#fwd").onclick = () => reorder("up"); $("#bwd").onclick = () => reorder("down");
$("#grpBtn").onclick = group; $("#ungrpBtn").onclick = ungroup;
$("#moveSel").onchange = e => toPage(Number(e.target.value));
$("#lockBtn").onclick = () => {
  const a = selShapes(); if (!a.length) return; snap();
  const v = !a.every(s => s.locked); a.forEach(s => s.locked = v); render();
};
$$("[data-al]").forEach(b => b.onclick = () => align(b.dataset.al));
$$("[data-ds]").forEach(b => b.onclick = () => distribute(b.dataset.ds));
$("#linkSel").onchange = e => { const a = selShapes(); if (a.length) { snap(); a.forEach(s => s.link = Number(e.target.value) || ""); render(); } };
$("#pname").oninput = e => { P().name = e.target.value; render(); };
$("#pbg").oninput = e => { P().bg = e.target.value; render(); };
$("#size").onchange = e => { snap(); const [w, h] = e.target.value.split("x").map(Number); P().w = w; P().h = h; render(); };
$("#addPage").onclick = () => { if (!canAddPage()) return; snap(); pages.push(mkPage("Page " + (pages.length + 1), [], P().w, P().h)); cur = pages.length - 1; sel = null; render(); };
$("#dupPage").onclick = () => {
  if (!canAddPage()) return; snap(); const c = JSON.parse(JSON.stringify(P())); c.id = pid++; c.name += " copy";
  c.shapes.forEach(s => s.id = uid++); pages.splice(cur + 1, 0, c); cur++; sel = null; render();
};
$("#delPage").onclick = () => {
  if (pages.length < 2) return alert("A project needs at least one page.");
  snap(); const id = P().id; pages.splice(cur, 1);
  pages.forEach(p => p.shapes.forEach(s => { if (s.link === id) s.link = ""; }));
  cur = Math.min(cur, pages.length - 1); sel = null; render();
};
const TOOLKEYS = { v: "select", r: "rect", o: "ellipse", l: "line", t: "text", b: "button" };
addEventListener("keydown", e => {
  if (!$("#editor").classList.contains("active") || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || $("#exportDlg").open || $("#prevDlg").open) return;
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (mod && k === "z") { e.preventDefault(); e.shiftKey ? redo() : $("#undo").click(); return; }
  if (mod && k === "y") { e.preventDefault(); redo(); return; }
  if (mod && k === "a") { e.preventDefault(); selAll(); return; }
  if (mod && k === "v") { e.preventDefault(); paste(); return; }
  if (e.key === "Escape") { if (tool !== "select") setTool("select"); else { sel = null; render(); } return; }
  if (!mod && !e.altKey && TOOLKEYS[k]) { setTool(TOOLKEYS[k]); return; }
  if (!selIds.length) return;
  if (mod && k === "c") { e.preventDefault(); copy(); return; }
  if (mod && k === "x") { e.preventDefault(); copy(); del(); return; }
  if (mod && k === "d") { e.preventDefault(); dup(); return; }
  if (mod && k === "g") { e.preventDefault(); e.shiftKey ? ungroup() : group(); return; }
  if (mod && (e.code === "BracketRight" || e.code === "BracketLeft")) {
    e.preventDefault(); const up = e.code === "BracketRight";
    reorder(e.shiftKey ? (up ? "front" : "back") : (up ? "up" : "down")); return;
  }
  if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); del(); return; }
  const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (d) { e.preventDefault(); const n = e.shiftKey ? 10 : 1; move(d[0] * n, d[1] * n); }
});

/* ---------- drag, resize, create ---------- */
const grid = () => $("#snapChk").checked ? 8 : 1;
function stopPlay() { if (playing) { playing = false; $("#play").textContent = "Play animations"; } }
function drag(e, fn) {
  const sx = e.clientX, sy = e.clientY;
  const mv = ev => { fn((ev.clientX - sx) / zoom, (ev.clientY - sy) / zoom); render(); };
  const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); };
  addEventListener("pointermove", mv); addEventListener("pointerup", up);
}
function startDrag(e, s) {
  if (tool !== "select") return;
  e.stopPropagation(); stopPlay();
  /* Shift / Ctrl / Cmd + click adds or removes a layer from the selection */
  if (e.shiftKey || e.ctrlKey || e.metaKey) { toggleSel(s.id); anchor = s.id; render(); return; }
  const wasMulti = selIds.includes(s.id) && selIds.length > 1;
  if (!selIds.includes(s.id)) selIds = grp([s.id]);
  selIds = [...selIds.filter(i => i !== s.id), s.id]; anchor = s.id;
  const mv = selShapes().filter(x => !x.locked);
  if (!mv.length) { render(); return; }
  snap();
  const org = mv.map(x => [x, x.x, x.y]), g = grid(), ref = org.find(o => o[0] === s) || org[0];
  let moved = false;
  /* every selected layer moves together; the layer you grabbed snaps to the grid */
  drag(e, (dx, dy) => {
    const ddx = Math.round((ref[1] + dx) / g) * g - ref[1], ddy = Math.round((ref[2] + dy) / g) * g - ref[2];
    if (dx || dy) moved = true;
    org.forEach(([x, ox, oy]) => { x.x = ox + ddx; x.y = oy + ddy; });
  });
  /* a plain click on one of several selected layers narrows the selection to it */
  addEventListener("pointerup", () => { if (wasMulti && !moved) { selIds = grp([s.id]); render(); } }, { once: true });
  render();
}
function startResize(e, s) {
  e.stopPropagation(); e.preventDefault(); stopPlay(); snap();
  const ow = s.w, oh = s.h, g = grid();
  drag(e, (dx, dy) => { s.w = Math.max(4, Math.round((ow + dx) / g) * g); s.h = Math.max(4, Math.round((oh + dy) / g) * g); });
}
/* drag a box on empty canvas to select everything it touches (Shift keeps the current selection) */
function startMarquee(e) {
  const b = $("#frame").getBoundingClientRect();
  const pt = ev => [(ev.clientX - b.left) / zoom, (ev.clientY - b.top) / zoom];
  const [x0, y0] = pt(e), base = e.shiftKey ? [...selIds] : [];
  if (!e.shiftKey && selIds.length) { selIds = []; render(); }
  const mv = ev => {
    const [x, y] = pt(ev), m = marq = { x: Math.min(x, x0), y: Math.min(y, y0), w: Math.abs(x - x0), h: Math.abs(y - y0) };
    const hit = S().filter(s => !s.hidden && !s.locked && s.x < m.x + m.w && s.x + s.w > m.x && s.y < m.y + m.h && s.y + s.h > m.y &&
      !(s.x <= m.x && s.y <= m.y && s.x + s.w >= m.x + m.w && s.y + s.h >= m.y + m.h)).map(s => s.id);
    selIds = [...new Set([...base, ...grp(hit)])]; render();
  };
  const up = () => { marq = null; removeEventListener("pointermove", mv); removeEventListener("pointerup", up); render(); };
  addEventListener("pointermove", mv); addEventListener("pointerup", up);
}
$("#frame").onpointerdown = e => {
  stopPlay();
  if (tool === "select") { if (e.target === $("#frame")) startMarquee(e); return; }
  const b = $("#frame").getBoundingClientRect();
  const x = Math.round((e.clientX - b.left) / zoom), y = Math.round((e.clientY - b.top) / zoom);
  const defs = {
    rect: () => mk("rect", x, y, 160, 100, { r: 8, fill: "#55A9A0" }),
    ellipse: () => mk("ellipse", x, y, 110, 110, { fill: "#FFF8B0" }),
    triangle: () => mk("triangle", x, y, 110, 100, { fill: "#287A74" }),
    star: () => mk("star", x, y, 110, 110, { fill: "#FFF8B0" }),
    line: () => mk("line", x, y, 200, 4, { fill: "#111827" }),
    text: () => mk("text", x, y, 220, 40, { text: "New text", color: "#111827", fs: 24 }),
    button: () => mk("button", x, y, 150, 46, { r: 10, text: "Button" })
  };
  snap(); const s = defs[tool](); S().push(s); sel = s.id; setTool("select"); render();
};
$("#wrap").onpointerdown = e => { if (e.target === $("#wrap") && tool === "select") { stopPlay(); startMarquee(e); } };
function setTool(t) { tool = t; $$("[data-tool]").forEach(b => b.classList.toggle("on", b.dataset.tool === t)); }
$$("[data-tool]").forEach(b => b.onclick = () => b.dataset.tool === "image" ? $("#imgIn").click() : setTool(b.dataset.tool));
$("#imgIn").onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 320 / im.width); snap();
      const s = mk("image", 40, 40, Math.round(im.width * k), Math.round(im.height * k), { img: r.result, name: f.name });
      S().push(s); sel = s.id; render();
    };
    im.src = r.result;
  };
  r.readAsDataURL(f); e.target.value = "";
};

/* ---------- zoom, tabs, play ---------- */
$("#zin").onclick = () => { zoom = Math.min(2, +(zoom + .1).toFixed(2)); render(); };
$("#zout").onclick = () => { zoom = Math.max(.3, +(zoom - .1).toFixed(2)); render(); };
$("#play").onclick = () => { playing = !playing; $("#play").textContent = playing ? "Stop" : "Play animations"; render(); };
function setTab(t) {
  $$(".tabs [data-tab]").forEach(b => b.classList.toggle("on", b.dataset.tab === t));
  ["design", "anim", "proto", "check", "code"].forEach(x => $("#tab-" + x).hidden = x !== t);
  render();
}
$$(".tabs [data-tab]").forEach(b => b.onclick = () => setTab(b.dataset.tab));
$$("[data-c]").forEach(b => b.onclick = () => {
  codeTab = b.dataset.c; $$("[data-c]").forEach(x => x.classList.toggle("on", x === b)); render();
});
$("#copyCode").onclick = async () => {
  try { await navigator.clipboard.writeText($("#codeOut").value); $("#copyCode").textContent = "Copied"; }
  catch { $("#codeOut").select(); $("#copyCode").textContent = "Select and copy"; }
  setTimeout(() => $("#copyCode").textContent = "Copy code", 1500);
};
$("#fname").oninput = render;
$("#gridChk").onchange = $("#wireChk").onchange = render;

/* ---------- preview ---------- */
$("#preview").onclick = () => {
  const html = genHTML()
    .replace('<link rel="stylesheet" href="style.css">', () => "<style>" + genCSS() + "</style>")
    .replace('<script src="script.js"><\/script>', () => "<script>" + genJS() + "<\/script>");
  $("#pvFrame").srcdoc = html; $("#prevDlg").showModal();
};
$$("[data-dev]").forEach(b => b.onclick = () => $("#pvFrame").style.width = b.dataset.dev);
$("#closePv").onclick = () => $("#prevDlg").close();

/* ---------- export (incl. ZIP writer) ---------- */
function save(name, data, type) {
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type }));
  const a = Object.assign(el("a"), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 500);
}
function zip(files) {
  const enc = new TextEncoder(), parts = [], cd = []; let off = 0;
  const T = [...Array(256)].map((_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xEDB88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
  const crc = b => { let c = ~0; for (const x of b) c = T[(c ^ x) & 255] ^ (c >>> 8); return ~c >>> 0; };
  const le = a => { const b = new Uint8Array(a.reduce((t, p) => t + p[0], 0)); let o = 0; for (const [n, v] of a) { for (let i = 0; i < n; i++) b[o + i] = (v >>> (8 * i)) & 255; o += n; } return b; };
  for (const f of files) {
    const nm = enc.encode(f.name), d = enc.encode(f.data), c = crc(d), n = d.length;
    parts.push(le([[4, 0x04034b50], [2, 20], [2, 0], [2, 0], [2, 0], [2, 33], [4, c], [4, n], [4, n], [2, nm.length], [2, 0]]), nm, d);
    cd.push(le([[4, 0x02014b50], [2, 20], [2, 20], [2, 0], [2, 0], [2, 0], [2, 33], [4, c], [4, n], [4, n], [2, nm.length], [2, 0], [2, 0], [2, 0], [2, 0], [4, 0], [4, off]]), nm);
    off += 30 + nm.length + n;
  }
  const size = cd.reduce((t, x) => t + x.length, 0);
  return new Blob([...parts, ...cd, le([[4, 0x06054b50], [2, 0], [2, 0], [2, files.length], [2, files.length], [4, size], [4, off], [2, 0]])], { type: "application/zip" });
}
const projectJSON = () => JSON.stringify({ name: $("#fname").value, pages, uid, pid }, null, 2);
function savePNG() {
  const p = P(), im = new Image();
  im.onload = () => {
    const c = Object.assign(el("canvas"), { width: p.w * 2, height: p.h * 2 });
    const g = c.getContext("2d"); g.scale(2, 2); g.drawImage(im, 0, 0);
    c.toBlob(b => save("design.png", b));
  };
  im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(genSVG());
}
$("#exportBtn").onclick = () => $("#exportDlg").showModal();
$("#closeDlg").onclick = () => $("#exportDlg").close();
$$("[data-ex]").forEach(b => b.onclick = () => ({
  zip: () => save("ui-craft-project.zip", zip([
    { name: "index.html", data: genHTML() }, { name: "style.css", data: genCSS() }, { name: "script.js", data: genJS() },
    { name: "design.svg", data: genSVG() }, { name: "project.uicraft.json", data: projectJSON() }])),
  html: () => save("index.html", genHTML(), "text/html"),
  css: () => save("style.css", genCSS(), "text/css"),
  js: () => save("script.js", genJS(), "text/javascript"),
  svg: () => save("design.svg", genSVG(), "image/svg+xml"),
  png: savePNG,
  json: () => save("project.uicraft.json", projectJSON(), "application/json")
})[b.dataset.ex]());
$("#openIn").onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result); if (!Array.isArray(d.pages) || !d.pages.length) throw 0;
      snap(); pages = d.pages.map(p => ({ ...p, shapes: p.shapes.map(norm) })); uid = d.uid || 9999; pid = d.pid || 9999; cur = 0; sel = null;
      $("#fname").value = d.name || "My Website"; $("#exportDlg").close(); render();
    } catch { alert("That file isn't a UI CRAFT project."); }
  };
  r.readAsText(f); e.target.value = "";
};

/* ---------- toast + storage ---------- */
function toast(m) {
  const t = el("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = m;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2800);
}
const store = {
  get(k, d) { try { const v = localStorage.getItem("uic:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("uic:" + k, JSON.stringify(v)); } catch { } }
};

/* ---------- palette ---------- */
["#287A74", "#55A9A0", "#AEEED3", "#FFF8B0", "#111827", "#ffffff"].forEach(c => {
  const b = el("button"); b.style.background = c; b.title = c + " (click: fill, Shift+click: text color)";
  b.onclick = e => {
    const a = selShapes(); if (!a.length) return; snap();
    a.forEach(s => { if (e.shiftKey) s.color = c; else { s.fill = c; s.nf = false; s.grad = false; } });
    render();
  };
  $("#palette").appendChild(b);
});

/* ---------- components ---------- */
const yr = new Date().getFullYear();
const COMP = {
  "Navbar": (x, y, p) => [
    mk("rect", 0, 0, p.w, 64, { fill: "#111827", name: "Navbar" }),
    mk("text", 24, 14, 140, 36, { text: "Brand", fs: 20, ta: "left", name: "Brand" }),
    ...(p.w > 500 ? ["Home", "Features", "Pricing"].map((t, i) => mk("text", p.w - 420 + i * 90, 14, 80, 36, { text: t, fs: 14, fw: 400, color: "#e5e7eb", name: "Link " + t })) : []),
    mk("button", p.w - 130, 10, 110, 44, { r: 22, text: "Sign up", fs: 14, name: "Nav button" })],
  "Hero": (x, y, p) => [
    mk("rect", 0, y, p.w, 280, { fill: "#AEEED3", grad: true, fill2: "#FFF8B0", ang: 120, name: "Hero" }),
    mk("text", 0, y + 70, p.w, 70, { text: "Design something new", fs: Math.min(48, p.w / 10), color: "#111827", name: "Headline" }),
    mk("text", 0, y + 145, p.w, 36, { text: "Ideas to working screens in one studio.", fs: 18, fw: 400, color: "#287A74", name: "Subtitle" }),
    mk("button", p.w / 2 - 90, y + 200, 180, 50, { r: 25, text: "Get started", name: "CTA" })],
  "Feature card": (x, y) => [
    mk("rect", x, y, 260, 180, { fill: "#FFF8B0", r: 16, shadow: 20, name: "Card" }),
    mk("ellipse", x + 20, y + 20, 44, 44, { fill: "#287A74", name: "Icon" }),
    mk("text", x + 20, y + 78, 220, 30, { text: "Feature title", fs: 18, color: "#111827", ta: "left", name: "Card title" }),
    mk("text", x + 20, y + 112, 220, 50, { text: "Short description goes here.", fs: 14, fw: 400, color: "#4b5563", ta: "left", name: "Card text" })],
  "Pricing card": (x, y) => [
    mk("rect", x, y, 260, 330, { fill: "#ffffff", r: 18, sw: 1, stroke: "#D6E6E2", shadow: 24, name: "Plan card" }),
    mk("text", x + 20, y + 20, 220, 30, { text: "Pro", fs: 20, color: "#287A74", ta: "left", name: "Plan name" }),
    mk("text", x + 20, y + 60, 220, 60, { text: "$12/mo", fs: 36, color: "#111827", ta: "left", name: "Price" }),
    mk("text", x + 20, y + 130, 220, 100, { text: "Unlimited pages\nZIP export\nAnimations", fs: 14, fw: 400, color: "#4b5563", ta: "left", lh: 1.6, name: "Perks" }),
    mk("button", x + 20, y + 260, 220, 46, { r: 12, text: "Choose plan", name: "Plan button" })],
  "Login form": (x, y) => [
    mk("rect", x, y, 320, 380, { fill: "#ffffff", r: 20, shadow: 30, name: "Form card" }),
    mk("text", x + 24, y + 24, 272, 40, { text: "Log in", fs: 26, color: "#111827", ta: "left", name: "Form title" }),
    mk("rect", x + 24, y + 90, 272, 46, { fill: "#ffffff", sw: 1, stroke: "#d1d5db", r: 10, text: "Email", color: "#6b7280", fw: 400, fs: 14, ta: "left", name: "Email field" }),
    mk("rect", x + 24, y + 152, 272, 46, { fill: "#ffffff", sw: 1, stroke: "#d1d5db", r: 10, text: "Password", color: "#6b7280", fw: 400, fs: 14, ta: "left", name: "Password field" }),
    mk("button", x + 24, y + 224, 272, 48, { r: 12, text: "Log in", name: "Login button" }),
    mk("text", x + 24, y + 296, 272, 30, { text: "Forgot password?", fs: 13, fw: 400, color: "#287A74", name: "Forgot link" })],
  "Glass card": (x, y) => [
    mk("rect", x, y, 280, 160, { fill: "#ffffff", fo: 30, bd: 12, r: 20, sw: 1, stroke: "#ffffff", name: "Glass card" }),
    mk("text", x + 20, y + 24, 240, 36, { text: "Glass card", fs: 22, color: "#111827", ta: "left", name: "Glass title" }),
    mk("text", x + 20, y + 66, 240, 60, { text: "Raise Fill opacity down and add Glass blur over an image or gradient.", fs: 13, fw: 400, color: "#111827", ta: "left", name: "Glass text" })],
  "Footer": (x, y, p) => [
    mk("rect", 0, p.h - 70, p.w, 70, { fill: "#111827", name: "Footer" }),
    mk("text", 0, p.h - 70, p.w, 70, { text: "© " + yr + " My Website", fs: 14, fw: 400, name: "Footer text" })]
};
const COMP_DESC = { "Navbar": "Brand, links and a sign-up button", "Hero": "Headline, subtitle and call to action", "Feature card": "Icon, title and text", "Pricing card": "Plan name, price and perks", "Login form": "Email, password and button", "Glass card": "Frosted card with blur", "Footer": "Dark footer bar" };
function addComp(n) {
  snap(); const arr = COMP[n](40, 90, P());
  arr.forEach(x => S().push(x)); sel = arr[0].id; render(); toast(n + " added to " + P().name);
}
Object.keys(COMP).forEach(n => $("#compSel").add(new Option(n, n)));
$("#compSel").onchange = e => { if (e.target.value) addComp(e.target.value); e.target.value = ""; };

/* ---------- templates ---------- */
const TPL = {
  "Landing page": {
    desc: "Navbar, hero, three features, footer", bg: "linear-gradient(135deg,#AEEED3,#FFF8B0)",
    build() { const p = { w: 960, h: 640 }; return [mkPage("Home", [...COMP.Navbar(0, 0, p), ...COMP.Hero(0, 64, p), ...[60, 355, 650].flatMap(x => COMP["Feature card"](x, 370, p)), ...COMP.Footer(0, 0, p)])]; }
  },
  "Pricing page": {
    desc: "Three plan cards under a headline", bg: "linear-gradient(135deg,#55A9A0,#AEEED3)",
    build() { const p = { w: 960, h: 640 }; return [mkPage("Pricing", [...COMP.Navbar(0, 0, p), mk("text", 0, 84, 960, 50, { text: "Simple pricing", fs: 36, color: "#111827", name: "Heading" }), ...[60, 355, 650].flatMap(x => COMP["Pricing card"](x, 170, p)), ...COMP.Footer(0, 0, p)])]; }
  },
  "Portfolio": {
    desc: "Intro, three project tiles, contact page", bg: "linear-gradient(135deg,#FFF8B0,#55A9A0)",
    build() {
      const p = { w: 960, h: 640 };
      const home = mkPage("Work", [...COMP.Navbar(0, 0, p), mk("text", 60, 100, 700, 70, { text: "Hi, I design interfaces.", fs: 44, color: "#111827", ta: "left", name: "Intro" }),
        ...[60, 355, 650].map((x, i) => mk("rect", x, 220, 250, 230, { fill: ["#287A74", "#55A9A0", "#111827"][i], grad: true, fill2: ["#AEEED3", "#FFF8B0", "#287A74"][i], r: 18, text: "Project " + (i + 1), fs: 20, shadow: 18, name: "Tile " + (i + 1), an: AN("slideUp", { dl: i * .2 }) })),
        mk("button", 60, 500, 180, 50, { r: 25, text: "Contact me", name: "CTA" })]);
      const contact = mkPage("Contact", [...COMP.Navbar(0, 0, p), ...COMP["Login form"](320, 120, p).slice(0, 5), mk("button", 60, 560, 160, 44, { r: 22, text: "Back", name: "Back" })]);
      home.shapes.find(s => s.name === "CTA").link = contact.id; contact.shapes.find(s => s.name === "Back").link = home.id;
      return [home, contact];
    }
  },
  "Mobile login": {
    desc: "Phone-sized login screen", bg: "linear-gradient(135deg,#287A74,#AEEED3)",
    build() { const p = { w: 390, h: 720 }; return [mkPage("Login", [mk("rect", 0, 0, 390, 720, { fill: "#287A74", grad: true, fill2: "#AEEED3", ang: 160, name: "Background" }), mk("ellipse", 155, 50, 80, 80, { fill: "#FFF8B0", name: "Logo", an: AN("float", { d: 2.5, it: "infinite", ea: "ease-in-out" }) }), ...COMP["Login form"](35, 160, p)], 390, 720)]; }
  }
};
function renderCards() {
  Object.entries(TPL).forEach(([n, t]) => {
    const b = el("button"); b.className = "tcard";
    b.innerHTML = `<div class="thumb" style="background:${t.bg}"></div><b>${esc(n)}</b><span>${esc(t.desc)}</span>`;
    b.onclick = () => {
      if (!confirm(`Replace the open project with “${n}”? Undo brings it back.`)) return;
      snap(); pages = t.build(); cur = 0; sel = null; $("#fname").value = n; show("editor"); setTab("design");
    };
    $("#tplGrid").appendChild(b);
  });
  Object.keys(COMP).forEach(n => {
    const b = el("button"); b.className = "tcard";
    b.innerHTML = `<b>${esc(n)}</b><span>${esc(COMP_DESC[n])}</span>`;
    b.onclick = () => { show("editor"); setTab("design"); addComp(n); };
    $("#compGrid").appendChild(b);
  });
}

/* ---------- plans ---------- */
const PLANS = [
  { id: "free", name: "Free", m: 0, y: 0, pages: 3, seats: 1, store: ["0.4 GB of 1 GB", 40], perks: ["3 pages per project", "PNG, SVG and code export", "Starter templates"] },
  { id: "pro", name: "Pro", m: 12, y: 9, pages: Infinity, seats: 1, store: ["0.4 GB of 50 GB", 1], perks: ["Unlimited pages", "50 GB storage", "Prototypes and animations", "ZIP export"] },
  { id: "team", name: "Team", m: 29, y: 24, pages: Infinity, seats: 10, store: ["0.4 GB of 500 GB", 1], perks: ["Everything in Pro", "Up to 10 teammates", "500 GB storage", "Shared component library"] }
];
let plan = store.get("plan", "free"), yearly = false;
const PLAN = () => PLANS.find(p => p.id === plan) || PLANS[0];
function canAddPage() {
  if (pages.length >= PLAN().pages) { toast(`The ${PLAN().name} plan allows ${PLAN().pages} pages per project. Choose a bigger plan to add more.`); return false; }
  return true;
}
function updateStorage() { $(".storage small:last-child").textContent = PLAN().store[0]; $(".bar i").style.width = PLAN().store[1] + "%"; }
function renderPlans() {
  const g = $("#planGrid"); g.innerHTML = "";
  PLANS.forEach(p => {
    const c = el("div"); c.className = "plan" + (p.id === plan ? " cur" : "") + (p.id === "pro" ? " feat" : "");
    c.innerHTML = `<h3>${p.name}</h3><div class="price">$${yearly ? p.y : p.m}<small>/month</small></div><small class="muted">${p.m ? (yearly ? "Billed yearly" : "Billed monthly") : "Free forever"}</small><ul>${p.perks.map(x => `<li>${x}</li>`).join("")}</ul>`;
    const b = el("button"); b.className = "btn" + (p.id === plan ? "" : " primary"); b.disabled = p.id === plan;
    b.textContent = p.id === plan ? "Current plan" : (p.m > PLAN().m ? "Upgrade to " : "Switch to ") + p.name;
    b.onclick = () => { plan = p.id; store.set("plan", plan); renderPlans(); updateStorage(); renderTeam(); toast(`You're on the ${p.name} plan (demo, no payment taken).`); };
    c.appendChild(b); g.appendChild(c);
  });
}
$$("[data-bill]").forEach(b => b.onclick = () => { yearly = b.dataset.bill === "y"; $$("[data-bill]").forEach(x => x.classList.toggle("on", x === b)); renderPlans(); });

/* ---------- team ---------- */
let members = store.get("team", [{ name: "", email: "", role: "Owner" }]);
const myName = () => store.get("name", "Designer");
function renderTeam() {
  const ul = $("#memberList"); ul.innerHTML = "";
  members.forEach((m, i) => {
    const label = i === 0 ? myName() + " (you)" : (m.email || m.name);
    const li = el("li");
    li.innerHTML = `<span class="av">${esc(label[0].toUpperCase())}</span><span class="mn">${esc(label)}<small>${esc(m.role)}${m.pending ? " · Invited" : ""}</small></span>`;
    if (i) { const b = el("button"); b.className = "btn sm"; b.textContent = "Remove"; b.onclick = () => { members.splice(i, 1); store.set("team", members); renderTeam(); }; li.appendChild(b); }
    ul.appendChild(li);
  });
  $("#seatInfo").textContent = `${members.length} of ${PLAN().seats} seat${PLAN().seats > 1 ? "s" : ""} used on the ${PLAN().name} plan.`;
}
$("#inviteBtn").onclick = () => {
  const e = $("#inviteEmail").value.trim();
  if (!/^\S+@\S+\.\S+$/.test(e)) return toast("Enter a valid email address.");
  if (members.length >= PLAN().seats) { toast("No free seats on your plan. Choose Team to invite more people."); showDp("plans"); return; }
  members.push({ name: "", email: e, role: $("#inviteRole").value, pending: true });
  store.set("team", members); $("#inviteEmail").value = ""; renderTeam(); toast("Invitation saved (demo, no email is sent).");
};

/* ---------- side menu + settings ---------- */
function showDp(n) {
  $$(".dpage").forEach(d => d.hidden = d.id !== "dp-" + n);
  $$(".side nav button").forEach(b => b.classList.toggle("on", b.dataset.dp === n));
}
$$(".side nav button").forEach(b => b.onclick = () => showDp(b.dataset.dp));
$("#dsearch").oninput = e => {
  showDp("home");
  const q = e.target.value.toLowerCase();
  $("#projCard").hidden = !!q && !$("#projCard b").textContent.toLowerCase().includes(q);
};
const applyTheme = t => t === "system" ? document.documentElement.removeAttribute("data-theme") : document.documentElement.dataset.theme = t;
const setAvatar = () => $("#avatar").textContent = (myName()[0] || "D").toUpperCase();
$("#setName").value = myName();
$("#setName").oninput = e => { store.set("name", e.target.value || "Designer"); setAvatar(); renderTeam(); };
$("#setTheme").value = store.get("theme", "system"); applyTheme($("#setTheme").value);
$("#setTheme").onchange = e => { store.set("theme", e.target.value); applyTheme(e.target.value); };
$("#setSnap").checked = store.get("snap", true); $("#snapChk").checked = $("#setSnap").checked;
$("#setSnap").onchange = e => { store.set("snap", e.target.checked); $("#snapChk").checked = e.target.checked; };
setAvatar(); updateStorage(); renderCards(); renderPlans(); renderTeam();

render();
