/*
 * __TITLE__ — trainer content.
 * Loads after ../../engine/o9-shell.js (shares its global scope). See that
 * file's header comment for the full engine/content interface.
 *
 * This is a MINIMAL skeleton, not a full copy of every pattern the engine
 * supports. It proves out: Launch (mode select) -> Guided Tour -> one
 * workspace page with an editable grid -> a coach hint fired on edit -> an
 * exception inbox with one item -> Finish -> a scored Results screen ->
 * Reflection.
 *
 * Patterns NOT included here but available to copy from
 * assets/o9-trainer/trainers/nvs-reforecast/content.js if this trainer
 * needs them: row locking, the priority-cascade side panel, the
 * explainability side panel + flow diagrams, and a multi-period rollover
 * (closeMonth-style) engine with drift/consequence rules.
 *
 * TODO before this trainer is real: replace ITEMS_SEED, EXCEPTIONS,
 * TOUR_STEPS, HINTS, KPI_OPTIONS and every screen's copy below with actual
 * content for __TITLE__.
 */
"use strict";

/* ---------- shell chrome content ---------- */
const NAV = [
	{ l:"Workspace", grp:true, open:true },
	{ l:"Workspace", leaf:true, page:"workspace" }
];
const SCOPE = [["Currency","USD"],["Season","TODO"]];
const PAGE_TITLE = { "workspace": ()=> "TODO — Workspace Title" };
const PAGE_CHIP  = { "workspace": "Workspace" };

/* ---------- Guided Tour, zero decision points ---------- */
const TOUR_STEPS = [
	{ t:"TODO — first thing the trainee needs oriented on",
	  b:"TODO — one or two short paragraphs, same tone as the o9 chrome around it." },
	{ t:"TODO — second orienting step",
	  b:"TODO — keep the tour to a handful of steps; it should never contain a decision." }
];

/* ---------- Coach copy, keyed by hint id ---------- */
const HINTS = {
	"H-1": { b:"TODO — the first hint a trainee sees, tied to their first edit.", f:null }
};

/* ---------- seed data — TODO replace with this trainer's real rows ---------- */
const ITEMS_SEED = [
	{ id:"IT1", label:"TODO item one", basis:1000 },
	{ id:"IT2", label:"TODO item two", basis:2000 },
	{ id:"IT3", label:"TODO item three", basis:3000 }
];

/* ---------- Exception Inbox — TODO replace with real scenarios ---------- */
const EXCEPTIONS = [
	{ id:"EX-1", type:"REVIEW", kind:"none", title:"TODO exception title",
	  body:"TODO — what changed and why it needs a decision.",
	  correctAction:"dismiss",
	  options:[{a:"dismiss",l:"No action — dismiss"}],
	  feedback:{ correct:"TODO — why dismissing was right.", wrong:null } }
];

/* ---------- Scoring — spec-shaped: weights + tier bands ---------- */
const KPI_WEIGHTS = { kpi1:1 };
const TIER_BANDS = [
	{ min:80, tier:1, label:"ON TRACK" },
	{ min:50, tier:2, label:"NEEDS WORK" },
	{ min:0,  tier:3, label:"START OVER" }
];
const KPI_OPTIONS = [
	{ id:"KPI-1", name:"Shaping Coverage",
	  desc:"Share of items with a planner override entered.",
	  fn:function(){
	  	const shaped = S.items.filter(i=>i.ovrd.value != null).length;
	  	return S.items.length ? 100 * shaped / S.items.length : 100;
	  } }
];

/* ==================================================================
   STATE
   ================================================================== */
let S = null;
function newRun(mode){
	S = {
		mode, screen:null, page:"workspace",
		tourOpen:false, tourIdx:0, tourComplete:false,
		coachExpanded:false, coachHint:null, firedHints:{},
		side:null, sideCtx:null,
		items: clone(ITEMS_SEED),
		inbox: clone(EXCEPTIONS)
	};
	S.items.forEach(it=>{ it.ovrd = { value:null }; });
	return S;
}
function finalValue(item){ return item.ovrd.value != null ? item.ovrd.value : item.basis; }

/* fireHint() and skipTour() live here, not in the engine — which hint fires
   and what happens when the tour ends are this trainer's own decisions. */
function fireHint(id, opts){
	opts = opts || {};
	if(!HINTS[id]) return;
	if(S.firedHints[id] && !opts.force) return;
	S.firedHints[id] = true;
	S.coachHint = id;
	if(S.mode==="guided") S.coachExpanded = true;
	announce("Coach note " + id);
}
function skipTour(){
	S.tourOpen = false; S.tourComplete = true;
	const ov = document.getElementById("tourOv"); if(ov) ov.remove();
	render();
}

/* ==================================================================
   SHELL RENDER
   ================================================================== */
