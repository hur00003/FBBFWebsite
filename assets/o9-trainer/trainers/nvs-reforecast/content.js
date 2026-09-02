/*
 * NVS IN-SEASON MONTHLY REFORECAST — trainer content.
 * Loads after ../../engine/o9-shell.js (shares its global scope — see the
 * header comment there for the engine/content split and the interface
 * this file is expected to provide).
 *
 * Everything below is domain-specific to this one o9 workflow: nav
 * structure, seed data, formulas, grids, side-panel content, screen copy,
 * exceptions, coach hints, tour steps, and KPI definitions. Traceability
 * ids in comments map to the original build spec's §10 table.
 */
"use strict";
/* ==================================================================
   NVS IN-SEASON MONTHLY REFORECAST — Planning Trainer
   Built to HTML Build Specification (Stage 4), NVS project.
   Traceability ids in comments map to that spec's §10 table.
   ================================================================== */

/* ---------- ASSUM-4: named constants so scoring can be retuned
     without touching computeScore(). NOT SME-approved. ---------- */
const KPI_WEIGHTS = { kpi1:1, kpi2:1, kpi3:1, kpi4:1 };
const TIER_BANDS  = [
  { min:90, tier:1, label:"TRUSTED SIGNAL" },
  { min:75, tier:2, label:"DEFENSIBLE PLANNER" },
  { min:60, tier:3, label:"SHAPING, NOT YET READING" },
  { min:0,  tier:4, label:"REBUILD THE READ" }
];
/* OQ-6 OPEN: Rolling Plan reconciliation threshold is unset in every source.
   Left null on purpose — the check renders "not yet available". Do not pick a number. */
const ROLLING_PLAN_THRESHOLD = null;
/* Material variance, per project owner: ±5% WF vs CF. */
const MATERIAL_VARIANCE_PCT = 5.0;
/* Signal column trigger, spec §4. */
const SIGNAL_PTS = 5.0;
const WEEKS_PER_MONTH = 4.33;

/* ---------- horizon ---------- */
const MONTHS = ["Jun-26","Jul-26","Aug-26","Sep-26","Oct-26","Nov-26","Dec-26","Jan-27"];
/* SPEC GAP G-1 (see Stage 3): §5 supplies no Feb-27 data, so the M3 Rebuy/Closeout grid
   renders four month columns rather than five. Not resolved locally. */
const MONTH_CFG = {
  1:{ label:"MONTH 1  ·  WEEK 2", trend:[0,1,2,3,4,5], grid:[2,3,4,5,6], actual:[0,1], cur:2 },
  2:{ label:"MONTH 2  ·  WEEK 2", trend:[1,2,3,4,5,6], grid:[3,4,5,6,7], actual:[1,2], cur:3 },
  3:{ label:"MONTH 3  ·  WEEK 2", trend:[2,3,4,5,6,7], grid:[4,5,6,7],   actual:[2,3], cur:4 }
};
const mk = i => MONTHS[i];

/* ---------- seeds, spec §5 ---------- */
function mo(v){ const o={}; MONTHS.forEach((m,i)=>{ if(v[i]!=null) o[m]=v[i]; }); return o; }

const REBUY_SEED = [
  { id:"RB1", midlevel:"5149 RUN", sport:"RUNNING", styleColor:"RUN-5149-VLT-021",
    signalFlag:"material_up", evidence:"directional",
    basis:mo([18420,19980,21640,20100,19400,18800,18200,17900]),
    avgDemand:5410, supplyU:18050, aur:52.40, lastActionDate:null },
  { id:"RB2", midlevel:"5149 RUN", sport:"RUNNING", styleColor:"RUN-5149-BLK-008",
    signalFlag:"material_up", evidence:"directional",
    basis:mo([7900,8600,9140,8900,8700,8500,8300,8150]),
    avgDemand:2280, supplyU:7200, aur:52.40, lastActionDate:"04-Aug-26" },
  { id:"RB3", midlevel:"AIR FORCE 1", sport:"SPORTSWEAR", styleColor:"AF1-LOW-WHT-013",
    signalFlag:"material_down", evidence:"confirmed",
    basis:mo([31240,28900,24110,26400,27000,27600,27900,27700]),
    avgDemand:6027, supplyU:41600, aur:38.20, lastActionDate:null },
  { id:"RB4", midlevel:"ACCESS", sport:"TRAINING", styleColor:"ACC-CRW-GRY-002",
    signalFlag:"none", evidence:null,
    basis:mo([9110,9240,9050,9200,9180,9220,9150,9100]),
    avgDemand:2262, supplyU:17400, aur:26.10, lastActionDate:null },
  { id:"RB5", midlevel:"ACCESS", sport:"TRAINING", styleColor:"ACC-CAP-NVY-011",
    signalFlag:"none", evidence:null,
    basis:mo([3010,3060,3020,3050,3040,3060,3030,3010]),
    avgDemand:760, supplyU:5900, aur:18.50, lastActionDate:"28-Jul-26" },
  { id:"RB6", midlevel:"ACG RUGGED ICON", sport:"SPORTSWEAR", styleColor:"ACG-RGD-BLK-004",
    signalFlag:"none", evidence:"price",   /* DEC-6: clearance strategy / degradation instrument */
    basis:mo([4420,4510,4390,4480,4500,4470,4420,4400]),
    avgDemand:1097, supplyU:12900, aur:44.90, lastActionDate:null }
];

/* Mid-level Current Forecast, spec §5. Grid A compares WF to this. */
const MID_CF = {
  "5149 RUN":        mo([18600,18700,18900,19100,19300,19200,19000,18900]),
  "AIR FORCE 1":     mo([31000,31200,31400,31600,31900,32100,32000,31800]),
  "ACCESS":          mo([9100,9150,9200,9250,9300,9280,9200,9150]),
  "ACG RUGGED ICON": mo([4400,4450,4500,4520,4540,4530,4500,4480])
};
/* Sell-through baselines, back-derived from the approved Stage 3 design review (slide 3)
   so the Signal column reproduces the reviewed values. Flagged: SPEC GAP G-2. */
const ST_BASE = {
  "5149 RUN":        { wf:69.4, cf:61.0 },
  "AIR FORCE 1":     { wf:47.6, cf:58.8 },
  "ACCESS":          { wf:51.6, cf:51.9 },
  "ACG RUGGED ICON": { wf:48.7, cf:49.2 }
};
/* SPEC GAP G-3: Rebuy EOP inventory is never seeded, so aWOS (WF) on Grid B has no
   spec-derived denominator input. Values below reproduce the aWOS shown on the approved
   Stage 3 deck (slide 13) given the §5 avgDemand seeds. Flagged, not silently resolved. */
const REBUY_EOP = {
  "5149 RUN":        mo([52000,50400,48149,46300,44800,43200,41900,41000]),
  "AIR FORCE 1":     mo([64000,62000,60100,58400,56900,55400,54100,53200]),
  "ACCESS":          mo([21500,21000,20500,20100,19700,19300,18900,18600]),
  "ACG RUGGED ICON": mo([10600,10400,10100,9900,9700,9500,9300,9150])
};

/* Closeout placeholders, spec §5.
   signalFlag supplied by the Engineer per project-owner direction (VQ-3), flagged as new. */
const CLOSEOUT_SEED = [
  { id:"PH2", code:"PHCO-00002", midlevel:"5149 RUN", signalFlag:"material_down", evidence:null,
    transferIn:mo([null,null,null,12000,12400,9850,7100,4200]),
    ovrd:mo([null,null,null,9000,9600,8400,6200,4000]),
    aur:mo([null,null,null,31.40,29.80,27.20,24.60,22.00]),
    auc:mo([null,null,null,17.10,17.10,17.10,17.10,17.10]) },
  { id:"PH3", code:"PHCO-00003", midlevel:"ACG RUGGED ICON", signalFlag:"none", evidence:null,
    transferIn:mo([null,null,null,3100,4400,3900,2600,1400]),
    ovrd:mo([null,null,null,3100,4400,3900,2600,1400]),
    aur:mo([null,null,null,28.90,26.40,24.10,21.80,19.50]),
    auc:mo([null,null,null,15.60,15.60,15.60,15.60,15.60]) },
  { id:"PH7", code:"PHCO-00007", midlevel:"SPORTSWEAR CLASSICS", signalFlag:"none", evidence:null,
    transferIn:mo([null,null,null,2000,2600,1800,0,0]),
    ovrd:mo([null,null,null,1900,2600,1800,0,0]),
    aur:mo([null,null,null,24.20,24.20,21.60,null,null]),
    auc:mo([null,null,null,13.40,13.40,13.40,null,null]) }
];

/* Assortment Actions, spec §5 / Stage 3 slide 10. Entire grid read-only. */
const ASSORTMENT_ACTIONS = [
  { grp:"IN-SEASON RECOMMENDATIONS  ·  WEEKLY BATCH 12-AUG-2026" },
  { mid:"AIR FORCE 1", sc:"AF1-LOW-WHT-013", rec:"CANCEL", kind:"cancel",
    crit:"Not on MAP · supply > sales · AUR degraded", ns:22900, sup:41600, awos:11.4, aur:38.20,
    last:null, owner:"Allocation" },
  { mid:"ACG RUGGED ICON", sc:"ACG-RGD-BLK-004", rec:"MARKDOWN", kind:"md",
    crit:"Not on MAP · supply significantly > sales", ns:4470, sup:12900, awos:14.2, aur:44.90,
    last:null, owner:"Merch" },
  { mid:"5149 RUN", sc:"RUN-5149-VLT-021", rec:"CHASE", kind:"chase",
    crit:"Sales exceeding supply · GA product available", ns:23371, sup:18050, awos:3.1, aur:52.40,
    last:null, owner:"Allocation" },
  { mid:"5149 RUN", sc:"RUN-5149-BLK-008", rec:"CHASE", kind:"chase",
    crit:"Sales exceeding supply · GA product available", ns:9140, sup:7200, awos:3.6, aur:52.40,
    last:"04-Aug-26", owner:"Allocation" },
  { mid:"ACCESS", sc:"ACC-CRW-GRY-002", rec:"NO ACTION", kind:"none",
    crit:"Does not meet any action criteria", ns:9180, sup:17400, awos:8.2, aur:26.10,
    last:null, owner:"—" },
  { mid:"ACCESS", sc:"ACC-CAP-NVY-011", rec:"EXCLUDE", kind:"none",
    crit:"Manually excluded by planner · 4 weeks", ns:3020, sup:5900, awos:9.1, aur:18.50,
    last:"28-Jul-26", owner:"NVS" },
  { grp:"POST-SEASON  ·  NOT IN SCOPE THIS CYCLE", muted:true },
  { mid:"SPORTSWEAR CLASSICS", sc:"SWC-TEE-WHT-006", rec:"GM REVIEW", kind:"gm", muted:true,
    crit:"Clearance period · GM ≤ 0 · inventory high", ns:1240, sup:6800, awos:22.0, aur:12.00,
    last:null, owner:"Merch" }
];

/* Location Plan — M1 store dataset, rendered in all three months per VQ-9. */
const LOCATION_PLAN = [
  { grp:"RUN-5149-VLT-021  ·  DISTRIBUTION AFTER SHAPING" },
  { code:"0504", name:"Nike Factory Store Cheshire Oa - STORE", tier:"Tier 1", sc:"RUN-5149-VLT-021", ns:1860, m:[640,620,600], aps:620, awos:3.0, chk:"Depth appropriate", ok:true },
  { code:"0517", name:"Nike Factory Store Parndorf - STORE", tier:"Tier 1", sc:"RUN-5149-VLT-021", ns:1740, m:[600,580,560], aps:580, awos:3.1, chk:"Depth appropriate", ok:true },
  { code:"0522", name:"Nike Factory Store Barcelona - STORE", tier:"Tier 1", sc:"RUN-5149-VLT-021", ns:1690, m:[590,560,540], aps:563, awos:3.2, chk:"Depth appropriate", ok:true },
  { code:"0545", name:"NIKE FACTORY STORE LELYSTAD - STORE", tier:"Tier 2", sc:"RUN-5149-VLT-021", ns:1610, m:[560,540,510], aps:537, awos:3.3, chk:"Tier 2 ≈ Tier 1 depth", ok:false, escalate:true },
  { code:"0509", name:"Nike Clearance Store - Alicant - STORE", tier:"Tier 2", sc:"RUN-5149-VLT-021", ns:410, m:[150,140,120], aps:137, awos:8.4, chk:"Depth appropriate", ok:true },
  { code:"0557", name:"Nike Clearance Store - Roubaix - STORE", tier:"Tier 3", sc:"RUN-5149-VLT-021", ns:380, m:[140,130,110], aps:127, awos:8.9, chk:"Depth appropriate", ok:true },
  { code:"0563", name:"Nike Factory Store Castel Roma - STORE", tier:"Tier 3", sc:"RUN-5149-VLT-021", ns:290, m:[100,100,90], aps:97, awos:9.6, chk:"Depth appropriate", ok:true },
  { grp:"PHCO-00002  ·  CLOSEOUT PLACEHOLDER DISTRIBUTION" },
  { code:"0504", name:"Nike Factory Store Cheshire Oa - STORE", tier:"Tier 1", sc:"PHCO-00002", ns:2180, m:[760,720,700], aps:727, awos:2.4, chk:"Depth appropriate", ok:true },
  { code:"0509", name:"Nike Clearance Store - Alicant - STORE", tier:"Tier 2", sc:"PHCO-00002", ns:3240, m:[1140,1080,1020], aps:1080, awos:1.9, chk:"Clearance-weighted, expected", ok:true },
  { code:"0557", name:"Nike Clearance Store - Roubaix - STORE", tier:"Tier 3", sc:"PHCO-00002", ns:2960, m:[1040,990,930], aps:987, awos:2.0, chk:"Clearance-weighted, expected", ok:true }
];

/* ---------- Guided Tour, spec §1: 7 scripted steps, zero decision points ---------- */
const TOUR_STEPS = [
  { t:"Pages hierarchy and how you reach this page",
    b:"Everything you touch this month lives under two branches. In-Season SSP holds Shaping & Reforecasting and the Location Plan. Placeholder Management sits under Rolling Plan. The greyed leaves are real pages other personas own — they are here so you know where you sit, not for you to open." },
  { t:"Scope bar — narrow to your AOR before you plan",
    b:"Currency, Country, Channel, Season, Area of Responsibility, Version. In the live tool you set these before you plan anything, because a number is meaningless without knowing what population it covers. Here they are fixed to your area." },
  { t:"Workflow ribbon — where Shaping sits in the cycle",
    b:"Five steps to a monthly lock. You read the signal, you review Assortment Actions, you shape, you reconcile, and Admin locks. Only step three is yours to change. Step five never has a button — you own readiness, Admin owns execution." },
  { t:"Rebuy and Closeout subtabs",
    b:"Each product sits in exactly one subtab, driven by Assortment Management flags set upstream. Rebuy is ongoing assortment planning. Closeout is product picked up from the unallocated channel — sell-down, degradation, transfer-in timing.\n\nYou will work both every month. Start in Rebuy." },
  { t:"Override cells are yellow — that's what you can edit",
    b:"Cream means editable. White is calculated. Grey italic means locked and it will reject your keystrokes. Red means the number you planned was capped by something, and it will tell you what if you click it." },
  { t:"Coach dock — collapse it, it never blocks the grid",
    b:"Bottom right. It flags a signal, a trade-off or a consequence, and then stops. It will not enter a value, will not pick your override, and will not tell you whether a variance is acceptable. Collapse it whenever you want." },
  { t:"Explainability — how any number got its value",
    b:"Click any calculated figure — a Final measure, aWOS, a constrained sale — and the panel shows you the arithmetic first, then the rule or cap that changed the answer. It never recommends which fix to take." }
];

