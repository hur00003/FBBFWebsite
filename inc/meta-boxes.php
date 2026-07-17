<?php
/**
 * Generic, hand-rolled meta-box registration — no ACF or other plugin
 * dependency. Each CPT file calls fbbf_register_meta_box() with a plain
 * array describing its fields, and gets a labeled admin form + save
 * handling for free.
 *
 * Field shape: [ 'label' => string, 'type' => text|url|date|number|select|textarea|checkbox|hidden,
 *                 'description' => string (optional), 'placeholder' => string (optional),
 *                 'options' => [ value => label ] (for select), 'checkbox_label' => string (for checkbox) ]
 */

if ( ! defined( 'ABSPATH' ) ) exit;

function fbbf_register_meta_box( $post_type, $box_id, $title, $fields ) {
	add_action( 'add_meta_boxes', function () use ( $post_type, $box_id, $title, $fields ) {
		add_meta_box(
			$box_id,
			$title,
			function ( $post ) use ( $fields, $box_id ) {
				wp_nonce_field( $box_id . '_nonce', $box_id . '_nonce_field' );
				foreach ( $fields as $key => $field ) {
					$value = get_post_meta( $post->ID, $key, true );
					echo '<p>';
					printf(
						'<label style="display:block;font-weight:600;margin-bottom:4px;" for="%s">%s</label>',
						esc_attr( $key ),
						esc_html( $field['label'] )
					);
					if ( ! empty( $field['description'] ) ) {
						printf( '<span style="display:block;color:#666;font-size:12px;margin-bottom:4px;">%s</span>', esc_html( $field['description'] ) );
					}
					fbbf_render_meta_field( $key, $field, $value );
					echo '</p>';
				}
			},
			$post_type,
			'normal',
			'high'
		);
	} );

	add_action( 'save_post_' . $post_type, function ( $post_id ) use ( $fields, $box_id ) {
		if ( ! isset( $_POST[ $box_id . '_nonce_field' ] ) ||
			! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ $box_id . '_nonce_field' ] ) ), $box_id . '_nonce' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
		if ( ! current_user_can( 'edit_post', $post_id ) ) return;

		foreach ( $fields as $key => $field ) {
			$type = isset( $field['type'] ) ? $field['type'] : 'text';

			// Checkboxes never appear in $_POST when unchecked, so they need
			// to be handled unconditionally rather than skipped like other
			// fields — otherwise unchecking one would never actually save.
			if ( 'checkbox' === $type ) {
				update_post_meta( $post_id, $key, isset( $_POST[ $key ] ) ? '1' : '' );
				continue;
			}

			if ( ! isset( $_POST[ $key ] ) ) continue;
			$raw = wp_unslash( $_POST[ $key ] );
			$clean = ( 'textarea' === $type )
				? sanitize_textarea_field( $raw )
				: sanitize_text_field( $raw );
			update_post_meta( $post_id, $key, $clean );
		}
	} );
}

function fbbf_render_meta_field( $key, $field, $value ) {
	$type = isset( $field['type'] ) ? $field['type'] : 'text';
	$placeholder = isset( $field['placeholder'] ) ? $field['placeholder'] : '';

	switch ( $type ) {
		case 'checkbox':
			printf(
				'<label style="font-weight:400;"><input type="checkbox" name="%s" id="%s" value="1" %s /> %s</label>',
				esc_attr( $key ), esc_attr( $key ), checked( $value, '1', false ), esc_html( isset( $field['checkbox_label'] ) ? $field['checkbox_label'] : 'Yes' )
			);
			break;

		case 'hidden':
			printf( '<input type="hidden" name="%s" id="%s" value="%s" />', esc_attr( $key ), esc_attr( $key ), esc_attr( $value ) );
			break;

		case 'select':
			echo '<select style="width:100%;max-width:420px;" name="' . esc_attr( $key ) . '" id="' . esc_attr( $key ) . '">';
			foreach ( $field['options'] as $opt_value => $opt_label ) {
				printf(
					'<option value="%s" %s>%s</option>',
					esc_attr( $opt_value ),
					selected( $value, $opt_value, false ),
					esc_html( $opt_label )
				);
			}
			echo '</select>';
			break;

		case 'textarea':
			printf(
				'<textarea style="width:100%%;max-width:520px;" rows="3" name="%s" id="%s" placeholder="%s">%s</textarea>',
				esc_attr( $key ), esc_attr( $key ), esc_attr( $placeholder ), esc_textarea( $value )
			);
			break;

		case 'date':
		case 'number':
		case 'url':
			printf(
				'<input type="%s" style="width:100%%;max-width:420px;" name="%s" id="%s" value="%s" placeholder="%s" />',
				esc_attr( $type ), esc_attr( $key ), esc_attr( $key ), esc_attr( $value ), esc_attr( $placeholder )
			);
			break;

		default:
			printf(
				'<input type="text" style="width:100%%;max-width:420px;" name="%s" id="%s" value="%s" placeholder="%s" />',
				esc_attr( $key ), esc_attr( $key ), esc_attr( $value ), esc_attr( $placeholder )
			);
	}
}
