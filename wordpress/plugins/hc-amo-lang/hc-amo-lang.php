<?php
/*
Plugin Name: HC AMO VN EN
Description: Local-first language switcher. Vietnamese default.
Version: 0.1.0
*/
add_action('wp_enqueue_scripts',function(){
$base=plugin_dir_url(__FILE__);
wp_enqueue_style('hc-amo-lang',$base.'amo-lang-switch.css',[], '0.1');
wp_enqueue_script('hc-amo-lang',$base.'amo-lang-switch.js',[], '0.1',true);
});
