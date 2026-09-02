/*
 * NVS PRE-SEASON PREP — Assortment Management, Closeout Flags & Clean Inputs.
 * Loads after ../../engine/o9-shell.js (shares its global scope — see that
 * file's header for the engine/content split).
 *
 * SOURCE: built from a linear e-learning deck (slides + narration + a final
 * acknowledgment quiz), not a decision-simulation like nvs-reforecast. The
 * deck's concepts, page names, and grid columns (confirmed against the
 * actual o9 screenshots it embeds) are followed directly. The exception
 * inbox, coach hints, and scoring are this Engineer's translation of those
 * concepts into decision scenarios, mirroring nvs-reforecast's mechanics —
 * the deck itself contains no right/wrong scenarios to lift verbatim.
 * DESIGN tags mark choices made to fit the engine's cycle-based format
 * where the source gave no equivalent (there's no numeric consequence
 * formula here the way reforecast's drift/actualization math was implied —
 * unresolved items are carried forward as open work instead).
 */
"use strict";

/* ==================================================================
   SHELL CHROME CONTENT — page names and columns match the real o9
   screenshots in the source deck (Assortment Management, Assortment
   Management Error, Seasonal Product Attributes, Inactive Products,
   Presentation Minimum Input, Placeholder Planning).
   ================================================================== */
const NAV = [
	{ l:"Assortment Management", grp:true, open:true },
	{ l:"Assortment Management", leaf:true, page:"assortment" },
	{ l:"Seasonal Product Attributes", leaf:true, page:"seasonal-attrs" },
	{ l:"Inactive Products", leaf:true, page:"inactive" },
	{ l:"Presentation Minimum Input", leaf:true, page:"presmin" },
	{ l:"Placeholder Planning", grp:true, open:true },
	{ l:"Closeout", leaf:true, page:"closeout" }
];
const SCOPE = [["Currency","USD"],["Country","UNITED STATES OF AM..."],["Channel","NIKE VALUE STORES"],
               ["Season","FA2026"],["Area of Responsib…","(All) 23490"],["Version","CurrentWorkingView"]];

const PAGE_TITLE = {
	"assortment":      ()=> S.tab==="error" ? "NVS Assortment Management Error" : "NVS Assortment Management",
	"seasonal-attrs":  ()=> "NVS Seasonal Product Attributes",
	"inactive":        ()=> "NVS Inactive BOP",
	"presmin":         ()=> "NVS Presentation Minimum Input",
	"closeout":        ()=> "NVS Placeholder Planning — Closeout"
};
const PAGE_CHIP = { "assortment":"Assortment Management", "seasonal-attrs":"Seasonal Product Attributes",
                    "inactive":"Inactive Products", "presmin":"Presentation Minimum Input", "closeout":"Placeholder Planning" };

/* Weeks 52–46 / Weeks 45–40 rhythm (source slides 13–14) collapses to the
   same 4-block ribbon both cycles — DESIGN: reused verbatim for cycle 2. */
const RIBBON_STEPS = [
	["Handover & Setup","read-only"],
	["Validate & Reconcile","decisions happen"],
	["SSP Generate","system-executed"],
	["Code Submit","admin-executed"]
];
const CYCLE_CFG = {
	1: { label:"WEEK 46 · STYLE SUBMIT", codeSubmit:"Week 46 Code Submit" },
	2: { label:"WEEK 40 · STYLE COLOR SUBMIT", codeSubmit:"Week 40 Code Submit" }
};

/* ==================================================================
   SEED DATA — style colors, inactive BOP, closeout placeholders and
   presentation minimums, shaped after the real grids in the source deck.
   ================================================================== */
const STYLE_SEED = [
	{ id:"AM1", midlevel:"DOWNSHIFTER", style:"FD6476", styleColor:"FD6476-101",
	  allocatedUnits:4200, deleteIndicator:0, hasError:false, sellDown:false },
	{ id:"AM2", midlevel:"DOWNSHIFTER", style:"IB1899", styleColor:"IB1899-001",
	  allocatedUnits:null, deleteIndicator:1, hasError:false, sellDown:false },
	{ id:"AM3", midlevel:"JOURNEY RUN", style:"FJ7765", styleColor:"FJ7765-121",
	  allocatedUnits:1800, deleteIndicator:0, hasError:true, errorType:"Missing MSRP in AV", sellDown:false },
	{ id:"AM4", midlevel:"QUEST", style:"FD6034", styleColor:"FD6034-001",
	  allocatedUnits:3100, deleteIndicator:0, hasError:false, sellDown:false, flag:"rebuy" },
	{ id:"AM5", midlevel:"ACG RUGGED ICON", style:"AA0762", styleColor:"AA0762-010",
	  allocatedUnits:null, deleteIndicator:0, hasError:false, sellDown:true },
	{ id:"AM6", midlevel:"REVOLUTION", style:"HJ8485", styleColor:"HJ8485-002",
	  allocatedUnits:2600, deleteIndicator:0, hasError:true, errorType:"Invalid store cluster", sellDown:false }
];

const INACTIVE_BOP_SEED = [
	{ id:"IB1", midlevel:"ACADEMY", style:"CW6109", styleColor:"CW6109-451",
	  bopU:56, avgMsrp:20.00, misclassified:false },
	{ id:"IB2", midlevel:"AIR FORCE 1", style:"805899", styleColor:"805899-202",
	  bopU:37, avgMsrp:170.00, misclassified:true },
	{ id:"IB3", midlevel:"ACCESS", style:"AV7941", styleColor:"AV7941-006",
	  bopU:47, avgMsrp:90.00, misclassified:false }
];

const PLACEHOLDER_SEED = [
	{ id:"PH1", code:"PHCO-10094", midlevel:"SPEED", bop:0 },
	{ id:"PH2", code:"PHCO-10225", midlevel:"DOWNSHIFTER", bop:0 },
	{ id:"PH3", code:"PHCO-10314", midlevel:"ELITE", bop:1200 }
];

const PRESMIN_SEED = [
	{ id:"PM1", division:"FOOTWEAR DIVISION", midlevel:"5149 RUN", location:"327722", defaultMin:50 },
	{ id:"PM2", division:"FOOTWEAR DIVISION", midlevel:"AIR ZOOM ALPHAFLY", location:"327722", defaultMin:20 },
	{ id:"PM3", division:"FOOTWEAR DIVISION", midlevel:"ESCAPE", location:"327722", defaultMin:20, smallFormat:true },
	{ id:"PM4", division:"FOOTWEAR DIVISION", midlevel:"CORTEZ", location:"327722", defaultMin:50 }
];

/* ==================================================================
   FORMULAS
   ================================================================== */
/* Closeout Placeholder inventory walk — same shape as nvs-reforecast's
   closeoutWalk: BOP + Transfer In = available; sales constrained to what's
   available; EOP = leftover. The source describes this identical mechanic
   (§ Closeout Placeholder Management), so the formula is reused, not reinvented. */
function placeholderWalk(ph){
	const bop = ph.bop;
	const ti = ph.transferIn ?? 0;
	const avail = bop + ti;
	const fcst = ph.fcstOvrd ?? 0;                  /* analytic forecast is always 0 on a placeholder */
	const constr = Math.min(fcst, avail);
	const eop = avail - constr;
	return { bop, ti, avail, fcst, constr, eop,
	         truncated: fcst > avail,
	         netSlsDollars: constr * (ph.aur ?? 0),
	         netSlsCost: constr * (ph.auc ?? 0) };
}
function placeholderPopulated(ph){
	return ph.fcstOvrd != null && ph.aur != null && ph.auc != null && ph.transferIn != null;
}
function presMinFinal(pm){ return pm.override != null ? pm.override : pm.defaultMin; }
function styleBlocked(row){ return row.hasError && !row.errorExported; }
/* Eligible for a Rebuy/Closeout decision at all: not blocked by an open
   error, and not leaving the assortment via a Line Delete (accepted or not
   — a deleted item never needs a flag either way). Used for the KPI
   denominator, which counts eligible rows regardless of whether they've
   been flagged yet. */
