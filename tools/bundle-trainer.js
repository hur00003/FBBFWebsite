#!/usr/bin/env node
/*
 * Bundle an o9 trainer's engine + content into one standalone .html file —
 * everything inlined, so it can be double-clicked or emailed with nothing
 * else alongside it. The split source under assets/o9-trainer/ stays the
 * real thing to edit; this is a distribution artifact generated from it.
 *
 * Usage:
 *   node tools/bundle-trainer.js nvs-reforecast
 *   node tools/bundle-trainer.js --all
 *
 * Output: assets/o9-trainer/dist/<slug>.html
 */
"use strict";

const fs = require("fs");
const path = require("path");

const TRAINER_DIR = path.join(__dirname, "..", "assets", "o9-trainer");
const ENGINE_CSS = path.join(TRAINER_DIR, "engine", "o9-shell.css");
const ENGINE_JS = path.join(TRAINER_DIR, "engine", "o9-shell.js");
const MANIFEST_PATH = path.join(TRAINER_DIR, "trainers.json");
const DIST_DIR = path.join(TRAINER_DIR, "dist");

function titleFromIndexHtml(indexHtmlPath, fallback) {
	const html = fs.readFileSync(indexHtmlPath, "utf8");
	const m = html.match(/<title>(.*?)<\/title>/s);
	return m ? m[1] : fallback;
}

function bundle(slug, title) {
	const trainerDir = path.join(TRAINER_DIR, "trainers", slug);
	const indexHtmlPath = path.join(trainerDir, "index.html");
	const contentJsPath = path.join(trainerDir, "content.js");

	if (!fs.existsSync(contentJsPath)) {
		console.error(`No content.js found for "${slug}" at ${contentJsPath}`);
		process.exit(1);
	}

	const css = fs.readFileSync(ENGINE_CSS, "utf8");
	const engineJs = fs.readFileSync(ENGINE_JS, "utf8");
	const contentJs = fs.readFileSync(contentJsPath, "utf8");
	const resolvedTitle = fs.existsSync(indexHtmlPath) ? titleFromIndexHtml(indexHtmlPath, title) : title;

	for (const [name, src] of [["engine.js", engineJs], ["content.js", contentJs]]) {
		if (src.includes("</script")) {
			console.error(`${name} for "${slug}" contains a literal "</script" — inlining it would break the bundle. Fix the source first.`);
			process.exit(1);
		}
	}

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${resolvedTitle}</title>
<style>
${css}
</style>
</head>
<body>
<div id="live" class="sr-only" aria-live="polite"></div>
<div id="app" class="hidden"></div>
<script>
${engineJs}
</script>
<script>
${contentJs}
</script>
</body>
</html>
`;

	fs.mkdirSync(DIST_DIR, { recursive: true });
	const outPath = path.join(DIST_DIR, `${slug}.html`);
	fs.writeFileSync(outPath, html);
	console.log(`Bundled assets/o9-trainer/dist/${slug}.html (${(html.length / 1024).toFixed(0)} KB)`);
}

function main() {
	const arg = process.argv[2];
	if (!arg) {
		console.error("Usage: node tools/bundle-trainer.js <slug> | --all");
		process.exit(1);
	}

	const manifest = fs.existsSync(MANIFEST_PATH) ? JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) : [];

	if (arg === "--all") {
		if (!manifest.length) {
			console.error("No trainers registered in assets/o9-trainer/trainers.json.");
			process.exit(1);
		}
		manifest.forEach((t) => bundle(t.slug, t.title));
		return;
	}

	const entry = manifest.find((t) => t.slug === arg);
	if (!entry) {
		console.error(`"${arg}" isn't registered in assets/o9-trainer/trainers.json. Registered slugs: ${manifest.map((t) => t.slug).join(", ") || "(none)"}`);
		process.exit(1);
	}
	bundle(entry.slug, entry.title);
}

main();
