/* AMO: header chung, nút Zalo/Facebook, chuyển VN/EN, lưới sản phẩm trang chủ */
(function(){
"use strict";
var LS="hc-amo-lang",lang="vi";
try{lang=localStorage.getItem(LS)==="en"?"en":"vi"}catch(e){}
var NAV=[["index.html","Trang chủ","Home"],["shop.html","Sản phẩm","Products"],["story.html","Giới thiệu","About"],["policy.html","Chính sách","Policy"],["contact.html","Liên hệ","Contact"]];
var path=(location.pathname.split("/").pop()||"index.html");
var API="https://hcdecorhub.com/wp-json/wc/store/v1";
var DEMO=[1,2,3,4,5,6,7,8].map(function(n){return{name:"Giày mẫu 0"+n+" (demo)",cat:n<5?"Giày Sneaker":"Giày công sở",price:3000000,image:"assets/images/demo/shoe-demo-"+(((n-1)%6)+1)+".jpg",slug:""}});
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function money(n){return new Intl.NumberFormat("vi-VN").format(Number(n))+" ₫"}

function header(){
  var h=el("header","lw-header"),w=el("div","lw-head"),b=el("a","lw-brand");b.href="index.html";
  var im=el("img");im.src="assets/images/amo-logo-new.jpg";im.alt="AMO NGUYỄN";b.appendChild(im);b.appendChild(el("span",null,"AMO NGUYỄN"));
  var n=el("nav","lw-nav");n.setAttribute("aria-label","Menu chính");
  NAV.forEach(function(x){var a=el("a",null,lang==="en"?x[2]:x[1]);a.href=x[0];a.dataset.vi=x[1];a.dataset.en=x[2];if(path===x[0]||(path==="p.html"&&x[0]==="shop.html"))a.setAttribute("aria-current","page");n.appendChild(a)});
  var l=el("button",null,lang==="en"?"VN":"EN");l.type="button";l.setAttribute("aria-label","Đổi ngôn ngữ / Switch language");
  l.onclick=function(){lang=lang==="en"?"vi":"en";try{localStorage.setItem(LS,lang)}catch(e){}apply()};
  n.appendChild(l);w.appendChild(b);w.appendChild(n);h.appendChild(w);
  var old=document.querySelector(".amo-new-top");if(old)old.remove();
  var oh=document.querySelector(".amo-new-header");if(oh)oh.replaceWith(h);else document.body.insertBefore(h,document.body.firstChild);
  return l;
}
var langBtn;
function apply(){
  document.documentElement.lang=lang;
  document.querySelectorAll("[data-vi][data-en]").forEach(function(e){e.textContent=lang==="en"?e.dataset.en:e.dataset.vi});
  if(langBtn)langBtn.textContent=lang==="en"?"VN":"EN";
}
function floats(){
  var f=el("div","lw-float");
  var z=el("a","zl","Zalo");z.href="https://zaloapp.com/qr/p/1s3r599zmwd4m?src=qr";z.target="_blank";z.rel="noopener";z.setAttribute("aria-label","Chat Zalo");
  var s=el("a","fb","f");s.href="https://www.facebook.com/nguyen.amo.2024/";s.target="_blank";s.rel="noopener";s.setAttribute("aria-label","Facebook AMO Nguyễn");
  f.appendChild(z);f.appendChild(s);document.body.appendChild(f);
}
function card(p){
  var a=el("a","lw-card");a.href="product.html?p="+encodeURIComponent(p.slug||p.id||"");
  var im=el("div","im");if(p.image){var i=el("img");i.src=p.image;i.alt=p.name||"";i.loading="lazy";im.appendChild(i)}else im.textContent="Hình ảnh đang cập nhật";
  a.appendChild(im);a.appendChild(el("div","ct",p.cat||""));a.appendChild(el("div","nm",p.name||""));
  if(p.price)a.appendChild(el("div","pr",money(p.price)));
  var bt=el("div","bt","Chọn tùy chọn");bt.dataset.vi="Chọn tùy chọn";bt.dataset.en="Select options";a.appendChild(bt);return a;
}
function attr(p,re){var o=[];(p.attributes||[]).forEach(function(a){if(re.test(a.name||""))(a.terms||[]).forEach(function(t){o.push(t.name)})});return o}
window.AMO_LW={card:card,demo:DEMO,money:money,apply:apply,api:API,
  load:function(cb){
    fetch(API+"/products?per_page=100").then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){
      var out=(Array.isArray(d)?d:[]).filter(function(p){return String(p.sku||"").indexOf("AMO-")===0}).map(function(p){
        var mu=Math.pow(10,Number(p.prices&&p.prices.currency_minor_unit||0));
        return{id:p.id,slug:p.slug,name:p.name,cat:(p.categories&&p.categories[0]&&p.categories[0].name)||"",price:Number(p.prices&&p.prices.price||0)/mu,image:p.images&&p.images[0]&&p.images[0].src||"",available:p.is_in_stock?1:0,brand:attr(p,/th.{0,3}ng hi|brand/i)[0]||"",sizes:attr(p,/size/i)}});
      cb(out.length?out:DEMO);
    }).catch(function(){cb(DEMO)});
  }};

function home(){
  var g=document.getElementById("lwHomeGrid");if(!g)return;
  window.AMO_LW.load(function(list){g.replaceChildren();list.slice(0,8).forEach(function(p){g.appendChild(card(p))});apply()});
}
function init(){langBtn=header();floats();home();apply()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
