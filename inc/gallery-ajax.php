<?php
/**
 * "Load more photos" for the Gallery page's tabs — fetches the next batch
 * of tiles for one tab and appends them client-side (assets/js/gallery.js).
 */

if ( ! defined( 'ABSPATH' ) ) exit;

function fbbf_gallery_load_more_step() {
	return 9;
}

function fbbf_handle_load_gallery_tab() {
	check_ajax_referer( 'fbbf_forms', 'nonce' );

	$tab    = isset( $_POST['tab'] ) ? sanitize_title( wp_unslash( $_POST['tab'] ) ) : '';
	$offset = isset( $_POST['offset'] ) ? max( 0, (int) $_POST['offset'] ) : 0;

	if ( '' === $tab ) {
		wp_send_json_error( array( 'message' => 'Missing tab.' ), 400 );
	}

	$step  = fbbf_gallery_load_more_step();
	$tiles = fbbf_get_gallery_tab_photos( $tab, $step, $offset );

	ob_start();
	foreach ( $tiles as $tile ) {
		fbbf_render_gallery_tile( $tile );
	}
	$html = ob_get_clean();

	$total    = fbbf_count_gallery_tab_photos( $tab );
	$has_more = ( $offset + count( $tiles ) ) < $total;

	wp_send_json_success( array(
		'html'    => $html,
		'count'   => count( $tiles ),
		'hasMore' => $has_more,
	) );
}
add_action( 'wp_ajax_fbbf_load_gallery_tab', 'fbbf_handle_load_gallery_tab' );
add_action( 'wp_ajax_nopriv_fbbf_load_gallery_tab', 'fbbf_handle_load_gallery_tab' );
