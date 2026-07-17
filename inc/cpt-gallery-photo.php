<?php
/**
 * Gallery Photo — one post per photo/video tile, used by:
 *  - the Home page's Instagram teaser (via the original "Section" field —
 *    left exactly as-is, do not remove/rename; nothing else uses it anymore)
 *  - the Gallery page's tabbed sub-gallery and the Race Day Gallery page
 *    (via the newer "Gallery Category" taxonomy below — this is what the
 *    client uses going forward for those two pages)
 *
 * A tab on the Gallery page = a "Gallery Category" term. Adding a new term
 * automatically adds a new tab, in the order set on the term's edit screen —
 * no template change needed. "Best Of The Blowfish" is the one exception:
 * it's not a taxonomy term, just a "Featured in Best Of" checkbox on any
 * Gallery Photo post, so it can pull hand-picked photos from any category.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

function fbbf_register_cpt_gallery_photo() {
	register_post_type( 'fbbf_gallery_photo', array(
		'labels' => array(
			'name'          => __( 'Gallery Photos', 'fbbf' ),
			'singular_name' => __( 'Gallery Photo', 'fbbf' ),
			'add_new_item'  => __( 'Add New Gallery Photo', 'fbbf' ),
			'edit_item'     => __( 'Edit Gallery Photo', 'fbbf' ),
		),
		'public'       => true,
		'show_in_menu' => true,
		'menu_icon'    => 'dashicons-format-gallery',
		'supports'     => array( 'title', 'thumbnail', 'page-attributes' ),
		'has_archive'  => false,
		'rewrite'      => false,
		'show_in_rest' => true,
	) );

	register_taxonomy( 'gallery_category', 'fbbf_gallery_photo', array(
		'labels' => array(
			'name'          => __( 'Gallery Categories', 'fbbf' ),
			'singular_name' => __( 'Gallery Category', 'fbbf' ),
			'add_new_item'  => __( 'Add New Gallery Category', 'fbbf' ),
			'edit_item'     => __( 'Edit Gallery Category', 'fbbf' ),
		),
		// Hierarchical so the post-edit screen shows a checkbox list (like
		// the native Categories box) instead of a free-typed tag input —
		// nothing is ever nested, it's just for the friendlier, typo-proof
		// UI. Terms are still ordered by the flat "Tab order" field below,
		// not by parent/child.
		'hierarchical'      => true,
		'public'            => true,
		'show_admin_column' => true,
		'show_in_rest'      => true,
		'rewrite'           => false,
		'description'       => __( 'Each term here becomes one tab on the Gallery page (and one section on Race Day Gallery). The term description shows as that tab\'s sub-heading.', 'fbbf' ),
	) );
}
add_action( 'init', 'fbbf_register_cpt_gallery_photo' );

/* ---- Tab ordering: a plain "Tab order" number field on the term
 *      add/edit screens, stored as term meta, since WordPress has no
 *      built-in custom ordering for taxonomy terms. Lower number = earlier
 *      tab. Terms without a number sort after ones that have it. ---- */
add_action( 'gallery_category_add_form_fields', 'fbbf_gallery_category_add_order_field' );
function fbbf_gallery_category_add_order_field() {
	?>
	<div class="form-field">
		<label for="gallery_tab_order">Tab order</label>
		<input type="number" name="gallery_tab_order" id="gallery_tab_order" value="10" />
		<p>Lower numbers show first. "Best Of The Blowfish" is always first regardless of this.</p>
	</div>
	<?php
}

add_action( 'gallery_category_edit_form_fields', 'fbbf_gallery_category_edit_order_field' );
function fbbf_gallery_category_edit_order_field( $term ) {
	$value = get_term_meta( $term->term_id, 'gallery_tab_order', true );
	?>
	<tr class="form-field">
		<th scope="row"><label for="gallery_tab_order">Tab order</label></th>
		<td>
			<input type="number" name="gallery_tab_order" id="gallery_tab_order" value="<?php echo esc_attr( $value !== '' ? $value : 10 ); ?>" />
			<p class="description">Lower numbers show first. "Best Of The Blowfish" is always first regardless of this.</p>
		</td>
	</tr>
	<?php
}

add_action( 'created_gallery_category', 'fbbf_save_gallery_category_order_field' );
add_action( 'edited_gallery_category', 'fbbf_save_gallery_category_order_field' );
function fbbf_save_gallery_category_order_field( $term_id ) {
	if ( isset( $_POST['gallery_tab_order'] ) ) {
		update_term_meta( $term_id, 'gallery_tab_order', (int) $_POST['gallery_tab_order'] );
	}
}

/**
 * All Gallery Category terms, ordered by the "Tab order" field (falling
 * back to term_id for terms that never got one set).
 */
