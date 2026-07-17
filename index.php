<?php
/**
 * Fallback template (blog listing, search results, CPT single views, etc.).
 * The site itself is entirely page-template driven; this exists only so
 * WordPress always has a template to fall back to.
 */
if ( ! defined( 'ABSPATH' ) ) exit;
get_header();
?>
<div class="generic-page">
	<div class="container container--md">
		<?php if ( have_posts() ) : ?>
			<?php while ( have_posts() ) : the_post(); ?>
				<article style="margin-bottom:48px;">
					<h1 class="generic-page__title"><?php the_title(); ?></h1>
					<div class="generic-page__content"><?php the_content(); ?></div>
				</article>
			<?php endwhile; ?>
		<?php else : ?>
			<p>Nothing found.</p>
		<?php endif; ?>
	</div>
</div>
<?php
get_footer();
