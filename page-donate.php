<?php
/**
 * Template Name: Donate
 */
if ( ! defined( 'ABSPATH' ) ) exit;

$square_url = 'https://square.link/u/IvSw9B8b?src=embed';
$tiles = array(
	array( 'amount' => 10, 'impact' => 'a set of grips' ),
	array( 'amount' => 25, 'impact' => 'a race-day entry' ),
	array( 'amount' => 50, 'impact' => 'crew travel' ),
	array( 'amount' => 100, 'impact' => 'a seat in the boat' ),
);
$uses = array(
	array( 'emoji' => '🚣', 'title' => 'Boats & paddles', 'body' => 'Maintaining and upgrading our racing gear.' ),
	array( 'emoji' => '🎓', 'title' => 'Coaching', 'body' => 'Pro coaching so every paddler improves.' ),
	array( 'emoji' => '🎟️', 'title' => 'Race entries', 'body' => 'Fees, travel, and lodging for the season.' ),
	array( 'emoji' => '🤝', 'title' => 'Access', 'body' => 'Try-it days and scholarships so cost is never a barrier.' ),
);

get_header();
?>

<section class="page-hero page-hero--donate">
	<div class="container container--sm">
		<span class="pill pill--red">WE BREATHE FIRE!</span>
		<?php fbbf_wordmark( 'fuel-the-fire', 'fuel the fire', 'display:block;height:clamp(38px,7.5vw,74px);width:auto;max-width:100%;margin:20px auto 0;' ); ?>
		<p class="page-hero__lede">We're a 501(c)(3) nonprofit. Every gift is tax-deductible and goes straight into the boat — gear, coaching, and keeping the sport open to everyone.</p>
		<button type="button" class="btn btn--ghost-light btn--sm share-btn" data-share-title="Fire Breathing Blowfish" data-share-text="Help us fuel the fire — support Portland's Fire Breathing Blowfish dragon boat team, a 501(c)(3) nonprofit. 🔥">
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="18" cy="5" r="2.6" stroke="currentColor" stroke-width="1.8"/><circle cx="6" cy="12" r="2.6" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="19" r="2.6" stroke="currentColor" stroke-width="1.8"/><line x1="8.3" y1="10.7" x2="15.7" y2="6.3" stroke="currentColor" stroke-width="1.8"/><line x1="8.3" y1="13.3" x2="15.7" y2="17.7" stroke="currentColor" stroke-width="1.8"/></svg>
			share this page
		</button>
	</div>
</section>

<section class="section container container--lg donate-grid">
	<div class="donate-card">
		<?php fbbf_wordmark( 'make-a-gift', 'make a gift', 'display:block;height:32px;width:auto;max-width:100%;margin:0 0 6px;' ); ?>
		<p class="donate-card__intro">Choose an amount below.</p>

		<div class="donate-tiles" id="donate-tiles">
			<?php foreach ( $tiles as $t ) : ?>
				<button type="button" class="donate-tile" data-amount="<?php echo esc_attr( $t['amount'] ); ?>">
					<span class="donate-tile__label">$<?php echo esc_html( $t['amount'] ); ?></span>
					<span class="donate-tile__impact"><?php echo esc_html( $t['impact'] ); ?></span>
				</button>
			<?php endforeach; ?>
			<button type="button" class="donate-tile" data-amount="custom">
				<span class="donate-tile__label">Other</span>
				<span class="donate-tile__impact">choose your own</span>
			</button>
		</div>
		<input type="number" min="1" step="1" id="donate-custom-amount" class="donate-custom-input" placeholder="Enter your own amount" hidden />

		<div class="donate-summary">
			<div>
				<div class="donate-summary__label">Your gift</div>
				<div class="donate-summary__value" id="donate-amount-display">$100</div>
			</div>
			<a href="<?php echo esc_url( $square_url ); ?>" target="_blank" rel="noopener" class="btn btn--fire" id="donate-cta">donate $100 →</a>
		</div>
		<p class="donate-secure-note">🔒 Secure checkout via Square · Enter your amount on the next screen.</p>
	</div>

	<div class="donate-side">
		<div class="donate-uses-card">
			<?php fbbf_wordmark( 'where-it-goes', 'where it goes', 'display:block;height:26px;width:auto;max-width:100%;margin:0 0 14px;' ); ?>
			<?php foreach ( $uses as $u ) : ?>
				<div class="donate-use">
					<span class="donate-use__emoji"><?php echo esc_html( $u['emoji'] ); ?></span>
					<div>
						<div class="donate-use__title"><?php echo esc_html( $u['title'] ); ?></div>
						<div class="donate-use__body"><?php echo esc_html( $u['body'] ); ?></div>
					</div>
				</div>
			<?php endforeach; ?>
		</div>
		<div class="donate-other-ways">
			<div class="heading-display donate-other-ways__title">other ways to give</div>
			<p>Prefer to give another way? Employer matching, in-kind gear, or a check — <a href="mailto:thefirebreathingblowfish@gmail.com">email us</a> and we'll make it easy.</p>
		</div>
	</div>
</section>

<?php get_footer(); ?>
