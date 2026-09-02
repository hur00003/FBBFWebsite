/*
 * O9 TRAINER ENGINE — shared chrome + generic mechanics for every trainer.
 *
 * Loaded as a plain script before a trainer's content.js, so both share one
 * global scope (same pattern the original monolithic file used internally —
 * this split only moves code between files, it does not change how it runs).
 *
 * What lives here: formatters, small render helpers with zero domain logic,
 * the Coach dock, the Guided Tour, the full-screen "screen" shell helpers,
 * and the scoring/tier aggregation. Everything domain-specific — nav
 * structure, seed data, formulas, grids, side-panel content, screen copy,
 * exceptions, hints, tour steps, KPI definitions, month-rollover rules —
 * lives in each trainer's own content.js and is expected to define these
 * globals before the engine's tour/coach/scoring functions are called:
 *   S            — the mutable trainer state (content creates/owns it)
 *   HINTS        — { [id]: { b, f } } coach hint copy, keyed by id
 *   TOUR_STEPS   — [{ t, b }] guided tour steps
 *   KPI_OPTIONS  — [{ id, name, desc, fn() }] scoring functions
 *   KPI_WEIGHTS  — { kpi1..N: number } weight per KPI_OPTIONS index
 *   TIER_BANDS   — [{ min, tier, label }] sorted high to low
 *   render()     — content's shell re-render function (engine calls it
 *                  after coach/tour interactions change S)
 *   fireHint(id, opts) / skipTour()
 *                — content defines these too: which hint fires and when a
 *                  repeat is suppressed are rollover-structure decisions,
 *                  not engine plumbing (see comments at their call sites).
 */
"use strict";

/* ---------- formatters — units integer w/ separators, % 1dp, currency 2dp.
   An empty cell is EMPTY. Never 0, never an em dash. ---------- */
const fU  = v => (v==null||v==="") ? "" : Math.round(v).toLocaleString("en-US");
const fP  = v => (v==null||v==="") ? "" : (v>0?"+":"") + Number(v).toFixed(1) + "%";
const fPc = v => (v==null||v==="") ? "" : Number(v).toFixed(1) + "%";
const f2  = v => (v==null||v==="") ? "" : Number(v).toFixed(2);
const f1  = v => (v==null||v==="") ? "" : Number(v).toFixed(1);
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function announce(msg){ const el=document.getElementById("live"); if(el) el.textContent = msg; }
function clone(o){ return JSON.parse(JSON.stringify(o)); }

/* ---------- editable cell helper — used by every grid ---------- */
function ec(rowId, field, m, val, fmt, locked, extra){
	if(locked) return `<td class="n lockcell">${fmt(val)}</td>`;
	return `<td class="n edit" tabindex="0" role="button"
    data-edit="${rowId}|${field}|${m}" data-fmt="${extra||""}"
    aria-label="${esc(field)} ${esc(m)}, editable">${fmt(val)}</td>`;
}

/* ---------- cell-state legend, shown under any grid ---------- */
function cellLegend(){
	const L = [["Editable","var(--c-edit)"],["Calculated","var(--c-calc)"],["Locked","var(--c-lock)"],
	           ["Constrained","var(--c-constr)"],["Actualized","var(--c-act)"]];
	return `<div style="display:flex;gap:20px;align-items:center;margin:10px 2px 18px;font-size:10.5px;color:var(--t-ink2)">
    <span style="font-size:9.5px;font-weight:700;letter-spacing:.6px;color:var(--t-ink3)">CELL STATE</span>` +
	  L.map(([l,c])=>`<span><i style="display:inline-block;width:16px;height:10px;background:${c};border:1px solid var(--p-hair);vertical-align:-1px"></i> ${l}</span>`).join("") +
	  `</div>`;
}

/* ---------- side-panel header, shared by every side panel ---------- */
function panelHead(eyebrow,title,meta){
	return `<div class="bar"></div><div class="hd"><div class="eyebrow">${esc(eyebrow)}</div>
    <h3>${esc(title)}</h3><div class="meta">${esc(meta||"")}</div>
    <button class="x" data-close-side aria-label="Close panel">×</button></div>`;
}

/* ---------- explainability-flow node, shared by every flow diagram ---------- */
function node(cap,nm,vl,sb,ink,fill){
	return `<div class="node" style="border-color:var(--${ink})">
    <div class="cap" style="background:var(--${fill});color:var(--${ink})">${esc(cap)}</div>
    <div class="nm">${esc(nm)}</div><div class="vl" style="color:var(--${ink})">${esc(vl)}</div>
    <div class="sb">${esc(sb)}</div></div>`;
}

/* ---------- full-screen "screen" shell (Launch, Mission, Results, ...) ---------- */
function clearScreen(){ const s=document.getElementById("scr"); if(s) s.remove(); }
function screenEl(cls){
	clearScreen();
	const d = document.createElement("div");
	d.id="scr"; d.className="screen "+(cls||"");
	document.body.appendChild(d);
	return d;
}

/* ==================================================================
   COACH DOCK — generic given a content-supplied HINTS map.
   ================================================================== */
