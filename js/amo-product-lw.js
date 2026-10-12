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
function setPrice(cur,base){var e=$("pPrice");e.replaceChildren();if(!(cur>0)){e.textContent="Liên hệ AMO để được tư vấn";return}e.appendChild(document.createTextNode(money(cur)));if(base>cur){var o=document.createElement("s");o.className="old";o.textContent=money(base);e.appendChild(o);var f=document.createElement("span");f.className="off";f.textContent="-"+Math.round((1-cur/base)*100)+"%";e.appendChild(f)}}
function toast(t){var d=document.getElementById("lwToast");if(!d){d=document.createElement("div");d.id="lwToast";d.setAttribute("role","status");document.body.appendChild(d)}d.textContent=t;clearTimeout(toast.t);toast.t=setTimeout(function(){d.remove()},7000)}
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
  setPrice(product.price,product.compare);
  $("pZalo").setAttribute("aria-label","Hỏi shop về "+product.name);
  $("pZalo").onclick=function(){
    var sz=selected&&selected.size?" - size "+selected.size:"";
    var msg="Chào shop, mình muốn hỏi về sản phẩm: "+product.name+sz+"\n"+location.href.split("#")[0];
    var ok=false;try{if(navigator.clipboard){navigator.clipboard.writeText(msg);ok=true}}catch(e){}if(!ok){try{var ta=document.createElement("textarea");ta.value=msg;ta.style.cssText="position:fixed;opacity:0";document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove()}catch(e){}}
    toast("Đã sao chép link sản phẩm. Mở Zalo rồi Dán (Ctrl+V) và Gửi.");say("Đã sao chép link sản phẩm - dán vào Zalo để gửi shop.");
  };
  gallery(product.images||[]);
  var box=$("pOpts");box.replaceChildren();
  var cols=[];product.variants.forEach(function(v){if(v.color&&cols.indexOf(v.color)<0)cols.push(v.color)});
  var cbox=$("pColors");if(!cbox&&cols.length){cbox=document.createElement("div");cbox.id="pColors";cbox.className=box.className;var sl=box.previousElementSibling;if(cols.length&&sl){var cl=document.createElement("div");cl.className="lab";cl.textContent="Chọn màu";sl.parentNode.insertBefore(cl,sl);sl.parentNode.insertBefore(cbox,sl)}}
  if(cbox)cbox.replaceChildren();selected=null;
  var curColor=cols[0]||"";
  function drawSizes(){
    box.replaceChildren();
    product.variants.filter(function(v){return !cols.length||v.color===curColor}).forEach(function(v){
      var b=document.createElement("button");b.type="button";b.textContent=v.size;b.disabled=v.available<=0;b.setAttribute("aria-pressed",String(selected===v));b.dataset.id=v.id;
      b.onclick=function(){selected=v;if(v.price>0)setPrice(v.price,v.base);Array.prototype.forEach.call(box.children,function(x){x.setAttribute("aria-pressed",String(x===b))});say("")};
      box.appendChild(b)});
  }
  if(cols.length&&cbox){cols.forEach(function(c){var b=document.createElement("button");b.type="button";b.textContent=c;b.setAttribute("aria-pressed",String(c===curColor));
    b.onclick=function(){curColor=c;selected=null;Array.prototype.forEach.call(cbox.children,function(x){x.setAttribute("aria-pressed",String(x===b))});drawSizes();say("")};cbox.appendChild(b)})}
  drawSizes();
  var meta=[];if(product.material)meta.push("Chất liệu: "+product.material);if(product.origin)meta.push("Xuất xứ: "+product.origin);
  if(meta.length)$("pDesc").textContent=(product.desc?product.desc+"\n":"")+meta.join(" · ");
  if(product.badge)$("pCat").textContent=(product.cat||"AMO NGUYỄN")+" · "+product.badge;
  if(product.demo)$("pNote").textContent="Đây là sản phẩm mẫu để xem giao diện. Shop sẽ cập nhật hình ảnh, giá và tồn kho thật khi đăng hàng. Chưa thể đặt hàng sản phẩm mẫu.";
  if(!product.variants.length){$("pAdd").disabled=true;say("Vui lòng liên hệ AMO để biết tình trạng hàng.")}
  if(/[?&]buy=1/.test(location.search)){var ob=$("pOpts");if(ob&&ob.scrollIntoView)ob.scrollIntoView({block:"center"});if(!selected)say("Chọn size rồi bấm Mua ngay.")}
  lw().apply();
}
function add(go){
  if(!selected)return say("Vui lòng chọn size.");
  var q=Math.max(1,Math.min(20,Number($("pQty").value)||1));
  if(q>selected.available)return say("Số lượng vượt tồn kho (còn "+selected.available+").");
  var up=selected.price>0?selected.price:product.price;if(!(up>0))return say("Giá đang được xác nhận. Vui lòng liên hệ AMO.");
  var c=cart(),x=c.find(function(i){return i.variant_id===selected.id});
  if(x)x.qty=Math.min(selected.available,Number(x.qty||0)+q);
  else c.push({variant_id:selected.id,product_id:product.id,name:product.name,sku:selected.sku,size:selected.size+(selected.color?" · "+selected.color:""),price:up,image:(product.images||[])[0]||"",qty:q,demo:!!product.demo});
  saveCart(c);if(go===true){location.href="checkout.html";return}say("Đã thêm vào giỏ hàng.");
}
function fromDemo(d){
  return{id:d.id,name:d.name,cat:d.cat,price:d.price,desc:d.desc,images:d.images,demo:true,
    variants:d.sizes.map(function(s){return{id:d.id+"-"+s,sku:d.id.toUpperCase()+"-"+s,size:s,available:d.available}})};
}
function fromEngine(w){
  return{id:w.id,name:w.name,cat:w.cat||"",price:Number(w.price||0),desc:String(w.description||"").trim(),compare:Number(w.compare||0),material:w.material||"",origin:w.origin||"",badge:w.badge||"",images:(w.images||[]).map(function(i){return typeof i==="string"?i:i&&i.url}).filter(Boolean),demo:false,
    variants:(w.variants||[]).map(function(v){return{id:v.id,sku:v.sku,size:v.size||v.color||"Free",color:v.color||"",base:Number(v.base_price||0),price:Number(v.price||0),available:Number(v.available||0)}})};
}
function start(){
  if(!window.AMO_LW){setTimeout(start,40);return}
  $("pAdd").onclick=function(){add()};$("pBuy").onclick=function(){add(true)};
  if(!key)return fail();
  var d=lw().demo.filter(function(x){return x.slug===key})[0];
  if(d){product=fromDemo(d);return render()}
  fetch(lw().engine+"/api/public/product?store="+lw().store+"&slug="+encodeURIComponent(key)).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(w){
    product=fromEngine(w);render();
  }).catch(fail);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
