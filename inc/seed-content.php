<?php
/**
 * One-time seeding of real launch content (races, sponsors, costume-parade
 * years, gallery photos) so the site matches the design handoff on first
 * activation instead of sitting empty. Runs once (guarded by the
 * fbbf_content_seeded option) from functions.php's after_switch_theme hook.
 * Everything it creates is a normal post the client can edit or delete
 * afterward like anything else in wp-admin. Merch products are real
 * WooCommerce products synced from Printful, not seeded here.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

function fbbf_attach_local_image( $abs_path, $filename, $desc = '', $alt = '' ) {
	if ( ! file_exists( $abs_path ) ) return false;
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';

	$contents = file_get_contents( $abs_path );
	$upload   = wp_upload_bits( $filename, null, $contents );
	if ( ! empty( $upload['error'] ) ) return false;

	$filetype = wp_check_filetype( $upload['file'], null );
	$attach_id = wp_insert_attachment( array(
		'post_mime_type' => $filetype['type'],
		'post_title'     => $desc ? $desc : sanitize_file_name( $filename ),
		'post_status'    => 'inherit',
	), $upload['file'] );

	if ( ! $attach_id ) return false;

	$attach_data = wp_generate_attachment_metadata( $attach_id, $upload['file'] );
	wp_update_attachment_metadata( $attach_id, $attach_data );
	if ( $alt ) update_post_meta( $attach_id, '_wp_attachment_image_alt', $alt );

	return $attach_id;
}

function fbbf_seed_content() {
	if ( get_option( 'fbbf_content_seeded' ) ) return;

	$dir = get_template_directory();

	// ---- Races -------------------------------------------------------
	$races = array(
		array( 'name' => 'Seattle Race', 'date' => '2026-06-13', 'date_end' => '', 'location' => 'Lake Union · Seattle, WA', 'result' => 'silver' ),
		array( 'name' => 'World Beat Festival', 'date' => '2026-06-27', 'date_end' => '', 'location' => 'Salem, OR', 'result' => 'silver' ),
		array( 'name' => 'Olympia Race', 'date' => '2026-07-11', 'date_end' => '', 'location' => 'Olympia, WA', 'result' => '' ),
		array( 'name' => 'Portland Race', 'date' => '2026-09-12', 'date_end' => '2026-09-13', 'location' => 'Portland, OR', 'result' => '' ),
	);
	foreach ( $races as $r ) {
		$id = wp_insert_post( array( 'post_type' => 'fbbf_race', 'post_title' => $r['name'], 'post_status' => 'publish' ) );
		if ( $id ) {
			update_post_meta( $id, 'race_date', $r['date'] );
			update_post_meta( $id, 'race_date_end', $r['date_end'] );
			update_post_meta( $id, 'race_location', $r['location'] );
			update_post_meta( $id, 'race_result', $r['result'] );
		}
	}

	// ---- Sponsors ------------------------------------------------------
	$sponsors = array(
		array( 'name' => "Wildwood Veterinary Clinic", 'logo' => 'sponsor-wildwood-vet.png' ),
		array( 'name' => 'Macadam Dental', 'logo' => 'sponsor-macadam-dental.png' ),
		array( 'name' => "De Nicola's Italian Restaurant", 'logo' => 'sponsor-denicolas.png' ),
	);
	foreach ( $sponsors as $s ) {
		$id = wp_insert_post( array( 'post_type' => 'fbbf_sponsor', 'post_title' => $s['name'], 'post_status' => 'publish' ) );
		if ( $id ) {
			$attach_id = fbbf_attach_local_image( "$dir/assets/images/sponsors/{$s['logo']}", $s['logo'], $s['name'] . ' logo' );
			if ( $attach_id ) set_post_thumbnail( $id, $attach_id );
		}
	}

	// Costume parade years now live as Gallery Photo posts tagged "Salem
	// Costumes" (see inc/cpt-gallery-photo.php) — seeded as part of the
	// Gallery rebuild, not here.

	fbbf_seed_gallery_photos( $dir );

	update_option( 'fbbf_content_seeded', 1 );
}

function fbbf_seed_gallery_photos( $dir ) {
	$order = 0;

	// Home — Instagram teaser grid: 3 real team photos + 3 open slots for future posts.
	$insta = array(
		array( 'file' => 'team-boat-race.jpeg', 'alt' => 'Team racing on the water', 'caption' => '' ),
		array( 'file' => 'team-race-skyline.webp', 'alt' => 'Boat racing under a city skyline', 'caption' => '' ),
		array( 'file' => 'team-group-seattle.webp', 'alt' => 'Team group photo in Seattle', 'caption' => '' ),
	);
	foreach ( $insta as $shot ) {
		fbbf_seed_one_gallery_photo( 'home-instagram', $order++, "$dir/assets/images/{$shot['file']}", $shot['file'], $shot['alt'], $shot['caption'] );
	}
	for ( $i = 0; $i < 3; $i++ ) {
		fbbf_seed_one_gallery_photo( 'home-instagram', $order++, '', '', '', '', 'Drop a future Instagram post photo here' );
	}

	// Gallery page tabs and Race Day Gallery sections are seeded separately
	// as Gallery Category-tagged posts (see the Gallery rebuild), not here.
}

function fbbf_seed_one_gallery_photo( $section, $order, $abs_path = '', $filename = '', $alt = '', $caption = '', $empty_caption = '', $video_url = '', $badge = '' ) {
	$title = $caption ? $caption : ( $empty_caption ? $empty_caption : ucfirst( str_replace( '-', ' ', $section ) ) . ' ' . ( $order + 1 ) );
	$id = wp_insert_post( array( 'post_type' => 'fbbf_gallery_photo', 'post_title' => $title, 'post_status' => 'publish', 'menu_order' => $order ) );
	if ( ! $id ) return;

	update_post_meta( $id, 'gallery_section', $section );
	update_post_meta( $id, 'gallery_caption', $caption );
	update_post_meta( $id, 'gallery_badge', $badge );
	update_post_meta( $id, 'gallery_video_url', $video_url );

	if ( $abs_path ) {
		$attach_id = fbbf_attach_local_image( $abs_path, $filename, $title, $alt );
		if ( $attach_id ) set_post_thumbnail( $id, $attach_id );
	}
}