function fbbf_get_gallery_categories() {
	$terms = get_terms( array(
		'taxonomy'   => 'gallery_category',
		'hide_empty' => false,
	) );
	if ( is_wp_error( $terms ) ) return array();

	usort( $terms, function ( $a, $b ) {
		$order_a = get_term_meta( $a->term_id, 'gallery_tab_order', true );
		$order_b = get_term_meta( $b->term_id, 'gallery_tab_order', true );
		$order_a = ( $order_a === '' ) ? 999999 + $a->term_id : (int) $order_a;
		$order_b = ( $order_b === '' ) ? 999999 + $b->term_id : (int) $order_b;
		return $order_a <=> $order_b;
	} );

	return $terms;
}

/**
 * Custom illustrated wordmarks (assets/images/wordmarks/word-{slug}.svg) for
 * the tabs that had one designed. A tab without an entry here just falls
 * back to a plain text heading — this is how a newly-added Gallery Category
 * (with no matching artwork yet) still works with zero code changes.
 */
function fbbf_gallery_tab_heading_images() {
	return array(
		'best'            => 'best-of-the-blowfish',
		'salem-costumes'  => 'salem-costumes',
		'race-photos'     => 'race-photos',
		'drone'           => 'drone-footage',
	);
}

/**
 * The Gallery page's tab list: the virtual "Best Of" tab (hand-curated via
 * the checkbox meta field, not a real category) followed by every Gallery
 * Category term in tab-order. Adding a term here automatically adds a tab —
 * nothing else to wire up.
 */
function fbbf_get_gallery_tabs() {
	$heading_images = fbbf_gallery_tab_heading_images();

	$tabs = array(
		array(
			'id'             => 'best',
			'label'          => 'Best Of The Blowfish',
			'heading'        => 'the best of the Blowfish',
			'heading_image'  => isset( $heading_images['best'] ) ? $heading_images['best'] : '',
			'description'    => '',
		),
	);

	foreach ( fbbf_get_gallery_categories() as $term ) {
		$tabs[] = array(
			'id'             => $term->slug,
			'label'          => $term->name,
			'heading'        => $term->name,
			'heading_image'  => isset( $heading_images[ $term->slug ] ) ? $heading_images[ $term->slug ] : '',
			'description'    => $term->description,
		);
	}

	return $tabs;
}

/* ---- Meta fields (additive — the original "Section" field used by the
 *      Home page's Instagram teaser is untouched below). ---- */
function fbbf_gallery_photo_sections() {
	return array(
		'home-instagram' => 'Home page — Instagram teaser grid',
	);
}

function fbbf_gallery_photo_fields() {
	return array(
		'gallery_section'          => array(
			'label'       => 'Section (only used by the Home page\'s Instagram teaser — leave blank otherwise)',
			'type'        => 'select',
			'options'     => array( '' => '— not used on Home —' ) + fbbf_gallery_photo_sections(),
			'description' => 'This spot only supports photos, not video — set a Featured Image below. A screenshot works fine for a video post; pair it with the Instagram Post URL field so the tile still links to the real post.',
		),
		'gallery_caption'          => array(
			'label'       => 'Caption',
			'type'        => 'text',
			'placeholder' => 'Paddles up, Portland skyline',
		),
		'gallery_instagram_url'    => array(
			'label'       => 'Instagram Post URL (only used by the Home page\'s Instagram teaser)',
			'type'        => 'url',
			'placeholder' => 'https://instagram.com/p/Cxxxxxxxxxx/',
			'description' => 'Paste the link to the actual Instagram post so this tile opens that post/reel instead of your profile. Grab a screenshot of it for the Featured Image above — Instagram doesn\'t allow linking directly to their photo/video files.',
		),
		'gallery_year'             => array(
			'label'       => 'Year (Salem Costumes only)',
			'type'        => 'number',
			'placeholder' => '2026',
			'description' => 'Only used for costume-parade photos. Fill in both this and Costume theme and the tile\'s caption becomes "Theme · Year" automatically — leave both blank for anything else.',
		),
		'gallery_theme'            => array(
			'label'       => 'Costume theme (Salem Costumes only)',
			'type'        => 'text',
			'placeholder' => 'Farmers Market',
		),
		'gallery_badge'            => array(
			'label'       => 'Badge label (optional)',
			'type'        => 'text',
			'placeholder' => 'Drone · 2026',
			'description' => 'A small tag shown in the corner of the tile itself (not the caption below it) — mainly for video clips, e.g. "Drone · 2026" or "CLIP 1". Leave blank for no badge.',
		),
		'gallery_video_url'        => array(
			'label'       => 'Video File URL (leave blank for a plain photo tile)',
			'type'        => 'url',
			'placeholder' => 'https://example.com/wp-content/uploads/2026/07/clip.mp4',
		),
		'gallery_feature_large'    => array(
			'label'          => 'Feature large in grid',
			'type'           => 'checkbox',
			'checkbox_label' => 'Show this tile bigger (spans 2×2) in the grid',
		),
		'gallery_featured_best_of' => array(
			'label'          => 'Featured in "Best Of The Blowfish"',
			'type'           => 'checkbox',
			'checkbox_label' => 'Show this photo on the Best Of tab, regardless of its category',
		),
		'gallery_extra_images'     => array(
			'label' => 'Additional photos (for a multi-photo tile — see button below)',
			'type'  => 'hidden',
		),
	);
}

