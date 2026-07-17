<?php
/**
 * Fire Breathing Blowfish theme setup.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'FBBF_VERSION', '1.0.1' );

function fbbf_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'custom-logo' );
	add_theme_support( 'woocommerce' );

	register_nav_menus( array(
		'primary' => __( 'Primary Navigation', 'fbbf' ),
	) );

	add_image_size( 'fbbf-card', 800, 600, true );
	add_image_size( 'fbbf-square', 800, 800, true );
}
add_action( 'after_setup_theme', 'fbbf_setup' );

function fbbf_asset( $path ) {
	return get_theme_file_uri( 'assets/' . ltrim( $path, '/' ) );
}

function fbbf_scripts() {
	$tokens = array( 'fonts', 'colors', 'typography', 'spacing', 'effects' );
	foreach ( $tokens as $token ) {
		wp_enqueue_style( 'fbbf-token-' . $token, fbbf_asset( "css/tokens/$token.css" ), array(), FBBF_VERSION );
	}
	wp_enqueue_style( 'fbbf-site', fbbf_asset( 'css/site.css' ), array( 'fbbf-token-effects' ), FBBF_VERSION );

	wp_enqueue_script( 'fbbf-main', fbbf_asset( 'js/main.js' ), array(), FBBF_VERSION, true );
	wp_localize_script( 'fbbf-main', 'fbbfData', array(
		'ajaxUrl' => admin_url( 'admin-ajax.php' ),
		'nonce'   => wp_create_nonce( 'fbbf_forms' ),
	) );

	if ( class_exists( 'WooCommerce' ) ) {
		wp_enqueue_style( 'fbbf-woocommerce', fbbf_asset( 'css/woocommerce.css' ), array( 'fbbf-site' ), FBBF_VERSION );
		wp_enqueue_script( 'fbbf-woocommerce', fbbf_asset( 'js/woocommerce.js' ), array( 'jquery' ), FBBF_VERSION, true );
	}

	if ( is_page_template( 'page-gallery.php' ) ) {
		wp_enqueue_script( 'fbbf-gallery', fbbf_asset( 'js/gallery.js' ), array( 'fbbf-main' ), FBBF_VERSION, true );
	}
}
add_action( 'wp_enqueue_scripts', 'fbbf_scripts' );

// Includes.
require get_theme_file_path( 'inc/helpers.php' );
require get_theme_file_path( 'inc/meta-boxes.php' );
require get_theme_file_path( 'inc/cpt-race.php' );
require get_theme_file_path( 'inc/cpt-sponsor.php' );
require get_theme_file_path( 'inc/cpt-gallery-photo.php' );
require get_theme_file_path( 'inc/forms.php' );
require get_theme_file_path( 'inc/gallery-ajax.php' );
require get_theme_file_path( 'inc/seed-content.php' );
require get_theme_file_path( 'inc/template-tags.php' );
require get_theme_file_path( 'inc/woocommerce.php' );

/**
 * Flush rewrite rules once after the theme is activated (needed for the CPTs).
 */
function fbbf_after_switch_theme() {
	fbbf_seed_content();
	flush_rewrite_rules();
}
add_action( 'after_switch_theme', 'fbbf_after_switch_theme' );