function render(){
	const app = document.getElementById("app");
	app.className = "";
	app.innerHTML =
		appbarHTML() +
		'<div class="main">' + railLHTML() + pagesHTML() +
		  '<div class="content">' + scopeHTML() + reportHeaderHTML() +
		    '<div class="workarea"><div class="gridwrap" id="gw">' + gridHTML() + '</div>' +
		    sidePanelHTML() + '</div>' +
		  '</div>' + railRHTML() +
		'</div>';
	renderCoach();
	bindShell();
}
function appbarHTML(){
	const ic = ["⌕","☁","☷","▤","○","△","↻","⚙"].map(i=>`<span>${i}</span>`).join("");
	return `<div class="appbar"><div class="o9">o9</div><div class="back">←&nbsp; TODO</div>
    <div class="pagechip">${esc(PAGE_CHIP[S.page])}</div><div class="spacer"></div>
    <div class="icons">${ic}</div><div class="who">TODO</div><div class="avatar">JH</div></div>`;
}
function railLHTML(){ return `<div class="railL" aria-hidden="true"><span>≡</span><span>▦</span><span>▭</span><span>☺</span></div>`; }
function railRHTML(){ return `<div class="railR" aria-hidden="true"><span>▤</span><span>⚙</span><span>◉</span><span>?</span></div>`; }
function pagesHTML(){
	let h = `<nav class="pages" aria-label="Pages"><h2>Pages</h2>`;
	NAV.forEach((n,i)=>{
		if(n.grp) h += `<div class="navrow grp nav-off">${esc(n.l)}<span class="chev">${n.open?"˄":"˅"}</span></div>`;
		else {
			const active = n.page === S.page;
			h += `<button class="navrow leaf nav-on ${active?"active":""}" data-nav="${i}">${esc(n.l)}</button>`;
		}
	});
	return h + `</nav>`;
}
function scopeHTML(){
	return `<div class="scopebar"><span class="ic">▥</span><span class="ic">∇</span>` +
	  SCOPE.map(([k,v])=>`<span class="scope"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></span>`).join("") +
	  `</div>`;
}
function reportHeaderHTML(){
	const open = S.inbox.filter(i=>!i.resolved).length;
	return `<div class="rpthdr"><h1>${esc(PAGE_TITLE[S.page]())}</h1>
    <div class="toolbar">
      <button class="tool" id="btnInbox">Exception Inbox${open?" · "+open:""}</button>
      <button class="tool primary" id="btnFinish">Finish &amp; Score</button>
    </div></div>`;
}

/* ---------- the one grid — TODO replace with this trainer's real columns ---------- */
function gridHTML(){
	let h = `<div class="sec-hdr">TODO GRID TITLE</div>
    <table class="g"><thead><tr><th>Item</th><th class="n">Basis</th>
    <th class="n">Override</th><th class="n">Final</th></tr></thead><tbody>`;
	S.items.forEach(it=>{
		h += `<tr><td>${esc(it.label)}</td><td class="n calc mute">${fU(it.basis)}</td>` +
		  ec(it.id, "ovrd", "value", it.ovrd.value, fU, false) +
		  `<td class="n" style="font-weight:700">${fU(finalValue(it))}</td></tr>`;
	});
	return h + `</tbody></table>` + cellLegend();
}

/* ==================================================================
   SIDE PANEL — inbox only. Explainability / cascade panels live in
   nvs-reforecast/content.js as a reference if this trainer needs them.
   ================================================================== */
function sidePanelHTML(){
	if(S.side==="inbox") return `<aside class="side inbox open" role="complementary">${inboxHTML()}</aside>`;
	return `<aside class="side"></aside>`;
}
function inboxHTML(){
	const items = S.inbox;
	const open = items.filter(i=>!i.resolved).length;
	let h = panelHead("EXCEPTION INBOX","", items.length+" items");
	h += `<div class="sc"><div class="summary">${open} need a decision</div>`;
	items.forEach(it=>{
		h += `<div class="card ${it.resolved?"done":""}"><h4>${esc(it.title)}</h4><p>${esc(it.body)}</p>`;
		if(!it.resolved){
			h += `<div class="acts">` + it.options.map(o=>
			  `<button data-inbox="${it.id}|${o.a}">${esc(o.l)} ›</button>`).join("") + `</div>`;
		} else {
			const good = it.chosen === it.correctAction;
			h += `<div class="fb" style="background:var(--${good?"chase-fill":"cancel-fill"});color:var(--${good?"chase-ink":"cancel-ink"})">
        ${esc(good?it.feedback.correct:(it.feedback.wrong||it.feedback.correct))}</div>`;
		}
		h += `</div>`;
	});
	return h + `</div>`;
}
function resolveException(id, action){
	const it = S.inbox.find(x=>x.id===id);
	if(!it || it.resolved) return;
	it.chosen = action; it.resolved = true;
	render();
}

/* ==================================================================
   INTERACTION
   ================================================================== */
