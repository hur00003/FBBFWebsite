<?php
/**
 * Global site header: sticky navy nav, mascot + wordmark, Donate CTA.
 */
if ( ! defined( 'ABSPATH' ) ) exit;
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div class="site-shell">

	<header class="site-header">
		<div class="site-header__inner">
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="site-header__brand">
				<img src="<?php echo esc_url( fbbf_asset( 'images/fbbf-mascot-web.png' ) ); ?>" alt="Fire Breathing Blowfish mascot" class="site-header__mascot" />
				<span class="site-header__wordblock">
					<span class="fbbf-outline site-header__title">Fire Breathing Blowfish</span>
					<span class="site-header__eyebrow">Portland · 501(c)(3) Nonprofit</span>
				</span>
			</a>

			<button class="site-header__menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="Toggle menu">
				<span></span><span></span><span></span>
			</button>

			<nav class="site-header__nav" id="primary-nav">
				<?php foreach ( fbbf_nav_items() as $slug => $item ) : ?>
					<a href="<?php echo esc_url( $item['url'] ); ?>" class="nav-link <?php echo fbbf_is_current_nav( $slug ) ? 'nav-link--active' : ''; ?>"><?php echo esc_html( $item['label'] ); ?></a>
				<?php endforeach; ?>
				<a href="https://instagram.com/thefirebreathingblowfish" target="_blank" rel="noopener" aria-label="Follow us on Instagram" class="site-header__instagram">
					<svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.3" stroke="currentColor" stroke-width="2"/><circle cx="17.6" cy="6.4" r="1.15" fill="currentColor"/></svg>
				</a>
				<?php if ( class_exists( 'WooCommerce' ) ) fbbf_cart_icon(); ?>
				<a href="<?php echo esc_url( home_url( '/donate/' ) ); ?>" class="btn btn--pill btn--fire site-header__donate">Donate</a>
			</nav>
		</div>
	</header>

	<main class="site-main">
