<?php
/**
 * Reusable chunks of markup shared across page templates.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

function fbbf_render_race_card( $race ) {
	$dm     = fbbf_race_day_month( $race['date'], $race['date_end'] );
	$badge  = fbbf_race_badge( $race['result'] );
	$share_text = ! empty( $race['result'] )
		? sprintf( 'Fire Breathing Blowfish took %s at %s! %s — %s! 🔥', ucfirst( $race['result'] ), $race['name'], $race['name'], $race['location'] )
		: sprintf( 'Come cheer on Fire Breathing Blowfish at %s — %s! 🔥', $race['name'], $race['location'] );
	?>
	<div class="race-card <?php echo $race['result'] ? 'race-card--placed' : ''; ?>">
		<div class="race-card__date">
			<div class="race-card__day"><?php echo esc_html( $dm['day'] ); ?></div>
			<div class="race-card__month"><?php echo esc_html( strtoupper( $dm['month'] ) ); ?></div>
		</div>
		<div class="race-card__info">
			<div class="race-card__name"><?php echo esc_html( $race['name'] ); ?></div>
			<div class="race-card__location">📍 <?php echo esc_html( $race['location'] ); ?></div>
		</div>
		<span class="badge <?php echo esc_attr( $badge['class'] ); ?>"><?php echo esc_html( $badge['label'] ); ?></span>
		<?php fbbf_share_button( $race['name'], $share_text ); ?>
	</div>
	<?php
}

/**
 * A Gallery Photo tile's display caption: "Theme · Year" for costume-style
 * entries (both fields set), otherwise its plain caption.
 */
function fbbf_gallery_tile_caption( $tile ) {
	if ( ! empty( $tile['year'] ) && ! empty( $tile['theme'] ) ) {
		return $tile['theme'] . ' · ' . $tile['year'];
	}
	return $tile['caption'];
}

/**
 * One Gallery page tab grid tile: video, photo (with an optional "+N"
 * multi-photo badge that opens the shared lightbox on its own image set),
 * or an empty drop-in slot. Caption renders below the tile.
 */
function fbbf_render_gallery_tile( $tile ) {
	$caption   = fbbf_gallery_tile_caption( $tile );
	$has_video = ! empty( $tile['video'] );
	$has_image = ! empty( $tile['image'] );
	?>
	<div class="gallery-grid__item <?php echo ! empty( $tile['big'] ) ? 'gallery-grid__item--big' : ''; ?>">
		<div class="g-tile">
			<?php if ( $has_video ) : ?>
				<video src="<?php echo esc_url( $tile['video'] ); ?>" autoplay muted loop playsinline></video>
				<?php if ( $tile['badge'] ) : ?><span class="g-tile__badge"><?php echo esc_html( $tile['badge'] ); ?></span><?php endif; ?>
			<?php elseif ( $has_image ) : ?>
				<button type="button" class="g-tile__link" data-images="<?php echo esc_attr( wp_json_encode( $tile['images'] ) ); ?>" data-caption="<?php echo esc_attr( $caption ); ?>" aria-label="<?php echo esc_attr( $caption ? $caption : 'View photo' ); ?>">
					<img src="<?php echo esc_url( $tile['image'] ); ?>" alt="<?php echo esc_attr( $tile['alt'] ? $tile['alt'] : $caption ); ?>" loading="lazy" />
					<?php if ( $tile['extra_count'] > 0 ) : ?><span class="g-tile__count">+<?php echo (int) $tile['extra_count']; ?></span><?php endif; ?>
				</button>
				<?php if ( $tile['badge'] ) : ?><span class="g-tile__badge"><?php echo esc_html( $tile['badge'] ); ?></span><?php endif; ?>
			<?php else : ?>
				<div class="g-tile__empty">Drop a photo or clip here</div>
			<?php endif; ?>
		</div>
		<?php if ( $caption && $has_image ) : ?>
			<div class="gallery-grid__caption"><?php echo esc_html( $caption ); ?></div>
		<?php endif; ?>
	</div>
	<?php
}

/**
 * One Race Day Gallery tile: same video/photo/empty logic and the same
 * lightbox multi-photo support as the Gallery page tabs, but with the
 * caption as a gradient overlay on the tile itself instead of below it.
 */
function fbbf_render_rdg_tile( $tile ) {
	$caption   = fbbf_gallery_tile_caption( $tile );
	$has_video = ! empty( $tile['video'] );
	$has_image = ! empty( $tile['image'] );
	?>
	<div class="rdg-tile">
		<?php if ( $has_video ) : ?>
			<video src="<?php echo esc_url( $tile['video'] ); ?>" controls playsinline></video>
			<?php if ( $tile['badge'] ) : ?><span class="rdg-tile__badge"><?php echo esc_html( $tile['badge'] ); ?></span><?php endif; ?>
		<?php elseif ( $has_image ) : ?>
			<button type="button" class="g-tile__link" data-images="<?php echo esc_attr( wp_json_encode( $tile['images'] ) ); ?>" data-caption="<?php echo esc_attr( $caption ); ?>" aria-label="<?php echo esc_attr( $caption ? $caption : 'View photo' ); ?>">
				<img src="<?php echo esc_url( $tile['image'] ); ?>" alt="<?php echo esc_attr( $tile['alt'] ? $tile['alt'] : $caption ); ?>" loading="lazy" />
				<?php if ( $tile['extra_count'] > 0 ) : ?><span class="g-tile__count">+<?php echo (int) $tile['extra_count']; ?></span><?php endif; ?>
				<?php if ( $caption ) : ?><span class="rdg-tile__caption"><?php echo esc_html( $caption ); ?></span><?php endif; ?>
			</button>
		<?php else : ?>
			<div class="rdg-tile__empty">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
				<div><?php echo esc_html( $tile['caption'] ? $tile['caption'] : 'Drop a photo or clip here' ); ?></div>
			</div>
		<?php endif; ?>
	</div>
	<?php
}

function fbbf_section_eyebrow( $text ) {
	printf( '<div class="section-eyebrow">%s</div>', esc_html( $text ) );
}
