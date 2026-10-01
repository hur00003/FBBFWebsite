# o9 Planning Trainers — standing process notes

Web-based training simulators mimicking the o9 Solutions platform. Shared
engine (`engine/o9-shell.css`, `engine/o9-shell.js`) + per-trainer content
(`trainers/<slug>/content.js`) — see `engine/o9-shell.js`'s header comment
for the full engine/content contract.

## Before starting a new trainer

Prompt the user for:
1. Context/knowledge material for that trainer (course doc, reference
   `.html`, etc.).
2. A unique Tier 1 celebration image for that specific trainer — each
   trainer gets its own, never shared across trainers.

## Before building a new shared component ("LEGO piece")

If the user points at a screenshot or reference `.html` and asks for a
new shared engine component, and the exact behavior, data shape, or
rollout scope (engine-only vs. retrofit existing trainers; full-featured
vs. shell-first) isn't clear from what they've given — **ask before
building**, rather than guessing and building something that has to be
reworked. Once confirmed, build it the same way the existing pieces are
built: generic in `o9-shell.js`/`o9-shell.css` given content-supplied
data, documented in that file's header comment, demoed in
`trainers/_template/content.js`.
