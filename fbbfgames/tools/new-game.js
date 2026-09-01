#!/usr/bin/env node
/*
 * Scaffold a new mini-game from assets/games/_template.
 *
 * Usage: node tools/new-game.js "Blowfish Pop"
 */
"use strict";

const fs = require("fs");
const path = require("path");

const GAMES_DIR = path.join(__dirname, "..", "assets", "games");
const TEMPLATE_DIR = path.join(GAMES_DIR, "_template");
const MANIFEST_PATH = path.join(GAMES_DIR, "games.json");

function slugify(title) {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function copyTemplate(destDir, slug, title) {
	fs.mkdirSync(destDir, { recursive: true });
	for (const name of fs.readdirSync(TEMPLATE_DIR)) {
		const contents = fs
			.readFileSync(path.join(TEMPLATE_DIR, name), "utf8")
			.replace(/__SLUG__/g, slug)
			.replace(/__TITLE__/g, title);
		fs.writeFileSync(path.join(destDir, name), contents);
	}
}

function updateManifest(slug, title) {
	const manifest = fs.existsSync(MANIFEST_PATH)
		? JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"))
		: [];
	if (manifest.some((g) => g.slug === slug)) return manifest;
	manifest.push({ slug, title, description: "TODO: one-line description for the games grid." });
	fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, "\t") + "\n");
	return manifest;
}

function main() {
	const title = process.argv.slice(2).join(" ").trim();
	if (!title) {
		console.error('Usage: node tools/new-game.js "Game Title"');
		process.exit(1);
	}

	const slug = slugify(title);
	const destDir = path.join(GAMES_DIR, slug);

	if (fs.existsSync(destDir)) {
		console.error(`assets/games/${slug} already exists.`);
		process.exit(1);
	}

	copyTemplate(destDir, slug, title);
	updateManifest(slug, title);

	console.log(`Created assets/games/${slug}/`);
	console.log(`Registered "${title}" in assets/games/games.json`);
	console.log(`Next: implement onInit/onUpdate/onDraw in assets/games/${slug}/game.js`);
}

main();
