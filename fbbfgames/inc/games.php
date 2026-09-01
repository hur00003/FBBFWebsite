<?php
/**
 * Mini-games: reads assets/games/games.json and exposes the registered
 * games via a [fbbf_game] shortcode and a grid renderer. New games are
 * scaffolded with tools/new-game.js, which keeps games.json in sync.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * All registered games, as read from assets/games/games.json.
 * Each entry: ['slug' => ..., 'title' => ..., 'description' => ...].
 */
function fbbf_get_games() {
	static $games = null;
	if ( null !== $games ) return $games;
	$path  = get_theme_file_path( 'assets/games/games.json' );
	$games = file_exists( $path ) ? json_decode( file_get_contents( $path ), true ) : array();
	return is_array( $games ) ? $games : array();
}

/**
 * [fbbf_game slug="blowfish-pop"] — embeds one game as a responsive,
 * sandboxed iframe. Unknown slugs render nothing rather than a broken embed.
 */
function fbbf_game_shortcode( $atts ) {
	$atts  = shortcode_atts( array( 'slug' => '', 'height' => '520' ), $atts, 'fbbf_game' );
	$slugs = wp_list_pluck( fbbf_get_games(), 'slug' );
	if ( ! in_array( $atts['slug'], $slugs, true ) ) return '';

	return sprintf(
		'<div style="max-width:720px;margin:0 auto;border-radius:12px;overflow:hidden;"><iframe src="%s" style="display:block;width:100%%;height:%dpx;border:0;" loading="lazy" sandbox="allow-scripts allow-same-origin" title="%s"></iframe></div>',
		esc_url( fbbf_asset( 'games/' . $atts['slug'] . '/index.html' ) ),
		absint( $atts['height'] ),
		esc_attr( $atts['slug'] )
	);
}
add_shortcode( 'fbbf_game', 'fbbf_game_shortcode' );

/**
 * Card grid linking to every registered game, for a games archive page.
 */
function fbbf_games_grid() {
	$games = fbbf_get_games();
	if ( ! $games ) return;
	echo '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1.5rem;">';
	foreach ( $games as $game ) {
		printf(
			'<a href="%s" style="display:block;padding:1.25rem;border-radius:12px;background:#17181c;color:#f4ede1;text-decoration:none;">
				<strong style="display:block;margin-bottom:0.4rem;">%s</strong>
				<span style="opacity:0.7;font-size:0.9rem;">%s</span>
			</a>',
			esc_url( fbbf_asset( 'games/' . $game['slug'] . '/index.html' ) ),
			esc_html( $game['title'] ),
			esc_html( $game['description'] )
		);
	}
	echo '</div>';
}
