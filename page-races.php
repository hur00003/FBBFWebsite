<?php
/**
 * Template Name: Races
 */
if ( ! defined( 'ABSPATH' ) ) exit;
get_header();

$races = fbbf_get_races();
?>

<section class="page-hero page-hero--night">
	<div class="container">
		<span class="pill pill--go">2026 Season</span>
		<?php fbbf_wordmark( 'race-schedule', 'race schedule', 'display:block;height:clamp(38px,7.5vw,74px);width:auto;max-width:100%;margin:20px 0 0;' ); ?>
		<p class="page-hero__lede">Come find us on the water. Bring a cowbell, a beverage, and your loudest cheer.</p>
	</div>
</section>

<section class="section container container--md">
	<h2 class="heading-display races-heading">2026 season</h2>
	<div class="race-list">
		<?php if ( $races ) : ?>
			<?php foreach ( $races as $race ) : fbbf_render_race_card( $race ); endforeach; ?>
		<?php else : ?>
			<p>No races yet — add one under <strong>Races</strong> in wp-admin.</p>
		<?php endif; ?>
	</div>
</section>

<section class="cta-band cta-band--fire cta-band--center">
	<?php fbbf_wordmark( 'want-to-be-in-the-boat', 'want to be in the boat', 'display:block;height:clamp(28px,4.5vw,46px);width:auto;max-width:100%;margin:0 auto;' ); ?>
	<a href="<?php echo esc_url( home_url( '/about/' ) ); ?>" class="btn btn--navy btn--lg">join the crew</a>
</section>

<?php get_footer(); ?>