function styleEligibleForFlag(row){ return !row.hasError && !row.deleteIndicator; }
/* Still missing that decision right now — used by the readiness check to
   report the current gap, as opposed to KPI-1's end-of-cycle accuracy. */
function styleNeedsFlag(row){ return styleEligibleForFlag(row) && !row.flag; }

/* ==================================================================
   Guided Tour — zero decision points
   ================================================================== */
const TOUR_STEPS = [
	{ t:"Where Prep fits in One Connected Plan",
	  b:"The handover from Global Sport to NVS happens at Week 50, right after the Merchandising Assortment Review. Pre-season Prep is your first active planning moment — before this point, Global and Geo Sport shaped strategy; now the plan lands with you, and your job is to make sure it was built on clean inputs before the SSP ever generates." },
	{ t:"Pages hierarchy",
	  b:"Assortment Management is where Prep inputs are reviewed and maintained — flags, allocated units, line deletes, and errors. Seasonal Product Attributes is a read-only rollup for validation, not edits. Inactive Products holds sell-down inventory that never re-enters the assortment. Presentation Minimum Input and Placeholder Planning round out the pages you'll use this module." },
	{ t:"Scope bar — set your area of responsibility first",
	  b:"Currency, Country, Channel, Season, Area of Responsibility, Version. Everything you review is scoped to these — a flag or a placeholder means nothing without knowing which population it covers." },
	{ t:"The Prep rhythm — where you sit in the cycle",
	  b:"Four blocks to a Code Submit: Handover & Setup, Validate & Reconcile, SSP Generate, Code Submit. Only step two is yours to work — that's where flags get confirmed, errors get routed, and placeholders get populated. SSP Generate and Code Submit are system- and admin-executed; you don't click either." },
	{ t:"Rebuy vs. Closeout — the flag that decides everything downstream",
	  b:"Rebuy means the system will generate receipts for this style color. Closeout means no receipts in the last 3 seasons — it's controlled sell-down instead. Get this wrong and the SSP is wrong from its first run, because the flag decides which subtab a product lands in and whether the system replenishes it or constrains it to what's already in the channel." },
	{ t:"Override cells are yellow — that's what you can edit",
	  b:"Cream means editable. White is calculated. On the Assortment Management Error subtab nothing is editable at all — that page exists to quarantine broken inputs, not to fix them in o9." },
	{ t:"Coach dock — collapse it, it never blocks the grid",
	  b:"Bottom right. It flags a guardrail or a consequence, then stops. It will not confirm a flag for you, will not export an error for you, and will not tell you whether a placeholder assumption is right. Collapse it whenever you want." }
];

/* ==================================================================
   Coach copy — keyed by hint id, written from the deck's own guardrail
   language (slides 20–23, 27–28).
   ================================================================== */
const HINTS = {
	"H-1":{ b:"This style color has allocated units from the Global Sport handover but no flag yet. Allocated units are an upstream input you don't enter — but the flag is yours, and it decides whether receipts generate at all.", f:null },
	"H-2":{ b:"You can't plan or override anything on this subtab, and the error can't be fixed inside o9. Export the list and send it to your Merch partner — AV updates back into o9 twice a day once they correct it.", f:null },
	"H-3":{ b:"This style color is flagged Closeout, but its placeholder is still sitting at the zero default. No analytics forecast is generated for a placeholder — every unit is planner intent, and right now that intent hasn't been entered.", f:"Leaving it at zero isn't neutral. It understates the closeout position the SSP will plan against." },
	"H-4":{ b:"Presentation Minimums are a guardrail, not a demand lever — they exist so a store isn't starved below a viable presentation, not to tune how much you want to sell. Most categories should stay at the Division/Consumer default.", f:null },
	"H-5":{ b:"Inactive BOP is controlled sell-down — no receipts, demand constrained to what's already there. Your job in Prep is to validate the classification, not to manage the sell-down itself. If something here looks like it should be active assortment, the fix is upstream in the Line Plan.", f:null },
	"H-6":{ b:"This style color was deleted upstream. Accept the Line Delete Update first — a dropped product shouldn't keep living in the plan just because nobody acknowledged it.", f:null },
	"H-7":{ b:"An Assortment Management Error is still open. SSP assumes the assortment is correct when it generates — an unresolved error rides straight through as a bad starting plan.", f:"Exporting the error counts toward Error Handling Discipline. Leaving it open doesn't." },
	"H-8":{ b:"A Closeout Placeholder is still unpopulated heading into Code Submit. It will still submit — but the starting closeout plan will be wrong from its first run.", f:null },
	"H-9":{ b:"You cleared the live decisions and left the routine ones alone — that's the read working. What carries forward is whatever's still unresolved: it doesn't reset, it becomes next cycle's opening problem.", f:null },
	"H-10":{ b:"Flags confirmed, errors exported, placeholders populated, line deletes accepted. That's a clean handoff to SSP Generate — the system builds the right starting plan because you gave it the right inputs.", f:"Admin still runs Code Submit. Your part was making sure what it submits is trustworthy." }
};

/* ==================================================================
   Exception Inbox. DESIGN: unresolved cycle-1 items carry forward into
   cycle 2's inbox (concatenated in newCycleState) — the deck describes no
   numeric consequence for unresolved Prep work, so open items simply stay
   open rather than something invented decaying or drifting.
   ================================================================== */
