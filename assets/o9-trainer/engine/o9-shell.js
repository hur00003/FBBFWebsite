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
 *   ADMIN_PRESETS — [{ name, difficulty, desc, hint, targets:[{kpi,dir,value}] }]
 *                  quick-start scenarios for the Admin Modal (see that
 *                  section below for the full content/engine contract)
 *   ADMIN_KPIS   — [{ id, label, fn() }] raw-metric catalog the Admin
 *                  Modal's Target KPI dropdown picks from — distinct from
 *                  KPI_OPTIONS, which are this trainer's weighted 0-100
 *                  Results/Tier factors, not raw counts/values
 *   SCOPE_PICKERS — { [dim]: { chipLabel, tabs:[{key,label,multi,members}] } }
 *                  the scope bar's clickable chips (see the SCOPE PICKER
 *                  section below for the full content/engine contract)
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

/* ==================================================================
   TIER MEDIA — a "you won" reward image/video for the top tier. Each
   trainer owns its own celebration: content.js defines its own
   TIER_MEDIA map with paths relative to its own trainer folder (e.g.
   "tier-media/tier-1.png", stored alongside that trainer's content.js),
   and calls this renderer with the resolved path. This function is pure
   engine plumbing — no trainer-specific data lives here — so two
   trainers can show completely different Tier 1 celebrations.
   tools/bundle-trainer.js inlines a trainer's own tier-media files as
   base64 when it builds that trainer's standalone .html.
   ================================================================== */
function tierMediaHTML(src, tier){
	if(!src) return "";
	const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(src);
	return isVideo
		? `<video class="mascot" src="${src}" autoplay loop muted playsinline></video>`
		: `<img class="mascot" alt="Tier ${tier} celebration" src="${src}">`;
}

/* ==================================================================
   ADMIN MODAL — a scenario/challenge builder, standard across every
   trainer. Generic given content-supplied ADMIN_PRESETS / ADMIN_KPIS
   (see the top-of-file header comment). Independent of the KPI_OPTIONS /
   TIER_BANDS scoring system: that one drives the Finish -> Results ->
   Reflection arc every trainer always has; this one is an optional,
   repeatable practice layer a trainee can start/exit/retry mid-run
   without ending the run, scored against specific target KPI values
   instead of a weighted readiness percentage.

   Content.js must seed its initial state (newRun()) with:
     S.admin = { open:false, presetIdx:null, name:"Custom Scenario",
                 difficulty:"medium", desc:"", hint:"", targets:[] }
     S.activeScenario = null
   and call render()'s existing self-mounted-overlay pattern: add
   renderAdminModal() and renderAdminResults() wherever renderTour() is
   already called. A trainer that wants the Target Tracker visible needs
   one more small, trainer-owned side-panel case (same shape as its
   existing inbox panel) that wraps adminTargetsHTML() in panelHead().
   ================================================================== */
const ADMIN_DIFFICULTY_TOL = { easy:.15, medium:.05, hard:.02 };
const ADMIN_DIFFICULTY_LABEL = { easy:"Easy (±15%)", medium:"Medium (±5%)", hard:"Hard (±2%)" };