/* ---------- Coach copy, spec §7 — verbatim, do not edit ---------- */
const HINTS = {
  "T-1":{ b:"Four mid-levels moved. Two moved enough to mean something. Before you touch anything — which two, and what caused them?", f:null },
  "T-2":{ b:"You've got two material signals. Shaping the noise alongside them makes the narrative harder to defend, not easier.", f:null },
  "T-3":{ b:"Business Planning gave you a number. A percentage gets you close to it and leaves no audit trail. Which instrument matches the quality of what you were told?", f:null },
  "T-4":{ b:"Adj % compounds. Check the resulting Net Sales U total — not the percentage.", f:"I won't enter the value or tell you if it's right. That call is yours." },
  "T-5":{ b:"Both are filled. Only one drives the plan — the direct unit override wins and the Adj % is ignored. Pick the one you mean.", f:"Leaving both populated is not scored as wrong. Not knowing which one won is." },
  "T-6":{ b:"That one isn't yours. Merch executes markdowns; Allocation executes cancels. Your leverage is the evidence you bring them.", f:"Routing an item with evidence counts toward Ownership Accuracy. Dismissing a live item does not." },
  "T-7":{ b:"Check whether an Assortment Action already captured this. Double-entering receipts is the most common NVS shaping error, and the inventory walk discrepancy is hard to unwind.", f:null },
  "T-8":{ b:"You shaped sales; aWOS is still running on the old average demand. Shape, refresh, validate, then review. That order doesn't bend.", f:"aWOS also refreshes overnight system-wide. That is not a reason to skip it before you present." },
  "T-9":{ b:"This view is stale until you run Store Disagg. It's a refresh, not an action step — it won't change your forecast.", f:null },
  "T-10":{ b:"You can't fix this here — this page is read-only. If the spread is wrong, the fix is upstream. That's a conversation with your Allocation partner.", f:"Escalating counts toward Ownership Accuracy. Editing around it would count against it." },
  "T-11":{ b:"Sales are constrained to available inventory. Right now the plan you're looking at won't hold — either Transfer In has to support it, or the sales assumption has to come down.", f:null },
  "T-12":{ b:"That's an intentional decision now. Unlocked, mid-level disaggregation can spread right over it.", f:null },
  "T-13":{ b:"You shaped two and left two alone — and the two you left alone stayed put. That is the read working. What did not work is PHCO-00007: you finished the assumption and never locked it, so mid-level disaggregation spread over it.", f:"In Challenge mode this recap still renders. The Coach line does not — the numbers make the point on their own." },
  "T-14":{ b:"Plan complete, key style colors locked, reconciled, narrative documented. Admin runs the lock — your part is being able to stand behind what's in it.", f:"Until then I will name which check is hollow, but I will not tell you whether the variance is acceptable. That call is yours." }
};

/* ---------- Exception Inbox, spec §5.
     M1 copy is verbatim from the spec.
     M2 and M3 copy authored by the Engineer under project-owner authorisation (VQ-1)
     and flagged as NEW COPY in the Stage 3 self-QA. ---------- */
const NVS_EXCEPTIONS = {
1:[
 { id:"M1-1", type:"CANCEL", kind:"cancel", title:"AIR FORCE 1 · partial cancel recommended",
   body:"Not on MAP, supply exceeding sales, AUR degraded. Allocation executes cancels — you bring the evidence.",
   correctAction:"escalate", partner:"Allocation", live:true,
   options:[{a:"escalate",l:"Route to Allocation"},{a:"dismiss",l:"Dismiss — no action"}],
   feedback:{ correct:"Right call. Allocation executes the cancel — you gave them the AUR degradation and the supply position to act on.",
              wrong:"You can't execute this. Allocation owns cancels. Nothing changed in the plan, and the recommendation is still sitting with no owner." } },
 { id:"M1-2", type:"MARKDOWN", kind:"md", title:"ACG RUGGED ICON · first markdown",
   body:"Not on MAP, supply significantly exceeding sales. Merch owns markdown execution, outside o9.",
   correctAction:"escalate", partner:"Merch", live:true,
   options:[{a:"escalate",l:"Route to Merch"},{a:"dismiss",l:"Dismiss — no action"}],
   feedback:{ correct:"Right call. Merch owns markdown execution outside o9 — your job was to bring them the evidence, and you did.",
              wrong:"Markdown execution isn't yours. Merch owns it, outside o9. Routing it is the action; approving it isn't available to you." } },
 { id:"M1-3", type:"CHASE", kind:"chase", title:"5149 RUN · chase available",
   body:"Sales exceeding supply and GA product is available to contract. Confirm your demand POV first.",
   correctAction:"escalate", partner:"Allocation", live:true, needsEvidence:true,
   options:[{a:"escalate",l:"Route to Allocation"},{a:"dismiss",l:"Dismiss — no action"}],
   feedback:{ correct:"Good — you formed a demand POV before routing. Allocation contracts the GA product; your read is what justifies it.",
              wrong:"You routed a chase without a demand POV. Allocation will ask why, and you won't have an answer that isn't the system's." } },
 { id:"M1-4", type:"PLACEHOLDER", kind:"gm", title:"PHCO-00002 · transfer-in projection moved",
   body:"NSO transfer-out revised down. Planned sales may no longer be supported by available inventory.",
   correctAction:"open", deepLink:"PH2", live:false,
   options:[{a:"open",l:"Open Placeholder Management"}],
   feedback:{ correct:"Inventory now supports the plan. Nothing is truncating, and what you plan is what will lock.",
              wrong:"This is still open. Until Transfer In supports the sales assumption, your forecast truncates and the difference never reaches the plan." } },
 { id:"M1-5", type:"ALREADY RESOLVED", kind:"none", decoy:true, title:"5149 RUN · receipt shift wk 3 → wk 6",
   body:"Captured by an approved Assortment Action on 04-Aug. A receipt override here would double-count.",
   correctAction:"dismiss", live:false,
   options:[{a:"dismiss",l:"No action — dismiss"}],
   feedback:{ correct:"Correct — an approved Assortment Action on 04-Aug already captured this. Entering it again would double-count.", wrong:null } },
 { id:"M1-6", type:"NO ACTION", kind:"none", decoy:true, title:"ACCESS · movement within variance",
   body:"Style color does not meet any action criteria. Nothing to do.",
   correctAction:"dismiss", live:false,
   options:[{a:"dismiss",l:"No action — dismiss"}],
   feedback:{ correct:"Correct — it doesn't meet any action criteria. Nothing to do is a real answer.", wrong:null } }
],
2:[
 { id:"M2-1", type:"PLACEHOLDER", kind:"gm", title:"PHCO-00002 · transfer-in revised down by NSO",
   body:"NSO has cut the transfer-out that feeds this placeholder. Planned sales now exceed what the inventory walk can carry in three periods.",
   correctAction:"open", deepLink:"PH2", live:false,
   options:[{a:"open",l:"Open Placeholder Management"}],
   feedback:{ correct:"Inventory supports the plan again. What you are looking at is now what will lock.",
              wrong:"Still truncating. Either Transfer In comes up to meet the sales assumption, or the sales assumption comes down to meet inventory. The gap does not reach the plan on its own." } },
 { id:"M2-2", type:"MARKDOWN", kind:"md", title:"ACG RUGGED ICON · clearance strategy deepened",
   body:"Merch has taken this deeper than the 15% default. Your degradation assumption no longer reflects the price you will actually sell at.",
   correctAction:"open", live:false,
   options:[{a:"open",l:"Open Rebuy and adjust degradation"}],
   feedback:{ correct:"Degradation now matches the clearance strategy. Revenue and margin move together, which is what makes the number defensible.",
              wrong:"The units may be right, but the price assumption is not. Net Sales dollars and sell-through will both read wrong until the degradation reflects the strategy." } },
 { id:"M2-3", type:"PLACEHOLDER", kind:"gm", title:"PHCO-00007 · lifecycle end moved to mid-November",
   body:"This product now exits the active assortment on 15-Nov-26. Nothing after that date should carry transfer-in or planned sales.",
   correctAction:"open", deepLink:"PH7", live:false,
   options:[{a:"open",l:"Open Closeout and set the date"}],
   feedback:{ correct:"Exit date set. Transfer-in and sales stop where the lifecycle stops, and the inventory walk closes out cleanly.",
              wrong:"The plan still carries units past the exit date. That inventory has nowhere to sell, and the walk will not close." } },
 { id:"M2-4", type:"ALREADY RESOLVED", kind:"none", decoy:true, title:"AIR FORCE 1 · cancel already routed",
   body:"You routed this to Allocation last month and they have it. Nothing here needs a second decision.",
   correctAction:"dismiss", live:false,
   options:[{a:"dismiss",l:"No action — dismiss"}],
   feedback:{ correct:"Correct — it is with the owner. Routing it twice does not make it move faster.", wrong:null } },
 { id:"M2-5", type:"ALREADY RESOLVED", kind:"none", decoy:true, title:"5149 RUN · chase executed by Allocation",
   body:"Informational. Allocation contracted the GA product against your demand read. No planner action.",
   correctAction:"dismiss", live:false,
   options:[{a:"dismiss",l:"No action — dismiss"}],
   feedback:{ correct:"Correct — this is a notification, not a task. Your read is already reflected upstream.", wrong:null } }
],
3:[
 { id:"M3-1", type:"CHASE", kind:"chase", title:"5149 RUN · sell-through accelerating again",
   body:"Sales are running ahead of supply for a second consecutive month, and GA product is still available to contract.",
   correctAction:"escalate", partner:"Allocation", live:true, needsEvidence:true,
   options:[{a:"escalate",l:"Route to Allocation"},{a:"dismiss",l:"Dismiss — no action"}],
   feedback:{ correct:"Right call, and the second month of evidence is what makes it credible rather than reactive.",
              wrong:"A repeat signal with supply behind it is the clearest case you will get. Left alone, the demand is real and the units are not there." } },
 { id:"M3-2", type:"CANCEL", kind:"cancel", title:"SPORTSWEAR CLASSICS · cancel recommended",
   body:"Supply well ahead of sales into the clearance period. Allocation executes cancels — your job is the evidence and the POV.",
   correctAction:"escalate", partner:"Allocation", live:true,
   options:[{a:"escalate",l:"Route to Allocation"},{a:"dismiss",l:"Dismiss — no action"}],
   feedback:{ correct:"Right call. You brought the position to the owner rather than trying to plan around it.",
              wrong:"Cancels are not yours to execute and not yours to ignore. Unrouted, the inventory arrives anyway." } },
 { id:"M3-3", type:"NO ACTION", kind:"none", decoy:true, title:"ACCESS · movement within variance",
   body:"Third month inside normal weekly variance. Does not meet any action criteria.",
   correctAction:"dismiss", live:false,
   options:[{a:"dismiss",l:"No action — dismiss"}],
   feedback:{ correct:"Correct. Three months of leaving it alone is a decision you should be able to defend, and you can.", wrong:null } },
 { id:"M3-4", type:"ALREADY RESOLVED", kind:"none", decoy:true, title:"ACG RUGGED ICON · markdown executed by Merch",
   body:"Informational. Merch has taken the markdown you routed. Your degradation assumption already reflects it.",
   correctAction:"dismiss", live:false,
   options:[{a:"dismiss",l:"No action — dismiss"}],
   feedback:{ correct:"Correct — the owner acted, and your plan already carries the price assumption. Nothing to do.", wrong:null } }
]};

/* ==================================================================
   STATE
   ================================================================== */
let S = null;

function freshMonthState(){
  return {
    lastShapeEdit:null, awosRefreshTs:null, storeDisaggTs:null,
    escalations:[], inbox:clone(NVS_EXCEPTIONS[1]), rationale:{}, firedHints:{}
  };
}
function newRun(mode){
  S = {
    mode, month:1, tourComplete:false, tourIdx:0, tourOpen:false,
    page:"inseason-ssp", tab:"shaping", subtab:"rebuy",
    rebuy:clone(REBUY_SEED), closeout:clone(CLOSEOUT_SEED),
    lastShapeEdit:null, awosRefreshTs:null, storeDisaggTs:null,
    escalations:[], inbox:clone(NVS_EXCEPTIONS[1]), rationale:{},
    firedHints:{}, coachExpanded:false, coachHint:null,
    side:null, sideCtx:null, monthScores:[], ledger:[], screen:null,
    selectedPH:null, monthEntry:{}, clock:0
  };
  S.rebuy.forEach(r=>{ r.adjPct={}; r.ovrd={}; r.degPct={}; r.receiptOvrd={};
    r.locked=false; r.duplicateReceipt=false; });
  S.closeout.forEach(c=>{ c.degPct={}; c.locked=false; c.transferOutDate=null; c.unallocatedOffset=false; });
  S.monthEntry[1] = snapshotPlan();
  return S;
}
function snapshotPlan(){ return { rebuy:clone(S.rebuy), closeout:clone(S.closeout) }; }
function now(){ return ++S.clock; }   /* monotonic logical clock — relative order is what matters (NEW-3) */

/* ==================================================================
   FORMULAS — spec §4, authoritative. Do not vary.
   ================================================================== */
function finalFcst(item, m){
  const o = item.ovrd ? item.ovrd[m] : null;
  const a = item.adjPct ? item.adjPct[m] : null;
  const b = item.basis ? (item.basis[m] ?? 0) : 0;      /* placeholders: analytic basis always 0 */
  if(o != null) return o;
  if(a != null) return Math.round(b * (1 + a/100));
  return b;
}
function survivingOverride(item, m){
  if(item.ovrd && item.ovrd[m] != null) return "ovrd";
  if(item.adjPct && item.adjPct[m] != null) return "adjPct";
  if(item.degPct && item.degPct[m] != null) return "degPct";
  return null;
}
function hasAnyOverride(item){
  const keys = ["ovrd","adjPct","degPct"];
  return keys.some(k => item[k] && Object.values(item[k]).some(v => v != null));
}
/* Rebuy: unconstrained — inventory is not modelled on this track (spec §4). */
function rebuyConstr(r, m){ return finalFcst(r, m); }
function rebuyAwos(r, m){
  const eop = REBUY_EOP[r.midlevel] ? REBUY_EOP[r.midlevel][m] : null;
  const ad = r.avgDemand;
  if(eop == null || !ad) return null;
  return eop / ad;
}
function rebuyDeg(r, m){ return r.degPct[m] != null ? r.degPct[m] : 15.0; }

