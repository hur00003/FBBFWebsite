<?php
/**
 * Template Name: Race Day Gallery
 */
if ( ! defined( 'ABSPATH' ) ) exit;
get_header();

$tabs          = fbbf_get_gallery_tabs();
$race_photos   = fbbf_get_gallery_tab_photos( 'race-photos', -1 );
$costume_shots = fbbf_get_gallery_tab_photos( 'salem-costumes', -1 );
$drone_all     = fbbf_get_gallery_tab_photos( 'drone', -1 );
$drone_clips   = array_values( array_filter( $drone_all, function ( $t ) { return ! empty( $t['video'] ); } ) );
$drone_stills  = array_values( array_filter( $drone_all, function ( $t ) { return empty( $t['video'] ); } ) );
?>

<section class="hero hero--race-day">
	<video class="hero__video" autoplay muted loop playsinline>
		<source src="<?php echo esc_url( fbbf_asset( 'video/drone/video1.mp4' ) ); ?>" type="video/mp4" />
	</video>
	<div class="hero__scrim hero__scrim--race-day"></div>
	<div class="hero__content container hero__content--bottom">
		<div class="pill-label">Race Day · Aerial Coverage</div>
		<h1 class="heading-display heading-display--hero"><?php fbbf_wordmark( 'the-gallery', 'the gallery', 'display:inline-block;height:clamp(40px,7vw,80px);width:auto;max-width:100%;' ); ?></h1>
		<p class="page-hero__lede">Every photo and clip from race day — on the water and from above.</p>
	</div>
</section>

<nav class="rdg-backlinks">
	<?php foreach ( $tabs as $tab ) : ?>
		<a href="<?php echo esc_url( add_query_arg( 'gtab', $tab['id'], home_url( '/gallery/' ) ) ); ?>" class="rdg-backlinks__pill"><?php echo esc_html( $tab['label'] ); ?></a>
	<?php endforeach; ?>
</nav>

<section class="section container container--lg">
	<div class="section-header">
		<?php fbbf_section_eyebrow( 'race day' ); ?>
		<h2 class="heading-display"><?php fbbf_wordmark( 'rdg-on-the-water', 'on the water', 'display:inline-block;height:clamp(32px,5vw,48px);width:auto;max-width:100%;' ); ?></h2>
	</div>
	<?php if ( empty( $race_photos ) ) : ?>
		<p class="gallery-empty">No race photos yet — add some to the <strong>Race Photos</strong> category in wp-admin.</p>
	<?php else : ?>
		<div class="rdg-grid rdg-grid--race">
			<?php foreach ( $race_photos as $shot ) : fbbf_render_rdg_tile( $shot ); endforeach; ?>
		</div>
	<?php endif; ?>
</section>

<section class="section container container--lg">
	<div class="section-header">
		<?php fbbf_section_eyebrow( 'team spirit' ); ?>
		<h2 class="heading-display"><?php fbbf_wordmark( 'costume-crew', 'costume crew', 'display:inline-block;height:clamp(32px,5vw,48px);width:auto;max-width:100%;' ); ?></h2>
		<p class="section-header__body">every year we dress in costume for the Salem race — always in character.</p>
	</div>
	<?php if ( empty( $costume_shots ) ) : ?>
		<p class="gallery-empty">No costume photos yet — add some to the <strong>Salem Costumes</strong> category in wp-admin.</p>
	<?php else : ?>
		<div class="rdg-grid rdg-grid--costume">
			<?php foreach ( $costume_shots as $shot ) : fbbf_render_rdg_tile( $shot ); endforeach; ?>
		</div>
	<?php endif; ?>
</section>

<section class="section container container--lg">
	<div class="section-header">
		<?php fbbf_section_eyebrow( 'aerial footage' ); ?>
		<h2 class="heading-display"><?php fbbf_wordmark( 'from-above', 'from above', 'display:inline-block;height:clamp(32px,5vw,48px);width:auto;max-width:100%;' ); ?></h2>
	</div>
	<?php if ( empty( $drone_clips ) ) : ?>
		<p class="gallery-empty">No drone clips yet — add a video URL to a <strong>Drone</strong> photo in wp-admin.</p>
	<?php else : ?>
		<div class="rdg-grid rdg-grid--clip">
			<?php foreach ( $drone_clips as $clip ) : ?>
				<div class="rdg-clip">
					<video src="<?php echo esc_url( $clip['video'] ); ?>" controls playsinline></video>
					<?php if ( $clip['badge'] ) : ?><span class="rdg-clip__badge"><?php echo esc_html( $clip['badge'] ); ?></span><?php endif; ?>
				</div>
			<?php endforeach; ?>
		</div>
	<?php endif; ?>
</section>

<section class="section container container--lg">
	<div class="section-header">
		<?php fbbf_section_eyebrow( 'aerial stills' ); ?>
		<h2 class="heading-display"><?php fbbf_wordmark( 'blowfish-from-the-sky', 'the blowfish from the sky', 'display:inline-block;height:clamp(32px,5vw,48px);width:auto;max-width:100%;' ); ?></h2>
	</div>
	<?php if ( empty( $drone_stills ) ) : ?>
		<p class="gallery-empty">No drone stills yet — add some to the <strong>Drone</strong> category in wp-admin.</p>
	<?php else : ?>
		<div class="rdg-grid rdg-grid--drone">
			<?php foreach ( $drone_stills as $shot ) : fbbf_render_rdg_tile( $shot ); endforeach; ?>
		</div>
	<?php endif; ?>
</section>

<section class="rdg-footer">
	<img src="<?php echo esc_url( fbbf_asset( 'images/fbbf-mascot-web.png' ) ); ?>" alt="Fire Breathing Blowfish mascot" class="fbbf-bob" width="64" height="64" />
	<div class="fbbf-outline rdg-footer__title">WE BREATHE FIRE!</div>
</section>

<?php get_footer(); ?>