function openAdminModal(){
	S.admin = { open:true, presetIdx:null, name:"Custom Scenario", difficulty:"medium",
		desc:"", hint:"", targets:[ newAdminTarget() ] };
	render();
}
function closeAdminModal(){ S.admin.open = false; render(); }
function newAdminTarget(){ return { kpi:ADMIN_KPIS[0].id, dir:"below", value:0 }; }
function selectAdminPreset(i){
	const p = ADMIN_PRESETS[i];
	S.admin.presetIdx = i;
	S.admin.name = p.name; S.admin.difficulty = p.difficulty;
	S.admin.desc = p.desc; S.admin.hint = p.hint;
	S.admin.targets = p.targets.map(t=>({ kpi:t.kpi, dir:t.dir, value:t.value }));
	render();
}
function addAdminTarget(){ S.admin.targets.push(newAdminTarget()); render(); }
function removeAdminTarget(i){ S.admin.targets.splice(i,1); render(); }
function startAdminChallenge(){
	const tol = ADMIN_DIFFICULTY_TOL[S.admin.difficulty] ?? .05;
	const targets = S.admin.targets.map(t=>{
		const k = ADMIN_KPIS.find(x=>x.id===t.kpi);
		return { kpi:t.kpi, dir:t.dir, value:t.value, label:k.label, tol };
	});
	S.activeScenario = { name:S.admin.name, difficulty:S.admin.difficulty,
		desc:S.admin.desc, hint:S.admin.hint, targets };
	S.admin.open = false;
	S.side = "admin";
	render();
}
function exitAdminScenario(){
	if(!confirm("Exit the current challenge? Progress stays, but the tracker will close.")) return;
	S.activeScenario = null;
	if(S.side==="admin") S.side = null;
	render();
}
function evalAdminTarget(t){
	const v = ADMIN_KPIS.find(x=>x.id===t.kpi).fn();
	const slack = t.tol * (Math.abs(t.value) || 1);
	const met = t.dir==="below" ? v <= t.value + slack : v >= t.value - slack;
	return { current:v, met };
}
function computeAdminScore(){
	if(!S.activeScenario) return 0;
	let sum = 0;
	S.activeScenario.targets.forEach(t=>{
		const ev = evalAdminTarget(t);
		if(ev.met){ sum += 100; return; }
		const dev = t.value!==0 ? Math.abs(ev.current-t.value)/Math.abs(t.value) : (ev.current===0?0:1);
		sum += Math.max(0, 100-dev*100)*0.7;
	});
	return Math.round(sum / S.activeScenario.targets.length);
}
function getAdminScoreBadge(score){
	if(score<60) return { emoji:"📋", caption:"Needs another pass — revisit the fundamentals." };
	if(score<80) return { emoji:"🧢", caption:"Solid progress — keep shaping the plan!" };
	if(score<=90) return { emoji:"🎯", caption:"Scenario targets mostly hit — nice work." };
	return { emoji:"🏆", caption:"Every target hit — scenario mastered." };
}
function submitAdminScenario(){
	if(!S.activeScenario) return;
	S.admin.resultsOpen = true;
	render();
}

/* ---------- adminTargetsHTML() — the tracker's per-target list + Submit
   Plan button. A pure render piece: content.js wraps it in panelHead()
   inside its own side-panel case, same as inboxHTML() does. ---------- */
function adminTargetsHTML(){
	if(!S.activeScenario) return "";
	const sc = S.activeScenario;
	let h = sc.hint ? `<div class="rulebox" style="background:var(--t-panel)"><b>Hint:</b> ${esc(sc.hint)}</div>` : "";
	sc.targets.forEach(t=>{
		const ev = evalAdminTarget(t);
		h += `<div class="target-item ${ev.met?"hit":"miss"}">
      <div class="ti-header"><span class="ti-label">${esc(t.label)}</span>
      <span class="ti-badge ${ev.met?"hit":"miss"}">${ev.met?"✓":"✗"}</span></div>
      <div class="ti-values">Current: ${f1(ev.current)}</div></div>`;
	});
	h += `<button class="btn dark" style="width:100%;margin-top:4px" data-admin-submit>✓ Submit Plan</button>`;
	return h;
}

/* ---------- renderAdminModal() / renderAdminResults() — self-mounted
   overlays, same pattern as renderTour(): called every render(), they
   remove and rebuild their own DOM node keyed off S.admin. ---------- */