const NVS_PREP_EXCEPTIONS = {
1:[
 { id:"C1-1", type:"FLAG", kind:"chase", title:"FD6476-101 · allocated units, flag unconfirmed",
   body:"Global Sport handed off allocated units for this style color, but Rebuy/Closeout is still unset.",
   correctAction:"open", live:true,
   options:[{a:"open",l:"Open Assortment Management"}],
   feedback:{ correct:"Flag confirmed. Allocated units plus a Rebuy flag means the system will generate receipts against a real upstream signal.", wrong:"Still unflagged. Until this is set, the SSP can't decide whether to generate receipts or constrain this to inventory." } },
 { id:"C1-2", type:"LINE DELETE", kind:"cancel", title:"IB1899-001 · deleted upstream",
   body:"Delete Indicator is set. This product was removed from the Line Plan upstream and needs to be acknowledged here.",
   correctAction:"open", live:true,
   options:[{a:"open",l:"Open Assortment Management"}],
   feedback:{ correct:"Line Delete accepted. A dropped product no longer lives in your plan.", wrong:"Still sitting in the plan. An unacknowledged delete doesn't remove itself — it keeps flowing into SSP as if it were current." } },
 { id:"C1-3", type:"ERROR", kind:"md", title:"FJ7765-121 · Assortment Management Error: Missing MSRP in AV",
   body:"This style color is quarantined on the Error subtab. It cannot be planned or overridden here, and the error can't be fixed inside o9.",
   correctAction:"escalate", partner:"Merch", live:true,
   options:[{a:"escalate",l:"Export to Merch"},{a:"dismiss",l:"Dismiss — no action"}],
   feedback:{ correct:"Right call. Merch fixes it in AV, which syncs back to o9 twice a day. That's the only path this error clears.", wrong:"This can't be dismissed away. It stays quarantined — and stays wrong — until it's exported to the partner who owns the source data." } },
 { id:"C1-4", type:"NO ACTION", kind:"none", decoy:true, title:"FD6034-001 · Rebuy confirmed, no issues",
   body:"Flag is already set correctly, allocated units are present, and there's no open error.",
   correctAction:"dismiss", live:false,
   options:[{a:"dismiss",l:"No action — dismiss"}],
   feedback:{ correct:"Correct — nothing to do here. Not every row needs a decision.", wrong:null } },
 { id:"C1-5", type:"FLAG", kind:"chase", title:"AA0762-010 · no receipts in 3 seasons, flag unconfirmed",
   body:"This style color hasn't generated a receipt in three seasons — that's the Closeout definition — but the flag is still unset.",
   correctAction:"open", live:true,
   options:[{a:"open",l:"Open Assortment Management"}],
   feedback:{ correct:"Flagged Closeout. Now it sells down against existing inventory instead of quietly waiting on a Rebuy receipt that was never coming.", wrong:"Still unflagged. Left this way, the system has no basis to decide this is sell-down rather than new-season product." } },
 { id:"C1-6", type:"PLACEHOLDER", kind:"gm", title:"PHCO-10225 (DOWNSHIFTER) · still at zero default",
   body:"No analytics forecast is generated for a Closeout Placeholder — every measure defaults to zero until you enter it.",
   correctAction:"open", live:false,
   options:[{a:"open",l:"Open Placeholder Planning"}],
   feedback:{ correct:"Populated. The starting closeout plan now reflects real planner intent instead of a zero default.", wrong:"Still zero. Whatever Code Submit locks in for this placeholder is built on inputs nobody actually entered." } }
],
2:[
 { id:"C2-1", type:"ERROR", kind:"md", title:"HJ8485-002 · Assortment Management Error: Invalid store cluster",
   body:"Quarantined on the Error subtab ahead of Week 40 Code Submit. Same guardrail as before: not fixable in o9.",
   correctAction:"escalate", partner:"Merch", live:true,
   options:[{a:"escalate",l:"Export to Merch"},{a:"dismiss",l:"Dismiss — no action"}],
   feedback:{ correct:"Exported. This is the only way it clears before the style-color-level submit.", wrong:"Still quarantined. It will not resolve itself, and it will not make Code Submit accurate while it's open." } },
 { id:"C2-2", type:"MISCLASSIFIED", kind:"cancel", title:"805899-202 · looks like it should be active assortment",
   body:"This is sitting in Inactive BOP, but the pattern doesn't read like normal controlled sell-down — it looks like it may have been misclassified.",
   correctAction:"escalate", partner:"Merch", live:true,
   options:[{a:"escalate",l:"Escalate to Merch / Line Plan"},{a:"dismiss",l:"Dismiss — no action"}],
   feedback:{ correct:"Right instinct, right route. The fix for a misclassified item is upstream in the Line Plan, not a local override in SSP.", wrong:"Dismissing leaves it stuck as inactive sell-down even if it should be part of the active assortment. That's not your call to fix locally — but it is your call to flag." } },
 { id:"C2-3", type:"NO ACTION", kind:"none", decoy:true, title:"AV7941-006 · normal controlled sell-down",
   body:"Classified correctly. Demand is constrained to what's in the channel, no receipts, transferring out at season end as expected.",
   correctAction:"dismiss", live:false,
   options:[{a:"dismiss",l:"No action — dismiss"}],
   feedback:{ correct:"Correct — this is what Inactive BOP is supposed to look like. Containment, not optimization.", wrong:null } },
 { id:"C2-4", type:"PRESENTATION MIN", kind:"gm", title:"ESCAPE @ 327722 · small-format store, real reason to tune",
   body:"This location is a known small-format store for this category. The Division/Consumer default may overstate what the store can actually present.",
   correctAction:"open", live:false,
   options:[{a:"open",l:"Open Presentation Minimum Input"}],
   feedback:{ correct:"Tuned with a real reason behind it. That's exactly the exception case Presentation Minimums are built for.", wrong:"Left at default despite a known store-format reason. Not wrong by rule, but it's the one case in this batch the guardrail was designed to catch." } },
 { id:"C2-5", type:"NO ACTION", kind:"none", decoy:true, title:"CORTEZ @ 327722 · default is fine",
   body:"No known store-format or category reason to deviate from the Division/Consumer default here.",
   correctAction:"dismiss", live:false,
   options:[{a:"dismiss",l:"No action — dismiss"}],
   feedback:{ correct:"Correct — Presentation Minimums aren't something you tune season over season without a clear business reason, and there isn't one here.", wrong:null } },
 { id:"C2-6", type:"PLACEHOLDER", kind:"gm", title:"PHCO-10094 (SPEED) · still needs inputs ahead of Code Submit",
   body:"Net Sales, AUR, AUC and Transfer In are all still at the zero/blank default.",
   correctAction:"open", live:false,
   options:[{a:"open",l:"Open Placeholder Planning"}],
   feedback:{ correct:"Populated ahead of the style-color-level submit — the closeout plan going into Code Submit reflects real intent.", wrong:"Still unpopulated. This rides into Code Submit exactly as empty as it started Prep." } }
]};

/* ==================================================================
   SCORING — spec-shaped: weights + tier bands, same pattern as
   nvs-reforecast so the Results screen behaves identically across trainers.
   ================================================================== */
const KPI_WEIGHTS = { kpi1:1, kpi2:1, kpi3:1, kpi4:1 };
const TIER_BANDS = [
	{ min:90, tier:1, label:"PREP READY" },
	{ min:75, tier:2, label:"MOSTLY CLEAN" },
	{ min:60, tier:3, label:"GAPS REMAIN" },
	{ min:0,  tier:4, label:"NOT READY FOR SSP" }
];
/* This trainer's own Tier 1 celebration — see tier-media/ next to this file. */
const TIER_MEDIA = {
	1: "tier-media/tier-1.webp",
};
const KPI_OPTIONS = [
	{ id:"KPI-1", name:"Flag Accuracy",
	  desc:"Share of style colors needing a Rebuy/Closeout confirmation that ended with the correct flag set.",
	  fn:function(){
	  	const needFlag = S.styles.filter(styleEligibleForFlag);
	  	if(!needFlag.length) return 100;
	  	const correct = needFlag.filter(r=> r.flag === (r.sellDown ? "closeout" : "rebuy"));
	  	return 100 * correct.length / needFlag.length;
	  } },
	{ id:"KPI-2", name:"Error Handling Discipline",
	  desc:"Share of Assortment Management Errors exported to the owning partner rather than left open.",
	  fn:function(){
	  	const errs = S.styles.filter(r=>r.hasError);
	  	if(!errs.length) return 100;
	  	return 100 * errs.filter(r=>r.errorExported).length / errs.length;
	  } },
	{ id:"KPI-3", name:"Placeholder Readiness",
	  desc:"Share of Closeout Placeholders with Net Sales, AUR, AUC and Transfer In all populated.",
	  fn:function(){
	  	if(!S.placeholders.length) return 100;
	  	return 100 * S.placeholders.filter(placeholderPopulated).length / S.placeholders.length;
	  } },
	{ id:"KPI-4", name:"Guardrail Discipline",
	  desc:"Correct routing of every live exception-inbox item — escalate when it's someone else's fix, dismiss when it isn't.",
	  fn:function(){
	  	const items = S.inbox.filter(i=>i.resolved);
	  	if(!items.length) return 100;
	  	return 100 * items.filter(i=>i.chosen===i.correctAction).length / items.length;
	  } }
];

/* ==================================================================
   STATE
   ================================================================== */
let S = null;
function newRun(mode){
	S = {
		mode, cycle:1, tourComplete:false, tourIdx:0, tourOpen:false,
		page:"assortment", tab:"grid",
		styles: clone(STYLE_SEED), inactive: clone(INACTIVE_BOP_SEED),
		placeholders: clone(PLACEHOLDER_SEED), presmins: clone(PRESMIN_SEED),
		inbox: clone(NVS_PREP_EXCEPTIONS[1]),
		firedHints:{}, coachExpanded:false, coachHint:null,
		side:null, sideCtx:null, cycleScores:[], ledger:[], screen:null
	};
	S.styles.forEach(r=>{ if(r.flag===undefined) r.flag=null; r.errorExported=false; r.deleteAccepted=false; });
	S.inactive.forEach(r=>{ r.aurDegOverride=null; r.analyticFcstOverride=null; r.locked=false; });
	S.placeholders.forEach(p=>{ p.fcstOvrd=null; p.aur=null; p.auc=null; p.transferIn=null; });
	S.presmins.forEach(p=>{ p.override=null; });
	return S;
}