/* Closeout inventory walk — spec §4 + §5.
   BOP current period = 0; future BOP = prior period EOP. */
function closeoutWalk(ph){
  const out = {}; let prevEop = 0; let stopped = false;
  const stopIdx = ph.transferOutDate ? monthIndexOfDate(ph.transferOutDate) : null;
  MONTHS.forEach((m,i)=>{
    if(stopIdx != null && i > stopIdx) stopped = true;
    const bop  = i === 0 ? 0 : prevEop;
    const ti   = stopped ? 0 : (ph.transferIn[m] ?? 0);
    const avail= bop + ti;
    const fin  = stopped ? 0 : finalFcst(ph, m);
    const constr = Math.min(fin, avail);
    const eop  = avail - constr;
    out[m] = { bop, ti, avail, fin, constr, eop,
               truncated: fin > avail,
               sales: constr * (ph.aur[m] ?? 0),
               cost:  constr * (ph.auc[m] ?? 0),
               st: avail > 0 ? (constr/avail*100) : 0 };
    prevEop = eop;
  });
  return out;
}
function monthIndexOfDate(d){
  const t = new Date(d);
  if(isNaN(t)) return null;
  const label = t.toLocaleString("en-GB",{month:"short"}) + "-" + String(t.getFullYear()).slice(2);
  const i = MONTHS.indexOf(label);
  return i < 0 ? null : i;
}
/* VQ-2(b): a row is finalized once every editable measure on it holds a value.
   Independent of `locked` so DEC-7 stays scoreable. */
function rebuyFinalized(r){
  const g = MONTH_CFG[S.month].grid;
  return g.every(i => {
    const m = mk(i);
    return (r.ovrd[m] != null || r.adjPct[m] != null) && r.degPct[m] != null && r.receiptOvrd[m] != null;
  });
}
function closeoutFinalized(c){
  const g = MONTH_CFG[S.month].grid;
  return g.every(i => {
    const m = mk(i);
    return c.transferIn[m] != null && c.ovrd[m] != null && c.aur[m] != null && c.auc[m] != null;
  });
}
function isFinalized(row){ return row.code ? closeoutFinalized(row) : rebuyFinalized(row); }

/* Mid-level roll-ups for Grid A */
function midlevels(){
  const seen = []; S.rebuy.forEach(r=>{ if(!seen.includes(r.midlevel)) seen.push(r.midlevel); });
  return seen;
}
function midWF(ml, m){
  return S.rebuy.filter(r=>r.midlevel===ml).reduce((s,r)=> s + rebuyConstr(r,m), 0);
}
function midBaseWF(ml, m){
  return REBUY_SEED.filter(r=>r.midlevel===ml).reduce((s,r)=> s + (r.basis[m] ?? 0), 0);
}
/* SPEC GAP G-2: sell-through has no seeded inventory base on Rebuy.
   ST scales with the planned units against the reviewed baseline. */
function midST(ml, m){
  const base = midBaseWF(ml, m); if(!base) return null;
  const b = ST_BASE[ml]; if(!b) return null;
  return b.wf * (midWF(ml,m)/base);
}
function midSTcf(ml){ return ST_BASE[ml] ? ST_BASE[ml].cf : null; }
function midSignal(ml){
  const m = mk(MONTH_CFG[S.month].cur);
  const wf = midST(ml,m), cf = midSTcf(ml);
  if(wf==null||cf==null) return { txt:"— within variance", ink:"none-ink", fill:"none-fill" };
  const d = wf - cf;
  if(d >=  SIGNAL_PTS) return { txt:"▲ ST +"+d.toFixed(1)+" pts vs CF", ink:"chase-ink", fill:"chase-fill" };
  if(d <= -SIGNAL_PTS) return { txt:"▼ ST "+d.toFixed(1)+" pts vs CF", ink:"cancel-ink", fill:"cancel-fill" };
  return { txt:"— within variance", ink:"none-ink", fill:"none-fill" };
}
/* Material variance = ±5% WF vs CF (project owner). Drives Narrative Documented. */
function materialVariances(){
  const m = mk(MONTH_CFG[S.month].cur), out = [];
  midlevels().forEach(ml=>{
    const cf = MID_CF[ml] ? MID_CF[ml][m] : null; if(!cf) return;
    const wf = midWF(ml,m);
    const pct = (wf-cf)/cf*100;
    if(Math.abs(pct) >= MATERIAL_VARIANCE_PCT) out.push({ key:"ML:"+ml, label:ml, pct });
  });
  S.closeout.forEach(c=>{
    const w = closeoutWalk(c)[m];
    if(w && w.truncated) out.push({ key:"PH:"+c.code, label:c.code+" — sales truncated by inventory", pct:null });
    else if(w && c.degPct[m] != null && c.degPct[m] !== 15.0)
      out.push({ key:"PH:"+c.code+":deg", label:c.code+" — degradation changed to "+c.degPct[m].toFixed(1)+"%", pct:null });
  });
  return out;
}


/* ==================================================================
   SHELL RENDER
   ================================================================== */
const NAV = [
  { l:"Rolling Plan", grp:true, open:true },
  { l:"Rolling Plan", leaf:true },
  { l:"Placeholder Management", leaf:true, page:"placeholder" },
  { l:"Pre-Season", grp:true, open:false },
  { l:"Pre-Season Management", grp:true, open:true },
  { l:"Assortment Management", leaf:true },
  { l:"3PP Assortment Mgmt", leaf:true },
  { l:"Store Management", leaf:true },
  { l:"Final Cluster Assignmt", leaf:true },
  { l:"Range Planning", leaf:true },
  { l:"In-Season", grp:true, open:true },
  { l:"In-Season SSP", leaf:true, page:"inseason-ssp" },
  { l:"Assortment Actions", leaf:true, page:"assortment-actions" },
  { l:"In-Season Maint. Dash", leaf:true },
  { l:"Published Chase Cancel", leaf:true },
  { l:"Reporting", grp:true, open:false },
  { l:"Batch Info", grp:true, open:false }
];
const SCOPE = [["Currency","USD"],["Country","EMEA"],["Channel","EMEA NVS MPU"],
               ["Season","SU2027"],["Area of Responsib…","(All) 20224"],["Version","CurrWorkingView"]];

