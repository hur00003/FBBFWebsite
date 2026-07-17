<?php
/**
 * Template Name: Gallery
 */
if ( ! defined( 'ABSPATH' ) ) exit;
get_header();

$tabs          = fbbf_get_gallery_tabs();
$tab_ids       = wp_list_pluck( $tabs, 'id' );
$requested_tab = isset( $_GET['gtab'] ) ? sanitize_title( wp_unslash( $_GET['gtab'] ) ) : '';
$active_tab    = in_array( $requested_tab, $tab_ids, true ) ? $requested_tab : 'best';
$initial_count = fbbf_gallery_load_more_step();
?>

<section class="page-hero page-hero--ocean">
	<div class="container">
		<span class="pill pill--fire-on-navy">Photo Gallery</span>
		<?php fbbf_wordmark( 'on-the-water', 'on the water', 'display:block;height:clamp(38px,7.5vw,74px);width:auto;max-width:100%;margin:20px 0 0;' ); ?>
		<p class="page-hero__lede">Sweat, spray, and medals. Drop your own shots into the empty frames.</p>
	</div>
</section>

<nav class="gallery-tabs">
	<div class="container gallery-tabs__inner">
		<?php foreach ( $tabs as $tab ) : ?>
			<button type="button" class="gallery-tabs__btn <?php echo $tab['id'] === $active_tab ? 'is-active' : ''; ?>" data-tab="<?php echo esc_attr( $tab['id'] ); ?>"><?php echo esc_html( $tab['label'] ); ?></button>
		<?php endforeach; ?>
		<a href="<?php echo esc_url( home_url( '/race-day-gallery/' ) ); ?>" class="gallery-tabs__seeall">
			<span class="gallery-tabs__seeall-icon">
				<img src="<?php echo esc_url( fbbf_asset( 'images/fbbf-mascot-web.png' ) ); ?>" alt="Fire Breathing Blowfish logo" />
			</span>
			<span>See All →</span>
		</a>
	</div>
</nav>

<section class="section container">
	<?php foreach ( $tabs as $tab ) :
		$tiles    = fbbf_get_gallery_tab_photos( $tab['id'], $initial_count );
		$total    = fbbf_count_gallery_tab_photos( $tab['id'] );
		$has_more = $total > count( $tiles );
		?>
		<div class="gallery-panel" data-tab-panel="<?php echo esc_attr( $tab['id'] ); ?>" <?php echo $tab['id'] === $active_tab ? '' : 'hidden'; ?>>
			<h2 class="heading-display gallery-panel__heading">
				<?php if ( $tab['heading_image'] ) : ?>
					<?php fbbf_wordmark( $tab['heading_image'], $tab['heading'], 'display:inline-block;height:clamp(28px,4.5vw,44px);width:auto;max-width:100%;' ); ?>
				<?php else : ?>
					<?php echo esc_html( $tab['heading'] ); ?>
				<?php endif; ?>
			</h2>
			<?php if ( $tab['description'] ) : ?>
				<p class="gallery-panel__body"><?php echo esc_html( $tab['description'] ); ?></p>
			<?php endif; ?>

			<?php if ( empty( $tiles ) ) : ?>
				<p class="gallery-empty">No photos in this category yet — add some from <strong>Gallery Photos</strong> in wp-admin.</p>
			<?php else : ?>
				<div class="gallery-grid">
					<?php foreach ( $tiles as $tile ) : fbbf_render_gallery_tile( $tile ); endforeach; ?>
				</div>
				<?php if ( $has_more ) : ?>
					<div class="gallery-panel__more-wrap">
						<button type="button" class="btn btn--navy gallery-panel__more" data-tab="<?php echo esc_attr( $tab['id'] ); ?>" data-offset="<?php echo (int) count( $tiles ); ?>">load more photos</button>
					</div>
				<?php endif; ?>
			<?php endif; ?>
		</div>
	<?php endforeach; ?>
</section>

<?php get_footer(); ?>
