<?php
/**
 * Sponsor — one post per sponsor on the wall. Edit under Sponsors in wp-admin.
 * Set the Featured Image to the sponsor's logo.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

function fbbf_register_cpt_sponsor() {
	register_post_type( 'fbbf_sponsor', array(
		'labels' => array(
			'name'          => __( 'Sponsors', 'fbbf' ),
			'singular_name' => __( 'Sponsor', 'fbbf' ),
			'add_new_item'  => __( 'Add New Sponsor', 'fbbf' ),
			'edit_item'     => __( 'Edit Sponsor', 'fbbf' ),
		),
		'public'       => true,
		'show_in_menu' => true,
		'menu_icon'    => 'dashicons-megaphone',
		'supports'     => array( 'title', 'thumbnail' ),
		'has_archive'  => false,
		'rewrite'      => false,
		'show_in_rest' => true,
	) );
}
add_action( 'init', 'fbbf_register_cpt_sponsor' );

function fbbf_sponsor_fields() {
	return array(
		'sponsor_url' => array(
			'label'       => 'Website URL',
			'type'        => 'url',
			'placeholder' => 'https://example.com',
		),
		'sponsor_tier' => array(
			'label'   => 'Tier (for your own reference — not shown publicly)',
			'type'    => 'select',
			'options' => array(
				''       => '— none —',
				'gold'   => 'Gold',
				'silver' => 'Silver',
				'bronze' => 'Bronze',
			),
		),
	);
}

fbbf_register_meta_box( 'fbbf_sponsor', 'fbbf_sponsor_details', __( 'Sponsor Details', 'fbbf' ), fbbf_sponsor_fields() );

function fbbf_get_sponsors() {
	$posts = get_posts( array(
		'post_type'      => 'fbbf_sponsor',
		'posts_per_page' => -1,
		'orderby'        => 'menu_order title',
		'order'          => 'ASC',
	) );

	return array_map( function ( $post ) {
		return array(
			'id'   => $post->ID,
			'name' => $post->post_title,
			'url'  => get_post_meta( $post->ID, 'sponsor_url', true ),
			'logo' => get_the_post_thumbnail_url( $post->ID, 'medium' ),
		);
	}, $posts );
}
