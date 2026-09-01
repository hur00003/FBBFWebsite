(function () {
	"use strict";

	let x = 0;

	FBBFGame.start({
		slug: "__SLUG__",
		title: "__TITLE__",
		instructions: "TODO: one or two lines on how to play.",

		onInit: function (api) {
			x = api.width / 2;
		},

		onUpdate: function (dt, input, api) {
			if (input.keys.has("ArrowRight")) x += 200 * dt;
			if (input.keys.has("ArrowLeft")) x -= 200 * dt;
			x = Math.max(0, Math.min(api.width, x));

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
