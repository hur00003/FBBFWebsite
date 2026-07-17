<?php
/**
 * Small shared helpers used across templates.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Print an outlined wordmark/heading graphic from assets/images/wordmarks/.
 */
function fbbf_wordmark( $slug, $alt, $style = '' ) {
	$default = 'display:block;height:clamp(30px,4.5vw,46px);width:auto;max-width:100%;';
	printf(
		'<img src="%s" alt="%s" style="%s" loading="lazy" />',
		esc_url( fbbf_asset( "images/wordmarks/word-$slug.svg" ) ),
		esc_attr( $alt ),
		esc_attr( $style ? $style : $default )
	);
}

/**
 * Badge label + tone class for a race result.
 * Returns ['label' => string, 'class' => string].
 */
function fbbf_race_badge( $result ) {
	switch ( $result ) {
		case 'gold':
			return array( 'label' => '🥇 Gold', 'class' => 'badge--gold' );
		case 'silver':
			return array( 'label' => '🥈 Silver', 'class' => 'badge--silver' );
		case 'bronze':
			return array( 'label' => '🥉 Bronze', 'class' => 'badge--bronze' );
		default:
			return array( 'label' => 'upcoming', 'class' => 'badge--upcoming' );
	}
}

/**
 * Format a race date range for display: returns ['day' => '13', 'month' => 'Jun']
 * or, for a multi-day race, ['day' => '12–13', 'month' => 'Sep'].
 */
function fbbf_race_day_month( $start, $end = '' ) {
	if ( ! $start ) return array( 'day' => '', 'month' => '' );
	$start_ts = strtotime( $start );
	$month    = date_i18n( 'M', $start_ts );
	$day      = date_i18n( 'j', $start_ts );
	if ( $end ) {
		$end_ts  = strtotime( $end );
		$end_day = date_i18n( 'j', $end_ts );
		if ( $end_day !== $day ) {
			$day .= '–' . $end_day;
		}
	}
	return array( 'day' => $day, 'month' => $month );
}

/**
 * Render a share button that fires the Web Share API (progressive enhancement,
 * see assets/js/main.js). $title/$text seed the native share sheet.
 */
function fbbf_share_button( $title, $text ) {
	printf(
		'<button type="button" class="share-btn" aria-label="Share" data-share-title="%s" data-share-text="%s">%s</button>',
		esc_attr( $title ),
		esc_attr( $text ),
		'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="18" cy="5" r="2.6" stroke="currentColor" stroke-width="1.8"/><circle cx="6" cy="12" r="2.6" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="19" r="2.6" stroke="currentColor" stroke-width="1.8"/><line x1="8.3" y1="10.7" x2="15.7" y2="6.3" stroke="currentColor" stroke-width="1.8"/><line x1="8.3" y1="13.3" x2="15.7" y2="17.7" stroke="currentColor" stroke-width="1.8"/></svg>'
	);
}

/**
 * The site's shared nav items, used by both header.php and footer.php.
 */
function fbbf_nav_items() {
	return array(
		'home'     => array( 'label' => 'Home', 'url' => home_url( '/' ) ),
		'about'    => array( 'label' => 'About', 'url' => home_url( '/about/' ) ),
		'races'    => array( 'label' => 'Races', 'url' => home_url( '/races/' ) ),
		'gallery'  => array( 'label' => 'Gallery', 'url' => home_url( '/gallery/' ) ),
		'merch'    => array( 'label' => 'Merch', 'url' => home_url( '/merch/' ) ),
		'sponsors' => array( 'label' => 'Sponsors', 'url' => home_url( '/sponsors/' ) ),
	);
}

/**
 * Is $slug (home|about|races|gallery|merch|sponsors) the current page,
 * based on the page template / front page rather than string-matching
 * titles, so it keeps working if the client renames a page.
 */
function fbbf_is_current_nav( $slug ) {
	if ( 'home' === $slug ) return is_front_page();
	if ( 'merch' === $slug ) return function_exists( 'is_shop' ) && is_shop();
	$template_map = array(
		'about'    => 'page-about.php',
		'races'    => 'page-races.php',
		'gallery'  => 'page-gallery.php',
		'sponsors' => 'page-sponsors.php',
	);
	return isset( $template_map[ $slug ] ) && is_page_template( $template_map[ $slug ] );
}