fbbf_register_meta_box( 'fbbf_gallery_photo', 'fbbf_gallery_photo_details', __( 'Gallery Photo Details', 'fbbf' ), fbbf_gallery_photo_fields() );

/**
 * "Choose Video" and "Manage Additional Photos" media-library pickers, so
 * the client never has to hand-type a URL or an attachment ID list.
 */
function fbbf_gallery_photo_media_button( $post ) {
	if ( 'fbbf_gallery_photo' !== $post->post_type ) return;
	wp_enqueue_media();

	$extra_ids = array_filter( array_map( 'intval', explode( ',', get_post_meta( $post->ID, 'gallery_extra_images', true ) ) ) );
	$previews  = array();
	foreach ( $extra_ids as $id ) {
		$url = wp_get_attachment_image_url( $id, 'thumbnail' );
		if ( $url ) $previews[] = array( 'id' => $id, 'url' => $url );
	}
	?>
	<div id="fbbf-extra-images-wrap" style="margin:16px 0;padding:16px;background:#f6f7f7;border:1px solid #dcdcde;border-radius:4px;max-width:520px;">
		<strong style="display:block;margin-bottom:8px;">Additional photos (for a multi-photo tile)</strong>
		<p style="color:#666;font-size:12px;margin:0 0 10px;">The Featured Image above is always the tile's cover photo. Anything added here shows in the lightbox when someone clicks the tile — a "+N" badge appears automatically.</p>
		<div id="fbbf-extra-images-preview" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
			<?php foreach ( $previews as $p ) : ?>
				<img src="<?php echo esc_url( $p['url'] ); ?>" data-id="<?php echo esc_attr( $p['id'] ); ?>" style="width:60px;height:60px;object-fit:cover;border-radius:4px;border:1px solid #ccc;" />
			<?php endforeach; ?>
		</div>
		<button type="button" class="button" id="fbbf-choose-extra-images">Manage Additional Photos</button>
	</div>
	<script>
	(function(){
		document.addEventListener('DOMContentLoaded', function () {
			var videoField = document.getElementById('gallery_video_url');
			if (videoField) {
				var videoBtn = document.createElement('button');
				videoBtn.type = 'button';
				videoBtn.className = 'button';
				videoBtn.style.marginLeft = '8px';
				videoBtn.textContent = 'Choose Video';
				videoField.insertAdjacentElement('afterend', videoBtn);
				videoBtn.addEventListener('click', function () {
					var frame = wp.media({
						title: 'Choose a video',
						library: { type: 'video' },
						button: { text: 'Use this video' },
						multiple: false,
					});
					frame.on('select', function () {
						var attachment = frame.state().get('selection').first().toJSON();
						videoField.value = attachment.url;
					});
					frame.open();
				});
			}

			var extraField = document.getElementById('gallery_extra_images');
			var extraBtn = document.getElementById('fbbf-choose-extra-images');
			var preview = document.getElementById('fbbf-extra-images-preview');
			if (!extraField || !extraBtn) return;

			function currentIds() {
				return (extraField.value || '').split(',').map(function(s){return parseInt(s,10);}).filter(function(n){return !isNaN(n);});
			}
			function renderPreview(attachments) {
				preview.innerHTML = '';
				attachments.forEach(function (a) {
					var img = document.createElement('img');
					img.src = (a.sizes && a.sizes.thumbnail) ? a.sizes.thumbnail.url : a.url;
					img.setAttribute('data-id', a.id);
					img.style.cssText = 'width:60px;height:60px;object-fit:cover;border-radius:4px;border:1px solid #ccc;';
					preview.appendChild(img);
				});
			}

			extraBtn.addEventListener('click', function () {
				var frame = wp.media({
					title: 'Manage Additional Photos',
					library: { type: 'image' },
					button: { text: 'Use these photos' },
					multiple: true,
				});
				frame.on('open', function () {
					var selection = frame.state().get('selection');
					currentIds().forEach(function (id) {
						var attachment = wp.media.attachment(id);
						attachment.fetch();
						selection.add(attachment);
					});
				});
				frame.on('select', function () {
					var attachments = frame.state().get('selection').toJSON();
					extraField.value = attachments.map(function(a){ return a.id; }).join(',');
					renderPreview(attachments);
				});
				frame.open();
			});
		});
	})();
	</script>
	<?php
}
add_action( 'edit_form_after_editor', 'fbbf_gallery_photo_media_button' );