/* fireHint() / skipTour() live here — see engine's comment on why. */
function fireHint(id, opts){
	opts = opts || {};
	if(!HINTS[id]) return;
	if(S.cycle===2 && S.firedHints[id] && !opts.force) return;
	S.firedHints[id] = true;
	S.coachHint = id;
	const auto = (S.mode==="guided" && !opts.postCommitOnly) || (S.mode==="challenge" && opts.postCommit);
	if(auto) S.coachExpanded = true;
	announce("Coach note " + id);
}
function skipTour(){
	S.tourOpen = false; S.tourComplete = true;
	const ov = document.getElementById("tourOv"); if(ov) ov.remove();
	fireHint("H-1");
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
		  '<div class="content">' + scopeHTML() + reportHeaderHTML() + tabsHTML() +
		    '<div class="workarea"><div class="gridwrap" id="gw">' + bodyHTML() + '</div>' +
		    sidePanelHTML() + '</div>' +
		  '</div>' + railRHTML() +
		'</div>';
	renderCoach();
	bindShell();
}
function appbarHTML(){
	const ic = ["⌕","☁","☷","▤","○","△","↻","⚙"].map(i=>`<span>${i}</span>`).join("");
	return `<div class="appbar"><div class="o9">o9</div><div class="back">←&nbsp; AP NVS</div>
    <div class="pagechip">${esc(PAGE_CHIP[S.page])}</div><div class="spacer"></div>
    <div class="icons">${ic}</div><div class="who">APNVS</div><div class="avatar">JH</div></div>`;
}
function railLHTML(){ return `<div class="railL" aria-hidden="true"><span>≡</span><span>▦</span><span>▭</span><span>☺</span></div>`; }
function railRHTML(){ return `<div class="railR" aria-hidden="true"><span>▤</span><span>⚙</span><span>◉</span><span>?</span></div>`; }
function pagesHTML(){
	let h = `<nav class="pages" aria-label="Pages"><h2>Pages</h2>`;
	NAV.forEach((n,i)=>{
		if(n.grp) h += `<div class="navrow grp nav-off">${esc(n.l)}<span class="chev">˄</span></div>`;
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
	  `<span style="margin-left:auto;color:var(--p-icon);font-size:11px">☆&nbsp;&nbsp;↪&nbsp;&nbsp;⋮</span></div>`;
}
function reportHeaderHTML(){
	const rows = { "assortment": S.tab==="error" ? "Showing "+S.styles.filter(r=>r.hasError).length+" rows of data."
	                 : "Showing "+S.styles.length+" rows of data.",
	               "seasonal-attrs":"Showing 1,207 rows of data.", "inactive":"Showing "+S.inactive.length+" rows of data.",
	               "presmin":"Showing "+S.presmins.length+" rows of data.", "closeout":"Showing "+S.placeholders.length+" rows of data." }[S.page];
	let tools = "";
	if(S.page==="assortment" && S.tab==="grid")
		tools = `<button class="tool primary" id="btnAcceptDeletes">Accept Line Delete Updates</button>`;
	if(S.page==="assortment" && S.tab==="error")
		tools = `<button class="tool primary" id="btnExportErrors">Export to Merch</button>`;
	const std = ["Export Pivot ˅","Download ˅","Bulk Edit ˅","Filters ˅","Layout","Local Edit"]
	  .map(t=>`<button class="tool">${esc(t)}</button>`).join("");
	return `<div class="rpthdr"><h1>${esc(PAGE_TITLE[S.page]())}</h1><span class="rows">ⓘ ${esc(rows)}</span>
    <div class="toolbar">${tools}${std}</div></div>`;
}
function tabsHTML(){
	if(S.page!=="assortment") return ribbonHTML();
	return ribbonHTML() + `<div class="subtabs">
    <button class="tab ${S.tab==="grid"?"on":""}" data-tab="grid">Assortment Management</button>
    <button class="tab ${S.tab==="error"?"on":""}" data-tab="error">Assortment Management Error</button></div>`;
}
function ribbonHTML(){
	let h = `<div class="ribbon" ${S.coachExpanded?'style="background:var(--none-fill)"':""}>
    <div class="mlabel">${esc(CYCLE_CFG[S.cycle].label)}</div>`;
	RIBBON_STEPS.forEach((s,i)=>{
		h += `<div class="rstep ${i===1?"on":""}"><div class="t">${esc(s[0])}</div><div class="s">${esc(s[1])}</div></div>`;
		if(i<RIBBON_STEPS.length-1) h += `<div class="rsep">›</div>`;
	});
	return h + `<div style="flex:1"></div></div>`;
}

/* ==================================================================
   GRID DISPATCHER
   ================================================================== */
function bodyHTML(){
	if(S.page==="assortment")     return S.tab==="error" ? gridError() : gridAssortment();
	if(S.page==="seasonal-attrs") return gridSeasonalAttrs();
	if(S.page==="inactive")       return gridInactive();
	if(S.page==="presmin")        return gridPresMin();
	if(S.page==="closeout")       return gridCloseout();
}

/* ---------- Assortment Management ---------- */
function gridAssortment(){
	let h = `<table class="g"><thead><tr><th>Actions</th><th>MidLevel</th><th>Style</th><th>Style Color</th>
    <th class="n">Allocated U…</th><th>Delete Indicator</th><th>Flag</th></tr></thead><tbody>`;
	S.styles.forEach(r=>{
		let actionCell;
		if(r.deleteIndicator && !r.deleteAccepted){
			actionCell = `<button class="lockbtn" data-accept-delete="${r.id}">Accept Delete</button>`;
		} else if(r.hasError && r.errorExported){
			actionCell = `<span class="finmark">exported — pending Merch correction</span>`;
		} else if(styleBlocked(r)){
			actionCell = `<span class="finmark">blocked — export error first</span>`;
		} else if(!r.flag){
			actionCell = `<button class="lockbtn" data-flag="${r.id}|rebuy">Confirm Rebuy</button>
        <button class="lockbtn" data-flag="${r.id}|closeout">Confirm Closeout</button>`;
		} else {
			actionCell = `<span class="pill" style="color:var(--${r.flag==="rebuy"?"chase-ink":"gm-ink"});background:var(--${r.flag==="rebuy"?"chase-fill":"gm-fill"})">${r.flag.toUpperCase()} CONFIRMED</span>`;
		}
		h += `<tr><td>${actionCell}</td><td>${esc(r.midlevel)}</td><td>${esc(r.style)}</td><td>${esc(r.styleColor)}</td>
      <td class="n ${r.allocatedUnits==null?"mute":""}">${r.allocatedUnits==null?"—":fU(r.allocatedUnits)}</td>
      <td class="n ${r.deleteIndicator?"constr":""}">${r.deleteIndicator}${r.deleteAccepted?" ✓":""}</td>
      <td>${r.flag ? esc(r.flag) : (r.hasError?`<span class="mute">${esc(r.errorType)}${r.errorExported?" (exported)":""}</span>`:"—")}</td></tr>`;
	});
	return h + `</tbody></table>
    <p style="font-size:10.5px;font-style:italic;color:var(--t-ink3);margin:8px 2px 18px">
    This is not where sales get planned — this is where the inputs to the plan get made clean.</p>`;
}
function gridError(){
	const errs = S.styles.filter(r=>r.hasError);
	let h = `<div class="notice warn"><b style="display:block;font-size:9.5px;letter-spacing:.7px;margin-bottom:5px">GUARDRAILS</b>
    Cannot plan or override products in this tab. Errors cannot be fixed inside o9.</div>
    <table class="g"><thead><tr><th>Style Color</th><th>MidLevel</th><th>Error</th><th>Status</th></tr></thead><tbody>`;
	errs.forEach(r=>{
		h += `<tr><td>${esc(r.styleColor)}</td><td>${esc(r.midlevel)}</td><td>${esc(r.errorType)}</td>
      <td>${r.errorExported ? '<span class="pill" style="color:var(--chase-ink);background:var(--chase-fill)">EXPORTED</span>' : '<span class="pill" style="color:var(--cancel-ink);background:var(--cancel-fill)">OPEN</span>'}</td></tr>`;
	});
	if(!errs.length) h += `<tr><td colspan="4" class="mute">No open errors.</td></tr>`;
	return h + `</tbody></table>`;
}

/* ---------- Seasonal Product Attributes — read-only rollup ---------- */
function gridSeasonalAttrs(){
	return `<div class="notice ro">READ-ONLY · This is a pivot on the locked plan for validation and storytelling with Merch, Finance or Leadership — not for edits. Nothing here changes the plan.</div>
    <table class="g"><thead><tr><th>MidLevel</th><th>Style Color</th><th>Flag</th></tr></thead><tbody>` +
	  S.styles.map(r=>`<tr><td>${esc(r.midlevel)}</td><td>${esc(r.styleColor)}</td><td class="mute">${r.flag||"unflagged"}</td></tr>`).join("") +
	  `</tbody></table>`;
}

/* ---------- Inactive BOP ---------- */
function gridInactive(){
	let h = `<table class="g"><thead><tr><th>MidLevel</th><th>Style Color</th><th class="n">BOP U (WF)</th>
    <th class="n">Avg MSRP/Factory</th><th class="n">AUR Deg % Ovrd</th><th class="n">Analytic Fcst Ovrd</th>
    <th style="text-align:center">Lock</th></tr></thead><tbody>`;
	S.inactive.forEach(r=>{
		const L = r.locked;
		h += `<tr><td>${esc(r.midlevel)}</td><td>${esc(r.styleColor)}</td>
      <td class="n calc mute">${fU(r.bopU)}</td><td class="n calc mute">${f2(r.avgMsrp)}</td>` +
		  ec(r.id,"aurDegOverride","cur", r.aurDegOverride, v=>v==null?"":fPc(v), L, "deg") +
		  ec(r.id,"analyticFcstOverride","cur", r.analyticFcstOverride, fU, L) +
		  `<td style="text-align:center"><button class="lockbtn ${L?"on":""}" data-lock-inactive="${r.id}" aria-pressed="${L}">${L?"LOCKED":"LOCK"}</button></td></tr>`;
	});
	return h + `</tbody></table>
    <div class="notice info">Inactive BOP is controlled sell-down: no receipts, demand constrained to what's already in the channel. Your job in Prep is to validate classification, not manage the sell-down — if something here should be active assortment, the fix is upstream in the Line Plan.</div>` + cellLegend();
}

/* ---------- Presentation Minimum Input ---------- */
function gridPresMin(){
	let h = `<table class="g"><thead><tr><th>Division</th><th>MidLevel</th><th>Location Code</th>
    <th class="n">Default Div Consumer Min</th><th class="n">Presentation Min Ovrd</th><th class="n">Final Pres Min</th></tr></thead><tbody>`;
	S.presmins.forEach(p=>{
		h += `<tr><td>${esc(p.division)}</td><td>${esc(p.midlevel)}</td><td>${esc(p.location)}</td>
      <td class="n calc mute">${fU(p.defaultMin)}</td>` +
		  ec(p.id,"override","cur", p.override, fU, false) +
		  `<td class="n calc" style="font-weight:700">${fU(presMinFinal(p))}</td></tr>`;
	});
	return h + `</tbody></table>
    <div class="notice info">Presentation Minimums are guardrails, not demand levers. Defaults are set at Division/Consumer level — tune down to Store/PPH + Mid-level only when there's a clear business reason.</div>` + cellLegend();
}

/* ---------- Placeholder Planning · Closeout ---------- */
function gridCloseout(){
	let h = `<table class="g"><thead><tr><th>MidLevel</th><th>Closeout Assoc</th><th class="n">BOP U (WP)</th>
    <th class="n">Sls Fcst U Ovrd</th><th class="n">Net Sls AUR $</th><th class="n">Net Sls AUC $</th>
    <th class="n">Transfer In U</th><th class="n">Net Sls U Constr</th><th class="n">EOP U</th></tr></thead><tbody>`;
	S.placeholders.forEach(p=>{
		const w = placeholderWalk(p);
		h += `<tr><td>${esc(p.midlevel)}</td><td class="mute">${esc(p.code)}</td>
      <td class="n calc mute">${fU(p.bop)}</td>` +
		  ec(p.id,"fcstOvrd","cur", p.fcstOvrd, fU, false) +
		  ec(p.id,"aur","cur", p.aur, f2, false) +
		  ec(p.id,"auc","cur", p.auc, f2, false) +
		  ec(p.id,"transferIn","cur", p.transferIn, fU, false) +
		  `<td class="n calc ${w.truncated?"constr":""}" style="font-weight:700">${fU(w.constr)}${w.truncated?'<span class="flagtxt">CAPPED</span>':""}</td>
      <td class="n calc">${fU(w.eop)}</td></tr>`;
	});
	return h + `</tbody></table>
    <div class="notice info">No analytics forecast is generated for a placeholder — every measure defaults to zero until you enter it. BOP carries forward from prior-season closeout planning; Net Sls U Constr and EOP are system-calculated from what you enter above.</div>` + cellLegend();
}

/* ==================================================================
   SIDE PANEL — inbox only for this trainer.
   ================================================================== */
function sidePanelHTML(){
	if(S.side==="inbox") return `<aside class="side inbox open" role="complementary">${inboxHTML()}</aside>`;
	return `<aside class="side"></aside>`;
}
function inboxHTML(){
	const items = S.inbox;
	const live = items.filter(i=>!i.decoy && !i.resolved).length;
	const dec  = items.filter(i=>i.decoy && !i.resolved).length;
	const inkOf = k => ({cancel:["cancel-ink","cancel-fill"],md:["md-ink","md-fill"],chase:["chase-ink","chase-fill"],
	                     gm:["gm-ink","gm-fill"],none:["none-ink","none-fill"]})[k];
	let h = panelHead("EXCEPTION INBOX","", CYCLE_CFG[S.cycle].label+"  ·  "+items.length+" items");
	h += `<div class="sc"><div class="summary">${live} need a decision &nbsp;·&nbsp; ${dec} need nothing</div>`;
	items.forEach(it=>{
		const [i1,f1c] = inkOf(it.kind);
		h += `<div class="card ${it.resolved?"done":""}" style="border-left-color:var(--${i1})">
      <span class="pill" style="color:var(--${i1});background:var(--${f1c})">${esc(it.type)}</span>
      <h4>${esc(it.title)}</h4><p>${esc(it.body)}</p>`;
		if(!it.resolved){
			h += `<div class="acts">` + it.options.map(o=>
			  `<button data-inbox="${it.id}|${o.a}" style="color:var(--${i1})">${esc(o.l)} ›</button>`).join("") + `</div>`;
		} else if(it.shownFeedback){
			const good = it.chosen === it.correctAction;
			h += `<div class="fb" style="background:var(--${good?"chase-fill":"cancel-fill"});color:var(--${good?"chase-ink":"cancel-ink"})">
        ${esc(it.shownFeedback)}</div>`;
		}
		h += `</div>`;
	});
	return h + `</div>`;
}

/* ==================================================================
   INTERACTION
   ================================================================== */
function findStyle(id){ return S.styles.find(r=>r.id===id); }
function bindShell(){
	const app = document.getElementById("app");

	app.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>{
		const n = NAV[Number(b.dataset.nav)];
		if(!n.page) return;
		S.page = n.page; S.side = null; if(n.page==="assortment") S.tab="grid";
		render();
	}));
	app.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{
		S.tab = b.dataset.tab; S.side = null;
		if(S.tab==="error") fireHint("H-2");
		render();
	}));

	const bAccept = app.querySelector("#btnAcceptDeletes");
	if(bAccept) bAccept.addEventListener("click", ()=>{
		S.styles.forEach(r=>{ if(r.deleteIndicator) r.deleteAccepted = true; });
		announce("Line Delete Updates accepted."); render();
	});
	const bExport = app.querySelector("#btnExportErrors");
	if(bExport) bExport.addEventListener("click", ()=>{
		S.styles.forEach(r=>{ if(r.hasError) r.errorExported = true; });
		announce("Errors exported to Merch."); render();
	});

	app.querySelectorAll("[data-accept-delete]").forEach(b=>b.addEventListener("click",()=>{
		const r = findStyle(b.dataset.acceptDelete); r.deleteAccepted = true;
		announce("Line Delete accepted for "+r.styleColor+"."); render();
	}));
	app.querySelectorAll("[data-flag]").forEach(b=>b.addEventListener("click",()=>{
		const [id,flag] = b.dataset.flag.split("|");
		const r = findStyle(id); r.flag = flag;
		fireHint("H-1");
		announce(r.styleColor+" flagged "+flag+"."); render();
	}));

	app.querySelectorAll("[data-lock-inactive]").forEach(b=>b.addEventListener("click",()=>{
		const r = S.inactive.find(x=>x.id===b.dataset.lockInactive);
		r.locked = !r.locked; fireHint("H-5");
		announce(r.locked?"Row locked.":"Row unlocked."); render();
	}));

	app.querySelectorAll("[data-edit]").forEach(td=>{
		td.addEventListener("click", ()=>beginEdit(td));
	});
	app.querySelectorAll("[data-inbox]").forEach(b=>b.addEventListener("click",()=>{
		const [id,act] = b.dataset.inbox.split("|");
		resolveException(id, act);
	}));
	app.querySelectorAll("[data-close-side]").forEach(b=>b.addEventListener("click",()=>{ S.side=null; render(); }));

	renderTour();
}

