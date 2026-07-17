<?php
/**
 * Global site footer: 3-column dark gradient — brand blurb, quick links, contact.
 */
if ( ! defined( 'ABSPATH' ) ) exit;
?>
	</main>

	<footer class="site-footer">
		<div class="site-footer__grid">
			<div class="site-footer__brand">
				<div class="site-footer__brandrow">
					<img src="<?php echo esc_url( fbbf_asset( 'images/fbbf-mascot-web.png' ) ); ?>" alt="mascot" width="56" height="56" />
					<?php fbbf_wordmark( 'fire-breathing-blowfish', 'Fire Breathing Blowfish', 'display:block;width:200px;height:auto;' ); ?>
				</div>
				<p>Portland's dragon boat team since 2009. A registered 501(c)(3) nonprofit. All bodies, all levels, all welcome.</p>
				<div class="site-footer__pill">WE BREATHE FIRE!</div>
			</div>

			<div class="site-footer__links">
				<div class="site-footer__heading">Explore</div>
				<?php foreach ( fbbf_nav_items() as $item ) : ?>
					<a href="<?php echo esc_url( $item['url'] ); ?>"><?php echo esc_html( $item['label'] ); ?></a>
				<?php endforeach; ?>
				<a href="<?php echo esc_url( home_url( '/donate/' ) ); ?>" class="site-footer__donate-link">Donate</a>
			</div>

			<div class="site-footer__contact">
				<div class="site-footer__heading">Connect</div>
				<a href="https://instagram.com/thefirebreathingblowfish" target="_blank" rel="noopener" class="site-footer__instagram">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.3" stroke="currentColor" stroke-width="2"/><circle cx="17.6" cy="6.4" r="1.15" fill="currentColor"/></svg>
					@thefirebreathingblowfish
				</a>
				<a href="https://firebreathingblowfish.com" target="_blank" rel="noopener">firebreathingblowfish.com</a>
				<a href="mailto:thefirebreathingblowfish@gmail.com">thefirebreathingblowfish@gmail.com</a>
			</div>
		</div>
		<div class="site-footer__bottom">
			<span>© <?php echo esc_html( date( 'Y' ) ); ?> Fire Breathing Blowfish. All rights reserved.</span>
			<span>501(c)(3) nonprofit · Portland, OR</span>
		</div>
	</footer>

	<div class="lightbox" id="fbbf-lightbox">
		<button type="button" class="lightbox__close" id="fbbf-lightbox-close" aria-label="Close">
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
		</button>
		<button type="button" class="lightbox__nav lightbox__nav--prev" id="fbbf-lightbox-prev" aria-label="Previous photo">
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
		</button>
		<button type="button" class="lightbox__nav lightbox__nav--next" id="fbbf-lightbox-next" aria-label="Next photo">
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
		</button>
		<figure class="lightbox__frame">
			<img class="lightbox__image" id="fbbf-lightbox-image" src="" alt="" />
			<figcaption class="lightbox__caption" id="fbbf-lightbox-caption"></figcaption>
			<div class="lightbox__counter" id="fbbf-lightbox-counter"></div>
		</figure>
	</div>

</div><!-- .site-shell -->

<?php wp_footer(); ?>
</body>
</html>