/**
 * A single Gallery Photo post's full tile data, including its image set
 * (featured image + any additional photos) for the lightbox.
 */
function fbbf_gallery_photo_tile_data( $post ) {
	$thumb_id   = get_post_thumbnail_id( $post->ID );
	$feature    = $thumb_id ? wp_get_attachment_image_url( $thumb_id, 'large' ) : '';
	$alt        = $thumb_id ? get_post_meta( $thumb_id, '_wp_attachment_image_alt', true ) : '';
	$extra_ids  = array_filter( array_map( 'intval', explode( ',', get_post_meta( $post->ID, 'gallery_extra_images', true ) ) ) );
	$images     = array();
	if ( $feature ) $images[] = $feature;
	foreach ( $extra_ids as $id ) {
		$url = wp_get_attachment_image_url( $id, 'large' );
		if ( $url ) $images[] = $url;
	}

	return array(
		'id'      => $post->ID,
		'caption' => get_post_meta( $post->ID, 'gallery_caption', true ),
		'year'    => get_post_meta( $post->ID, 'gallery_year', true ),
		'theme'   => get_post_meta( $post->ID, 'gallery_theme', true ),
		'badge'   => get_post_meta( $post->ID, 'gallery_badge', true ),
		'video'   => get_post_meta( $post->ID, 'gallery_video_url', true ),
		'big'     => (bool) get_post_meta( $post->ID, 'gallery_feature_large', true ),
		'image'   => $feature,
		'alt'     => $alt ? $alt : get_post_meta( $post->ID, 'gallery_caption', true ),
		'images'  => $images,
		'extra_count' => max( 0, count( $images ) - 1 ),
	);
}

/**
 * Photos for one Gallery Category tab (or the "best" virtual tab), newest
 * first, with a limit/offset for pagination ("load more").
 */
function fbbf_get_gallery_tab_photos( $tab, $limit = -1, $offset = 0 ) {
	$args = array(
		'post_type'      => 'fbbf_gallery_photo',
		'posts_per_page' => $limit,
		'offset'         => $offset,
		'orderby'        => 'menu_order date',
		'order'          => 'ASC',
	);

	if ( 'best' === $tab ) {
		$args['meta_query'] = array( array( 'key' => 'gallery_featured_best_of', 'value' => '1' ) );
	} else {
		$args['tax_query'] = array( array( 'taxonomy' => 'gallery_category', 'field' => 'slug', 'terms' => $tab ) );
	}

	$posts = get_posts( $args );
	return array_map( 'fbbf_gallery_photo_tile_data', $posts );
}

/**
 * Total photo count for one tab, for "load more" has-more checks.
 */
function fbbf_count_gallery_tab_photos( $tab ) {
	$args = array(
		'post_type'      => 'fbbf_gallery_photo',
		'posts_per_page' => -1,
		'fields'         => 'ids',
	);
	if ( 'best' === $tab ) {
		$args['meta_query'] = array( array( 'key' => 'gallery_featured_best_of', 'value' => '1' ) );
	} else {
		$args['tax_query'] = array( array( 'taxonomy' => 'gallery_category', 'field' => 'slug', 'terms' => $tab ) );
	}
	return count( get_posts( $args ) );
}

function fbbf_get_gallery_photos( $section ) {
	$posts = get_posts( array(
		'post_type'      => 'fbbf_gallery_photo',
		'posts_per_page' => -1,
		'orderby'        => 'menu_order',
		'order'          => 'ASC',
		'meta_query'     => array(
			array(
				'key'   => 'gallery_section',
				'value' => $section,
			),
		),
	) );

	return array_map( function ( $post ) {
		return array(
			'id'             => $post->ID,
			'caption'        => get_post_meta( $post->ID, 'gallery_caption', true ),
			'badge'          => get_post_meta( $post->ID, 'gallery_badge', true ),
			'video'          => get_post_meta( $post->ID, 'gallery_video_url', true ),
			'image'          => get_the_post_thumbnail_url( $post->ID, 'large' ),
			'alt'            => get_post_thumbnail_id( $post->ID ) ? get_post_meta( get_post_thumbnail_id( $post->ID ), '_wp_attachment_image_alt', true ) : '',
			'instagram_url'  => get_post_meta( $post->ID, 'gallery_instagram_url', true ),
		);
	}, $posts );
}
