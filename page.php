<?php
/**
 * Generic fallback template for any page that isn't one of the named
 * page templates (About/Races/Gallery/Merch/Sponsors/Donate/Race Day Gallery).
 */
if ( ! defined( 'ABSPATH' ) ) exit;
get_header();
?>
<article class="generic-page">
	<div class="container container--md">
		<?php while ( have_posts() ) : the_post(); ?>
			<h1 class="generic-page__title"><?php the_title(); ?></h1>
			<div class="generic-page__content"><?php the_content(); ?></div>
		<?php endwhile; ?>
	</div>
</article>
<?php
get_footer();