const PAGE_TITLE = {
  "inseason-ssp": ()=> S.tab==="location" ? "NVS In-Season SSP — Location Plan" : "NVS In-Season Shaping & Reforecasting",
  "placeholder":  ()=> "NVS Placeholder Management",
  "assortment-actions": ()=> "NVS Assortment Actions"
};
const PAGE_CHIP = { "inseason-ssp":"In-Season SSP", "placeholder":"Placeholder Management",
                    "assortment-actions":"Assortment Actions" };

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
    <div class="icons">${ic}</div><div class="who">APEMEA</div><div class="avatar">JH</div></div>`;
}
function railLHTML(){ return `<div class="railL" aria-hidden="true"><span>≡</span><span>▦</span><span>▭</span><span>☺</span></div>`; }
function railRHTML(){ return `<div class="railR" aria-hidden="true"><span>▤</span><span>⚙</span><span>◉</span><span>?</span></div>`; }
function pagesHTML(){
  let h = `<nav class="pages" aria-label="Pages"><h2>Pages</h2>`;
  NAV.forEach((n,i)=>{
    if(n.grp) h += `<div class="navrow grp nav-off">${esc(n.l)}<span class="chev">${n.open?"˄":"˅"}</span></div>`;
    else {
      const on = !!n.page, active = n.page === S.page;
      h += `<button class="navrow leaf ${on?"nav-on":"nav-off"} ${active?"active":""}" data-nav="${i}"
             ${on?"":'tabindex="-1" aria-disabled="true"'}>${esc(n.l)}</button>`;
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
  const rows = { "inseason-ssp": S.tab==="location" ? "Showing 236 rows of data."
                   : (S.subtab==="closeout" ? "Showing 318 rows of data." : "Showing 1,284 rows of data."),
                 "placeholder":"Showing 7,520 rows of data.",
                 "assortment-actions":"Showing 46 rows of data." }[S.page];
  let tools = "";
  if(S.page==="inseason-ssp" && S.tab==="location")
    tools = `<button class="tool primary" id="btnDisagg">Store Disagg</button>`;
  if(S.page==="inseason-ssp" && S.tab==="shaping")
    tools = `<button class="tool primary" id="btnAwos">aWOS Avg Demand Update</button>`;
  if(S.page==="placeholder")
    tools = `<button class="tool primary" id="btnRefreshPH">Refresh Closeout PH</button>`;
  if(S.page==="assortment-actions")
    tools = `<button class="tool primary" id="btnApprove" disabled aria-disabled="true"
       aria-describedby="apprWhy">Approve Action to WF &amp; DCD</button>
       <span id="apprWhy" class="sr-only">Disabled for the NVS persona. Merch executes markdowns; Allocation executes cancels.</span>`;
  const std = ["Export Pivot ˅","Download ˅","Bulk Edit ˅","Filters ˅","Layout","Local Edit"]
    .map(t=>`<button class="tool">${esc(t)}</button>`).join("");
  return `<div class="rpthdr"><h1>${esc(PAGE_TITLE[S.page]())}</h1><span class="rows">ⓘ ${esc(rows)}</span>
    <div class="toolbar">${tools}${std}</div></div>`;
}
function tabsHTML(){
  let h = "";
  if(S.page==="inseason-ssp"){
    h += `<div class="tabs">
      <button class="tab" disabled>Seasonal SSP</button>
      <button class="tab ${S.tab==="shaping"?"on":""}" data-tab="shaping">Shaping &amp; Reforecasting</button>
      <button class="tab ${S.tab==="location"?"on":""}" data-tab="location">Location Plan</button></div>`;
    if(S.tab==="shaping"){
      h += ribbonHTML();
      h += `<div class="subtabs">
        <button class="tab ${S.subtab==="rebuy"?"on":""}" data-sub="rebuy">Rebuy</button>
        <button class="tab ${S.subtab==="closeout"?"on":""}" data-sub="closeout">Closeout</button></div>`;
    }
  } else if(S.page==="placeholder"){
    h += `<div class="tabs"><button class="tab on">Closeout</button></div>`;
  } else {
    h += `<div class="tabs"><button class="tab on">Assortment Actions</button>
      <button class="tab" data-tab="params">Parameters</button>
      <button class="tab" data-tab="viz">Visualization</button></div>`;
  }
  return h;
}
/* Warm-surface rule: ribbon only renders warm while the Coach is collapsed. */
function ribbonHTML(){
  const steps = [["1  OTB read","read-only"],["2  Assortment Actions","read-only"],
    ["3  Shaping & Reforecasting","decisions happen"],["4  Prior Plan Review","validate & reconcile"],
    ["5  Monthly Lock","admin-executed"]];
  let h = `<div class="ribbon" ${S.coachExpanded?'style="background:var(--none-fill)"':""}>
    <div class="mlabel">${esc(MONTH_CFG[S.month].label)}</div>`;
  steps.forEach((s,i)=>{
    h += `<div class="rstep ${i===2?"on":""}"><div class="t">${esc(s[0])}</div><div class="s">${esc(s[1])}</div></div>`;
    if(i<4) h += `<div class="rsep">›</div>`;
  });
  return h + `<div style="flex:1"></div></div>`;
}

/* ==================================================================
   GRID DISPATCHER
   ================================================================== */
function bodyHTML(){
  if(S.page==="placeholder")          return gridD();
  if(S.page==="assortment-actions")   return gridE();
  if(S.tab==="location")              return gridF();
  return gridA() + (S.subtab==="rebuy" ? gridB() : gridC());
}
function actualClass(i){ return MONTH_CFG[S.month].actual.includes(i) ? "actual" : ""; }
function isActual(i){ return MONTH_CFG[S.month].actual.includes(i); }

/* ---------- GRID A — multi-month trend (opening artifact, REQ-3) ---------- */
function gridA(){
  const cfg = MONTH_CFG[S.month];
  let h = `<div class="sec-hdr">REBUY — MID-LEVEL TREND · ACTUALIZED PERIODS READ-ONLY</div>
    <table class="g"><thead><tr>
    <th>Global Sport Focus</th><th>MidLevel</th><th>Data</th>` +
    cfg.trend.map(i=>`<th class="n">${esc(mk(i))}${isActual(i)?" act":""}</th>`).join("") +
    `<th>Signal</th></tr></thead><tbody>`;
  midlevels().forEach(ml=>{
    const sport = S.rebuy.find(r=>r.midlevel===ml).sport;
    const sig = midSignal(ml);
    const rows = [
      { lab:"Net Sls U Constr (WF)", get:i=>fU(midWF(ml,mk(i))), bold:true },
      { lab:"Net Sls U Constr (CF)", get:i=>fU(MID_CF[ml]?MID_CF[ml][mk(i)]:null), mute:true },
      { lab:"ST % (WF)",             get:i=>fPc(midST(ml,mk(i))) }
    ];
    rows.forEach((r,ri)=>{
      h += `<tr><td>${ri===0?"<b>"+esc(sport)+"</b>":""}</td><td>${ri===0?"<b>"+esc(ml)+"</b>":""}</td>
        <th scope="row" class="${r.mute?"mute":""}">${esc(r.lab)}</th>` +
        cfg.trend.map(i=>`<td class="n ${actualClass(i)} ${r.mute?"mute":""}" ${r.bold?'style="font-weight:700"':""}>${r.get(i)}</td>`).join("") +
        `<td>${ri===0?`<span class="pill" style="color:var(--${sig.ink});background:var(--${sig.fill})">${esc(sig.txt)}</span>`:""}</td></tr>`;
    });
  });
  return h + `</tbody></table>
    <p style="font-size:10.5px;font-style:italic;color:var(--t-ink3);margin:8px 2px 18px">
    Prior months · current month · forward months in one view. The OTB Report carries the same numbers — you do not navigate to it.</p>`;
}

function lockCellHTML(row){
  const fin = isFinalized(row);
  return `<td style="text-align:center">
    <button class="lockbtn ${row.locked?"on":""}" data-lock="${row.id}"
      aria-pressed="${row.locked}">${row.locked?"LOCKED":"LOCK"}</button>
    ${fin && !row.locked ? '<span class="finmark">finalized</span>' : ""}</td>`;
}

/* ---------- GRID B — Rebuy subtab (REQ-5) ---------- */
function gridB(){
  const g = MONTH_CFG[S.month].grid;
  const groups = [
    { ml:"5149 RUN", hdr:"REBUY · 5149 RUN — DIRECTIONAL READ FROM MERCH, NO CONFIRMED NUMBER" },
    { ml:"AIR FORCE 1", hdr:"REBUY · AIR FORCE 1 — CONFIRMED UNIT TARGET FROM BUSINESS PLANNING" },
    { ml:"ACCESS", hdr:"REBUY · ACCESS — MOVEMENT WITHIN VARIANCE" },
    { ml:"ACG RUGGED ICON", hdr:"REBUY · ACG RUGGED ICON — CLEARANCE PRICE STRATEGY" }
  ];
  let h = `<table class="g"><thead><tr><th>MidLevel</th><th>Style Color</th><th>Data</th>` +
    g.map(i=>`<th class="n">${esc(mk(i))}</th>`).join("") +
    `<th class="n">SSN Total</th><th style="text-align:center">Lock</th></tr></thead><tbody>`;
  groups.forEach(grp=>{
    h += `<tr class="grouprow"><td colspan="${g.length+5}">${esc(grp.hdr)}</td></tr>`;
    S.rebuy.filter(r=>r.midlevel===grp.ml).forEach(r=>{
      const L = r.locked;
      const ssn = g.reduce((s,i)=> s + rebuyConstr(r, mk(i)), 0);
      const rows = [
        { lab:"Net Sls Fcst U (Basis)", cls:"mute",
          cell:i=>`<td class="n calc mute">${fU(r.basis[mk(i)])}</td>` },
        { lab:"Net Sls Fcst U Adj %", bold:true,
          cell:i=> ec(r.id,"adjPct",mk(i), r.adjPct[mk(i)], fP, L) },
        { lab:"Net Sls Fcst U Ovrd", bold:true,
          cell:i=> ec(r.id,"ovrd",mk(i), r.ovrd[mk(i)], fU, L) },
        { lab:"Net Sls U Constr (WF)", bold:true, total:fU(ssn),
          cell:i=>`<td class="n calc expl" data-expl="rebuy|${r.id}|${mk(i)}" tabindex="0"
                   style="font-weight:700">${fU(rebuyConstr(r,mk(i)))}</td>` },
        { lab:"Net Sls MSRP Deg % Ovrd", bold:true,
          cell:i=> ec(r.id,"degPct",mk(i), r.degPct[mk(i)], v=> v==null?"":fPc(v), L, "deg") },
        { lab:"Receipt U Ovrd",
          cell:i=> ec(r.id,"receiptOvrd",mk(i), r.receiptOvrd[mk(i)], fU, L) },
        { lab:"aWOS (WF)", ital:true,
          cell:i=>`<td class="n ital expl" data-expl="awos|${r.id}|${mk(i)}" tabindex="0">${f1(rebuyAwos(r,mk(i)))}</td>` }
      ];
      rows.forEach((row,ri)=>{
        h += `<tr><td>${ri===0?"<b>"+esc(r.midlevel)+"</b>":""}</td>
          <td style="color:var(--t-ink2)">${ri===0?esc(r.styleColor):""}</td>
          <th scope="row" ${row.bold?'style="font-weight:700"':""} class="${row.cls||""} ${row.ital?"ital":""}">${esc(row.lab)}</th>` +
          g.map(i=>row.cell(i)).join("") +
          `<td class="n" style="font-weight:${row.total?700:400}">${row.total||""}</td>` +
          (ri===0 ? lockCellHTML(r) : "<td></td>") + `</tr>`;
      });
      if(r.duplicateReceipt)
        h += `<tr><td colspan="${g.length+5}" style="background:var(--cancel-fill);color:var(--cancel-ink);font-size:10.5px">
          ⚠ DUPLICATE RECEIPT — an approved Assortment Action dated ${esc(r.lastActionDate)} already captured this shift. Plan Integrity will read this at readiness.</td></tr>`;
    });
  });
  h += `</tbody></table>` + cellLegend();
  if(S.month===3) h += `<div class="notice gap">SPEC GAP G-1 — §5 supplies no Feb-27 data, so Month 3 renders four month columns rather than five. Not resolved locally; sent back.</div>`;
  return h;
}

/* ---------- GRID C — Closeout subtab (REQ-6) ---------- */
function gridC(){
  const g = MONTH_CFG[S.month].grid;
  let h = `<table class="g"><thead><tr><th>MidLevel</th><th>Style Color</th><th>Data</th>` +
    g.map(i=>`<th class="n">${esc(mk(i))}</th>`).join("") +
    `<th class="n">SSN Total</th><th style="text-align:center">Lock</th></tr></thead><tbody>`;
  S.closeout.forEach(c=>{
    const w = closeoutWalk(c), L = c.locked;
    const ssnTI = g.reduce((s,i)=> s + (w[mk(i)].ti||0), 0);
    const ssnCo = g.reduce((s,i)=> s + (w[mk(i)].constr||0), 0);
    h += `<tr class="grouprow"><td colspan="${g.length+5}">CLOSEOUT · ${esc(c.code)} — ${esc(c.midlevel)}</td></tr>`;
    const rows = [
      { lab:"Transfer In U (WF)", bold:true, total:fU(ssnTI), cell:i=> ec(c.id,"transferIn",mk(i), c.transferIn[mk(i)], fU, L) },
      { lab:"Total Avail Inv U (WF)", cell:i=>`<td class="n calc expl" data-expl="ph|${c.id}|${mk(i)}" tabindex="0">${fU(w[mk(i)].avail)}</td>` },
      { lab:"Net Sls Fcst U Ovrd", bold:true, cell:i=> ec(c.id,"ovrd",mk(i), c.ovrd[mk(i)], fU, L) },
      { lab:"Net Sls U Constr (WF)", bold:true, total:fU(ssnCo), cell:i=>{
          const t = w[mk(i)];
          return `<td class="n ${t.truncated?"constr":"calc"} expl" data-expl="ph|${c.id}|${mk(i)}" tabindex="0" style="font-weight:700">
            ${fU(t.constr)}${t.truncated?'<span class="flagtxt">CAPPED</span>':""}</td>`; } },
      { lab:"Net Sls AUR $ (WF)", bold:true, cell:i=> ec(c.id,"aur",mk(i), c.aur[mk(i)], f2, L) },
      { lab:"Net Sls AUC $ (WF)", bold:true, cell:i=> ec(c.id,"auc",mk(i), c.auc[mk(i)], f2, L) },
      { lab:"Net Sls MSRP Deg % Ovrd", bold:true, cell:i=> ec(c.id,"degPct",mk(i), c.degPct[mk(i)], v=>v==null?"":fPc(v), L, "deg") },
      { lab:"EOP U (WF)", cell:i=>`<td class="n calc">${fU(w[mk(i)].eop)}</td>` }
    ];
    rows.forEach((row,ri)=>{
      h += `<tr><td>${ri===0?"<b>"+esc(c.midlevel)+"</b>":""}</td>
        <td style="color:var(--t-ink2)">${ri===0?esc(c.code):""}</td>
        <th scope="row" ${row.bold?'style="font-weight:700"':""}>${esc(row.lab)}</th>` +
        g.map(i=>row.cell(i)).join("") +
        `<td class="n" style="font-weight:${row.total?700:400}">${row.total||""}</td>` +
        (ri===0 ? lockCellHTML(c) : "<td></td>") + `</tr>`;
    });
    /* Transfer Out Date — single-value editable, spec §4 Grid C */
    h += `<tr><td></td><td></td><th scope="row" style="font-weight:700">Transfer Out Date</th>
      <td colspan="${g.length+1}">` +
      (L ? `<span class="lockcell" style="padding:3px 6px">${esc(c.transferOutDate||"")}</span>`
         : `<input class="rationale" style="min-height:0;width:170px;margin:0" type="date"
             data-tod="${c.id}" value="${c.transferOutDate||""}" aria-label="Transfer Out Date ${esc(c.code)}">`) +
      `</td><td></td></tr>`;
  });
  h += `</tbody></table>
    <div class="notice info">Transfer In U and Net Sls AUC are editable here and in Placeholder Management only. Every Transfer In auto-creates an offsetting Transfer Out in the Unallocated Channel — no manual balancing, no TMP impact.</div>`
    + cellLegend();
  return h;
}

/* ---------- GRID D — Placeholder Management (REQ-7) ---------- */
function gridD(){
  const g = MONTH_CFG[S.month].grid.slice(0,4);
  let h = `<div class="sec-hdr">CLOSEOUT PLACEHOLDERS · PPH + MIDLEVEL CROSS-SECTIONS · PHCO-PREFIXED STYLE COLOR CODES</div>
    <table class="g"><thead><tr><th>Actions</th><th>Country</th><th>Channel</th><th>MidLevel</th>
    <th>Closeout Association</th><th>Data</th>` +
    g.map(i=>`<th class="n">${esc(mk(i))}</th>`).join("") +
    `<th style="text-align:center">Lock</th></tr></thead><tbody>`;
  S.closeout.forEach(c=>{
    const w = closeoutWalk(c), L = c.locked;
    const sel = S.selectedPH === c.id;
    const rows = [
      { lab:"Transfer In U (WF)", bold:true, cell:i=> ec(c.id,"transferIn",mk(i), c.transferIn[mk(i)], fU, L) },
      { lab:"Net Sls U Constr (WF)", bold:true, cell:i=>{ const t=w[mk(i)];
          return `<td class="n ${t.truncated?"constr":"calc"} expl" data-expl="ph|${c.id}|${mk(i)}" tabindex="0" style="font-weight:700">
            ${fU(t.constr)}${t.truncated?'<span class="flagtxt">CAPPED</span>':""}</td>`; } },
      { lab:"Net Sls AUR $ (WF)", bold:true, cell:i=> ec(c.id,"aur",mk(i), c.aur[mk(i)], f2, L) },
      { lab:"Net Sls AUC $ (WF)", bold:true, cell:i=> ec(c.id,"auc",mk(i), c.auc[mk(i)], f2, L) },
      { lab:"Total Avail Inv U (WF)", cell:i=>`<td class="n calc">${fU(w[mk(i)].avail)}</td>` },
      { lab:"EOP U (WF)", cell:i=>`<td class="n calc">${fU(w[mk(i)].eop)}</td>` }
    ];
    rows.forEach((row,ri)=>{
      h += `<tr ${sel?'style="outline:2px solid var(--coach);outline-offset:-2px"':""}>
        <td>${ri===0?"⋯":""}</td><td>${ri===0?"EMEA":""}</td><td>${ri===0?"Nike Value Stores":""}</td>
        <td>${ri===0?"<b>"+esc(c.midlevel)+"</b>":""}</td>
        <td style="color:var(--t-ink2);font-weight:${ri===0?700:400}">${ri===0?esc(c.code):""}</td>
        <th scope="row" ${row.bold?'style="font-weight:700"':""}>${esc(row.lab)}</th>` +
        g.map(i=>row.cell(i)).join("") +
        (ri===0 ? lockCellHTML(c) : "<td></td>") + `</tr>`;
    });
  });
  h += `</tbody></table>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:14px 0">
      <div class="notice info"><b style="display:block;font-size:9.5px;letter-spacing:.7px;margin-bottom:6px">WHY PLACEHOLDERS BEHAVE DIFFERENTLY</b>
      • Analytic forecast is always 0 — every unit is planner intent<br>
      • Included in reports and totals, but never actualize<br>
      • Transfer In and AUC editable only here and in the Closeout subtab<br>
      • Sales constrained to available inventory including Transfer In</div>
      <div class="notice" style="background:var(--imp-fill);color:var(--imp-ink)">
      <b style="display:block;font-size:9.5px;letter-spacing:.7px;margin-bottom:6px">WHEN TO LOCK</b>
      • Placeholder reflects an intentional business decision<br>
      • You do not want mid-level disaggregation to change it<br>
      • Sales, AUR, AUC or Transfer In assumptions are final<br>
      • The placeholder is done being actively shaped</div>
    </div>
    <div class="notice warn">PLANNER RISK — Unlocked placeholders may change when planning is performed at higher aggregate levels. Locking protects the deliberate decision; it does not stop you reviewing it.</div>`;
  return h;
}

/* ---------- GRID E — Assortment Actions, read-only (REQ-20) ---------- */
function gridE(){
  const ink = { cancel:["cancel-ink","cancel-fill"], md:["md-ink","md-fill"], chase:["chase-ink","chase-fill"],
                gm:["gm-ink","gm-fill"], none:["none-ink","none-fill"] };
  let h = `<table class="g"><thead><tr><th>Actions</th><th>MidLevel</th><th>Style Color</th>
    <th>Recommendation</th><th>Criteria met</th><th class="n">Net Sls U (WF)</th><th class="n">Supply U</th>
    <th class="n">aWOS</th><th class="n">AUR $</th><th style="text-align:center">Last Action Date</th>
    <th>Owner</th></tr></thead><tbody>`;
  ASSORTMENT_ACTIONS.forEach((a,idx)=>{
    if(a.grp){ h += `<tr class="grouprow ${a.muted?"none":""}"><td colspan="11">${esc(a.grp)}</td></tr>`; return; }
    const [i1,f1c] = ink[a.kind];
    const mu = a.muted ? "mute" : "";
    h += `<tr><td class="${mu}">⋯</td><td class="${mu}">${esc(a.mid)}</td><td class="${mu}">${esc(a.sc)}</td>
      <td style="text-align:center"><span class="pill" style="color:var(--${i1});background:var(--${f1c})">${esc(a.rec)}</span></td>
      <td class="expl ${mu}" data-expl="aa|${idx}|-" tabindex="0">${esc(a.crit)}</td>
      <td class="n ${mu}">${fU(a.ns)}</td><td class="n ${mu}">${fU(a.sup)}</td>
      <td class="n ${mu}">${f1(a.awos)}</td><td class="n ${mu}">${f2(a.aur)}</td>
      <td class="mute" style="text-align:center;font-size:10px">${esc(a.last||"")}</td>
      <td class="${mu}" style="color:var(--${i1});font-weight:700">${esc(a.owner)}</td></tr>`;
  });
  h += `</tbody></table>
    <div class="notice warn"><b style="display:block;font-size:9.5px;letter-spacing:.7px;margin-bottom:5px">READ-ONLY FOR THIS PERSONA</b>
    Approve Action to WF &amp; DCD renders present but disabled. NVS AP planners do not own these actions in any Geo — the page exists so you can bring evidence to the partner who does.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="notice ro"><b>Parameters</b> — Default thresholds managed centrally by Admin. Visible, never editable by NVS.</div>
      <div class="notice ro"><b>Visualization</b> — Shows which criteria this style color met. This is the evidence you take to the partner.</div>
    </div>`;
  return h;
}

/* ---------- GRID F — Location Plan, read-only (REQ-9) ---------- */
function gridF(){
  const stale = !S.storeDisaggTs;
  const g = MONTH_CFG[S.month].grid.slice(0,3);
  let h = `<div class="notice ro">READ-ONLY · No planning happens here. You are confirming that upstream shaping decisions are flowing to location level. ` +
    (stale ? `<span style="color:var(--cancel-ink)">Store Disagg has not been run this cycle — this view is stale.</span>`
           : `Store Disagg last run at step ${S.storeDisaggTs}${S.awosRefreshTs && S.storeDisaggTs > S.awosRefreshTs ? ", after the aWOS refresh" : ""}.`) + `</div>`;
  h += `<table class="g" ${stale?'style="opacity:.55"':""}><thead><tr>
    <th>Location Code</th><th>Location Name</th><th>Store Tier</th><th>Style Color</th>
    <th class="n">Net Sls U (WF)</th>` + g.map(i=>`<th class="n">${esc(mk(i))}</th>`).join("") +
    `<th class="n">APS</th><th class="n">aWOS</th><th>Distribution check</th></tr></thead><tbody>`;
  LOCATION_PLAN.forEach(r=>{
    if(r.grp){ h += `<tr class="grouprow"><td colspan="${g.length+8}">${esc(r.grp)}</td></tr>`; return; }
    h += `<tr><td>${esc(r.code)}</td><td>${esc(r.name)}</td><td>${esc(r.tier)}</td><td>${esc(r.sc)}</td>
      <td class="n">${fU(r.ns)}</td>` + r.m.slice(0,g.length).map(v=>`<td class="n">${fU(v)}</td>`).join("") +
      `<td class="n">${fU(r.aps)}</td><td class="n">${f1(r.awos)}</td>
      <td style="color:var(--${r.ok?"chase-ink":"cancel-ink"});background:var(--${r.ok?"chase-fill":"cancel-fill"});font-weight:700;font-size:10px">
        ${esc(r.chk)}</td></tr>`;
  });
  h += `</tbody></table>`;
  const esc0545 = S.escalations.find(e=>e.item==="LOC-0545");
  h += `<div class="notice warn"><b style="display:block;font-size:9.5px;letter-spacing:.7px;margin-bottom:5px">THE FIX IS UPSTREAM</b>
    Lelystad is a Tier 2 store carrying near Tier 1 depth. Nothing on this page can correct it. This is a conversation with the Allocation partner — the escalation path, not a planning action.
    <div style="margin-top:8px">` +
    (esc0545 ? `<span class="pill" style="color:var(--chase-ink);background:var(--chase-fill)">ESCALATED TO ALLOCATION</span>`
             : `<button class="btn" id="btnEsc0545">Escalate 0545 to Allocation</button>`) + `</div></div>
    <div class="notice gap">VQ-9 — The Location Plan renders the Month 1 store dataset in all three months. §5 supplies no Store Disagg allocation method and no Month 2 / Month 3 store rows. Confirmed by the project owner; recorded here rather than derived.</div>`;
  return h;
}

/* ==================================================================
   SIDE PANELS — animate width, never overlay the grid (spec §9)
   ================================================================== */
function sidePanelHTML(){
  if(!S.side) return `<aside class="side"></aside>`;
  if(S.side==="inbox")   return `<aside class="side inbox open" role="complementary">${inboxHTML()}</aside>`;
  if(S.side==="cascade") return `<aside class="side open" role="complementary">${cascadeHTML()}</aside>`;
  if(S.side==="expl")    return `<aside class="side open" role="complementary">${explHTML()}</aside>`;
  if(S.side==="flow")    return `<aside class="side open" role="complementary">${flowHTML()}</aside>`;
  return `<aside class="side"></aside>`;
}

/* ---------- SHARED-5 Explainability, formula-first (REQ-12) ---------- */
function explHTML(){
  const [kind,id,m] = S.sideCtx.split("|");
  if(kind==="aa"){
    const a = ASSORTMENT_ACTIONS[Number(id)];
    return panelHead("EXPLAINABILITY","Assortment Action recommendation", a.sc+" · "+a.rec) +
      `<div class="sc"><div class="sec-hdr t">CRITERIA MET</div>
      <ul><li>${esc(a.crit).split(" · ").join("</li><li>")}</li></ul>
      <div class="panelfoot">This mirrors the Visualization tab. It is the evidence you take to ${esc(a.owner)}. Explainability states the criteria; it does not recommend an action.</div></div>`;
  }
  if(kind==="awos"){
    const r = S.rebuy.find(x=>x.id===id);
    const eop = REBUY_EOP[r.midlevel][m], ad = r.avgDemand;
    const stale = S.lastShapeEdit && (!S.awosRefreshTs || S.awosRefreshTs < S.lastShapeEdit);
    return panelHead("EXPLAINABILITY","aWOS (WF)", r.styleColor+" · "+m) + `<div class="sc">
      <div class="sec-hdr t">THE ARITHMETIC</div>
      <div class="calcrow"><span>EOP Inventory U</span><b>${fU(eop)}</b></div>
      <div class="calcrow"><span>÷ Average Demand per week</span><b>${fU(ad)}</b></div>
      <div class="calcrow"><span>= aWOS (WF)</span><b>${f1(eop/ad)}</b></div>
      <div class="sec-hdr t">THE RULE THAT CHANGED THE ANSWER</div>
      <div class="rulebox" style="background:var(--${stale?"cancel-fill":"chase-fill"});color:var(--${stale?"cancel-ink":"chase-ink"})">
        ${stale ? "Average Demand per week still holds the PRE-shaping figure. EOP recalculated the moment you shaped; the denominator did not. This number is misleading until you run the aWOS Avg Demand Update."
                : "Average Demand per week was recalculated from your current overrides. This number matches the shaped plan."}</div>
      <button class="btn" style="margin:8px 14px" data-flow="B">Show the flow</button>
      <div class="panelfoot">Explainability states the arithmetic, then the cap or rule that changed the answer. It never recommends which fix to take.</div></div>`;
  }
  if(kind==="ph"){
    const c = S.closeout.find(x=>x.id===id), w = closeoutWalk(c)[m];
    return panelHead("EXPLAINABILITY","Net Sls U Constr (WF)", c.code+" · "+c.midlevel+" · "+m) + `<div class="sc">
      <div class="sec-hdr t">THE ARITHMETIC</div>
      <div class="calcrow mute"><span>BOP U (WF) · current period</span><b>${fU(w.bop)}</b></div>
      <div class="calcrow"><span>+ Transfer In U (WF)</span><b>${fU(w.ti)}</b></div>
      <div class="calcrow"><span>= Total Avail Inv U (WF)</span><b>${fU(w.avail)}</b></div>
      <div class="calcrow"><span>Final Net Sls Fcst U (your override)</span><b>${fU(w.fin)}</b></div>
      <div class="calcrow"><span>Available inventory</span><b>${fU(w.avail)}</b></div>
      <div class="sec-hdr t">THE RULE THAT CHANGED THE ANSWER</div>
      <div class="rulebox constr"><b>IF</b> Available Inventory &lt; Final Net Sales Fcst<br>
        <b>THEN</b> Net Sales is constrained to available inventory<br>
        <b>ELSE</b> Net Sales = Final Net Sales Forecast</div>` +
      (w.truncated
        ? `<div class="conseq">Your forecast of ${fU(w.fin)} truncated to ${fU(w.constr)}. The ${fU(w.fin-w.constr)}-unit difference is not in the plan and will not lock.</div>
           <div class="sec-hdr t">WHAT WOULD CHANGE IT</div>
           <ul><li>Raise Transfer In U so inventory supports the plan</li>
           <li>Lower the sales override to what inventory can carry</li></ul>`
        : `<div class="conseq">Inventory supports the plan. Nothing is truncating, and what you plan is what will lock.</div>`) +
      `<button class="btn" style="margin:8px 14px" data-flow="C">Show the flow</button>
      <div class="panelfoot">Explainability states the arithmetic, then the cap that changed the answer. It never recommends which fix to take.</div></div>`;
  }
  /* rebuy Final measure */
  const r = S.rebuy.find(x=>x.id===id);
  const basis = r.basis[m], adj = r.adjPct[m], ov = r.ovrd[m];
  const surv = survivingOverride(r,m);
  return panelHead("EXPLAINABILITY","Net Sls U Constr (WF)", r.styleColor+" · "+m) + `<div class="sc">
    <div class="sec-hdr t">THE ARITHMETIC</div>
    <div class="calcrow mute"><span>Net Sls Fcst U (system Basis)</span><b>${fU(basis)}</b></div>
    <div class="calcrow ${surv==="adjPct"?"":"mute"}"><span>Net Sls Fcst U Adj % ${ov!=null&&adj!=null?"· suppressed":""}</span><b>${adj==null?"—":fP(adj)}</b></div>
    <div class="calcrow ${surv==="ovrd"?"":"mute"}"><span>Net Sls Fcst U Ovrd</span><b>${ov==null?"—":fU(ov)}</b></div>
    <div class="calcrow"><span>= Final / Net Sls U Constr (WF)</span><b>${fU(rebuyConstr(r,m))}</b></div>
    <div class="sec-hdr t">THE RULE THAT CHANGED THE ANSWER</div>
    <div class="rulebox" style="background:var(--imp-fill);color:var(--imp-ink)">
      FINAL MEASURE RULE · No override → Final = Basis. Override entered → Final = Override.
      Both paths populated → the direct unit override takes precedence.</div>` +
    (ov!=null && adj!=null
      ? `<div class="conseq" style="color:var(--cancel-ink)">Both paths are populated. The unit override drives the plan; the Adj % is stored but suppressed.</div>`
      : "") +
    `<button class="btn" style="margin:8px 14px" data-flow="A">Show the flow</button>
    <div class="panelfoot">Explainability states the arithmetic, then the cap or rule that changed the answer. It never recommends which fix to take.</div></div>`;
}

/* ---------- SHARED-6 Explainability Flow ---------- */
function flowHTML(){
  const f = S.sideCtx;
  if(f==="B") return panelHead("EXPLAINABILITY FLOW","Flow B — why aWOS goes stale","the moment you shape") + `<div class="sc">
    <div class="flow" style="flex-direction:column">
      ${node("UPDATED","EOP Inventory U","","recalculates immediately on shaping","chase-ink","chase-fill")}
      ${node("STALE","÷ Average Demand per week","","holds the PRE-shaping figure until refreshed","cancel-ink","cancel-fill")}
      ${node("MISLEADING","= aWOS (WF)","","reads wrong until Avg Demand Update runs","md-ink","md-fill")}
    </div>
    <div class="rulebox" style="background:var(--t-ink);color:#fff;font-weight:700">
      RULE — Shape sales → Run aWOS Avg Demand Update → Validate Location Plan → then review, lock or present.</div></div>`;
  if(f==="C") return panelHead("EXPLAINABILITY FLOW","Flow C — closeout placeholder inventory walk","") + `<div class="sc">
    <ul style="line-height:2">
      <li><b>BOP U · current period</b> — always 0; future periods = prior period EOP</li>
      <li><b>+ Transfer In U</b> — planner-owned; auto-offset by a Transfer Out in the Unallocated Channel</li>
      <li><b>= Total Avail Inv U</b> — the cap on everything below</li>
      <li><b>Net Sls U (Constr)</b> — truncates if the cap is exceeded</li>
      <li><b>× Net Sls AUR → Net Sls $</b> · <b>× Net Sls AUC → Net Sls Cost $</b></li>
    </ul>
    <div class="rulebox" style="background:var(--gm-fill);color:var(--gm-ink);font-weight:700">
      Analytic Net Sls Fcst U is always 0 on a placeholder. There is no seeded forecast to fall back on — every unit is planner intent.</div></div>`;
  const [ , id, m] = (S.sideCtx2||"|RB3|"+mk(MONTH_CFG[S.month].cur)).split("|");
  const r = S.rebuy.find(x=>x.id===id) || S.rebuy[2];
  const adj = r.adjPct[m], ov = r.ovrd[m];
  return panelHead("EXPLAINABILITY FLOW","Flow A — how a planned number becomes the locked number", r.styleColor+" · "+m) + `<div class="sc">
    <div class="flow" style="flex-direction:column">
      ${node("SYSTEM","Net Sls Fcst U", fU(r.basis[m]), "system Basis","none-ink","none-fill")}
      ${node("PLANNER","Net Sls Fcst U Adj %", adj==null?"—":fP(adj), ov!=null&&adj!=null?"override P2 · suppressed":"override P2",
             (ov!=null&&adj!=null)?"cancel-ink":"none-ink",(ov!=null&&adj!=null)?"cancel-fill":"none-fill")}
      ${node("PLANNER","Net Sls Fcst U Ovrd", ov==null?"—":fU(ov), ov!=null?"override P1 · wins":"override P1","chase-ink","chase-fill")}
      ${node("SYSTEM","Final Net Sls Fcst U", fU(rebuyConstr(r,m)), "final measure rule","imp-ink","imp-fill")}
      ${node("SYSTEM · LOCKS","Net Sls U Constr (WF)", fU(rebuyConstr(r,m)), "inventory constraint applied","md-ink","md-fill")}
    </div>
    <div class="panelfoot">Priority rules resolve before the Final Measure Rule runs. The suppressed Adj % stays stored and stays visible here — it is never silently deleted.</div></div>`;
}

/* ---------- SHARED-10 Priority-cascade panel (REQ-17) — Net Sales Units only ---------- */
function cascadeHTML(){
  const [id,m] = S.sideCtx.split("|");
  const r = S.rebuy.find(x=>x.id===id);
  const basis = r.basis[m], adj = r.adjPct[m], ov = r.ovrd[m];
  const adjResult = adj==null ? null : Math.round(basis*(1+adj/100));
  return panelHead("OVERRIDE PRIORITY", r.styleColor+" · Net Sales Units", m) + `<div class="sc">
    <div class="tier win" style="border-color:var(--chase-ink)">
      <div class="badge" style="background:var(--chase-fill);color:var(--chase-ink)">P1</div>
      <div class="mid"><div class="lab" style="font-weight:700">Net Sls Fcst U Ovrd</div>
        <div class="val">${fU(ov)}</div></div>
      <div class="st"><span class="pill" style="color:var(--chase-ink);background:var(--chase-fill)">WINS — DRIVES FINAL</span></div></div>
    <div class="tier">
      <div class="badge" style="background:var(--cancel-fill);color:var(--cancel-ink)">P2</div>
      <div class="mid"><div class="lab mute" style="color:var(--t-ink3)">Net Sls Fcst U Adj %</div>
        <div class="val" style="color:var(--t-ink3)">${fP(adj)} &nbsp;→&nbsp; ${fU(adjResult)}</div></div>
      <div class="st"><span class="pill" style="color:var(--cancel-ink);background:var(--cancel-fill)">IGNORED WHILE P1 IS POPULATED</span></div></div>
    <div class="tier">
      <div class="badge" style="background:var(--none-fill);color:var(--none-ink)">—</div>
      <div class="mid"><div class="lab" style="color:var(--t-ink3)">Net Sls Fcst U (system Basis)</div>
        <div class="val" style="color:var(--t-ink3)">${fU(basis)}</div></div>
      <div class="st"><span class="pill" style="color:var(--none-ink);background:var(--none-fill)">SUPERSEDED BY OVERRIDE</span></div></div>
    <div class="rulebox" style="background:var(--imp-fill);color:var(--imp-ink)">
      FINAL MEASURE RULE · No override → Final = Basis. Override entered → Final = Override.
      Both paths populated → the direct unit override takes precedence.</div>
    <div style="display:flex;gap:8px;margin:10px 14px;flex-wrap:wrap">
      <button class="btn" data-casc="adj|${id}|${m}">Clear the Adj %</button>
      <button class="btn" data-casc="ovrd|${id}|${m}">Clear the unit override</button>
      <button class="btn dark" data-casc="keep|${id}|${m}">Keep P1, continue</button></div>
    <div class="panelfoot">Net Sales Units is the only measure in this simulation with two competing override paths. AUR, AUC, Receipts and Transfer In each have a single input path and never invoke this panel.</div></div>`;
}

/* ---------- SHARED-3 Exception Inbox (REQ-4) ---------- */
function inboxHTML(){
  const items = S.inbox;
  const live = items.filter(i=>!i.decoy && !i.resolved).length;
  const dec  = items.filter(i=>i.decoy && !i.resolved).length;
  const inkOf = k => ({cancel:["cancel-ink","cancel-fill"],md:["md-ink","md-fill"],chase:["chase-ink","chase-fill"],
                       gm:["gm-ink","gm-fill"],none:["none-ink","none-fill"]})[k];
  let h = panelHead("EXCEPTION INBOX","","Month "+S.month+"  ·  "+items.length+" items");
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

/* Guided auto-expands at the decision point. Challenge stays collapsed until commit.
   M3 suppresses any hint already fired in M1 or M2. */
function fireHint(id, opts){
  opts = opts || {};
  if(!HINTS[id]) return;
  if(S.month===3 && S.firedHints[id] && !opts.force) return;
  S.firedHints[id] = true;
  S.coachHint = id;
  const auto = (S.mode==="guided" && !opts.postCommitOnly) || (S.mode==="challenge" && opts.postCommit);
  if(auto) S.coachExpanded = true;
  announce("Coach note " + id);
}

function skipTour(){
  S.tourOpen = false; S.tourComplete = true;
  const ov = document.getElementById("tourOv"); if(ov) ov.remove();
  fireHint("T-1");
  render();
}

/* ==================================================================
   INTERACTION LOGIC — spec §6
   ================================================================== */
function findRow(id){ return S.rebuy.find(r=>r.id===id) || S.closeout.find(c=>c.id===id); }

function bindShell(){
  const app = document.getElementById("app");

  app.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>{
    const n = NAV[Number(b.dataset.nav)];
    if(!n.page) return;                      /* non-navigable leaves render but do nothing */
    S.page = n.page; S.side = null;
    if(n.page==="inseason-ssp") S.tab = "shaping";
    render();
  }));
  app.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{
    const t = b.dataset.tab;
    if(t!=="shaping" && t!=="location") return;   /* Parameters / Visualization are display-only */
    S.tab = t; S.side = null;
    if(t==="location" && !S.storeDisaggTs) fireHint("T-9");
    render();
  }));
  app.querySelectorAll("[data-sub]").forEach(b=>b.addEventListener("click",()=>{
    S.subtab = b.dataset.sub; S.side=null; render();
  }));

  const bA = app.querySelector("#btnAwos");   if(bA) bA.addEventListener("click", awosAvgDemandUpdate);
  const bD = app.querySelector("#btnDisagg"); if(bD) bD.addEventListener("click", storeDisagg);
  const bR = app.querySelector("#btnRefreshPH"); if(bR) bR.addEventListener("click", ()=>{
    S.coachHint = null;
    announce("Refresh Closeout PH is a pre-season utility. No change in-season.");
    alert("Refresh Closeout PH is a pre-season utility.\n\nIn-season it does nothing — placeholders are already associated, and refreshing would not add or remove any. No plan state has changed.");
  });
  const bAp = app.querySelector("#btnApprove");
  if(bAp){ ["mouseenter","focus"].forEach(ev=>bAp.addEventListener(ev, ()=>{ fireHint("T-6"); renderCoach(); })); }
  const bE = app.querySelector("#btnEsc0545");
  if(bE) bE.addEventListener("click", ()=>{
    S.escalations.push({ item:"LOC-0545", partner:"Allocation", correctPartner:"Allocation", evidenceOpened:true });
    announce("Escalated store 0545 to Allocation."); render();
  });

  app.querySelectorAll("[data-lock]").forEach(b=>b.addEventListener("click",()=>{
    const row = findRow(b.dataset.lock);
    row.locked = !row.locked;
    announce(row.locked ? "Row locked." : "Row unlocked.");
    render();
  }));
  app.querySelectorAll("[data-tod]").forEach(inp=>inp.addEventListener("change",()=>{
    const c = S.closeout.find(x=>x.id===inp.dataset.tod);
    c.transferOutDate = inp.value || null;
    S.lastShapeEdit = now();
    S.storeDisaggTs = null;                 /* location view goes stale */
    announce("Transfer Out date set. Inventory walk recalculated.");
    render();
  }));
  app.querySelectorAll("[data-edit]").forEach(td=>{
    td.addEventListener("click", ()=>beginEdit(td));
    td.addEventListener("keydown", e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); beginEdit(td); } });
  });
  app.querySelectorAll("[data-expl]").forEach(td=>{
    const open = ()=>{ S.side="expl"; S.sideCtx=td.dataset.expl; S.sideCtx2=td.dataset.expl; render(); };
    td.addEventListener("click", open);
    td.addEventListener("keydown", e=>{ if(e.key==="Enter"){ e.preventDefault(); open(); } });
  });
  app.querySelectorAll("[data-close-side]").forEach(b=>b.addEventListener("click",()=>{ S.side=null; render(); }));
  app.querySelectorAll("[data-flow]").forEach(b=>b.addEventListener("click",()=>{
    S.side="flow"; S.sideCtx=b.dataset.flow; render();
  }));
  app.querySelectorAll("[data-casc]").forEach(b=>b.addEventListener("click",()=>{
    const [act,id,m] = b.dataset.casc.split("|");
    const r = S.rebuy.find(x=>x.id===id);
    if(act==="adj")  { delete r.adjPct[m]; announce("Adj % cleared."); }
    if(act==="ovrd") { delete r.ovrd[m];   announce("Unit override cleared."); }
    S.side = null; S.lastShapeEdit = now(); render();
  }));
  app.querySelectorAll("[data-inbox]").forEach(b=>b.addEventListener("click",()=>{
    const [id,act] = b.dataset.inbox.split("|");
    resolveException(id, act);
  }));

  /* arrow-key traversal across editable cells (REQ-21) */
  app.addEventListener("keydown", e=>{
    if(!["ArrowRight","ArrowLeft"].includes(e.key)) return;
    const cells = [...app.querySelectorAll("[data-edit]")];
    const i = cells.indexOf(document.activeElement);
    if(i < 0) return;
    e.preventDefault();
    const nx = cells[i + (e.key==="ArrowRight" ? 1 : -1)];
    if(nx) nx.focus();
  });
  renderTour();
}

function beginEdit(td){
  const [id,field,m] = td.dataset.edit.split("|");
  const row = findRow(id);
  if(row.locked) return;
  const cur = row[field][m];
  const inp = document.createElement("input");
  inp.className="cell"; inp.type="number"; inp.step="any";
  inp.value = cur==null ? "" : cur;
  inp.setAttribute("aria-label", field+" "+m);
  td.textContent=""; td.appendChild(inp); inp.focus(); inp.select();
  const commit = ()=>{
    const raw = inp.value.trim();
    const val = raw==="" ? null : Number(raw);
    if(raw!=="" && isNaN(val)) { render(); return; }
    applyEdit(id, field, m, val);
  };
  inp.addEventListener("blur", commit);
  inp.addEventListener("keydown", e=>{
    if(e.key==="Enter"){ e.preventDefault(); commit(); }
    if(e.key==="Escape"){ e.preventDefault(); render(); }
  });
}

function applyEdit(id, field, m, val){
  const row = findRow(id);
  row[field][m] = val;
  S.lastShapeEdit = now();

  /* Transfer In → auto Unallocated Channel offset; location view goes stale */
  if(field==="transferIn"){ row.unallocatedOffset = true; S.storeDisaggTs = null;
    announce("Transfer In updated. Offsetting Transfer Out created in the Unallocated Channel."); }

  /* Receipt override duplicating an approved Assortment Action → KPI-3 */
  if(field==="receiptOvrd"){
    if(val != null && row.lastActionDate){ row.duplicateReceipt = true; fireHint("T-7"); }
    else row.duplicateReceipt = false;
  }
  /* Adj % where a confirmed unit target exists */
  if(field==="adjPct" && val != null && row.evidence==="confirmed") fireHint("T-3");
  /* Adj % across a long span (8+ weeks ≈ 2+ months) */
  if(field==="adjPct" && val != null && Object.values(row.adjPct).filter(v=>v!=null).length >= 2) fireHint("T-4");
  /* Third distinct override in M1 */
  if(S.month===1 && ["adjPct","ovrd"].includes(field) && val != null){
    const shaped = S.rebuy.filter(r=>hasAnyOverride(r)).length;
    if(shaped >= 3) fireHint("T-2");
  }
  /* Placeholder sales now exceed available inventory */
  if(row.code){
    const w = closeoutWalk(row);
    if(MONTH_CFG[S.month].grid.some(i=>w[mk(i)].truncated)) fireHint("T-11");
  }
  /* Priority cascade — Net Sales Units only, on the transition into both-populated */
  if(!row.code && ["adjPct","ovrd"].includes(field) &&
     row.adjPct[m] != null && row.ovrd[m] != null){
    fireHint("T-5");
    S.side = "cascade"; S.sideCtx = id+"|"+m; render(); return;
  }
  render();
}

/* ---------- action buttons ---------- */
function awosAvgDemandUpdate(){
  /* SPEC GAP G-4: §6 says "recompute avgDemandPerWeek from current overrides" but gives no
     formula. Implemented as mean planned units across the visible months ÷ 4.33 weeks.
     Flagged, not silently treated as approved. */
  const g = MONTH_CFG[S.month].grid;
  S.rebuy.forEach(r=>{
    const mean = g.reduce((s,i)=> s + rebuyConstr(r, mk(i)), 0) / g.length;
    r.avgDemand = Math.max(1, Math.round(mean / WEEKS_PER_MONTH));
  });
  S.awosRefreshTs = now();
  S.storeDisaggTs = null;                     /* location view must be re-disaggregated after */
  announce("aWOS Avg Demand Update complete. aWOS recalculated on your current overrides.");
  render();
}
function storeDisagg(){
  S.storeDisaggTs = now();                    /* refreshes the location view only */
  announce("Store Disagg complete. Location view refreshed. The forecast was not modified.");
  render();
}

/* ---------- SHARED-3 inbox resolution ---------- */
function resolveException(id, action){
  const it = S.inbox.find(x=>x.id===id);
  if(!it || it.resolved) return;
  it.chosen = action; it.resolved = true;
  const correct = action === it.correctAction;
  it.shownFeedback = correct ? it.feedback.correct : (it.feedback.wrong || it.feedback.correct);

  if(action==="escalate"){
    S.escalations.push({ item:it.id, partner:it.partner, correctPartner:it.partner,
      evidenceOpened:true });   /* the card body IS the criteria evidence, shown before the click */
  }
  if(action==="open"){
    if(it.deepLink){ S.selectedPH = it.deepLink; S.page="placeholder"; S.side=null; }
    else { S.page="inseason-ssp"; S.tab="shaping"; S.subtab="rebuy"; S.side=null; }
    render(); return;
  }
  if(S.mode==="challenge") fireHint(it.kind==="cancel"||it.kind==="md" ? "T-6" : "T-1", { postCommit:true });
  else if(it.kind==="cancel"||it.kind==="md") fireHint("T-6");
  render();
}
function inboxScore(){   /* display only — NOT a scoring input, per spec §1 */
  const live = S.inbox.filter(i=>!i.decoy);
  const ok = live.filter(i=>i.resolved && i.chosen===i.correctAction).length;
  return live.length ? Math.round(ok/live.length*100) : 100;
}

/* ==================================================================
   SCORING — spec §8. Every KPI reads END STATE. No click counters.
   ================================================================== */
function evalTarget(v, t){
  const dev = t.value!==0 ? Math.abs(v-t.value)/Math.abs(t.value) : (v===0?0:1);
  return Math.max(0, 100*(1-dev));
}
const KPI_OPTIONS = [
  { id:"KPI-1", name:"Signal Discipline",
    desc:"Share of ended-month overrides with a material signal behind them, less material signals left unshaped.",
    fn:function(){
      const items = S.rebuy;                          /* placeholders carry seeded overrides — excluded (VQ-3) */
      const shaped = items.filter(hasAnyOverride);
      const correct = shaped.filter(i=>i.signalFlag !== "none");
      const missed  = items.filter(i=>i.signalFlag !== "none" && !hasAnyOverride(i));
      const denom = shaped.length + missed.length;
      return denom === 0 ? 100 : 100 * correct.length / denom;
    } },
  { id:"KPI-2", name:"Instrument Accuracy",
    desc:"Whether the override surviving priority-cascade resolution matches the instrument the evidence supports.",
    fn:function(){
      const m = mk(MONTH_CFG[S.month].cur);
      /* VQ-6(a): items with no evidence tag are excluded from the denominator. */
      const shaped = S.rebuy.filter(i=>hasAnyOverride(i) && i.evidence);
      if(!shaped.length) return 100;
      const ok = shaped.filter(i=>{
        const surv = survivingOverride(i, m) ||
          MONTH_CFG[S.month].grid.map(x=>survivingOverride(i, mk(x))).find(Boolean);
        return (i.evidence==="directional" && surv==="adjPct")
            || (i.evidence==="confirmed"   && surv==="ovrd")
            || (i.evidence==="price"       && surv==="degPct");
      });
      return 100 * ok.length / shaped.length;
    } },
  { id:"KPI-3", name:"Plan Integrity",
    desc:"Constraint truncations, duplicate receipts, refresh and disagg timestamps, and locks — all read off end state.",
    fn:function(){
      const g = MONTH_CFG[S.month].grid;
      const c1 = !S.closeout.some(c=>{ const w=closeoutWalk(c); return g.some(i=>w[mk(i)].truncated); });
      const c2 = !S.rebuy.some(r=>r.duplicateReceipt);
      const c3 = S.awosRefreshTs != null && S.awosRefreshTs > (S.lastShapeEdit||0);
      const c4 = S.storeDisaggTs != null && S.storeDisaggTs > (S.awosRefreshTs||0);
      const all = [...S.rebuy, ...S.closeout];
      const c5 = all.filter(isFinalized).every(r=>r.locked);
      return 100 * [c1,c2,c3,c4,c5].filter(Boolean).length / 5;
    } },
  { id:"KPI-4", name:"Ownership Accuracy",
    desc:"Correct routing of every live partner-owned recommendation, with the evidence open.",
    fn:function(){
      /* VQ-7(a): the "violations" half is dropped — nothing in this build lets a learner
         edit a partner-owned item, so it could never score anything but 100. */
      const live = S.inbox.filter(i=>i.live);
      if(!live.length) return 100;
      const ok = S.escalations.filter(e=>{
        const it = S.inbox.find(x=>x.id===e.item);
        return it && it.live && e.partner === e.correctPartner && e.evidenceOpened;
      }).length;
      return 100 * Math.min(ok, live.length) / live.length;
    } }
];
const PRESETS = [];   /* declared for repo parity; unused — the four KPIs are fixed (spec §1) */


/* ---------- readiness checks — evaluation, not confirmation ---------- */
function readinessChecks(){
  const g = MONTH_CFG[S.month].grid;
  const c1 = !S.closeout.some(c=>{ const w=closeoutWalk(c); return g.some(i=>w[mk(i)].truncated); });
  const c3 = S.awosRefreshTs != null && S.awosRefreshTs > (S.lastShapeEdit||0);
  const c4 = S.storeDisaggTs != null && S.storeDisaggTs > (S.awosRefreshTs||0);
  const all = [...S.rebuy, ...S.closeout];
  const fin = all.filter(isFinalized);
  const mats = materialVariances();
  const documented = mats.filter(v=>(S.rationale[v.key]||"").trim().length > 0);
  return [
    { id:"plan", title:"PLAN COMPLETE", pass:(c1&&c3&&c4),
      desc:"Working Plan shapes reviewed and finalized for this lock cycle.",
      ev:[ (c3?"✓":"✗")+" aWOS Avg Demand Update ran after the last shaping edit",
           (c4?"✓":"✗")+" Store Disagg ran after the aWOS refresh",
           (c1?"✓":"✗")+" No measure left in an unresolved constrained state" ] },
    { id:"locks", title:"KEY STYLE COLORS LOCKED", pass: fin.every(r=>r.locked),
      desc:"Critical style color plans are complete and no longer changing.",
      ev: fin.length
          ? fin.map(r=>(r.locked?"✓ ":"✗ ")+(r.code||r.styleColor)+(r.locked?" locked":" finalized but UNLOCKED — exposed to disaggregation"))
              .concat([ (all.length-fin.length)+" items still being shaped" ])
          : ["No row is finalized yet — a row finalizes once every editable measure on it holds a value"] },
    { id:"rolling", title:"ROLLING PLAN RECONCILED", pass:null, na:true,
      desc:"CP / CF aligns to the Rolling Plan and the approved demand signal.",
      ev:["Not yet available — OQ-6 is open.",
          "No source supplies a Rolling Plan comparison value, and no variance threshold has been approved.",
          "This check is not evaluated and does not contribute to readiness."] },
    { id:"narr", title:"NARRATIVE DOCUMENTED", pass: mats.length ? documented.length===mats.length : true,
      desc:"Risks, opportunities, gaps and key changes are documented.",
      mats,
      ev:[ documented.length+" of "+mats.length+" material variances have a written rationale attached",
           "Material variance = ±"+MATERIAL_VARIANCE_PCT.toFixed(1)+"% WF vs CF",
           "Evaluated on attached rationale, not on a checkbox (ASSUM-5 — SME confirmation still open)" ] }
  ];
}

/* ==================================================================
   NEW-1 — MONTH ROLLOVER ENGINE. Deterministic, no randomness.
   ================================================================== */
function actualFactor(item){
  const material = item.signalFlag && item.signalFlag !== "none";
  const shaped = hasAnyOverride(item);
  if(material && shaped)  return 1.00;
  if(material && !shaped) return 0.92;
  if(!material && shaped) return 0.94;
  return 0.99;
}
function closeMonth(){
  const score = computeScore();
  const checks = readinessChecks();
  S.monthScores.push({ month:S.month, vals:score.vals, readiness:score.readiness,
    checks: checks.map(c=>({ title:c.title, pass:c.pass, na:!!c.na })) });
  recordLedger();

  const closing = mk(MONTH_CFG[S.month].cur);
  /* 1 — CF = WF */
  midlevels().forEach(ml=>{ if(MID_CF[ml]) MID_CF[ml][closing] = midWF(ml, closing); });
  /* 2 — actuals for the closing month */
  [...S.rebuy].forEach(r=>{
    const f = actualFactor(r);
    r.basis[closing] = Math.round(rebuyConstr(r, closing) * f);
    if(f !== 1.00 && ST_BASE[r.midlevel]) ST_BASE[r.midlevel].wf *= f;
  });
  S.closeout.forEach(c=>{
    const w = closeoutWalk(c)[closing];
    c.ovrd[closing] = w.constr;
  });
  /* 3 — unlocked rows with a planner-entered value take disaggregation drift on EVERY measure (VQ-8) */
  const DRIFT = 0.893;
  S.rebuy.forEach(r=>{
    if(r.locked || !hasAnyOverride(r)) return;
    MONTH_CFG[S.month].grid.forEach(i=>{
      const m = mk(i);
      if(r.ovrd[m]   != null) r.ovrd[m]   = Math.round(r.ovrd[m]*DRIFT);
      if(r.adjPct[m] != null) r.adjPct[m] = +(r.adjPct[m]*DRIFT).toFixed(1);
      if(r.degPct[m] != null) r.degPct[m] = +(r.degPct[m]*DRIFT).toFixed(1);
    });
    r.drifted = true;
  });
  S.closeout.forEach(c=>{
    if(c.locked) return;
    MONTH_CFG[S.month].grid.forEach(i=>{
      const m = mk(i);
      if(c.aur[m]        != null) c.aur[m]        = +(c.aur[m]*DRIFT).toFixed(2);
      if(c.auc[m]        != null) c.auc[m]        = +(c.auc[m]*DRIFT).toFixed(2);
      if(c.transferIn[m] != null) c.transferIn[m] = Math.round(c.transferIn[m]*DRIFT);
      if(c.ovrd[m]       != null) c.ovrd[m]       = Math.round(c.ovrd[m]*DRIFT);
    });
    c.drifted = true;
  });
  /* 4 — duplicate receipt inflates next month's opening position */
  S.rebuy.forEach(r=>{
    if(!r.duplicateReceipt) return;
    const nm = mk(MONTH_CFG[Math.min(3,S.month+1)].cur);
    const dup = Object.values(r.receiptOvrd).find(v=>v!=null) || 0;
    if(REBUY_EOP[r.midlevel] && REBUY_EOP[r.midlevel][nm] != null)
      REBUY_EOP[r.midlevel][nm] += dup;
    r.walkDiscrepancy = true;
  });
  /* 5 — refresh out of order → false variance carried into Prior Plan Review */
  S.falseVariance = (S.awosRefreshTs||0) < (S.lastShapeEdit||0);

  /* 6 — reset timestamps, advance */
  S.lastShapeEdit = null; S.awosRefreshTs = null; S.storeDisaggTs = null;
  S.rationale = {};
  if(S.month < 3){
    S.month += 1;
    S.inbox = clone(NVS_EXCEPTIONS[S.month]);
    S.escalations = [];
    S.monthEntry[S.month] = snapshotPlan();
    S.screen = "close";
  } else {
    S.screen = "results";
  }
  renderScreen();
}
function recordLedger(){
  const shaped = S.rebuy.filter(hasAnyOverride);
  const correctShapes = shaped.filter(r=>r.signalFlag!=="none").length;
  S.ledger.push({ id:"DEC-1", what:"Shaped "+shaped.length+" of "+S.rebuy.length+" style colors",
    out: correctShapes===shaped.length && shaped.length>0 ? "Correct — narrative defensible"
        : shaped.length===0 ? "Missed — material signals left unshaped"
        : "Partial — noise shaped alongside signal",
    ok: correctShapes===shaped.length && shaped.length>0,
    consumer:"Rolling Plan refresh" });
  const live = S.inbox.filter(i=>i.live);
  const routed = S.escalations.filter(e=>S.inbox.find(x=>x.id===e.item && x.live)).length;
  S.ledger.push({ id:"DEC-3", what:"Routed "+routed+" of "+live.length+" partner-owned recommendations",
    out: routed===live.length ? "Correct — no action outside ownership" : "Missed — recommendation left with no owner",
    ok: routed===live.length, consumer:"Merch / Allocation" });
  const seq = S.awosRefreshTs>(S.lastShapeEdit||0) && S.storeDisaggTs>(S.awosRefreshTs||0);
  S.ledger.push({ id:"DEC-4", what:"Shape → aWOS refresh → Store Disagg sequence",
    out: seq ? "Correct — sequence intact" : "Missed — stale aWOS carried into the lock",
    ok: seq, consumer:"Prior Plan Review · OTB Report" });
  const trunc = S.closeout.filter(c=>{ const w=closeoutWalk(c);
    return MONTH_CFG[S.month].grid.some(i=>w[mk(i)].truncated); });
  S.ledger.push({ id:"DEC-5", what:"Closeout inventory support",
    out: trunc.length===0 ? "Correct — nothing truncating" : "Partial — "+trunc.length+" placeholder(s) still capped",
    ok: trunc.length===0, consumer:"Enterprise Business Plan" });
  const finUnlocked = [...S.rebuy,...S.closeout].filter(r=>isFinalized(r) && !r.locked);
  S.ledger.push({ id:"DEC-7", what:"Locking finalized rows",
    out: finUnlocked.length===0 ? "Correct — deliberate decisions protected"
        : "Missed — "+finUnlocked.length+" finalized row(s) left unlocked",
    ok: finUnlocked.length===0, consumer:"Mid-level disaggregation" });
}

/* ==================================================================
   TRAINER RAIL — Mission Brief / Inbox / Readiness, always reachable
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
     <button class="btn" id="tbInbox">Priority Inbox${open?" · "+open:""}</button>
     <button class="btn dark" id="tbReady">Readiness Challenge</button>
     <button class="btn ghost" id="tbReset">Reset all</button>`;
  el.querySelector("#tbMission").onclick = ()=>{ S.screen="mission"; renderScreen(); };
  el.querySelector("#tbInbox").onclick   = ()=>{ S.side = S.side==="inbox" ? null : "inbox"; render(); };
  el.querySelector("#tbReady").onclick   = ()=>{
    if(!S.awosRefreshTs || S.awosRefreshTs < (S.lastShapeEdit||0)) fireHint("T-8");
    const finUnlocked = [...S.rebuy,...S.closeout].filter(r=>isFinalized(r) && !r.locked);
    if(finUnlocked.length) fireHint("T-12");
    S.screen="readiness"; renderScreen();
  };
  el.querySelector("#tbReset").onclick = ()=>{
    if(!confirm("Reset all?\n\nThis clears every override, lock, escalation and rationale across all three months and returns you to the Launch Screen. This cannot be undone.")) return;
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
  if(S.screen==="close")     return screenMonthClose();
  if(S.screen==="results")   return screenResults();
  if(S.screen==="reflect")   return screenReflection();
}
function backToWorkspace(){ S.screen=null; clearScreen(); render(); renderTrainerBar(); renderCoach(); }

