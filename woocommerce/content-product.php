<?php
/**
 * Product loop card — FBBF storefront treatment: photo with a hover
 * "quick add" overlay, category eyebrow, Giant Head price. Structure
 * mirrors WooCommerce core's content-product.php but wraps the image +
 * add-to-cart action in a shared media block for the overlay effect.
 *
 * @see woocommerce/templates/content-product.php
 */

defined( 'ABSPATH' ) || exit;

global $product;

if ( ! $product || ! $product->is_visible() ) return;
?>
<li <?php wc_product_class( 'product-card', $product ); ?>>
	<?php do_action( 'woocommerce_before_shop_loop_item' ); ?>

	<div class="product-card__media">
		<a href="<?php the_permalink(); ?>" class="product-card__media-link">
			<?php do_action( 'woocommerce_before_shop_loop_item_title' ); ?>
		</a>
		<div class="product-card__quick-add">
			<?php do_action( 'woocommerce_after_shop_loop_item' ); ?>
		</div>
	</div>

	<div class="product-card__body">
		<?php
		$cats = wc_get_product_category_list( $product->get_id() );
		if ( $cats ) echo '<div class="product-card__cat">' . wp_strip_all_tags( $cats ) . '</div>';
		?>
		<a href="<?php the_permalink(); ?>" class="product-card__title-link">
			<?php do_action( 'woocommerce_shop_loop_item_title' ); ?>
		</a>
		<div class="product-card__price heading-display"><?php echo $product->get_price_html(); ?></div>
	</div>
</li>
