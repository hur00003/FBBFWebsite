<?php
/**
 * Home page: video hero, marquee, stats bar, quick-nav cards, Instagram
 * teaser, join CTA band.
 */
if ( ! defined( 'ABSPATH' ) ) exit;
get_header();

$home_cards = array(
	array( 'emoji' => '🐉', 'title' => 'who we are', 'body' => 'Sixteen years of racing, hollering, and Portland pride.', 'cta' => 'meet the crew', 'url' => home_url( '/about/' ) ),
	array( 'emoji' => '🌊', 'title' => 'race with us', 'body' => 'Catch us on the water across the PNW this season.', 'cta' => 'see the schedule', 'url' => home_url( '/races/' ) ),
	array( 'emoji' => '🔥', 'title' => 'gear up', 'body' => 'Jerseys, hoodies, hats — wear the fire.', 'cta' => 'shop merch', 'url' => home_url( '/merch/' ) ),
	array( 'emoji' => '❤️', 'title' => 'fuel the fire', 'body' => 'Tax-deductible gifts keep us paddling.', 'cta' => 'donate now', 'url' => home_url( '/donate/' ) ),
);
$stats = array(
	array( 'value' => '16+', 'label' => 'Years on the water' ),
	array( 'value' => '20', 'label' => 'Paddlers per boat' ),
	array( 'value' => '40+', 'label' => 'Podium finishes' ),
	array( 'value' => '501(c)(3)', 'label' => 'Nonprofit crew' ),
);
$insta_photos = fbbf_get_gallery_photos( 'home-instagram' );
?>

<section class="hero hero--home">
	<video class="hero__video" autoplay muted loop playsinline poster="<?php echo esc_url( fbbf_asset( 'images/team-boat-race.jpeg' ) ); ?>">
		<source src="<?php echo esc_url( fbbf_asset( 'video/fbbf-hero.mp4' ) ); ?>" type="video/mp4" />
	</video>
	<div class="hero__scrim hero__scrim--home"></div>
	<div class="hero__content container">
		<div class="hero__copy fbbf-rise">
			<span class="pill pill--red">WE BREATHE FIRE!</span>
			<?php fbbf_wordmark( 'fire-breathing-blowfish', 'Fire Breathing Blowfish', 'display:block;width:min(560px,90%);height:auto;margin:22px 0 0;' ); ?>
			<p class="hero__lede">Portland's <em>THAT team</em> — a dragon boat crew that paddles hot, finishes first, and throws the best party on the water.</p>
			<div class="hero__actions">
				<a href="<?php echo esc_url( home_url( '/about/' ) ); ?>" class="btn btn--fire btn--outlined">come paddle with us</a>
				<a href="<?php echo esc_url( home_url( '/donate/' ) ); ?>" class="btn btn--ghost-light">support the crew</a>
			</div>
		</div>
	</div>
	<img src="<?php echo esc_url( fbbf_asset( 'images/fbbf-mascot-web.png' ) ); ?>" alt="mascot" class="hero__mascot hero__mascot--home fbbf-bob" />
</section>

<section class="marquee">
	<div class="marquee__track">
		<?php for ( $i = 0; $i < 16; $i++ ) : ?>
			<span class="marquee__item">WE BREATHE FIRE! <span aria-hidden="true">🔥</span></span>
		<?php endfor; ?>
	</div>
</section>

<section class="stats-bar">
	<div class="stats-bar__grid container">
		<?php foreach ( $stats as $s ) : ?>
			<div class="stats-bar__item">
				<div class="stats-bar__value"><?php echo esc_html( $s['value'] ); ?></div>
				<div class="stats-bar__label"><?php echo esc_html( $s['label'] ); ?></div>
			</div>
		<?php endforeach; ?>
	</div>
</section>

<section class="section container">
	<div class="section-header section-header--center">
		<?php fbbf_section_eyebrow( 'jump in' ); ?>
		<?php fbbf_wordmark( 'find-your-lane', 'find your lane', 'display:block;height:clamp(32px,5vw,50px);width:auto;max-width:100%;margin:10px auto 0;' ); ?>
	</div>
	<div class="home-cards">
		<?php foreach ( $home_cards as $c ) : ?>
			<a class="home-card" href="<?php echo esc_url( $c['url'] ); ?>">
				<div class="home-card__emoji"><?php echo esc_html( $c['emoji'] ); ?></div>
				<div class="home-card__title"><?php echo esc_html( $c['title'] ); ?></div>
				<p class="home-card__body"><?php echo esc_html( $c['body'] ); ?></p>
				<span class="home-card__cta"><?php echo esc_html( $c['cta'] ); ?> →</span>
			</a>
		<?php endforeach; ?>
	</div>
</section>

<section class="section section--sunk">
	<div class="container">
		<div class="insta-header">
			<div>
				<?php fbbf_section_eyebrow( 'on instagram' ); ?>
				<h2 class="heading-display">follow the fire</h2>
				<p class="insta-header__body">Tag <strong>@thefirebreathingblowfish</strong> or <strong>#WeBreatheFire</strong> in your race-day shots — we repost our favorites.</p>
			</div>
			<div class="insta-header__followers">
				<div class="insta-header__count">500+</div>
				<div class="insta-header__label">followers</div>
			</div>
		</div>
		<div class="insta-grid">
			<?php foreach ( $insta_photos as $shot ) :
				$insta_href = $shot['instagram_url'] ? $shot['instagram_url'] : 'https://instagram.com/thefirebreathingblowfish';
				?>
				<a class="insta-tile" href="<?php echo esc_url( $insta_href ); ?>" target="_blank" rel="noopener">
					<?php if ( $shot['image'] ) : ?>
						<img src="<?php echo esc_url( $shot['image'] ); ?>" alt="<?php echo esc_attr( $shot['alt'] ); ?>" loading="lazy" />
					<?php else : ?>
						<span class="insta-tile__empty">Drop a post photo</span>
					<?php endif; ?>
					<span class="insta-tile__hover"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="4.3" stroke="white" stroke-width="2"/><circle cx="17.6" cy="6.4" r="1.15" fill="white"/></svg></span>
				</a>
			<?php endforeach; ?>
		</div>
		<div class="insta-follow">
			<a href="https://instagram.com/thefirebreathingblowfish" target="_blank" rel="noopener" class="btn btn--navy">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.3" stroke="currentColor" stroke-width="2"/><circle cx="17.6" cy="6.4" r="1.15" fill="currentColor"/></svg>
				follow @thefirebreathingblowfish
			</a>
		</div>
	</div>
</section>

<section class="cta-band cta-band--fire">
	<div class="container container--sm cta-band__inner">
		<?php fbbf_wordmark( 'never-held-a-paddle', 'never held a paddle? perfect.', 'display:block;height:clamp(58px,12vw,116px);width:auto;max-width:100%;margin:0 auto;' ); ?>
		<p class="cta-band__body">That's how most of us started. All bodies, all levels, all welcome. We'll teach you everything — you bring the fire.</p>
		<a href="<?php echo esc_url( home_url( '/about/' ) ); ?>" class="btn btn--navy btn--lg">learn how to join</a>
	</div>
</section>

<?php get_footer(); ?>