function renderAdminModal(){
	const old = document.getElementById("adminOv"); if(old) old.remove();
	if(!S.admin || !S.admin.open) return;
	const ov = document.createElement("div");
	ov.id = "adminOv"; ov.className = "overlay"; ov.setAttribute("role","dialog");
	ov.setAttribute("aria-modal","true"); ov.setAttribute("aria-label","Scenario builder");
	ov.innerHTML = `<div class="modal admin-modal"><div class="bar"></div><div class="body">
    <h3>⚙ Scenario Builder</h3>
    <p>Build a scored scenario spanning this trainer's workspace, or pick a preset and go.</p>
    <div class="sec-hdr t">★ QUICK PRESETS</div>
    <div class="preset-grid">${ADMIN_PRESETS.map((p,i)=>`
      <div class="preset-card ${S.admin.presetIdx===i?"selected":""}" data-preset="${i}" role="button" tabindex="0">
        <span class="preset-badge ${esc(p.difficulty)}">${esc(p.difficulty)}</span>
        <h4>${esc(p.name)}</h4><p>${esc(p.desc)}</p>
      </div>`).join("")}</div>
    <div class="sec-hdr t" style="margin-top:14px">SCENARIO DETAILS</div>
    <div class="admform">
      <label>Scenario Name<input id="admName" type="text" value="${esc(S.admin.name)}"></label>
      <label>Difficulty<select id="admDiff">${Object.keys(ADMIN_DIFFICULTY_LABEL).map(k=>
        `<option value="${k}" ${S.admin.difficulty===k?"selected":""}>${ADMIN_DIFFICULTY_LABEL[k]}</option>`).join("")}</select></label>
    </div>
    <div class="admform">
      <label>Planner Instructions<textarea id="admDesc">${esc(S.admin.desc)}</textarea></label>
      <label>Hint<textarea id="admHint">${esc(S.admin.hint)}</textarea></label>
    </div>
    <div class="sec-hdr t" style="margin-top:14px">🎯 TARGET KPIS</div>
    <table class="target-table"><thead><tr><th>KPI</th><th>Direction</th><th>Target</th><th></th></tr></thead>
    <tbody>${S.admin.targets.map((t,i)=>`
      <tr>
        <td><select data-tgt-kpi="${i}">${ADMIN_KPIS.map(k=>
          `<option value="${k.id}" ${k.id===t.kpi?"selected":""}>${esc(k.label)}</option>`).join("")}</select></td>
        <td><select data-tgt-dir="${i}"><option value="below" ${t.dir==="below"?"selected":""}>At or Below</option>
          <option value="above" ${t.dir==="above"?"selected":""}>At or Above</option></select></td>
        <td><input data-tgt-val="${i}" type="number" value="${t.value}"></td>
        <td><button class="btn ghost" data-tgt-del="${i}" aria-label="Remove target">✕</button></td>
      </tr>`).join("")}</tbody></table>
    <button class="btn" id="admAddTarget" style="width:100%;margin-top:8px">+ Add Target KPI</button>
    <div class="foot" style="justify-content:flex-end">
      <button class="btn" id="admCancel">Cancel</button>
      <button class="btn dark" id="admStart">▶ Start Challenge</button>
    </div>
  </div></div>`;
	document.body.appendChild(ov);
	ov.querySelectorAll("[data-preset]").forEach(c=>c.addEventListener("click", ()=>selectAdminPreset(+c.dataset.preset)));
	ov.querySelector("#admName").addEventListener("input", e=>{ S.admin.name = e.target.value; });
	ov.querySelector("#admDiff").addEventListener("change", e=>{ S.admin.difficulty = e.target.value; });
	ov.querySelector("#admDesc").addEventListener("input", e=>{ S.admin.desc = e.target.value; });
	ov.querySelector("#admHint").addEventListener("input", e=>{ S.admin.hint = e.target.value; });
	ov.querySelectorAll("[data-tgt-kpi]").forEach(s=>s.addEventListener("change", e=>{ S.admin.targets[+s.dataset.tgtKpi].kpi = e.target.value; }));
	ov.querySelectorAll("[data-tgt-dir]").forEach(s=>s.addEventListener("change", e=>{ S.admin.targets[+s.dataset.tgtDir].dir = e.target.value; }));
	ov.querySelectorAll("[data-tgt-val]").forEach(i=>i.addEventListener("input", e=>{ S.admin.targets[+i.dataset.tgtVal].value = parseFloat(e.target.value)||0; }));
	ov.querySelectorAll("[data-tgt-del]").forEach(b=>b.addEventListener("click", ()=>removeAdminTarget(+b.dataset.tgtDel)));
	ov.querySelector("#admAddTarget").addEventListener("click", addAdminTarget);
	ov.querySelector("#admCancel").addEventListener("click", closeAdminModal);
	ov.querySelector("#admStart").addEventListener("click", startAdminChallenge);
}
function renderAdminResults(){
	const old = document.getElementById("adminResOv"); if(old) old.remove();
	if(!S.admin || !S.admin.resultsOpen || !S.activeScenario) return;
	const sc = S.activeScenario;
	const score = computeAdminScore();
	const badge = getAdminScoreBadge(score);
	const ov = document.createElement("div");
	ov.id = "adminResOv"; ov.className = "overlay"; ov.setAttribute("role","dialog"); ov.setAttribute("aria-modal","true");
	ov.innerHTML = `<div class="modal"><div class="bar"></div><div class="body">
    <div class="eyebrow">${esc(sc.name.toUpperCase())}</div>
    <h3>${badge.emoji} ${score} <span style="font-size:13px;color:var(--t-ink3);font-weight:400">/ 100</span></h3>
    <p>${esc(badge.caption)}</p>
    <div class="checks" style="grid-template-columns:1fr 1fr">` +
		sc.targets.map(t=>{ const ev = evalAdminTarget(t);
			return `<div class="check" style="border-left-color:var(--${ev.met?"chase-ink":"cancel-ink"})">
        <div class="hd"><h3 style="font-size:12px">${esc(t.label)}</h3></div>
        <div class="desc">Current: ${f1(ev.current)}</div></div>`; }).join("") +
	`</div>
    <div class="foot" style="justify-content:flex-end"><button class="btn pri" id="admResClose">Close</button></div>
  </div></div>`;
	document.body.appendChild(ov);
	ov.querySelector("#admResClose").addEventListener("click", ()=>{ S.admin.resultsOpen = false; render(); });
}