function findEditable(id){
	return S.inactive.find(x=>x.id===id) || S.placeholders.find(x=>x.id===id) || S.presmins.find(x=>x.id===id);
}
function beginEdit(td){
	const [id,field,m] = td.dataset.edit.split("|");
	const row = findEditable(id);
	const cur = row[field];
	const inp = document.createElement("input");
	inp.className="cell"; inp.type="number"; inp.step="any";
	inp.value = cur==null ? "" : cur;
	td.textContent=""; td.appendChild(inp); inp.focus(); inp.select();
	const commit = ()=>{
		const raw = inp.value.trim();
		const val = raw==="" ? null : Number(raw);
		if(raw!=="" && isNaN(val)) { render(); return; }
		row[field] = val;
		if(S.placeholders.includes(row) && val != null) fireHint("H-3");
		if(S.presmins.includes(row) && val != null) fireHint("H-4");
		render();
	};
	inp.addEventListener("blur", commit);
	inp.addEventListener("keydown", e=>{
		if(e.key==="Enter"){ e.preventDefault(); commit(); }
		if(e.key==="Escape"){ e.preventDefault(); render(); }
	});
}

function resolveException(id, action){
	const it = S.inbox.find(x=>x.id===id);
	if(!it || it.resolved) return;
	it.chosen = action; it.resolved = true;
	const correct = action === it.correctAction;
	it.shownFeedback = correct ? it.feedback.correct : (it.feedback.wrong || it.feedback.correct);
	if(action==="open"){
		S.side = null;
		if(it.id.includes("PLACEHOLDER") || it.type==="PLACEHOLDER") S.page="closeout";
		else if(it.type==="PRESENTATION MIN") S.page="presmin";
		else S.page="assortment", S.tab="grid";
		render(); return;
	}
	if(S.mode==="challenge") fireHint(it.kind==="cancel"||it.kind==="md" ? "H-2" : "H-7", { postCommit:true });
	else if(it.kind==="md") fireHint("H-2");
	render();
}

