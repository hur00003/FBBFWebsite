<?php
/**
 * WooCommerce integration. The merch store (Printful catalog) is real
 * WooCommerce + the Printful plugin — see readme.md for connecting your
 * Printful account. This file reskins WooCommerce's own template hooks to
 * match the FBBF design instead of reinventing cart/checkout logic.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( 'WooCommerce' ) ) return;

add_theme_support( 'wc-product-gallery-zoom' );
add_theme_support( 'wc-product-gallery-lightbox' );
add_theme_support( 'wc-product-gallery-slider' );

/* ---- Swap WooCommerce's default wrapper for ours ---- */
remove_action( 'woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10 );
remove_action( 'woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10 );

/* ---- No shop sidebar in this design — the product grid is full-width.
 *      Without this, WooCommerce falls back to rendering whatever widgets
 *      happen to be assigned to a 'sidebar-1' area (e.g. leftover from an
 *      earlier theme/plugin), which has nothing to do with this theme. ---- */
remove_action( 'woocommerce_sidebar', 'woocommerce_get_sidebar' );
add_action( 'woocommerce_before_main_content', 'fbbf_woo_wrapper_start', 10 );
add_action( 'woocommerce_after_main_content', 'fbbf_woo_wrapper_end', 10 );
function fbbf_woo_wrapper_start() { echo '<div class="fbbf-shop container container--lg">'; }
function fbbf_woo_wrapper_end() { echo '</div>'; }

/* ---- Shop hero banner (Merch page), matches the rest of the site's heroes ---- */
add_action( 'woocommerce_before_main_content', 'fbbf_woo_shop_hero', 5 );
function fbbf_woo_shop_hero() {
	if ( ! is_shop() ) return;
	?>
	<section class="hero hero--merch">
		<div class="hero__content container">
			<div class="hero__copy">
				<span class="pill pill--fire-on-navy">Team Store</span>
				<?php fbbf_wordmark( 'gear-up-breathe-fire', 'gear up. breathe fire.', 'display:block;height:clamp(38px,7.5vw,74px);width:auto;max-width:100%;margin:20px 0 0;' ); ?>
				<p class="hero__lede hero__lede--merch">Wear the fire. Every purchase powers the crew — proceeds go straight back into the boat.</p>
			</div>
		</div>
		<img src="<?php echo esc_url( fbbf_asset( 'images/fbbf-mascot-web.png' ) ); ?>" alt="mascot" class="hero__mascot hero__mascot--merch" />
	</section>
	<?php
}

/* ---- Filter bar: category chips + item count + WC's default sorting ---- */
remove_action( 'woocommerce_before_shop_loop', 'woocommerce_result_count', 20 );
remove_action( 'woocommerce_before_shop_loop', 'woocommerce_catalog_ordering', 30 );
add_action( 'woocommerce_before_shop_loop', 'fbbf_woo_filter_bar', 25 );
function fbbf_woo_filter_bar() {
	$terms   = get_terms( array( 'taxonomy' => 'product_cat', 'hide_empty' => true, 'parent' => 0 ) );
	$current = is_tax( 'product_cat' ) ? get_queried_object() : null;
	?>
	<div class="filter-bar">
		<div class="filter-bar__chips">
			<a href="<?php echo esc_url( get_permalink( wc_get_page_id( 'shop' ) ) ); ?>" class="filter-chip<?php echo ( ! $current ) ? ' filter-chip--active' : ''; ?>">all</a>
			<?php if ( ! is_wp_error( $terms ) ) foreach ( $terms as $term ) : ?>
				<a href="<?php echo esc_url( get_term_link( $term ) ); ?>" class="filter-chip<?php echo ( $current && $current->term_id === $term->term_id ) ? ' filter-chip--active' : ''; ?>"><?php echo esc_html( strtolower( $term->name ) ); ?></a>
			<?php endforeach; ?>
		</div>
		<div class="filter-bar__meta">
			<span class="filter-bar__count"><?php woocommerce_result_count(); ?></span>
			<?php woocommerce_catalog_ordering(); ?>
		</div>
	</div>
	<?php
}

/* ---- Quick-add: AJAX add to cart on loop cards ---- */
add_filter( 'woocommerce_loop_add_to_cart_args', function ( $args ) {
	$args['class'] = str_replace( 'button', 'btn btn--fire btn--sm quick-add-btn', $args['class'] );
	return $args;
} );

/* ---- Cart drawer markup ---- */
add_action( 'wp_footer', 'fbbf_cart_drawer_markup', 30 );
function fbbf_cart_drawer_markup() {
	?>
	<div class="cart-drawer-overlay" id="fbbf-cart-overlay"></div>
	<aside class="cart-drawer" id="fbbf-cart-drawer" aria-label="Your bag">
		<div class="cart-drawer__head">
			<div class="cart-drawer__title heading-display">your bag</div>
			<button class="cart-drawer__close" id="fbbf-cart-close" aria-label="Close">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
			</button>
		</div>
		<div class="cart-drawer__body widget_shopping_cart_content">
			<?php woocommerce_mini_cart(); ?>
		</div>
	</aside>
	<?php
}

/* ---- Cart icon + count badge, wired into the main site nav ---- */
function fbbf_cart_icon() {
	$count = WC()->cart ? WC()->cart->get_cart_contents_count() : 0;
	?>
	<button type="button" id="fbbf-cart-toggle" class="cart-toggle" aria-label="Cart">
		<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
		<span class="cart-toggle__count<?php echo $count ? '' : ' is-hidden'; ?>"><?php echo (int) $count; ?></span>
	</button>
	<?php
}

/* ---- Keep the nav cart badge in sync after an AJAX add-to-cart ---- */
add_filter( 'woocommerce_add_to_cart_fragments', 'fbbf_cart_count_fragment' );
function fbbf_cart_count_fragment( $fragments ) {
	ob_start();
	fbbf_cart_icon();
	$fragments['#fbbf-cart-toggle'] = ob_get_clean();
	return $fragments;
}

/* ---- Loop tweaks ---- */
add_filter( 'loop_shop_columns', function () { return 3; } );
add_filter( 'loop_shop_per_page', function () { return 24; } );

/* ---- Printful sets its own sync product data; nothing else to wire here.
 *      Connect the Printful plugin from wp-admin → Printful → Store Setup
 *      to sync the real catalog. See readme.md. ---- */
