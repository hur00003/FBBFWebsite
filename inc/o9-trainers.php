<?php
/**
 * o9 Planning Trainers: reads assets/o9-trainer/trainers.json and exposes
 * the registered trainers via an [fbbf_o9_trainer] shortcode and a grid
 * renderer. New trainers are scaffolded with tools/new-o9-trainer.js, which
 * keeps trainers.json in sync.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * All registered o9 trainers, as read from assets/o9-trainer/trainers.json.
 * Each entry: ['slug' => ..., 'title' => ..., 'description' => ...].
 */
function fbbf_get_o9_trainers() {
	static $trainers = null;
	if ( null !== $trainers ) return $trainers;
	$path     = get_theme_file_path( 'assets/o9-trainer/trainers.json' );
	$trainers = file_exists( $path ) ? json_decode( file_get_contents( $path ), true ) : array();
	return is_array( $trainers ) ? $trainers : array();
}

/**
 * [fbbf_o9_trainer slug="nvs-reforecast"] — embeds one trainer as a
 * responsive, sandboxed iframe. Unknown slugs render nothing.
 */
function fbbf_o9_trainer_shortcode( $atts ) {
	$atts  = shortcode_atts( array( 'slug' => '', 'height' => '760' ), $atts, 'fbbf_o9_trainer' );
	$slugs = wp_list_pluck( fbbf_get_o9_trainers(), 'slug' );
	if ( ! in_array( $atts['slug'], $slugs, true ) ) return '';

	return sprintf(
		'<div style="max-width:1180px;margin:0 auto;border-radius:12px;overflow:hidden;"><iframe src="%s" style="display:block;width:100%%;height:%dpx;border:0;" loading="lazy" sandbox="allow-scripts allow-same-origin" title="%s"></iframe></div>',
		esc_url( fbbf_asset( 'o9-trainer/trainers/' . $atts['slug'] . '/index.html' ) ),
		absint( $atts['height'] ),
		esc_attr( $atts['slug'] )
	);
}
add_shortcode( 'fbbf_o9_trainer', 'fbbf_o9_trainer_shortcode' );

/**
 * Card grid linking to every registered trainer, for a trainer catalog page.
 */
function fbbf_o9_trainers_grid() {
	$trainers = fbbf_get_o9_trainers();
	if ( ! $trainers ) return;
	echo '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.5rem;">';
	foreach ( $trainers as $t ) {
		printf(
			'<a href="%s" style="display:block;padding:1.25rem;border-radius:12px;background:#17181c;color:#f4ede1;text-decoration:none;">
				<strong style="display:block;margin-bottom:0.4rem;">%s</strong>
				<span style="opacity:0.7;font-size:0.9rem;">%s</span>
			</a>',
			esc_url( fbbf_asset( 'o9-trainer/trainers/' . $t['slug'] . '/index.html' ) ),
			esc_html( $t['title'] ),
			esc_html( $t['description'] )
		);
	}
	echo '</div>';
}