/* ==================================================================
   READINESS CHECKS
   ================================================================== */
function readinessChecks(){
	const unflagged = S.styles.filter(styleNeedsFlag);
	const openErrors = S.styles.filter(r=>r.hasError && !r.errorExported);
	const unpopulated = S.placeholders.filter(p=>!placeholderPopulated(p));
	const pendingDeletes = S.styles.filter(r=>r.deleteIndicator && !r.deleteAccepted);
	return [
		{ id:"flags", title:"FLAGS CONFIRMED", pass: unflagged.length===0,
		  desc:"Every style color needing a Rebuy/Closeout decision has one.",
		  ev:[ unflagged.length===0 ? "✓ No unflagged style colors" : "✗ "+unflagged.length+" style color(s) still unflagged" ] },
		{ id:"errors", title:"ERRORS CLEARED", pass: openErrors.length===0,
		  desc:"Every Assortment Management Error has been exported to its owning partner.",
		  ev:[ openErrors.length===0 ? "✓ No open errors" : "✗ "+openErrors.length+" error(s) still open" ] },
		{ id:"placeholders", title:"PLACEHOLDERS POPULATED", pass: unpopulated.length===0,
		  desc:"Net Sales, AUR, AUC and Transfer In are entered for every Closeout Placeholder.",
		  ev:[ unpopulated.length===0 ? "✓ All placeholders populated" : "✗ "+unpopulated.length+" placeholder(s) still at the zero default" ] },
		{ id:"deletes", title:"LINE DELETES ACCEPTED", pass: pendingDeletes.length===0,
		  desc:"Every upstream Line Delete has been acknowledged.",
		  ev:[ pendingDeletes.length===0 ? "✓ No pending deletes" : "✗ "+pendingDeletes.length+" delete(s) not yet accepted" ] }
	];
}

/* ==================================================================
   CYCLE ROLLOVER — DESIGN: no numeric drift/consequence formula the way
   nvs-reforecast has one (the source gives none for Prep); unresolved
   items simply carry forward as still-open work into the next cycle.
   ================================================================== */
function closeCycle(){
	const score = computeScore();
	const checks = readinessChecks();
	S.cycleScores.push({ cycle:S.cycle, vals:score.vals, readiness:score.readiness,
	  checks: checks.map(c=>({ title:c.title, pass:c.pass })) });
	recordLedger();

	if(S.cycle < 2){
		const carryForward = clone(S.inbox.filter(i=>i.live && !i.resolved));
		carryForward.forEach(i=>{ i.carriedForward = true; });
		S.cycle += 1;
		S.inbox = clone(NVS_PREP_EXCEPTIONS[S.cycle]).concat(carryForward);
		S.screen = "close";
	} else {
		S.screen = "results";
	}
	renderScreen();
}
function recordLedger(){
	const unflagged = S.styles.filter(styleNeedsFlag).length;
	S.ledger.push({ id:"DEC-1", what:"Flag confirmations", out: unflagged===0 ? "Correct — no unflagged style colors" : "Missed — "+unflagged+" style color(s) left unflagged", ok: unflagged===0, consumer:"SSP Generate" });
	const openErrs = S.styles.filter(r=>r.hasError && !r.errorExported).length;
	S.ledger.push({ id:"DEC-2", what:"Error export discipline", out: openErrs===0 ? "Correct — no open errors" : "Missed — "+openErrs+" error(s) never exported", ok: openErrs===0, consumer:"Merch / AV" });
	const unpop = S.placeholders.filter(p=>!placeholderPopulated(p)).length;
	S.ledger.push({ id:"DEC-3", what:"Closeout Placeholder population", out: unpop===0 ? "Correct — all placeholders populated" : "Missed — "+unpop+" placeholder(s) left at zero", ok: unpop===0, consumer:"Code Submit" });
	const live = S.inbox.filter(i=>i.live);
	const routed = live.filter(i=>i.resolved && i.chosen===i.correctAction).length;
	S.ledger.push({ id:"DEC-4", what:"Guardrail routing", out: routed===live.length ? "Correct — every live item routed correctly" : "Partial — "+(live.length-routed)+" item(s) misrouted", ok: routed===live.length, consumer:"Merch / Line Plan" });
}

