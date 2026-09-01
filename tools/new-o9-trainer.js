#!/usr/bin/env node
/*
 * Scaffold a new o9 Planning Trainer from assets/o9-trainer/trainers/_template.
 *
 * Usage: node tools/new-o9-trainer.js "Demand Planning Escalations"
 *
 * The template is a minimal skeleton, not a finished trainer — see the
 * TODOs it leaves in content.js. Fill in real seed data, formulas, grids,
 * tour steps, coach hints, exceptions and KPI definitions for the new
 * scenario before it's usable. For patterns the template doesn't include
 * (row locking, the priority-cascade panel, explainability, a multi-period
 * rollover engine), copy them from trainers/nvs-reforecast/content.js.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const TRAINER_DIR = path.join(__dirname, "..", "assets", "o9-trainer");
const TEMPLATE_DIR = path.join(TRAINER_DIR, "trainers", "_template");
const MANIFEST_PATH = path.join(TRAINER_DIR, "trainers.json");

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
			.replace(/__TITLE__/g, title);
		fs.writeFileSync(path.join(destDir, name), contents);
	}
}

function updateManifest(slug, title) {
	const manifest = fs.existsSync(MANIFEST_PATH)
		? JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"))
		: [];
	if (manifest.some((t) => t.slug === slug)) return manifest;
	manifest.push({ slug, title, description: "TODO: one-line description for the trainer catalog." });
	fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, "\t") + "\n");
	return manifest;
}

function main() {
	const title = process.argv.slice(2).join(" ").trim();
	if (!title) {
		console.error('Usage: node tools/new-o9-trainer.js "Trainer Title"');
		process.exit(1);
	}

	const slug = slugify(title);
	const destDir = path.join(TRAINER_DIR, "trainers", slug);

	if (fs.existsSync(destDir)) {
		console.error(`assets/o9-trainer/trainers/${slug} already exists.`);
		process.exit(1);
	}

	copyTemplate(destDir, slug, title);
	updateManifest(slug, title);

	console.log(`Created assets/o9-trainer/trainers/${slug}/`);
	console.log(`Registered "${title}" in assets/o9-trainer/trainers.json`);
	console.log(`Next: fill in the TODOs in assets/o9-trainer/trainers/${slug}/content.js`);
}

main();
