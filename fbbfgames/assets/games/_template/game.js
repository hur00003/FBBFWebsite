/*
 * __TITLE__
 * TODO: replace the demo below with the real game. Everything you need is
 * handed to you by the engine (see ../engine/engine.js) — you only implement
 * onInit / onUpdate / onDraw.
 */
(function () {
	"use strict";

	// Demo state — delete once the real game replaces it.
	let x = 0;

	FBBFGame.start({
		slug: "__SLUG__",
		title: "__TITLE__",
		instructions: "TODO: one or two lines on how to play.",

		onInit: function (api) {
			// Runs once per "Play" click, before the loop starts.
			x = api.width / 2;
		},

		onUpdate: function (dt, input, api) {
			// Runs every frame. `input.keys` is a Set of held key names,
			// `input.pointerDown` / pointerX / pointerY track mouse & touch.
			if (input.keys.has("ArrowRight")) x += 200 * dt;
			if (input.keys.has("ArrowLeft")) x -= 200 * dt;
			x = Math.max(0, Math.min(api.width, x));

			// input.taps queues discrete clicks/touches (use input.pointerDown
			// / pointerX / pointerY instead for continuous drag-style input).
			if (input.taps.length) {
				api.addScore(input.taps.length);
				input.taps.length = 0;
			}
		},

		onDraw: function (ctx, api) {
			ctx.clearRect(0, 0, api.width, api.height);
			ctx.fillStyle = "#ff5a1f";
			ctx.beginPath();
			ctx.arc(x, api.height / 2, 24, 0, Math.PI * 2);
			ctx.fill();
		},
	});
})();