function renderCoach(){
	let el = document.getElementById("coach");
	if(!el){ el = document.createElement("div"); el.id="coach"; document.body.appendChild(el); }
	if(S.screen){ el.classList.add("hidden"); return; }
	el.classList.remove("hidden");
	const id = S.coachHint;
	const notes = id ? 1 : 0;
	el.className = S.coachExpanded && id ? "exp" : "";
	if(S.coachExpanded && id){
		const H = HINTS[id];
		el.innerHTML = `<div class="coachhead" data-coach-toggle role="button" tabindex="0">
        <div class="cavatar">C</div><div><div class="eb">COACH · ${esc(id)}</div></div>
        <span class="chev">˅</span></div>
      <div class="coachbody">${esc(H.b)}${H.f?`<div class="coachfoot">${esc(H.f)}</div>`:""}</div>`;
	} else {
		el.innerHTML = `<div class="coachhead" data-coach-toggle role="button" tabindex="0"
        aria-label="Coach, ${notes} note available">
      <div class="cavatar">C</div><div><div class="eb">COACH</div>
      <div class="sub">${notes} note on this screen</div></div><span class="chev">˄</span></div>`;
	}
	el.querySelector("[data-coach-toggle]").addEventListener("click", ()=>{
		S.coachExpanded = !S.coachExpanded; render();
	});
}
/* fireHint() itself stays in each trainer's content.js — whether/when a hint
   repeats is a rollover-structure decision (e.g. "don't repeat after month 3")
   that's specific to that trainer's own S shape, not a generic engine rule. */

/* ==================================================================
   GUIDED TOUR — generic given a content-supplied TOUR_STEPS array.
   skipTour() itself stays in content.js: what happens when the tour ends
   (which hint fires next, if any) is a scenario decision, not engine plumbing.
   ================================================================== */
function renderTour(){
	const old = document.getElementById("tourOv"); if(old) old.remove();
	if(!S.tourOpen) return;
	const st = TOUR_STEPS[S.tourIdx];
	const ov = document.createElement("div");
	ov.id = "tourOv"; ov.className = "overlay"; ov.setAttribute("role","dialog");
	ov.setAttribute("aria-modal","true"); ov.setAttribute("aria-label","Guided Tour step "+(S.tourIdx+1)+" of "+TOUR_STEPS.length);
	ov.innerHTML = `<div class="modal"><div class="bar"></div><div class="body">
    <div style="display:flex"><div class="eyebrow">STEP ${S.tourIdx+1} OF ${TOUR_STEPS.length}</div>
      <button class="btn ghost" id="tSkip" style="margin-left:auto">Skip tour</button></div>
    <h3>${esc(st.t)}</h3>
    ${st.b.split("\n\n").map(p=>`<p>${esc(p)}</p>`).join("")}
    <div class="foot"><div class="dots">${TOUR_STEPS.map((_,i)=>`<span class="dot ${i===S.tourIdx?"on":""}"></span>`).join("")}</div>
      <button class="btn" id="tBack" ${S.tourIdx===0?"disabled":""}>Back</button>
      <button class="btn pri" id="tNext">${S.tourIdx===TOUR_STEPS.length-1?"Finish":"Next"}</button></div>
  </div></div>`;
	document.body.appendChild(ov);
	ov.querySelector("#tNext").addEventListener("click", tourNext);
	ov.querySelector("#tBack").addEventListener("click", tourBack);
	ov.querySelector("#tSkip").addEventListener("click", skipTour);
	ov.querySelector("#tNext").focus();
}
function renderTourStep(i){ S.tourIdx = Math.max(0, Math.min(TOUR_STEPS.length-1, i)); renderTour(); }
function tourNext(){ if(S.tourIdx >= TOUR_STEPS.length-1) return skipTour(); renderTourStep(S.tourIdx+1); }
function tourBack(){ renderTourStep(S.tourIdx-1); }
/* skipTour() is defined in content.js — see comment above. */

/* ==================================================================
   SCORING — generic given content-supplied KPI_OPTIONS / KPI_WEIGHTS / TIER_BANDS.
   ================================================================== */
function computeScore(){
	const vals = {}; let tot = 0, wt = 0;
	KPI_OPTIONS.forEach((k,i)=>{
		const v = Math.max(0, Math.min(100, k.fn()));
		vals[k.id] = v;
		const w = KPI_WEIGHTS["kpi"+(i+1)];
		tot += v*w; wt += w;
	});
	return { vals, readiness: wt ? tot/wt : 0 };
}
function getScoreBadgeTier(readiness){
	return TIER_BANDS.find(b=>readiness >= b.min) || TIER_BANDS[TIER_BANDS.length-1];
}
/* Is this the best tier a trainer can award? Every trainer's TIER_BANDS is
   written highest-threshold-first (see nvs-reforecast / nvs-preseason-prep),
   so the top tier is simply the first entry. */
function isTopTier(tier){ return tier === TIER_BANDS[0]; }

/* ==================================================================
   TIER MEDIA — one shared photo/video per tier number, reused by every
   trainer's Results screen so they all celebrate the same way. Add an
   entry here (and drop the file in this engine/tier-media/ folder) to
   wire up a new tier's media — no trainer content.js needs to change.
   tools/bundle-trainer.js inlines whichever of these are referenced when
   it builds a standalone .html, so the split and bundled versions both
   just work once a file is added.
   ================================================================== */
const TIER_MEDIA = {
	1: "tier-media/tier-1.webp",
};
function tierMediaHTML(tier){
	const src = TIER_MEDIA[tier];
	if(!src) return "";
	const path = /^(data:|https?:)/.test(src) ? src : "../../engine/" + src;
	const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(src);
	return isVideo
		? `<video class="mascot" src="${path}" autoplay loop muted playsinline></video>`
		: `<img class="mascot" alt="Tier ${tier} celebration" src="${path}">`;
}
