<?php

class Whizzie {

	public function __construct() {
		$this->init();
	}

	public function init()
	{
	
	}

	public static function shoes_store_elementor_setup_widgets(){

		set_theme_mod( 'shoes_store_elementor_header_advertisement_text', '100% Secure Delivery' );
		set_theme_mod( 'shoes_store_elementor_header_wishlist_url', '#' );
		set_theme_mod( 'shoes_store_elementor_header_button_text', 'Contact' );
		set_theme_mod( 'shoes_store_elementor_header_button_url', '#' );

	$shoes_store_elementor_product_image_gallery = array();
	$shoes_store_elementor_product_ids = array();

	$shoes_store_elementor_product_category= array(
		'Product Category'       => array(
			'Nike Kyrie 7 TB Midnight',
			'Preventing Sneaker Bots',
			'RS X CNV Sneakers',
			'Cali Kari Sneakers',
		),
	);

	$shoes_store_elementor_k = 1;
	foreach ( $shoes_store_elementor_product_category as $shoes_store_elementor_product_cats => $shoes_store_elementor_products_name ) { 
	// Insert porduct cats Start
	$content = 'This is sample product category';
	$shoes_store_elementor_parent_category	=	wp_insert_term(
	$shoes_store_elementor_product_cats, // the term
	'product_cat', // the taxonomy
		array(
		'description'=> $content,
		'slug' => str_replace( ' ', '-', $shoes_store_elementor_product_cats)
		)
	);

// -------------- create subcategory END -----------------

	$shoes_store_elementor_n=1;
	// create Product START
	foreach ( $shoes_store_elementor_products_name as $key => $shoes_store_elementor_product_title ) {
	$content = '
		<div class="main_content">
		<p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p>
		</div>';

	// Create post object
	$shoes_store_elementor_my_post = array(
		'post_title'    => wp_strip_all_tags( $shoes_store_elementor_product_title ),
		'post_content'  => $content,
		'post_status'   => 'publish',
		'post_type'     => 'product',
		'post_category' => [$shoes_store_elementor_parent_category['term_id']]
	);

	// Insert the post into the database

	$shoes_store_elementor_uqpost_id = wp_insert_post($shoes_store_elementor_my_post);
	wp_set_object_terms( $shoes_store_elementor_uqpost_id, str_replace( ' ', '-', $shoes_store_elementor_product_cats), 'product_cat', true );

	$shoes_store_elementor_price = array('600','600','600','600');
	$shoes_store_elementor_regular_price = array('600','600','600','600');
	$shoes_store_elementor_sale_price = array('400','400','400','400');
	
	update_post_meta( $shoes_store_elementor_uqpost_id, '_price', $shoes_store_elementor_price[$shoes_store_elementor_n-1] );
	update_post_meta( $shoes_store_elementor_uqpost_id, '_regular_price', $shoes_store_elementor_regular_price[$shoes_store_elementor_n-1] );
	update_post_meta( $shoes_store_elementor_uqpost_id, '_sale_price', $shoes_store_elementor_sale_price[$shoes_store_elementor_n-1] );
	array_push( $shoes_store_elementor_product_ids,  $shoes_store_elementor_uqpost_id );

	// Now replace meta w/ new updated value array
	$shoes_store_elementor_image_url = get_template_directory_uri().'/assets/images/product/'.$shoes_store_elementor_product_cats.'/' . str_replace(' ', '_', strtolower($shoes_store_elementor_product_title)).'.png';
	$shoes_store_elementor_image_name  = $shoes_store_elementor_product_title.'.png';
	$shoes_store_elementor_upload_dir = wp_upload_dir();
	// Set upload folder
	$shoes_store_elementor_image_data = file_get_contents(esc_url($shoes_store_elementor_image_url));
	// Get image data
	$unique_file_name = wp_unique_filename($shoes_store_elementor_upload_dir['path'], $shoes_store_elementor_image_name);
	// Generate unique name
	$shoes_store_elementor_filename = basename($unique_file_name);
	// Create image file name
	// Check folder permission and define file location
	if (wp_mkdir_p($shoes_store_elementor_upload_dir['path'])) {
	$shoes_store_elementor_file = $shoes_store_elementor_upload_dir['path'].'/'.$shoes_store_elementor_filename;
	} else {
	$shoes_store_elementor_file = $shoes_store_elementor_upload_dir['basedir'].'/'.$shoes_store_elementor_filename;
	}
	
	file_put_contents($shoes_store_elementor_file, $shoes_store_elementor_image_data);
	// Check image file type
	$wp_filetype = wp_check_filetype($shoes_store_elementor_filename, null);
	// Set attachment data
	$attachment = array(
	'post_mime_type' => $wp_filetype['type'],
	'post_title'     => sanitize_file_name($shoes_store_elementor_filename),
	'post_type'      => 'product',
	'post_status'    => 'inherit',
	);

	// Create the attachment
	$shoes_store_elementor_attach_id = wp_insert_attachment($attachment, $shoes_store_elementor_file, $shoes_store_elementor_uqpost_id);

	// Define attachment metadata
	$attach_data = wp_generate_attachment_metadata($shoes_store_elementor_attach_id, $shoes_store_elementor_file);

	// Assign metadata to attachment
	wp_update_attachment_metadata($shoes_store_elementor_attach_id, $attach_data);
	if ( count( $shoes_store_elementor_product_image_gallery ) < 3 ) {
		array_push( $shoes_store_elementor_product_image_gallery, $shoes_store_elementor_attach_id );
	}
	// // And finally assign featured image to post
	set_post_thumbnail($shoes_store_elementor_uqpost_id, $shoes_store_elementor_attach_id);
	++$shoes_store_elementor_n;
	}
	// Create product END
	++$shoes_store_elementor_k;
	}
	// Add Gallery in first simple product and second variable product START
	$shoes_store_elementor_product_image_gallery = implode( ',', $shoes_store_elementor_product_image_gallery );
	foreach ( $shoes_store_elementor_product_ids as $shoes_store_elementor_product_id ) {
	update_post_meta( $shoes_store_elementor_product_id, 'shoes_store_elementor_product_image_gallery', $shoes_store_elementor_product_image_gallery );
	}

	/* Create Menu */
            $shoes_store_elementor_menuname  = 'Main Menu';
            $shoes_store_elementor_location  = 'main-menu';

            $shoes_store_elementor_menu = wp_get_nav_menu_object( $shoes_store_elementor_menuname );

            if ( ! $shoes_store_elementor_menu ) {
            $shoes_store_elementor_menu_id = wp_create_nav_menu( $shoes_store_elementor_menuname );

           // Home Page 
			wp_update_nav_menu_item( $shoes_store_elementor_menu_id, 0, array(
				'menu-item-title'     => __( 'Home', 'shoes-store-elementor' ),
				'menu-item-url'       => home_url( '/' ),
				'menu-item-type'      => 'custom',
				'menu-item-status'    => 'publish',
				'menu-item-position'  => 1,
			) );

			// About Us Page 
			$shoes_store_elementor_about_id = wp_insert_post( array(
			'post_type'   => 'page',
			'post_content' => 'We are committed to providing reliable, professional, and result-oriented solutions tailored to meet individual needs. Our goal is to empower people with the right guidance, knowledge, and support to help them make informed decisions for a better future. <br><br> Our mission is to deliver high-quality services with honesty, transparency, and dedication. We focus on understanding client requirements and offering practical solutions that create long-term value. <br><br> With a client-centric approach, experienced professionals, and a commitment to excellence, we ensure every individual receives the attention and guidance they deserve. We believe in building trust through quality service and consistent results.',
			'post_title'  => 'About Us',
			'post_status' => 'publish',
			) );

			if ( $shoes_store_elementor_about_id ) {
			wp_update_nav_menu_item( $shoes_store_elementor_menu_id, 0, array(
			'menu-item-title'     => 'About Us',
			'menu-item-object'    => 'page',
			'menu-item-object-id' => $shoes_store_elementor_about_id,
			'menu-item-type'      => 'post_type',
			'menu-item-status'    => 'publish',
            'menu-item-position'  => 2,
			) );
			}

			// Man Page 
			$shoes_store_elementor_about_id = wp_insert_post( array(
			'post_type'   => 'page',
			'post_content' => 'We are committed to providing reliable, professional, and result-oriented solutions tailored to meet individual needs. Our goal is to empower people with the right guidance, knowledge, and support to help them make informed decisions for a better future. <br><br> Our mission is to deliver high-quality services with honesty, transparency, and dedication. We focus on understanding client requirements and offering practical solutions that create long-term value. <br><br> With a client-centric approach, experienced professionals, and a commitment to excellence, we ensure every individual receives the attention and guidance they deserve. We believe in building trust through quality service and consistent results.',
			'post_title'  => 'Man',
			'post_status' => 'publish',
			) );

			if ( $shoes_store_elementor_about_id ) {
			wp_update_nav_menu_item( $shoes_store_elementor_menu_id, 0, array(
			'menu-item-title'     => 'Man',
			'menu-item-object'    => 'page',
			'menu-item-object-id' => $shoes_store_elementor_about_id,
			'menu-item-type'      => 'post_type',
			'menu-item-status'    => 'publish',
            'menu-item-position'  => 3,
			) );
			}

			// Women Page 
			$shoes_store_elementor_about_id = wp_insert_post( array(
			'post_type'   => 'page',
			'post_content' => 'We are committed to providing reliable, professional, and result-oriented solutions tailored to meet individual needs. Our goal is to empower people with the right guidance, knowledge, and support to help them make informed decisions for a better future. <br><br> Our mission is to deliver high-quality services with honesty, transparency, and dedication. We focus on understanding client requirements and offering practical solutions that create long-term value. <br><br> With a client-centric approach, experienced professionals, and a commitment to excellence, we ensure every individual receives the attention and guidance they deserve. We believe in building trust through quality service and consistent results.',
			'post_title'  => 'Women',
			'post_status' => 'publish',
			) );

			if ( $shoes_store_elementor_about_id ) {
			wp_update_nav_menu_item( $shoes_store_elementor_menu_id, 0, array(
			'menu-item-title'     => 'Women',
			'menu-item-object'    => 'page',
			'menu-item-object-id' => $shoes_store_elementor_about_id,
			'menu-item-type'      => 'post_type',
			'menu-item-status'    => 'publish',
            'menu-item-position'  => 3,
			) );
			}

			// Contact Us Page 
			$shoes_store_elementor_about_id = wp_insert_post( array(
			'post_type'   => 'page',
			'post_content' => 'We are committed to providing reliable, professional, and result-oriented solutions tailored to meet individual needs. Our goal is to empower people with the right guidance, knowledge, and support to help them make informed decisions for a better future. <br><br> Our mission is to deliver high-quality services with honesty, transparency, and dedication. We focus on understanding client requirements and offering practical solutions that create long-term value. <br><br> With a client-centric approach, experienced professionals, and a commitment to excellence, we ensure every individual receives the attention and guidance they deserve. We believe in building trust through quality service and consistent results.',
			'post_title'  => 'Contact Us',
			'post_status' => 'publish',
			) );

			if ( $shoes_store_elementor_about_id ) {
			wp_update_nav_menu_item( $shoes_store_elementor_menu_id, 0, array(
			'menu-item-title'     => 'Contact Us',
			'menu-item-object'    => 'page',
			'menu-item-object-id' => $shoes_store_elementor_about_id,
			'menu-item-type'      => 'post_type',
			'menu-item-status'    => 'publish',
            'menu-item-position'  => 4,
			) );
			}

			// Pages Page 
			$shoes_store_elementor_about_id = wp_insert_post( array(
			'post_type'   => 'page',
			'post_content' => 'We are committed to providing reliable, professional, and result-oriented solutions tailored to meet individual needs. Our goal is to empower people with the right guidance, knowledge, and support to help them make informed decisions for a better future. <br><br> Our mission is to deliver high-quality services with honesty, transparency, and dedication. We focus on understanding client requirements and offering practical solutions that create long-term value. <br><br> With a client-centric approach, experienced professionals, and a commitment to excellence, we ensure every individual receives the attention and guidance they deserve. We believe in building trust through quality service and consistent results.',
			'post_title'  => 'Pages',
			'post_status' => 'publish',
			) );

			if ( $shoes_store_elementor_about_id ) {
			wp_update_nav_menu_item( $shoes_store_elementor_menu_id, 0, array(
			'menu-item-title'     => 'Pages',
			'menu-item-object'    => 'page',
			'menu-item-object-id' => $shoes_store_elementor_about_id,
			'menu-item-type'      => 'post_type',
			'menu-item-status'    => 'publish',
            'menu-item-position'  => 4,
			) );
			}

            // Create Shop Page
                $shoes_store_elementor_about_title = 'Shop';
                $shoes_store_elementor_about_content = 'Lorem ipsum dolor sit amet...';

                $shop_page = get_page_by_path('shop');
                if ( !$shop_page ) {
                    $shoes_store_elementor_about = array(
                        'post_type'   => 'page',
                        'post_title'  => $shoes_store_elementor_about_title,
                        'post_content'=> $shoes_store_elementor_about_content,
                        'post_status' => 'publish',
                        'post_author' => 1,
                        'post_name'   => 'shop' 
                        );
                        $shoes_store_elementor_about_id = wp_insert_post($shoes_store_elementor_about);
                    } else {
                        $shoes_store_elementor_about_id = $shop_page->ID;
                    }

                    wp_update_nav_menu_item($shoes_store_elementor_menu_id, 0, array(
                        'menu-item-title'   => __('Shop', 'shoes-store-elementor'),
                        'menu-item-classes' => 'shop',
                        'menu-item-object-id' => $shoes_store_elementor_about_id,
                        'menu-item-object'  => 'page',
                        'menu-item-type'    => 'post_type',
                        'menu-item-status'  => 'publish'
                    ));
            
			/* ---------- Assign Menu Location ---------- */
			$shoes_store_elementor_locations = get_theme_mod( 'nav_menu_locations', array() );
			$shoes_store_elementor_locations[ $shoes_store_elementor_location ] = $shoes_store_elementor_menu_id;
			set_theme_mod( 'nav_menu_locations', $shoes_store_elementor_locations );
		}
    }
}
 