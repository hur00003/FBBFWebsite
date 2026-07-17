<?php
/**
 * Race — one post per race on the schedule. Edit under Races in wp-admin.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

function fbbf_register_cpt_race() {
	register_post_type( 'fbbf_race', array(
		'labels' => array(
			'name'          => __( 'Races', 'fbbf' ),
			'singular_name' => __( 'Race', 'fbbf' ),
			'add_new_item'  => __( 'Add New Race', 'fbbf' ),
			'edit_item'     => __( 'Edit Race', 'fbbf' ),
		),
		'public'       => true,
		'show_in_menu' => true,
		'menu_icon'    => 'dashicons-palmtree',
		'supports'     => array( 'title' ),
		'has_archive'  => false,
		'rewrite'      => false,
		'show_in_rest' => true,
	) );
}
add_action( 'init', 'fbbf_register_cpt_race' );

function fbbf_race_fields() {
	return array(
		'race_date'     => array(
			'label'       => 'Race date',
			'type'        => 'date',
			'description' => 'First (or only) day of the race.',
		),
		'race_date_end' => array(
			'label'       => 'End date (optional)',
			'type'        => 'date',
			'description' => 'Only set this for a multi-day race, e.g. the Portland Race weekend.',
		),
		'race_location' => array(
			'label'       => 'Location',
			'type'        => 'text',
			'placeholder' => 'Lake Union · Seattle, WA',
		),
		'race_result'   => array(
			'label'   => 'Result',
			'type'    => 'select',
			'options' => array(
				''       => 'Upcoming (no result yet)',
				'gold'   => 'Gold 🥇',
				'silver' => 'Silver 🥈',
				'bronze' => 'Bronze 🥉',
			),
		),
	);
}

fbbf_register_meta_box( 'fbbf_race', 'fbbf_race_details', __( 'Race Details', 'fbbf' ), fbbf_race_fields() );

/**
 * All races, soonest first, as plain arrays ready for template use.
 */
function fbbf_get_races() {
	$posts = get_posts( array(
		'post_type'      => 'fbbf_race',
		'posts_per_page' => -1,
		'meta_key'       => 'race_date',
		'orderby'        => 'meta_value',
		'order'          => 'ASC',
	) );

	return array_map( function ( $post ) {
		return array(
			'id'       => $post->ID,
			'name'     => $post->post_title,
			'date'     => get_post_meta( $post->ID, 'race_date', true ),
			'date_end' => get_post_meta( $post->ID, 'race_date_end', true ),
			'location' => get_post_meta( $post->ID, 'race_location', true ),
			'result'   => get_post_meta( $post->ID, 'race_result', true ),
		);
	}, $posts );
}
