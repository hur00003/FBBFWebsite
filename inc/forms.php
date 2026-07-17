<?php
/**
 * Sponsor inquiry form — real submission handling (no form-plugin
 * dependency). Submits via fetch() in assets/js/main.js to
 * admin-ajax.php?action=fbbf_sponsor_inquiry, which stores a private
 * "Sponsor Inquiry" post (visible under Sponsor Inquiries in wp-admin) and
 * emails the club inbox.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

function fbbf_register_cpt_sponsor_inquiry() {
	register_post_type( 'fbbf_sponsor_lead', array(
		'labels' => array(
			'name'          => __( 'Sponsor Inquiries', 'fbbf' ),
			'singular_name' => __( 'Sponsor Inquiry', 'fbbf' ),
		),
		'public'              => false,
		'show_ui'             => true,
		'show_in_menu'        => true,
		'menu_icon'           => 'dashicons-email-alt',
		'supports'            => array( 'title' ),
		'capability_type'     => 'post',
		'map_meta_cap'        => true,
		'capabilities'        => array( 'create_posts' => 'do_not_allow' ), // only created programmatically
	) );
}
add_action( 'init', 'fbbf_register_cpt_sponsor_inquiry' );

function fbbf_sponsor_inbox_email() {
	return apply_filters( 'fbbf_sponsor_inbox_email', 'thefirebreathingblowfish@gmail.com' );
}

function fbbf_handle_sponsor_inquiry() {
	check_ajax_referer( 'fbbf_forms', 'nonce' );

	$name     = isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '';
	$business = isset( $_POST['business'] ) ? sanitize_text_field( wp_unslash( $_POST['business'] ) ) : '';
	$email    = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	$tier     = isset( $_POST['tier'] ) ? sanitize_text_field( wp_unslash( $_POST['tier'] ) ) : '';

	if ( empty( $name ) || ! is_email( $email ) ) {
		wp_send_json_error( array( 'message' => 'Please enter your name and a valid email.' ), 400 );
	}

	$post_id = wp_insert_post( array(
		'post_type'   => 'fbbf_sponsor_lead',
		'post_title'  => sprintf( '%s — %s (%s)', $name, $business ? $business : 'no business given', $tier ),
		'post_status' => 'private',
		'meta_input'  => array(
			'lead_name'     => $name,
			'lead_business' => $business,
			'lead_email'    => $email,
			'lead_tier'     => $tier,
		),
	) );

	if ( ! $post_id || is_wp_error( $post_id ) ) {
		wp_send_json_error( array( 'message' => 'Something went wrong saving your inquiry. Please email us directly.' ), 500 );
	}

	$body = sprintf(
		"New sponsorship inquiry from the website:\n\nName: %s\nBusiness: %s\nEmail: %s\nInterested tier: %s\n",
		$name, $business ? $business : '(not given)', $email, $tier ? $tier : '(not selected)'
	);
	wp_mail( fbbf_sponsor_inbox_email(), 'New FBBF sponsorship inquiry — ' . $name, $body, array( 'Reply-To: ' . $email ) );

	wp_send_json_success( array( 'firstName' => explode( ' ', trim( $name ) )[0], 'email' => $email ) );
}
add_action( 'wp_ajax_fbbf_sponsor_inquiry', 'fbbf_handle_sponsor_inquiry' );
add_action( 'wp_ajax_nopriv_fbbf_sponsor_inquiry', 'fbbf_handle_sponsor_inquiry' );
