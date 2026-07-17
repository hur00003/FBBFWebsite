<?php
/**
 * Template Name: Sponsors
 *
 * Tier names/prices/perks are kept as exact code per the club's real
 * published sponsorship terms — do not edit these without checking with
 * the club, per the design handoff.
 */
if ( ! defined( 'ABSPATH' ) ) exit;

$tiers = array(
	array(
		'name' => 'gold', 'price' => '$750+', 'featured' => true, 'blurb' => 'top billing — you set the beat.',
		'perks' => array(
			'Printed name/logo on race-day tent signage',
			'Logo on the FBBF website with link, March–September',
			'Social media posts, check-ins & race-day shares',
			'1–3 team events at your location or as a partnership',
			'Advertising on the team jersey sleeve',
			'Team T-shirt, photo, or memorabilia for business display',
		),
	),
	array(
		'name' => 'silver', 'price' => '$400–$749', 'featured' => false, 'blurb' => 'steer the season with us.',
		'perks' => array(
			'Printed name/logo on race-day tent signage',
			'Logo on the FBBF website with link, March–September',
			'Social media posts, check-ins & race-day shares',
			'One team event at your location or as a partnership',
			'Team T-shirt, photo, or memorabilia for business display',
		),
	),
	array(
		'name' => 'bronze', 'price' => 'up to $399', 'featured' => false, 'blurb' => 'every bit fuels the boat.',
		'perks' => array(
			'Printed name/logo on race-day tent signage',
			'Social media post about the sponsorship',
		),
	),
);

$impact_stats = array(
	array( 'value' => '16', 'label' => 'years on the water' ),
	array( 'value' => '5', 'label' => 'races / festivals a year' ),
	array( 'value' => '40,000+', 'label' => 'festival spectators reached' ),
	array( 'value' => '500+', 'label' => 'social followers' ),
);
$why_cards = array(
	array( 'icon' => '👀', 'title' => 'seen everywhere', 'body' => 'Logos on the boat banner, jersey, and team tent — plus race-day photos that live on for years.' ),
	array( 'icon' => '📣', 'title' => 'social reach', 'body' => 'Shout-outs to a loyal, local, PNW-active audience across our channels all season long.' ),
	array( 'icon' => '❤️', 'title' => 'feel-good + deductible', 'body' => "Back an inclusive community team and write it off — we're a registered 501(c)(3)." ),
);
$sponsors = fbbf_get_sponsors();

get_header();
?>

<section class="page-hero page-hero--night page-hero--center">
	<div class="container container--sm">
		<span class="pill pill--fire-on-navy">501(c)(3) · tax-deductible</span>
		<?php fbbf_wordmark( 'sponsor-the-fish', 'sponsor the fish', 'display:block;height:clamp(38px,7.5vw,74px);width:auto;max-width:100%;margin:20px auto 0;' ); ?>
		<p class="page-hero__lede">Put your business on the loudest boat in the Pacific Northwest. We paddle in front of tens of thousands of festival-goers every season — and every dollar is tax-deductible.</p>
		<div class="page-hero__actions">
			<a href="#sponsor-inquire" class="btn btn--fire">become a sponsor 🔥</a>
			<a href="#sponsor-tiers" class="btn btn--ghost-light">see the packages</a>
		</div>
		<a href="mailto:thefirebreathingblowfish@gmail.com?subject=Sponsorship%20packet%20request" class="page-hero__mailto">⬇ download the 1-page sponsorship packet (PDF)</a>
	</div>
</section>

<section class="section container container--md">
	<div class="section-header section-header--center">
		<?php fbbf_section_eyebrow( 'why sponsor us' ); ?>
		<?php fbbf_wordmark( 'real-eyeballs', 'real eyeballs, real community', 'display:block;height:clamp(28px,4.5vw,44px);width:auto;max-width:100%;margin:10px auto 0;' ); ?>
		<p class="section-header__body">Dragon boat festivals draw big, active, local crowds — and we're impossible to miss. Your brand rides with us on the boat, the jersey, the tent, and every post.</p>
	</div>
	<div class="impact-stats">
		<?php foreach ( $impact_stats as $s ) : ?>
			<div class="impact-stats__item">
				<div class="impact-stats__value"><?php echo esc_html( $s['value'] ); ?></div>
				<div class="impact-stats__label"><?php echo esc_html( $s['label'] ); ?></div>
			</div>
		<?php endforeach; ?>
	</div>
	<div class="why-cards">
		<?php foreach ( $why_cards as $c ) : ?>
			<div class="why-card">
				<div class="why-card__icon"><?php echo esc_html( $c['icon'] ); ?></div>
				<div class="why-card__title"><?php echo esc_html( $c['title'] ); ?></div>
				<p><?php echo esc_html( $c['body'] ); ?></p>
			</div>
		<?php endforeach; ?>
	</div>
</section>