/* ---------- REQ-1 Launch Screen (SHARED-1) ---------- */
function renderLaunch(){
  clearScreen();
  const d = screenEl("");
  d.innerHTML = `<div class="launch">
    <div class="l"><div class="kicker"></div>
      <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;color:var(--coach)">PLANNING TRAINER</div>
      <h1>NVS In-Season<br>Monthly Reforecast</h1>
      <p class="lede">Three monthly lock cycles. Two tracks — Rebuy SSP and Closeout Placeholders. One demand signal the enterprise plans against.</p>
      <div class="fact"><div class="k">ROLE</div><div class="v">NVS Planner — Geo Marketplace / MPU</div></div>
      <div class="fact"><div class="k">SCOPE</div><div class="v">Season 1 · M1 → M2 → M3</div></div>
      <div class="fact"><div class="k">PREREQUISITES</div><div class="v">3 NVS courses complete</div></div>
    </div>
    <div class="r">
      <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:var(--eyebrow)">MISSION BRIEF</div>
      <div class="brief" style="margin-top:12px">
        <p>You plan Nike Value Stores — factory and clearance. You own two tracks: the Rebuy SSP and the Closeout Placeholders. Over the next three monthly lock cycles, the business will move under you. Sell-through will run off plan. Transfer-in projections from other channels will shift. Assortment Actions will recommend things you don't own.</p>
        <p>Your job each month: read the signal, decide what actually needs to change, shape it with the right instrument, refresh aWOS, validate distribution, and get to four green readiness checks before Admin runs the lock.</p>
        <p>What you lock becomes the demand signal the enterprise plans against. Shape what the signal justifies — and be willing to conclude that no action is the right action.</p>
      </div>
      <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:var(--eyebrow);margin-top:26px">CHOOSE YOUR PATH</div>
      <div class="paths">
        <div class="path"><div class="top" style="background:var(--coach)"></div>
          <h3>GUIDED</h3>
          <p class="q">"I'll flag the signal, the trade-off and the consequence before you commit. You still make every call."</p>
          <p class="m">Proactive coaching · immediate consequence feedback · ~35–40 min</p>
          <button class="btn pri" data-mode="guided">Start Guided</button></div>
        <div class="path"><div class="top" style="background:var(--imp-ink)"></div>
          <h3>CHALLENGE</h3>
          <p class="q">"No prompting. I'll show you what your decisions did after you've made them."</p>
          <p class="m">Feedback after commit · reflection at outcome · retry · ~20–24 min</p>
          <button class="btn dark" data-mode="challenge">Start Challenge</button></div>
      </div>
      <div class="arc"><div class="on">M1 &nbsp;Read · shape · refresh · validate · lock</div>
        <div>M2 &nbsp;Consequences land · placeholders · lock</div>
        <div>M3 &nbsp;Tighten · defend · lock</div></div>
      <p style="font-size:10.5px;font-style:italic;color:var(--t-ink3);margin-top:20px">
        Trainer layer only — no plan data on this screen. Platform chrome does not appear until you enter Month 1.</p>
    </div></div>`;
  d.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>{
    newRun(b.dataset.mode);
    document.getElementById("app").classList.remove("hidden");
    clearScreen();
    if(S.mode==="guided" && S.month===1){ S.tourOpen = true; }
    else fireHint("T-1");
    render(); renderTrainerBar(); renderCoach();
  }));
}