/* ==================================================================
   SCOPE PICKER — a popover opened from a scope-bar chip, standard across
   every trainer. Generic given content-supplied SCOPE_PICKERS. Unlike
   the Guided Tour / Admin Modal overlays, the page behind it is never
   dimmed — it's a positioned popover, not a full-screen modal.

   Content.js must seed its initial state (newRun()) with:
     S.scope = { [dim]: { tab: <first tab's key>, selected: [members...] } }
       — one entry per key in SCOPE_PICKERS, each pre-seeded with
       whatever default selection makes sense for that trainer
     S.scopePicker = { open:false, dim:null, tab:null, draft:[], x:0, y:0 }
   and render scopeChipHTML(dim) for each dim instead of a static chip,
   and call renderScopePicker() wherever renderTour() is already called.
   ================================================================== */
function scopeDisplayValue(dim){
	const sel = S.scope[dim].selected;
	const total = SCOPE_PICKERS[dim].tabs.find(t=>t.key===S.scope[dim].tab).members.length;
	if(sel.length === total) return "(All)";
	if(sel.length <= 1) return sel[0] || "(None)";
	return sel[0] + " (+" + (sel.length-1) + ")";
}
function scopeChipHTML(dim){
	const cfg = SCOPE_PICKERS[dim];
	return `<button class="scope" data-scope-chip="${dim}">
    <span class="k">${esc(cfg.chipLabel)}</span><span class="v">${esc(scopeDisplayValue(dim))}</span></button>`;
}
function openScopePicker(dim, el){
	const r = el.getBoundingClientRect();
	const tab = S.scope[dim].tab;
	S.scopePicker = { open:true, dim, tab, draft:[...S.scope[dim].selected], x:r.left, y:r.bottom+6 };
	render();
}
function closeScopePicker(){ S.scopePicker.open = false; render(); }
function switchScopePickerTab(tabKey){
	const p = S.scopePicker;
	p.tab = tabKey;
	p.draft = (tabKey === S.scope[p.dim].tab) ? [...S.scope[p.dim].selected] : [];
	render();
}
function toggleScopeMember(member){
	const p = S.scopePicker;
	const tabCfg = SCOPE_PICKERS[p.dim].tabs.find(t=>t.key===p.tab);
	if(!tabCfg.multi){ p.draft = [member]; render(); return; }
	const i = p.draft.indexOf(member);
	if(i === -1) p.draft.push(member); else p.draft.splice(i,1);
	render();
}
function applyScopePicker(){
	const p = S.scopePicker;
	S.scope[p.dim] = { tab:p.tab, selected:[...p.draft] };
	closeScopePicker();
}
function renderScopePicker(){
	const old = document.getElementById("scopePickerOv"); if(old) old.remove();
	const p = S.scopePicker;
	if(!p || !p.open) return;
	const cfg = SCOPE_PICKERS[p.dim];
	const tabCfg = cfg.tabs.find(t=>t.key===p.tab);
	const ov = document.createElement("div");
	ov.id = "scopePickerOv"; ov.className = "scopepicker"; ov.setAttribute("role","dialog");
	ov.setAttribute("aria-label", cfg.chipLabel + " picker");
	ov.style.left = p.x + "px"; ov.style.top = p.y + "px";
	ov.innerHTML = `<div class="tabs2">${cfg.tabs.map(t=>
      `<button class="${t.key===p.tab?"on":""}" data-sp-tab="${t.key}">${esc(t.label)}</button>`).join("")}</div>
    <div class="body">
      <div class="count">ⓘ ${p.draft.length} selected out of all ${tabCfg.members.length} available members.</div>
      <div class="members">${tabCfg.members.map(m=>
        `<button class="member ${p.draft.includes(m)?"on":""}" data-sp-member="${esc(m)}">${esc(m).toUpperCase()}</button>`).join("")}</div>
    </div>
    <div class="foot"><button class="btn" id="spCancel">Cancel</button>
      <button class="btn go" id="spApply">✓ Apply</button></div>`;
	document.body.appendChild(ov);
	ov.querySelectorAll("[data-sp-tab]").forEach(b=>b.addEventListener("click", ()=>switchScopePickerTab(b.dataset.spTab)));
	ov.querySelectorAll("[data-sp-member]").forEach(b=>b.addEventListener("click", ()=>toggleScopeMember(b.dataset.spMember)));
	ov.querySelector("#spCancel").addEventListener("click", closeScopePicker);
	ov.querySelector("#spApply").addEventListener("click", applyScopePicker);
}
