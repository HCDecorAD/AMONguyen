/* AMO: header + footer dùng chung, giỏ hàng, sáng/tối, VN/EN, dữ liệu sản phẩm */
(function(){
"use strict";
var LS="hc-amo-lang",lang="vi";
try{lang=localStorage.getItem(LS)==="en"?"en":"vi"}catch(e){}
var ROOT=(function(){var s=document.currentScript||document.querySelector('script[src*="amo-localwp.js"]');var u=s?s.getAttribute("src"):"js/amo-localwp.js";return u.replace(/js\/amo-localwp\.js.*$/,"")})();
var NAV=[["index.html","Trang chủ","Home"],["shop.html","Sản phẩm","Products"],["story.html","Giới thiệu","About"],["policy.html","Chính sách","Policy"],["contact.html","Liên hệ","Contact"]];
var path=(location.pathname.split("/").pop()||"index.html");
var ENGINE="https://hc-shop-engine.huycuongonline.workers.dev",STORE="store_amo";
var SOC=[["https://www.facebook.com/profile.php?id=100083708970226", "Facebook Fanpage", "M13.5 22v-9h3l.5-3h-3.5V8.1c0-.9.3-1.6 1.7-1.6H17V3.8c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5V10H7v3h3v9h3.5z"], ["https://www.facebook.com/nguyen.amo.2024/", "Facebook AMO", "M13.5 22v-9h3l.5-3h-3.5V8.1c0-.9.3-1.6 1.7-1.6H17V3.8c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5V10H7v3h3v9h3.5z"], ["https://www.tiktok.com/@amo_3651", "TikTok AMO 3651", "M16 3c.4 2.2 1.7 3.6 4 4v3c-1.6 0-3-.5-4-1.3V15a6 6 0 1 1-5-5.9v3.1a3 3 0 1 0 2 2.8V3h3z"], ["https://www.tiktok.com/@cuoi.moi.ngay365", "TikTok C\u01b0\u1eddi M\u1ed7i Ng\u00e0y 365", "M16 3c.4 2.2 1.7 3.6 4 4v3c-1.6 0-3-.5-4-1.3V15a6 6 0 1 1-5-5.9v3.1a3 3 0 1 0 2 2.8V3h3z"], ["https://www.youtube.com/@AMO-NGUYEN", "YouTube AMO NGUY\u1ec4N", "M23 7.2s-.2-1.7-.9-2.4c-.8-.9-1.8-.9-2.2-1C16.8 3.5 12 3.5 12 3.5s-4.8 0-7.9.3c-.4.1-1.4.1-2.2 1C1.2 5.5 1 7.2 1 7.2S.8 9.2.8 11.1v1.8c0 2 .2 3.9.2 3.9s.2 1.7.9 2.4c.8.9 1.9.9 2.4 1 1.8.2 7.7.3 7.7.3s4.8 0 7.9-.3c.4-.1 1.4-.1 2.2-1 .7-.7.9-2.4.9-2.4s.2-2 .2-3.9v-1.8c0-2-.2-3.9-.2-3.9zM9.7 15.3V8.5l6.2 3.4-6.2 3.4z"], ["https://zalo.me/84932680592", "Zalo AMO NGUY\u1ec4N", "M12 2C6.5 2 2 5.8 2 10.5c0 2.7 1.5 5.1 3.8 6.7L5 22l4.3-2.4c.9.2 1.8.4 2.7.4 5.5 0 10-3.8 10-8.5S17.5 2 12 2zm-5 7h5v2l-2.5 3H12v2H7v-2l2.5-3H7V9zm6 0h2v7h-2V9zm3 0h2v5h3v2h-5V9z"]];
var DESC="Giày da nam tuyển chọn kỹ, form đẹp, dễ phối đồ. Đây là sản phẩm mẫu để xem giao diện, thông tin thật sẽ được cập nhật khi shop đăng hàng.";
var SIZES=["37-37.5","38-38.5","39-39.5","40-40.5","41-41.5","42-42.5","43-43.5","44-44.5","45-45.5"];
var DEMO=[1,2,3,4,5,6,7,8].map(function(n){var im=(((n-1)%6)+1);return{id:"demo-0"+n,slug:"demo-0"+n,demo:true,name:"Giày mẫu 0"+n+" (demo)",cat:n<5?"Giày Sneaker":"Giày công sở",price:3000000,image:ROOT+"assets/images/demo/shoe-demo-"+im+".jpg",images:[ROOT+"assets/images/demo/shoe-demo-"+im+".jpg",ROOT+"assets/images/demo/shoe-demo-"+(im%6+1)+".jpg"],desc:DESC,sizes:SIZES.slice(),available:5,brand:n%2?"Gucci":"Khác"}});
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function money(n){return new Intl.NumberFormat("vi-VN").format(Number(n))+" ₫"}
function svg(d,fill){var s=document.createElementNS("http://www.w3.org/2000/svg","svg");s.setAttribute("viewBox","0 0 24 24");s.setAttribute("aria-hidden","true");var p=document.createElementNS("http://www.w3.org/2000/svg","path");p.setAttribute("d",d);s.appendChild(p);return s}
function cartCount(){try{var a=JSON.parse(localStorage.getItem("AMO_CART")||"[]");return Array.isArray(a)?a.reduce(function(s,x){return s+(Number(x.qty)||0)},0):0}catch(e){return 0}}

var langBtn,badge;
function header(){
  var h=el("header","lw-header"),w=el("div","lw-head"),b=el("a","lw-brand");b.href=ROOT+"index.html";
  var im=el("img");im.src=ROOT+"assets/images/amo-logo-new.jpg";im.alt="AMO NGUYỄN";b.appendChild(im);b.appendChild(el("span",null,"AMO NGUYỄN"));
  var n=el("nav","lw-nav");n.setAttribute("aria-label","Menu chính");
  NAV.forEach(function(x){var a=el("a",null,lang==="en"?x[2]:x[1]);a.href=ROOT+x[0];a.dataset.vi=x[1];a.dataset.en=x[2];if(path===x[0]||((path==="p.html"||path==="product.html")&&x[0]==="shop.html"))a.setAttribute("aria-current","page");n.appendChild(a)});
  var t=el("div","lw-tools");
  langBtn=el("button",null,lang==="en"?"VN":"EN");langBtn.type="button";langBtn.setAttribute("aria-label","Đổi ngôn ngữ / Switch language");
  langBtn.onclick=function(){lang=lang==="en"?"vi":"en";try{localStorage.setItem(LS,lang)}catch(e){}apply()};
  var th=el("button","lw-ico");th.type="button";th.setAttribute("data-theme-toggle","");th.title="Sáng / Tối";
  var ca=el("a","lw-ico");ca.href=ROOT+"cart.html";ca.setAttribute("aria-label","Giỏ hàng");
  var cs=svg("M3 4h2.2l2.1 10.2a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.5L20.5 8H6.1M10 20.2h.01M17 20.2h.01");ca.appendChild(cs);
  badge=el("span","lw-badge","0");badge.hidden=true;ca.appendChild(badge);
  var ac=el("a","lw-ico");ac.href=ROOT+"account.html";ac.setAttribute("aria-label","Tài khoản");ac.title="Tài khoản";
  ac.appendChild(svg("M12 12.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4zM4.5 20.2c.6-3.6 3.7-5.6 7.5-5.6s6.9 2 7.5 5.6"));
  try{if(localStorage.getItem("HCC_TOKEN_store_amo")){ac.classList.add("on");ac.title="Tài khoản của tôi"}}catch(e){}
  t.appendChild(langBtn);t.appendChild(th);t.appendChild(ac);t.appendChild(ca);
  w.appendChild(b);w.appendChild(n);w.appendChild(t);h.appendChild(w);
  document.querySelectorAll(".amo-new-top,.amo-new-header,.amo-header,.amo-mobile-nav").forEach(function(x){x.remove()});
  document.body.insertBefore(h,document.body.firstChild);
}
function refreshCart(){if(!badge)return;var c=cartCount();badge.textContent=c>99?"99+":String(c);badge.hidden=c<1}
function footer(){
  document.querySelectorAll(".amo-new-footer,.amo-new-cta,.amo-footer").forEach(function(x){x.remove()});
  var f=el("footer","lw-footer"),g=el("div","lw-foot");
  var a=el("div");a.appendChild(el("h3",null,"AMO NGUYỄN"));a.appendChild(el("p",null,"Shop giày si hiệu nam. Chọn giày có gu, bước đi có chất."));
  var so=el("div","lw-social");SOC.forEach(function(s){var l=el("a");l.href=s[0];l.target="_blank";l.rel="noopener";l.setAttribute("aria-label",s[1]);l.title=s[1];l.appendChild(svg(s[2]));so.appendChild(l)});a.appendChild(so);
  var b=el("div");b.appendChild(el("h3",null,"Liên hệ"));
  function line(k,v,href){var p=el("p");var kb=el("b",null,k+" ");p.appendChild(kb);if(href){var l=el("a",null,v);l.href=href;p.appendChild(l)}else p.appendChild(document.createTextNode(v));b.appendChild(p)}
  line("Hotline / Zalo:","093.268.0592","tel:0932680592");
  line("Email:","Kathy.nguyen171@gmail.com","mailto:Kathy.nguyen171@gmail.com");
  line("Địa chỉ:","Vinhomes Grand Park, Nguyễn Xiển, Phường Long Thạnh Mỹ, Thủ Đức, TP.HCM");
  g.appendChild(a);g.appendChild(b);f.appendChild(g);f.appendChild(el("div","lw-copy","© AMO NGUYỄN · Shop giày si hiệu nam"));
  document.body.appendChild(f);
}
function floats(){
  var f=el("div","lw-float");
  var z=el("a","zl","Zalo");z.href="https://zalo.me/84932680592";z.target="_blank";z.rel="noopener";z.setAttribute("aria-label","Chat Zalo");
  var s=el("a","fb","f");s.href="https://www.facebook.com/nguyen.amo.2024/";s.target="_blank";s.rel="noopener";s.setAttribute("aria-label","Facebook AMO Nguyễn");
  f.appendChild(z);f.appendChild(s);document.body.appendChild(f);
}
var mo=null,moT=0;
function translateTree(){
  var M=window.AMO_I18N;if(!M)return;
  document.querySelectorAll("main *, footer *, .lw-filter *").forEach(function(e){
    var t=e.tagName;if(t==="SCRIPT"||t==="STYLE"||t==="INPUT"||t==="SELECT"||t==="TEXTAREA"||t==="IFRAME"||t==="SVG"||t==="svg"||t==="path")return;
    if(e.hasAttribute("placeholder")){if(e._ph===undefined&&M[e.getAttribute("placeholder")])e._ph=e.getAttribute("placeholder");if(e._ph!==undefined)e.setAttribute("placeholder",lang==="en"?M[e._ph]:e._ph)}
    if(e.children.length||e.dataset.vi)return;
    var raw=e.textContent,m=raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if(e._vi===undefined){if(!m[2]||!Object.prototype.hasOwnProperty.call(M,m[2]))return;e._vi=m[2];e._ws=[m[1],m[3]]}
    e.textContent=e._ws[0]+(lang==="en"?M[e._vi]:e._vi)+e._ws[1];
  });
}
function apply(){
  if(mo)mo.disconnect();
  document.documentElement.lang=lang;
  document.querySelectorAll("[data-vi][data-en]").forEach(function(e){e.textContent=lang==="en"?e.dataset.en:e.dataset.vi});
  translateTree();
  if(langBtn)langBtn.textContent=lang==="en"?"VN":"EN";
  watch();
}
function watch(){
  if(!window.MutationObserver)return;
  if(!mo)mo=new MutationObserver(function(){clearTimeout(moT);moT=setTimeout(function(){if(lang==="en")apply()},120)});
  var m=document.querySelector("main");if(m)mo.observe(m,{childList:true,subtree:true});
}
function card(p){
  var a=el("a","lw-card");a.href=ROOT+"product.html?p="+encodeURIComponent(p.slug||p.id||"");
  var im=el("div","im");if(p.image){var i=el("img");i.src=p.image;i.alt=p.name||"";i.loading="lazy";im.appendChild(i)}else im.textContent="Hình ảnh đang cập nhật";
  a.appendChild(im);a.appendChild(el("div","ct",p.cat||""));a.appendChild(el("div","nm",p.name||""));
  if(p.price)a.appendChild(el("div","pr",money(p.price)));
  var bt=el("div","bt","Chọn tùy chọn");bt.dataset.vi="Chọn tùy chọn";bt.dataset.en="Select options";a.appendChild(bt);return a;
}
function inRange(label,v){var m=String(label).replace(/\s/g,"").match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/),n=parseFloat(v);if(m)return n>=parseFloat(m[1])&&n<=parseFloat(m[2]);return String(label)===String(v)}
function attr(p,re){var o=[];(p.attributes||[]).forEach(function(a){if(re.test(a.name||""))(a.terms||[]).forEach(function(t){o.push(t.name)})});return o}
function load(cb){
  var done=false;function fin(l){if(done)return;done=true;cb(l)}
  setTimeout(function(){fin(DEMO)},6000);
  fetch(ENGINE+"/api/public/products?store="+STORE).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){
    var out=(d&&d.items||[]).map(function(p){return{id:p.id,slug:p.slug,name:p.name,cat:p.cat||"",price:Number(p.price||0),image:p.image||"",available:p.available?1:0,brand:p.brand||"",sizes:p.sizes||[]}});
    fin(out.length?out:DEMO);
  }).catch(function(){fin(DEMO)});
}
window.AMO_LW={sizes:SIZES,inRange:inRange,card:card,demo:DEMO,money:money,apply:apply,engine:ENGINE,store:STORE,load:load,root:ROOT,el:el,refreshCart:refreshCart,lang:function(){return lang}};

function home(){
  var g=document.getElementById("lwHomeGrid");if(!g)return;
  load(function(list){g.replaceChildren();list.slice(0,8).forEach(function(p){g.appendChild(card(p))});apply()});
}
/* trang size / thương hiệu */
function listPage(){
  var g=document.getElementById("amoProductGrid");if(!g||!(g.dataset.size||g.dataset.brand))return;
  var sz=g.dataset.size,br=g.dataset.brand,em=document.getElementById("amoEmptyState");
  load(function(list){
    var a=list.filter(function(p){
      if(sz)return (p.sizes||[]).some(function(s){return inRange(sz,s)});
      if(br)return String(p.brand||"khác").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g,"-")===br;
      return true});
    g.replaceChildren();a.forEach(function(p){g.appendChild(card(p))});
    if(em)em.hidden=a.length>0;apply();
  });
}
function init(){
  header();footer();floats();refreshCart();setInterval(refreshCart,1000);
  window.addEventListener("storage",refreshCart);
  home();listPage();apply();
  var sc=document.createElement("script");sc.src=ROOT+"js/amo-i18n.js";sc.onload=apply;document.head.appendChild(sc);
  if(window.__amoTheme)window.__amoTheme();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