/* ---------- Mission Brief, re-openable ---------- */
function screenMission(){
  const d = screenEl("dark");
  d.innerHTML = `<div class="wrapc">
    <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;color:var(--coach)">MISSION BRIEF · ${esc(S.mode.toUpperCase())} MODE</div>
    <h1 style="font-family:Georgia,serif;font-size:30px;margin:10px 0 20px">Three monthly lock cycles.</h1>
    <div style="max-width:760px;font-size:13px;line-height:1.7;color:#C9CDD2">
      <p>You plan Nike Value Stores — factory and clearance. You own two tracks: the Rebuy SSP and the Closeout Placeholders. Over the next three monthly lock cycles, the business will move under you.</p>
      <p>Your job each month: read the signal, decide what actually needs to change, shape it with the right instrument, refresh aWOS, validate distribution, and get to four green readiness checks before Admin runs the lock.</p>
    </div>
    <div class="arc" style="margin-top:26px">` +
    [1,2,3].map(m=>`<div class="${m===S.month?"on":""}">M${m} ${m<S.month?"· locked":m===S.month?"· current":"· ahead"}</div>`).join("") +
    `</div><button class="btn pri" style="margin-top:28px" id="mBack">Back to the workspace</button></div>`;
  d.querySelector("#mBack").onclick = backToWorkspace;
}

