(function () {
	"use strict";

	function start(config) {
		const {
			slug,
			title = "Game",
			instructions = "",
			onInit = function () {},
			onUpdate = function () {},
			onDraw = function () {},
		} = config;

		const root = document.querySelector(".fbbf-game-frame");
		const canvas = root.querySelector("canvas");
		const ctx = canvas.getContext("2d");
		const scoreEl = root.querySelector(".fbbf-game-score");
		const bestEl = root.querySelector(".fbbf-game-best");
		const startOverlay = root.querySelector(".fbbf-game-overlay--start");
		const endOverlay = root.querySelector(".fbbf-game-overlay--end");

		const storageKey = "fbbf-game-highscore-" + slug;
		let best = Number(localStorage.getItem(storageKey)) || 0;

		let width = 0;
		let height = 0;
		let score = 0;
		let running = false;
		let lastTime = 0;
		let rafId = null;

		const input = {
			keys: new Set(),
			pointerDown: false,
			pointerX: 0,
			pointerY: 0,
			taps: [],
		};

		const api = {
			get width() { return width; },
			get height() { return height; },
			get score() { return score; },
			get best() { return best; },
			input,
			setScore(n) {
				score = n;
				scoreEl.textContent = String(score);
			},
			addScore(n) {
				api.setScore(score + n);
			},
			endGame() {
				stop();
				if (score > best) {
					best = score;
					localStorage.setItem(storageKey, String(best));
				}
				bestEl.textContent = String(best);
				endOverlay.querySelector(".fbbf-game-final-score").textContent = String(score);
				endOverlay.hidden = false;
			},
		};

		function resize() {
			const rect = root.querySelector(".fbbf-game-stage").getBoundingClientRect();
			const dpr = window.devicePixelRatio || 1;
			width = rect.width;
			height = rect.height;
			canvas.width = Math.round(width * dpr);
			canvas.height = Math.round(height * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		}

		function loop(time) {
			if (!running) return;
			const dt = Math.min((time - lastTime) / 1000, 1 / 15);
			lastTime = time;
			onUpdate(dt, input, api);
			onDraw(ctx, api);
			rafId = requestAnimationFrame(loop);
		}

		function stop() {
			running = false;
			if (rafId) cancelAnimationFrame(rafId);
		}

		function play() {
			startOverlay.hidden = true;
			endOverlay.hidden = true;
			resize();
			api.setScore(0);
			bestEl.textContent = String(best);
			onInit(api);
			running = true;
			lastTime = performance.now();
			rafId = requestAnimationFrame(loop);
		}

		root.querySelector(".fbbf-game-overlay--start h1").textContent = title;
		root.querySelector(".fbbf-game-overlay--start p").textContent = instructions;
		root.querySelectorAll("[data-fbbf-play]").forEach(function (btn) {
			btn.addEventListener("click", play);
		});

		window.addEventListener("resize", function () {
			if (running) resize();
		});
		document.addEventListener("visibilitychange", function () {
			if (document.hidden) running = false;
		});

		window.addEventListener("keydown", function (e) { input.keys.add(e.key); });
		window.addEventListener("keyup", function (e) { input.keys.delete(e.key); });

		canvas.addEventListener("pointerdown", function (e) {
			input.pointerDown = true;
			updatePointer(e);
			input.taps.push({ x: input.pointerX, y: input.pointerY });
		});
		window.addEventListener("pointerup", function () { input.pointerDown = false; });
		canvas.addEventListener("pointermove", updatePointer);

		function updatePointer(e) {
			const rect = canvas.getBoundingClientRect();
			input.pointerX = e.clientX - rect.left;
			input.pointerY = e.clientY - rect.top;
		}

		resize();
	}

	window.FBBFGame = { start: start };
})();
