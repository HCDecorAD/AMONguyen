/* AMO trang chi tiết sản phẩm: hàng mẫu (demo-xx) hoặc sản phẩm WooCommerce theo slug */
(function(){
"use strict";
var $=function(i){return document.getElementById(i)};
var key=new URLSearchParams(location.search).get("p")||"";
var product=null,selected=null;
function lw(){return window.AMO_LW}
function money(n){return lw().money(n)}
function cart(){try{var x=JSON.parse(localStorage.getItem("AMO_CART")||"[]");return Array.isArray(x)?x:[]}catch(e){return[]}}
function saveCart(c){try{localStorage.setItem("AMO_CART",JSON.stringify(c))}catch(e){}lw().refreshCart()}
function say(t){$("pMsg").textContent=t}
function fail(){
  $("pName").textContent="Không tìm thấy sản phẩm";
  $("pDesc").textContent="Sản phẩm này không còn hoặc đường dẫn chưa đúng. Anh/chị xem các sản phẩm khác hoặc nhắn Zalo để shop tư vấn.";
  $("pPrice").textContent="";$("pAdd").disabled=true;$("pOpts").replaceChildren();
}
function gallery(imgs){
  var m=$("gMain"),t=$("gThumbs");m.replaceChildren();t.replaceChildren();
  if(!imgs.length){m.textContent="Hình ảnh đang cập nhật";return}
  function show(i){var im=document.createElement("img");im.src=imgs[i];im.alt=product.name;m.replaceChildren(im);Array.prototype.forEach.call(t.children,function(b,j){b.setAttribute("aria-current",String(i===j))})}
  imgs.forEach(function(u,i){if(imgs.length<2)return;var b=document.createElement("button");b.type="button";b.setAttribute("aria-label","Ảnh "+(i+1));var im=document.createElement("img");im.src=u;im.alt="";b.appendChild(im);b.onclick=function(){show(i)};t.appendChild(b)});
  show(0);
}
function render(){
  document.title=product.name+" | AMO NGUYỄN";
  $("pCat").textContent=product.cat||"AMO NGUYỄN";
  $("pName").textContent=product.name;
  $("pDesc").textContent=product.desc||"";
  $("pPrice").textContent=product.price>0?money(product.price):"Liên hệ AMO để được tư vấn";
  $("pZalo").setAttribute("aria-label","Hỏi shop về "+product.name);
  gallery(product.images||[]);
  var box=$("pOpts");box.replaceChildren();
  product.variants.forEach(function(v){
    var b=document.createElement("button");b.type="button";b.textContent=v.size;b.disabled=v.available<=0;b.setAttribute("aria-pressed","false");b.dataset.id=v.id;
    b.onclick=function(){selected=v;if(v.price>0)$("pPrice").textContent=money(v.price);Array.prototype.forEach.call(box.children,function(x){x.setAttribute("aria-pressed",String(x===b))});say("")};
    box.appendChild(b)});
  if(product.demo)$("pNote").textContent="Đây là sản phẩm mẫu để xem giao diện. Shop sẽ cập nhật hình ảnh, giá và tồn kho thật khi đăng hàng. Chưa thể đặt hàng sản phẩm mẫu.";
  if(!product.variants.length){$("pAdd").disabled=true;say("Vui lòng liên hệ AMO để biết tình trạng hàng.")}
  lw().apply();
}
function add(){
  if(!selected)return say("Vui lòng chọn size.");
  var q=Math.max(1,Math.min(20,Number($("pQty").value)||1));
  if(q>selected.available)return say("Số lượng vượt tồn kho (còn "+selected.available+").");
  var up=selected.price>0?selected.price:product.price;if(!(up>0))return say("Giá đang được xác nhận. Vui lòng liên hệ AMO.");
  var c=cart(),x=c.find(function(i){return i.variant_id===selected.id});
  if(x)x.qty=Math.min(selected.available,Number(x.qty||0)+q);
  else c.push({variant_id:selected.id,product_id:product.id,name:product.name,sku:selected.sku,size:selected.size,price:up,image:(product.images||[])[0]||"",qty:q,demo:!!product.demo});
  saveCart(c);say("Đã thêm vào giỏ hàng.");
}
function fromDemo(d){
  return{id:d.id,name:d.name,cat:d.cat,price:d.price,desc:d.desc,images:d.images,demo:true,
    variants:d.sizes.map(function(s){return{id:d.id+"-"+s,sku:d.id.toUpperCase()+"-"+s,size:s,available:d.available}})};
}
function fromEngine(w){
  return{id:w.id,name:w.name,cat:w.cat||"",price:Number(w.price||0),desc:String(w.description||"").trim(),images:w.images||[],demo:false,
    variants:(w.variants||[]).map(function(v){return{id:v.id,sku:v.sku,size:v.size||v.color||"Free",price:Number(v.price||0),available:Number(v.available||0)}})};
}
function start(){
  if(!window.AMO_LW){setTimeout(start,40);return}
  $("pAdd").onclick=add;
  if(!key)return fail();
  var d=lw().demo.filter(function(x){return x.slug===key})[0];
  if(d){product=fromDemo(d);return render()}
  fetch(lw().engine+"/api/public/product?store="+lw().store+"&slug="+encodeURIComponent(key)).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(w){
    product=fromEngine(w);render();
  }).catch(fail);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