<section id="sponsor-tiers" class="section section--ocean">
	<div class="container container--lg">
		<div class="section-header section-header--center">
			<?php fbbf_section_eyebrow( 'sponsorship packages' ); ?>
			<?php fbbf_wordmark( 'pick-your-seat-boat', 'pick your seat in the boat', 'display:block;height:clamp(30px,4.5vw,46px);width:auto;max-width:100%;margin:10px auto 0;' ); ?>
			<p class="section-header__body section-header__body--light">Pricing is placeholder — we'll tailor a package to your business. Custom &amp; in-kind sponsorships welcome too.</p>
		</div>
		<div class="tier-cards">
			<?php foreach ( $tiers as $t ) : ?>
				<div class="tier-card <?php echo $t['featured'] ? 'tier-card--featured' : ''; ?>">
					<?php if ( $t['featured'] ) : ?><div class="tier-card__ribbon">most visible</div><?php endif; ?>
					<div class="tier-card__name"><?php echo esc_html( $t['name'] ); ?></div>
					<div class="tier-card__price"><?php echo esc_html( $t['price'] ); ?></div>
					<div class="tier-card__blurb"><?php echo esc_html( $t['blurb'] ); ?></div>
					<ul class="tier-card__perks">
						<?php foreach ( $t['perks'] as $perk ) : ?>
							<li><span class="tier-card__check">✔</span><span><?php echo esc_html( $perk ); ?></span></li>
						<?php endforeach; ?>
					</ul>
					<a href="#sponsor-inquire" class="btn <?php echo $t['featured'] ? 'btn--fire' : 'btn--navy'; ?> btn--block tier-select" data-tier="<?php echo esc_attr( $t['name'] ); ?>">choose <?php echo esc_html( $t['name'] ); ?></a>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<section class="section container container--md">
	<div class="trust-card">
		<div class="trust-card__icon">🛡️</div>
		<div>
			<div class="trust-card__title">a registered 501(c)(3) nonprofit</div>
			<p>Fire Breathing Blowfish is a federally recognized tax-exempt nonprofit. Sponsorships and donations are <strong>tax-deductible</strong> to the fullest extent allowed by law — we'll send a receipt for your records. Funds go straight to <strong>boat time, race entry fees, travel, and gear</strong> so the whole crew can compete.</p>
			<div class="trust-card__facts">
				<span><strong>EIN:</strong> 45-4172338</span>
				<span><strong>Founded:</strong> 2009</span>
				<span><strong>Location:</strong> Portland, OR</span>
			</div>
		</div>
	</div>
</section>

<section class="section section--navy">
	<div class="container container--md">
		<div class="section-header section-header--center">
			<?php fbbf_section_eyebrow( 'in good company' ); ?>
			<?php fbbf_wordmark( '2026-sponsors', '2026 sponsors', 'display:block;height:clamp(26px,4vw,40px);width:auto;max-width:100%;margin:10px auto 0;' ); ?>
		</div>
		<div class="sponsor-wall">
			<?php if ( $sponsors ) : foreach ( $sponsors as $s ) : ?>
				<div class="sponsor-wall__tile">
					<?php if ( $s['logo'] ) : ?>
						<?php if ( $s['url'] ) : ?>
							<a href="<?php echo esc_url( $s['url'] ); ?>" target="_blank" rel="noopener"><img src="<?php echo esc_url( $s['logo'] ); ?>" alt="<?php echo esc_attr( $s['name'] ); ?>" /></a>
						<?php else : ?>
							<img src="<?php echo esc_url( $s['logo'] ); ?>" alt="<?php echo esc_attr( $s['name'] ); ?>" />
						<?php endif; ?>
					<?php else : ?>
						<span class="sponsor-wall__name"><?php echo esc_html( $s['name'] ); ?></span>
					<?php endif; ?>
				</div>
			<?php endforeach; else : ?>
				<p style="color:rgba(255,255,255,.7);">Add sponsors under <strong>Sponsors</strong> in wp-admin to fill this wall.</p>
			<?php endif; ?>
		</div>
	</div>
</section>

<section id="sponsor-inquire" class="section section--night">
	<div class="container container--sm">
		<div class="section-header section-header--center">
			<?php fbbf_section_eyebrow( "let's talk" ); ?>
			<?php fbbf_wordmark( 'become-a-sponsor', 'become a sponsor', 'display:block;height:clamp(30px,4.5vw,46px);width:auto;max-width:100%;margin:10px auto 0;' ); ?>
			<p class="section-header__body section-header__body--light">Tell us a little about your business and we'll follow up with a tailored package within a couple days.</p>
		</div>
		<div class="sponsor-form-card">
			<form id="sponsor-inquiry-form" class="sponsor-form" novalidate>
				<label>
					<span>Your name</span>
					<input type="text" name="name" placeholder="Jordan Kim" required />
				</label>
				<label>
					<span>Business</span>
					<input type="text" name="business" placeholder="Riverside Brewing" />
				</label>
				<label>
					<span>Email</span>
					<input type="email" name="email" placeholder="you@business.com" required />
				</label>
				<label>
					<span>Interested tier</span>
					<select name="tier" id="sponsor-tier-select">
						<option value="gold">gold — $750+</option>
						<option value="silver">silver — $400–$749</option>
						<option value="bronze">bronze — up to $399</option>
						<option value="custom">custom / in-kind</option>
					</select>
				</label>
				<button type="submit" class="btn btn--fire btn--block">send inquiry ✈️</button>
				<div class="sponsor-form__fallback">or email us directly at <a href="mailto:thefirebreathingblowfish@gmail.com">thefirebreathingblowfish@gmail.com</a></div>
			</form>
			<div id="sponsor-inquiry-success" class="sponsor-form-success" hidden>
				<div class="sponsor-form-success__emoji">🎉</div>
				<div class="heading-display sponsor-form-success__title">thanks, <span id="sponsor-inquiry-first-name">friend</span>!</div>
				<p>We'll be in touch at <span id="sponsor-inquiry-email"></span> soon. WE BREATHE FIRE! 🔥</p>
			</div>
		</div>
	</div>
</section>

<?php get_footer(); ?>