/* ---------- REQ-11 / SHARED-4 Readiness Challenge ---------- */
function screenReadiness(){
  const checks = readinessChecks();
  const d = screenEl("");
  const green = checks.filter(c=>!c.na).every(c=>c.pass);
  if(green) fireHint("T-14");
  let h = `<div class="wrapc">
    <div class="notice" style="background:var(--act-fill);color:var(--act-ink);font-weight:700">
      MONTH ${S.month} · WEEK 4 · PRE-LOCK — Planner owns readiness. Admin owns lock execution. You never click the lock.</div>
    <div class="checks">`;
  checks.forEach(c=>{
    const st = c.na ? ["NOT YET AVAILABLE","md-ink","md-fill"]
             : c.pass ? ["PASS","chase-ink","chase-fill"] : ["INCOMPLETE","cancel-ink","cancel-fill"];
    h += `<div class="check" style="border-left-color:var(--${st[1]})">
      <div class="hd"><h3>${esc(c.title)}</h3>
        <span class="pill" style="color:var(--${st[1]});background:var(--${st[2]})">${st[0]}</span></div>
      <div class="desc">${esc(c.desc)}</div>
      <ul>${c.ev.map(e=>`<li>${esc(e)}</li>`).join("")}</ul>`;
    if(c.id==="narr" && c.mats && c.mats.length){
      h += `<div class="sec-hdr t" style="margin-top:10px">ATTACH A RATIONALE PER MATERIAL VARIANCE</div>`;
      c.mats.forEach(v=>{
        h += `<div style="margin-top:8px"><div style="font-size:11px;font-weight:700">${esc(v.label)}${v.pct!=null?" — "+v.pct.toFixed(1)+"% vs CF":""}</div>
          <textarea class="rationale" data-rat="${esc(v.key)}"
            placeholder="Why did this move, and what did you do about it?">${esc(S.rationale[v.key]||"")}</textarea></div>`;
      });
    }
    h += `</div>`;
  });
  h += `</div>
    <div class="notice" style="background:var(--imp-fill);color:var(--imp-ink);margin-top:16px">
      <b style="display:block;font-size:9.5px;letter-spacing:.7px;margin-bottom:6px">EVERY CHECK IS COMPUTED FROM RESULTING PLAN STATE, NOT FROM CLICKS</b>
      Timestamps are compared, not confirmed. Locks are read off the rows. Narrative reads attached rationale per material variance — the one check at risk of being gameable if it shipped as a checkbox, and the reason ASSUM-5 is still open with the business reviewer.</div>
    <div style="display:flex;gap:12px;align-items:center;margin-top:18px">
      <button class="btn" id="rBack">Go back and finish a step</button>
      <button class="btn dark" id="rGo">Declare ready for lock</button>
      <span style="font-size:10.5px;font-style:italic;color:var(--t-ink3);max-width:420px">
        Declaring ready with an incomplete check is permitted — and scored. The simulation does not block you from locking a plan you cannot defend.</span>
    </div></div>`;
  d.innerHTML = h;
  d.querySelectorAll("[data-rat]").forEach(t=>t.addEventListener("input",()=>{
    S.rationale[t.dataset.rat] = t.value;
  }));
  d.querySelector("#rBack").onclick = backToWorkspace;
  d.querySelector("#rGo").onclick = ()=>{
    if(!confirm("Declare ready for lock?\n\nAdmin will execute the Monthly Lock. Your Working Forecast becomes the Current Forecast and leaves your hands. Month "+S.month+" closes and cannot be edited further.")) return;
    clearScreen(); closeMonth();
  };
}