/* ==================================================================
   TRAINER RAIL
   ================================================================== */
function renderTrainerBar(){
	let el = document.getElementById("tbar");
	if(!el){ el = document.createElement("div"); el.id="tbar";
	  el.style.cssText="position:fixed;left:44px;bottom:18px;z-index:50;display:flex;gap:8px";
	  document.body.appendChild(el); }
	if(S.screen){ el.classList.add("hidden"); return; }
	el.classList.remove("hidden");
	const open = S.inbox.filter(i=>!i.resolved).length;
	el.innerHTML =
	  `<button class="btn" id="tbMission">Mission Brief</button>
     <button class="btn" id="tbInbox">Exception Inbox${open?" · "+open:""}</button>
     <button class="btn dark" id="tbReady">Readiness Challenge</button>
     <button class="btn ghost" id="tbReset">Reset all</button>`;
	el.querySelector("#tbMission").onclick = ()=>{ S.screen="mission"; renderScreen(); };
	el.querySelector("#tbInbox").onclick   = ()=>{ S.side = S.side==="inbox" ? null : "inbox"; render(); };
	el.querySelector("#tbReady").onclick   = ()=>{ S.screen="readiness"; renderScreen(); };
	el.querySelector("#tbReset").onclick = ()=>{
		if(!confirm("Reset all?\n\nThis clears every flag, override, lock and inbox decision across both cycles and returns you to the Launch Screen. This cannot be undone.")) return;
		S = null; document.getElementById("app").classList.add("hidden");
		renderLaunch();
	};
}

/* ==================================================================
   FULL-SCREEN TRAINER SCREENS
   ================================================================== */
function renderScreen(){
	if(!S.screen){ clearScreen(); render(); renderTrainerBar(); return; }
	if(S.screen==="mission")   return screenMission();
	if(S.screen==="readiness") return screenReadiness();
	if(S.screen==="close")     return screenCycleClose();
	if(S.screen==="results")  return screenResults();
	if(S.screen==="reflect")  return screenReflection();
}
function backToWorkspace(){ S.screen=null; clearScreen(); render(); renderTrainerBar(); renderCoach(); }

function renderLaunch(){
	clearScreen();
	const d = screenEl("");
	d.innerHTML = `<div class="launch">
    <div class="l"><div class="kicker"></div>
      <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;color:var(--coach)">PLANNING TRAINER</div>
      <h1>NVS Pre-Season<br>Prep</h1>
      <p class="lede">Assortment Management, Closeout Flags and Clean Inputs. Two Code Submits — Week 46 style level, Week 40 style color level — same rhythm both times.</p>
      <div class="fact"><div class="k">ROLE</div><div class="v">NVS Planner — Nike Value Stores</div></div>
      <div class="fact"><div class="k">SCOPE</div><div class="v">Pre-season Prep · Week 46 → Week 40</div></div>
    </div>
    <div class="r">
      <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:var(--eyebrow)">MISSION BRIEF</div>
      <div class="brief" style="margin-top:12px">
        <p>NVS is inventory-first: the plan begins with what's in the channel, not consumer demand signals alone. The SSP auto-generates from what's already in the system — if Rebuy/Closeout flags, the line plan, or inventory inputs are incomplete, the starting plan is wrong from the first run.</p>
        <p>Your job each cycle: clear the Assortment Management Error queue, confirm the right flag on every style color, populate Closeout Placeholders that default to zero, and only tune Presentation Minimums where there's a real reason. Errors do not just create rework — they flow downstream to store-level decisions.</p>
      </div>
      <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:var(--eyebrow);margin-top:26px">CHOOSE YOUR PATH</div>
      <div class="paths">
        <div class="path"><div class="top" style="background:var(--coach)"></div>
          <h3>GUIDED</h3>
          <p class="q">"I'll flag the guardrail and the consequence before you commit. You still make every call."</p>
          <p class="m">Proactive coaching · immediate feedback · ~15 min</p>
          <button class="btn pri" data-mode="guided">Start Guided</button></div>
        <div class="path"><div class="top" style="background:var(--imp-ink)"></div>
          <h3>CHALLENGE</h3>
          <p class="q">"No prompting. I'll show you what your decisions did after you've made them."</p>
          <p class="m">Feedback after commit · reflection at outcome · ~10 min</p>
          <button class="btn dark" data-mode="challenge">Start Challenge</button></div>
      </div>
      <div class="arc"><div class="on">Week 46 &nbsp;Handover · validate · flag · populate · submit</div>
        <div>Week 40 &nbsp;Tighten at style-color level · submit</div></div>
    </div></div>`;
	d.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>{
		newRun(b.dataset.mode);
		document.getElementById("app").classList.remove("hidden");
		clearScreen();
		if(S.mode==="guided" && S.cycle===1){ S.tourOpen = true; }
		else fireHint("H-1");
		render(); renderTrainerBar(); renderCoach();
	}));
}

function screenMission(){
	const d = screenEl("dark");
	d.innerHTML = `<div class="wrapc">
    <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;color:var(--coach)">MISSION BRIEF · ${esc(S.mode.toUpperCase())} MODE</div>
    <h1 style="font-family:Georgia,serif;font-size:30px;margin:10px 0 20px">Clean inputs, before the SSP ever generates.</h1>
    <div style="max-width:760px;font-size:13px;line-height:1.7;color:#C9CDD2">
      <p>NVS plans drive store inventory, Transfer In assumptions, and what DCD receives at Order Entry. What you validate, flag, and set in Prep flows directly into the receipts that hit value stores.</p>
    </div>
    <div class="arc" style="margin-top:26px">` +
	  [1,2].map(c=>`<div class="${c===S.cycle?"on":""}">${esc(CYCLE_CFG[c].label)} ${c<S.cycle?"· submitted":c===S.cycle?"· current":"· ahead"}</div>`).join("") +
	  `</div><button class="btn pri" style="margin-top:28px" id="mBack">Back to the workspace</button></div>`;
	d.querySelector("#mBack").onclick = backToWorkspace;
}

function screenReadiness(){
	const checks = readinessChecks();
	const d = screenEl("");
	const green = checks.every(c=>c.pass);
	if(green) fireHint("H-10");
	let h = `<div class="wrapc">
    <div class="notice" style="background:var(--act-fill);color:var(--act-ink);font-weight:700">
      ${esc(CYCLE_CFG[S.cycle].label)} · PRE-SUBMIT — you own readiness. Admin owns Code Submit. You never click the submit itself.</div>
    <div class="checks">`;
	checks.forEach(c=>{
		const st = c.pass ? ["PASS","chase-ink","chase-fill"] : ["INCOMPLETE","cancel-ink","cancel-fill"];
		h += `<div class="check" style="border-left-color:var(--${st[1]})">
      <div class="hd"><h3>${esc(c.title)}</h3>
        <span class="pill" style="color:var(--${st[1]});background:var(--${st[2]})">${st[0]}</span></div>
      <div class="desc">${esc(c.desc)}</div>
      <ul>${c.ev.map(e=>`<li>${esc(e)}</li>`).join("")}</ul></div>`;
	});
	h += `</div>
    <div style="display:flex;gap:12px;align-items:center;margin-top:18px">
      <button class="btn" id="rBack">Go back and finish a step</button>
      <button class="btn dark" id="rGo">Declare ready for ${esc(CYCLE_CFG[S.cycle].codeSubmit)}</button>
      <span style="font-size:10.5px;font-style:italic;color:var(--t-ink3);max-width:420px">
        Declaring ready with an incomplete check is permitted — and scored. Nothing here blocks you from submitting a plan you can't defend.</span>
    </div></div>`;
	d.innerHTML = h;
	d.querySelector("#rBack").onclick = backToWorkspace;
	d.querySelector("#rGo").onclick = ()=>{
		if(!confirm("Declare ready for "+CYCLE_CFG[S.cycle].codeSubmit+"?\n\nAdmin will execute Code Submit on what's currently in the plan. This cannot be undone.")) return;
		clearScreen(); closeCycle();
	};
}

