<?php
/**
 * Template Name: About
 */
if ( ! defined( 'ABSPATH' ) ) exit;
get_header();

$values = array(
	array( 'emoji' => '🙌', 'slug' => 'all-welcome', 'body' => "Never held a paddle? Perfect. All bodies, all levels — that's how most of us started." ),
	array( 'emoji' => '🏆', 'slug' => 'we-compete', 'body' => 'We show up to win. Loud, fast, and hungry for the podium every single race.' ),
	array( 'emoji' => '🎉', 'slug' => 'we-party', 'body' => 'Win or lose, we hoist a beverage. Dragon boat is a team sport and a great excuse.' ),
	array( 'emoji' => '🌱', 'slug' => 'we-give-back', 'body' => 'As a 501(c)(3), we keep the sport accessible and reinvest every dollar in the boat.' ),
);
?>

<section class="page-hero page-hero--ocean">
	<div class="container">
		<span class="pill pill--fire-on-navy">About the Blowfish</span>
		<?php fbbf_wordmark( 'who-we-are', 'who we are', 'display:block;height:clamp(38px,7.5vw,74px);width:auto;max-width:100%;margin:20px 0 0;' ); ?>
		<p class="page-hero__lede">Sixteen-plus years of racing, hollering, and out-paddling teams half our age. We are Fire Breathing Blowfish — and we are, proudly, <em>that team</em>.</p>
	</div>
</section>

<section class="section about-story container">
	<div class="about-story__copy">
		<?php fbbf_wordmark( 'our-story', 'our story', 'display:block;height:40px;width:auto;max-width:100%;margin:0 0 18px;' ); ?>
		<p>Founded in Portland around 2009, Fire Breathing Blowfish started with a handful of paddlers, one borrowed boat, and a refusal to take ourselves too seriously. Dragon boat is a 20-person sport — a long canoe with a carved dragon head and tail, a drummer at the bow keeping the beat, and a steersperson at the stern holding the line.</p>
		<p>Since then we've raced across the Pacific Northwest and beyond — Portland, Seattle, Tacoma, and every festival that'll have us. We paddle hot, we finish first more often than not, and win or lose, we hoist a beverage after every race.</p>
		<p>As a registered <strong>501(c)(3) nonprofit</strong>, every dollar we raise goes back into the boat — gear, coaching, race entries, and keeping the sport accessible to anyone who wants to grab a paddle.</p>
	</div>
	<div class="about-story__photo">
		<img src="<?php echo esc_url( fbbf_asset( 'images/team-group-seattle.webp' ) ); ?>" alt="team group photo" />
	</div>
</section>

<section class="section section--sunk">
	<div class="container">
		<div class="section-header section-header--center">
			<?php fbbf_section_eyebrow( "what we're about" ); ?>
			<?php fbbf_wordmark( 'the-blowfish-code', 'the blowfish code', 'display:block;height:clamp(30px,4.5vw,46px);width:auto;max-width:100%;margin:10px auto 0;' ); ?>
		</div>
		<div class="value-cards">
			<?php foreach ( $values as $v ) : ?>
				<div class="value-card">
					<div class="value-card__emoji"><?php echo esc_html( $v['emoji'] ); ?></div>
					<?php fbbf_wordmark( $v['slug'], str_replace( '-', ' ', $v['slug'] ), 'display:block;height:26px;width:auto;max-width:100%;margin:14px 0 10px;' ); ?>
					<p><?php echo esc_html( $v['body'] ); ?></p>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<section class="section container container--md about-cta">
	<?php fbbf_wordmark( 'ready-to-breathe-fire', 'ready to breathe fire', 'display:block;height:clamp(30px,4.5vw,46px);width:auto;max-width:100%;margin:0 auto;' ); ?>
	<p class="about-cta__body">No experience needed. Come to a practice, meet the crew, and get in the boat. First session's on us.</p>
	<div class="about-cta__actions">
		<a href="mailto:thefirebreathingblowfish@gmail.com" class="btn btn--fire">email the team</a>
		<a href="<?php echo esc_url( home_url( '/races/' ) ); ?>" class="btn btn--navy">see us race</a>
	</div>
</section>

<?php get_footer(); ?>