/* ---------- REQ-16 Month Close ---------- */
function screenMonthClose(){
  const prev = S.month - 1;
  const d = screenEl("");
  const drifted = [...S.rebuy,...S.closeout].filter(r=>r.drifted);
  const dup = S.rebuy.filter(r=>r.walkDiscrepancy);
  let h = `<div class="dark" style="padding:36px 44px">
    <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;color:var(--coach)">MONTH ${prev} CLOSED</div>
    <h1 style="font-family:Georgia,serif;font-size:26px;margin:10px 0 12px">Admin has executed the Monthly Lock.</h1>
    <p style="max-width:760px;font-size:13px;color:#C9CDD2;line-height:1.65">
      Your Working Forecast is now the Current Forecast. It has left your hands — the Rolling Plan has refreshed against it, and Assortment Plan / Operating Plan reconciliation is running on your numbers.</p></div>
    <div class="wrapc"><div class="twocol">
      <div><div class="sec-hdr t">WHAT MONTH ${S.month} OPENS WITH</div>`;
  const opens = [];
  opens.push(["Actuals land against your locked CF","your shaping decisions are now the baseline you are measured on","imp-ink"]);
  if(drifted.length) opens.push([drifted.length+" unlocked row(s) arrived changed","mid-level disaggregation spread over assumptions you never locked","cancel-ink"]);
  if(dup.length) opens.push([dup.length+" inventory walk discrepancy","a receipt override duplicated an approved Assortment Action","cancel-ink"]);
  if(S.falseVariance) opens.push(["A variance that is not a real plan change","aWOS was never refreshed after your last shaping edit","cancel-ink"]);
  S.inbox.slice(0,2).forEach(i=>opens.push([i.title, i.body, "gm-ink"]));
  opens.forEach(o=>{ h += `<div class="evrow" style="border-left-color:var(--${o[2]})">
    <div class="t">${esc(o[0])}</div><div class="s">${esc(o[1])}</div></div>`; });
  h += `</div><div><div class="sec-hdr t">WHERE MONTH ${prev} WENT</div>`;
  [["Marketplace lock complete","CP and CF committed"],["Rolling Plan refreshes","inventory, receipts, sales"],
   ["AP / OP reconciliation","aligned to commitments"],["Global visibility","one version of the plan"],
   ["Sport evaluates upside","from a stable baseline"]].forEach((f,i)=>{
    h += `<div class="evrow" style="border-left-color:var(--${i===0?"act-ink":"none-ink"})">
      <div class="t">${esc(f[0])}</div><div class="s">${esc(f[1])}</div></div>`;
  });
  h += `</div></div>
    <div class="notice" style="background:var(--act-fill);color:var(--act-ink);margin-top:18px;font-weight:700">
      CONSEQUENCE CHAIN — Month ${S.month} opening state is computed from the state you locked, not from a fixed script. Over-shaping returns a correction gap. A skipped refresh returns a false variance. A double-entered receipt returns an inventory walk discrepancy. An unlocked deliberate value returns changed.</div>
    <div style="display:flex;gap:12px;margin-top:18px">
      <button class="btn" id="cRetry">Retry Month ${prev}</button>
      <button class="btn dark" id="cGo">Begin Month ${S.month} ›</button></div></div>`;
  d.innerHTML = h;
  d.querySelector("#cGo").onclick = ()=>{
    S.screen = null; clearScreen();
    if(S.month===2) fireHint("T-13", { postCommit:true, force:true });
    render(); renderTrainerBar(); renderCoach();
  };
  d.querySelector("#cRetry").onclick = ()=>retryMonth(prev);
}

/* ---------- REQ-15 retry ---------- */
function retryMonth(m){
  if(!confirm("Retry Month "+m+"?\n\nThis restores that month's entry state and discards every decision you made in it, plus any month after it. This cannot be undone.")) return;
  const snap = S.monthEntry[m];
  if(!snap){ alert("No entry snapshot exists for Month "+m+"."); return; }
  S.rebuy = clone(snap.rebuy); S.closeout = clone(snap.closeout);
  S.month = m; S.inbox = clone(NVS_EXCEPTIONS[m]);
  S.escalations = []; S.rationale = {};
  S.lastShapeEdit=null; S.awosRefreshTs=null; S.storeDisaggTs=null;
  S.monthScores = S.monthScores.filter(x=>x.month < m);
  S.ledger = [];
  S.screen = null; clearScreen();
  render(); renderTrainerBar(); renderCoach();
}

/* ---------- REQ-14 Results Dashboard (SHARED-7) ---------- */
/* This trainer's own Tier 1 celebration — see tier-media/ next to this file. */
const TIER_MEDIA = {
  1: "tier-media/tier-1.webp",
};
function getScoreBadge(readiness){
  const t = getScoreBadgeTier(readiness);
  /* Only the top tier gets the celebration media — this is a "you won" reward,
     not decoration shown on every run. */
  const img = isTopTier(t) ? tierMediaHTML(TIER_MEDIA[t.tier], t.tier) : "";
  return { img, tier:t };
}
function screenResults(){
  const per = S.monthScores;
  const avg = id => per.length ? per.reduce((s,p)=>s+p.vals[id],0)/per.length : 0;
  const readiness = per.length ? per.reduce((s,p)=>s+p.readiness,0)/per.length : 0;
  const badge = getScoreBadge(readiness);
  const d = screenEl("");
  let h = `<div style="display:grid;grid-template-columns:340px 1fr;min-height:100vh">
    <div class="dark" style="padding:44px 34px">
      <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;color:var(--coach)">RUN COMPLETE</div>
      <div style="font-size:15px;color:#C9CDD2;margin-top:10px">Readiness</div>
      <div class="bignum">${Math.round(readiness)}%</div>
      <div style="font-size:11.5px;color:var(--t-ink3);margin-top:8px">${esc(S.mode)} mode · ${per.length} of 3 months locked</div>
      ${badge.img}
      <div class="tierbadge">TIER ${badge.tier.tier} · ${esc(badge.tier.label)} · ${badge.tier.min}%+</div>
      <p style="font-size:10px;font-style:italic;color:var(--t-ink3);line-height:1.6;margin-top:12px">
        Tier thresholds and equal KPI weighting are ASSUM-4 — Architect-proposed, not SME-approved. They live in TIER_BANDS and KPI_WEIGHTS.</p>
    </div>
    <div style="padding:36px 40px">
      <div class="sec-hdr t">OUTCOME-BASED KPIs — COMPUTED FROM RESULTING PLAN STATE, AVERAGED ACROSS MONTHS</div>
      <div style="margin-top:12px">`;
  KPI_OPTIONS.forEach(k=>{
    const v = avg(k.id);
    const ink = v>=90?"chase-ink":v>=80?"imp-ink":v>=60?"md-ink":"cancel-ink";
    h += `<div class="kpi" style="border-left-color:var(--${ink})">
      <div class="l"><div class="id">${esc(k.id)}</div><h3>${esc(k.name)}</h3><div class="d">${esc(k.desc)}</div></div>
      <div class="r"><div class="bar"><i style="width:${Math.max(0,Math.min(100,v))}%;background:var(--${ink})"></i></div>
        <div class="pc" style="color:var(--${ink})">${Math.round(v)}%</div>
        <div class="mm">${per.map(p=>"M"+p.month+" "+Math.round(p.vals[k.id])+"%").join("  ")}</div></div></div>`;
  });
  h += `</div><div class="sec-hdr t" style="margin-top:18px">READINESS AT EACH LOCK · DECISION LEDGER</div>
    <div style="display:flex;gap:10px;margin:12px 0 16px">` +
    per.map(p=>{
      const ev = p.checks.filter(c=>!c.na);
      const pass = ev.filter(c=>c.pass).length;
      const good = pass===ev.length;
      return `<div style="width:120px;padding:9px;text-align:center;background:var(--${good?"chase-fill":"md-fill"});
        color:var(--${good?"chase-ink":"md-ink"})"><div style="font-size:10px;font-weight:700">M${p.month}</div>
        <div style="font-family:var(--num);font-size:17px;font-weight:700">${pass} / ${ev.length}</div></div>`;
    }).join("") +
    `<div style="flex:1;font-size:10px;font-style:italic;color:var(--t-ink3);display:flex;align-items:center">
       Rolling Plan Reconciled is excluded — OQ-6 remains open, so it is not evaluated.</div></div>`;
  S.ledger.forEach(l=>{
    const ink = l.ok ? "chase-ink" : (String(l.out).startsWith("Partial") ? "md-ink" : "cancel-ink");
    h += `<div class="ledger" style="border-left-color:var(--${ink})">
      <div class="id">${esc(l.id)}</div><div class="w">${esc(l.what)}<br>
      <span style="color:var(--t-ink3);font-size:9.5px">downstream: ${esc(l.consumer)}</span></div>
      <div class="o" style="color:var(--${ink})">${esc(l.out)}</div></div>`;
  });
  h += `<div style="display:flex;gap:12px;margin-top:20px">
      <button class="btn" id="resRetry">Retry a month</button>
      <button class="btn dark" id="resGo">Continue to reflection ›</button></div></div></div>`;
  d.innerHTML = h;
  d.querySelector("#resGo").onclick = ()=>{ S.screen="reflect"; renderScreen(); };
  d.querySelector("#resRetry").onclick = ()=>{
    const m = prompt("Retry which month? Enter 1, 2 or 3.");
    const n = Number(m); if(![1,2,3].includes(n)) return;
    retryMonth(n);
  };
}

/* ---------- Reflection ---------- */
function screenReflection(){
  const d = screenEl("dark");
  d.innerHTML = `<div class="wrapc">
    <div class="kicker"></div>
    <h1 style="font-family:Georgia,serif;font-size:32px;margin:14px 0 18px">Three months, one plan.</h1>
    <p style="font-size:14px;color:#C9CDD2;line-height:1.7;max-width:900px">
      The instinct in-season is to react — a number moves, you shape it. What you practiced here is the harder version: reading the signal, finding the cause, and being willing to conclude that no action is the right action.</p>
    <div class="principles">
      <div class="principle"><div class="top"></div><div class="n">01</div>
        <h3>Know the boundary of your ownership</h3>
        <p>You influence markdowns and cancels. You do not execute them. Your leverage is the evidence you bring the partner who does — Merch, Allocation, Geo Sport, Admin.</p></div>
      <div class="principle"><div class="top"></div><div class="n">02</div>
        <h3>Protect deliberate decisions by locking them</h3>
        <p>Anything unlocked is available to be overwritten by someone planning at a higher level. Locking is not caution — it is how a decision survives contact with mid-level disaggregation.</p></div>
      <div class="principle"><div class="top"></div><div class="n">03</div>
        <h3>Never present numbers from a session where you skipped the refresh</h3>
        <p>Shape, refresh, validate, then review. A stale aWOS does not just look wrong — it manufactures variances that were never real plan changes.</p></div>
    </div>
    <div style="background:var(--coach);color:#fff;font-size:14px;font-weight:700;padding:16px 20px;max-width:1000px">
      What you locked each month is what the enterprise planned against. That's the whole reason the sequence matters.</div>
    <p style="font-size:11px;color:var(--t-ink3);margin-top:14px">
      Rolling Plan refresh &nbsp;·&nbsp; Assortment Plan / Operating Plan reconciliation &nbsp;·&nbsp; Enterprise Business Plan &nbsp;·&nbsp; Geo Sport upside evaluation from a stable baseline</p>
    <button class="btn" style="margin-top:26px;background:#fff;color:var(--t-ink);font-weight:700" id="again">Run it again</button>
  </div>`;
  d.querySelector("#again").onclick = ()=>{
    if(!confirm("Run it again?\n\nThis clears all three months and returns you to the Launch Screen. This cannot be undone.")) return;
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