function screenCycleClose(){
	const prev = S.cycle - 1;
	const d = screenEl("");
	const carried = S.inbox.filter(i=>i.carriedForward);
	let h = `<div class="dark" style="padding:36px 44px">
    <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;color:var(--coach)">${esc(CYCLE_CFG[prev].label)} SUBMITTED</div>
    <h1 style="font-family:Georgia,serif;font-size:26px;margin:10px 0 12px">Admin has executed ${esc(CYCLE_CFG[prev].codeSubmit)}.</h1>
    <p style="max-width:760px;font-size:13px;color:#C9CDD2;line-height:1.65">
      Whatever wasn't resolved doesn't reset — it becomes ${esc(CYCLE_CFG[S.cycle].label)}'s opening problem.</p></div>
    <div class="wrapc"><div class="sec-hdr t">WHAT ${esc(CYCLE_CFG[S.cycle].label)} OPENS WITH</div>`;
	if(carried.length){
		carried.forEach(i=>{
			h += `<div class="evrow" style="border-left-color:var(--cancel-ink)"><div class="t">Carried forward: ${esc(i.title)}</div>
        <div class="s">Unresolved at ${esc(CYCLE_CFG[prev].label)} — still open now</div></div>`;
		});
	} else {
		h += `<div class="evrow" style="border-left-color:var(--chase-ink)"><div class="t">Clean handoff</div>
      <div class="s">Nothing carried forward from ${esc(CYCLE_CFG[prev].label)}</div></div>`;
	}
	h += `<div style="display:flex;gap:12px;margin-top:18px">
      <button class="btn dark" id="cGo">Begin ${esc(CYCLE_CFG[S.cycle].label)} ›</button></div></div>`;
	d.innerHTML = h;
	d.querySelector("#cGo").onclick = ()=>{
		S.screen = null; clearScreen();
		fireHint("H-9", { postCommit:true, force:true });
		render(); renderTrainerBar(); renderCoach();
	};
}

function screenResults(){
	const per = S.cycleScores;
	const avg = id => per.length ? per.reduce((s,p)=>s+p.vals[id],0)/per.length : 0;
	const readiness = per.length ? per.reduce((s,p)=>s+p.readiness,0)/per.length : 0;
	const tier = getScoreBadgeTier(readiness);
	/* Only the top tier gets the celebration media — a "you won" reward, not
	   decoration on every run. */
	const img = isTopTier(tier) ? tierMediaHTML(TIER_MEDIA[tier.tier], tier.tier) : "";
	const d = screenEl("");
	let h = `<div style="display:grid;grid-template-columns:340px 1fr;min-height:100vh">
    <div class="dark" style="padding:44px 34px">
      <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;color:var(--coach)">RUN COMPLETE</div>
      <div style="font-size:15px;color:#C9CDD2;margin-top:10px">Prep Readiness</div>
      <div class="bignum">${Math.round(readiness)}%</div>
      <div style="font-size:11.5px;color:var(--t-ink3);margin-top:8px">${esc(S.mode)} mode · ${per.length} of 2 cycles submitted</div>
      ${img}
      <div class="tierbadge">TIER ${tier.tier} · ${esc(tier.label)}</div>
    </div>
    <div style="padding:36px 40px">
      <div class="sec-hdr t">OUTCOME-BASED KPIs — AVERAGED ACROSS BOTH CYCLES</div>
      <div style="margin-top:12px">`;
	KPI_OPTIONS.forEach(k=>{
		const v = avg(k.id);
		const ink = v>=90?"chase-ink":v>=80?"imp-ink":v>=60?"md-ink":"cancel-ink";
		h += `<div class="kpi" style="border-left-color:var(--${ink})">
      <div class="l"><div class="id">${esc(k.id)}</div><h3>${esc(k.name)}</h3><div class="d">${esc(k.desc)}</div></div>
      <div class="r"><div class="bar"><i style="width:${Math.max(0,Math.min(100,v))}%;background:var(--${ink})"></i></div>
        <div class="pc" style="color:var(--${ink})">${Math.round(v)}%</div>
        <div class="mm">${per.map(p=>"C"+p.cycle+" "+Math.round(p.vals[k.id])+"%").join("  ")}</div></div></div>`;
	});
	h += `</div><div class="sec-hdr t" style="margin-top:18px">DECISION LEDGER</div><div style="margin-top:12px">`;
	S.ledger.forEach(l=>{
		const ink = l.ok ? "chase-ink" : (String(l.out).startsWith("Partial") ? "md-ink" : "cancel-ink");
		h += `<div class="ledger" style="border-left-color:var(--${ink})">
      <div class="id">${esc(l.id)}</div><div class="w">${esc(l.what)}<br>
      <span style="color:var(--t-ink3);font-size:9.5px">downstream: ${esc(l.consumer)}</span></div>
      <div class="o" style="color:var(--${ink})">${esc(l.out)}</div></div>`;
	});
	h += `<button class="btn dark" id="resGo" style="margin-top:20px">Continue to reflection ›</button></div></div></div>`;
	d.innerHTML = h;
	d.querySelector("#resGo").onclick = ()=>{ S.screen="reflect"; renderScreen(); };
}

function screenReflection(){
	const d = screenEl("dark");
	d.innerHTML = `<div class="wrapc">
    <div class="kicker"></div>
    <h1 style="font-family:Georgia,serif;font-size:32px;margin:14px 0 18px">The plan is only as clean as its inputs.</h1>
    <p style="font-size:14px;color:#C9CDD2;line-height:1.7;max-width:900px">
      Nothing you did here planned a single sale. That's the point — Prep isn't about shaping demand, it's about making sure the SSP has something trustworthy to generate from.</p>
    <div class="principles">
      <div class="principle"><div class="top"></div><div class="n">01</div>
        <h3>The flag decides everything downstream</h3>
        <p>Rebuy or Closeout isn't a label — it's the difference between the system generating receipts and constraining demand to what's already in the channel.</p></div>
      <div class="principle"><div class="top"></div><div class="n">02</div>
        <h3>Errors are fixed upstream, never in o9</h3>
        <p>Assortment Management Error is a quarantine, not a workbench. Your leverage is exporting the evidence to the partner who owns the source data.</p></div>
      <div class="principle"><div class="top"></div><div class="n">03</div>
        <h3>A default of zero is not neutral</h3>
        <p>Closeout Placeholders don't get an analytics forecast. Leaving one at zero doesn't skip a decision — it makes one, quietly, against the whole channel.</p></div>
    </div>
    <div style="background:var(--coach);color:#fff;font-size:14px;font-weight:700;padding:16px 20px;max-width:1000px">
      What you clean in Prep is what the SSP builds from. Errors don't stay with you — they travel downstream.</div>
    <button class="btn" style="margin-top:26px;background:#fff;color:var(--t-ink);font-weight:700" id="again">Run it again</button>
  </div>`;
	d.querySelector("#again").onclick = ()=>{
		if(!confirm("Run it again?\n\nThis clears both cycles and returns you to the Launch Screen. This cannot be undone.")) return;
		S=null; document.getElementById("app").classList.add("hidden");
		const c=document.getElementById("coach"); if(c) c.classList.add("hidden");
		const t=document.getElementById("tbar"); if(t) t.classList.add("hidden");
		renderLaunch();
	};
}

/* ==================================================================
   INIT
   ================================================================== */
document.addEventListener("DOMContentLoaded", renderLaunch);