function findRow(id){ return S.items.find(i=>i.id===id); }
function bindShell(){
	const app = document.getElementById("app");
	app.querySelectorAll("[data-edit]").forEach(td=>{
		td.addEventListener("click", ()=>beginEdit(td));
	});
	app.querySelectorAll("[data-inbox]").forEach(b=>b.addEventListener("click",()=>{
		const [id,act] = b.dataset.inbox.split("|");
		resolveException(id, act);
	}));
	const bF = app.querySelector("#btnFinish");
	if(bF) bF.addEventListener("click", finish);
	const bI = app.querySelector("#btnInbox");
	if(bI) bI.addEventListener("click", ()=>{ S.side = S.side==="inbox" ? null : "inbox"; render(); });
	app.querySelectorAll("[data-close-side]").forEach(b=>b.addEventListener("click",()=>{ S.side=null; render(); }));
	renderTour();
}
function beginEdit(td){
	const [id,field,m] = td.dataset.edit.split("|");
	const row = findRow(id);
	const cur = row[field][m];
	const inp = document.createElement("input");
	inp.className="cell"; inp.type="number"; inp.step="any";
	inp.value = cur==null ? "" : cur;
	td.textContent=""; td.appendChild(inp); inp.focus(); inp.select();
	const commit = ()=>{
		const raw = inp.value.trim();
		const val = raw==="" ? null : Number(raw);
		if(raw!=="" && isNaN(val)) { render(); return; }
		row[field][m] = val;
		if(val != null) fireHint("H-1");
		render();
	};
	inp.addEventListener("blur", commit);
	inp.addEventListener("keydown", e=>{
		if(e.key==="Enter"){ e.preventDefault(); commit(); }
		if(e.key==="Escape"){ e.preventDefault(); render(); }
	});
}

/* ==================================================================
   FINISH -> RESULTS -> REFLECTION
   ================================================================== */
function finish(){
	S.score = computeScore();
	S.screen = "results";
	renderScreen();
}
function renderScreen(){
	if(!S.screen){ const s=document.getElementById("scr"); if(s) s.remove(); render(); return; }
	if(S.screen==="results")  return screenResults();
	if(S.screen==="reflect")  return screenReflection();
}
function screenResults(){
	const d = screenEl("");
	const badge = getScoreBadgeTier(S.score.readiness);
	let h = `<div class="wrapc">
    <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;color:var(--coach)">RUN COMPLETE</div>
    <div class="bignum">${Math.round(S.score.readiness)}%</div>
    <div class="tierbadge">TIER ${badge.tier} · ${esc(badge.label)}</div>`;
	KPI_OPTIONS.forEach(k=>{
		const v = S.score.vals[k.id];
		h += `<div class="kpi" style="border-left-color:var(--imp-ink)">
      <div class="l"><h3>${esc(k.name)}</h3><div class="d">${esc(k.desc)}</div></div>
      <div class="r"><div class="pc">${Math.round(v)}%</div></div></div>`;
	});
	h += `<button class="btn dark" id="resGo" style="margin-top:20px">Continue to reflection ›</button></div>`;
	d.innerHTML = h;
	d.querySelector("#resGo").onclick = ()=>{ S.screen="reflect"; renderScreen(); };
}
function screenReflection(){
	const d = screenEl("dark");
	d.innerHTML = `<div class="wrapc">
    <h1 style="font-family:Georgia,serif;font-size:30px;margin:14px 0 18px">TODO — closing reflection headline.</h1>
    <p style="font-size:13px;color:#C9CDD2;line-height:1.7;max-width:800px">TODO — one or two paragraphs on what the trainee just practiced and why it matters.</p>
    <button class="btn" style="margin-top:26px;background:#fff;color:var(--t-ink);font-weight:700" id="again">Run it again</button>
  </div>`;
	d.querySelector("#again").onclick = ()=>{
		S=null; document.getElementById("app").classList.add("hidden");
		const c=document.getElementById("coach"); if(c) c.classList.add("hidden");
		const s=document.getElementById("scr"); if(s) s.remove();
		renderLaunch();
	};
}

/* ==================================================================
   LAUNCH
   ================================================================== */
function renderLaunch(){
	const d = screenEl("");
	d.innerHTML = `<div class="launch">
    <div class="l"><div class="kicker"></div>
      <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;color:var(--coach)">PLANNING TRAINER</div>
      <h1>__TITLE__</h1>
      <p class="lede">TODO — one or two sentences on what this trainer covers.</p>
    </div>
    <div class="r">
      <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:var(--eyebrow)">MISSION BRIEF</div>
      <div class="brief" style="margin-top:12px"><p>TODO — the mission brief copy.</p></div>
      <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:var(--eyebrow);margin-top:26px">CHOOSE YOUR PATH</div>
      <div class="paths">
        <div class="path"><div class="top" style="background:var(--coach)"></div>
          <h3>GUIDED</h3><p class="q">TODO — guided-mode pitch.</p>
          <button class="btn pri" data-mode="guided">Start Guided</button></div>
        <div class="path"><div class="top" style="background:var(--imp-ink)"></div>
          <h3>CHALLENGE</h3><p class="q">TODO — challenge-mode pitch.</p>
          <button class="btn dark" data-mode="challenge">Start Challenge</button></div>
      </div>
    </div></div>`;
	d.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>{
		newRun(b.dataset.mode);
		document.getElementById("app").classList.remove("hidden");
		const s=document.getElementById("scr"); if(s) s.remove();
		if(S.mode==="guided") S.tourOpen = true;
		render();
	}));
}

/* ==================================================================
   INIT
   ================================================================== */
document.addEventListener("DOMContentLoaded", renderLaunch);
