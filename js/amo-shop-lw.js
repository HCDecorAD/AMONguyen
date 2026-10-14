/* AMO trang Sản phẩm: lọc size / thương hiệu / còn hàng + tìm kiếm + sắp xếp */
(function(){
"use strict";
var all=[],$=function(id){return document.getElementById(id)};
var qs=new URLSearchParams(location.search);
function checked(n){return Array.prototype.map.call(document.querySelectorAll('input[name="'+n+'"]:checked'),function(i){return i.value.toLowerCase()})}
function render(){
  var q=($("amoSearch").value||"").trim().toLowerCase(),sort=$("amoSort").value,br=checked("brand"),ct=checked("category"),st=$("lwStock").checked;
  var a=all.filter(function(p){
    if(q&&((p.name||"")+" "+(p.brand||"")+" "+(p.cat||"")).toLowerCase().indexOf(q)<0)return false;
    if(br.length&&br.indexOf(String(p.brand||"khác").toLowerCase())<0)return false;
    if(ct.length&&ct.indexOf(String(p.cat||"").toLowerCase())<0)return false;
    if(st&&!p.available)return false;return true});
  if(sort==="price-asc")a.sort(function(x,y){return(x.price||1e15)-(y.price||1e15)});
  if(sort==="price-desc")a.sort(function(x,y){return(y.price||0)-(x.price||0)});
  var g=$("amoProductGrid");g.replaceChildren();a.forEach(function(p){g.appendChild(AMO_LW.card(p))});
  $("amoEmptyState").hidden=a.length>0;
  var en=document.documentElement.lang==="en";
  $("lwCount").textContent=en?"Showing "+a.length+" results":"Hiển thị "+a.length+" kết quả";
  AMO_LW.apply();
}
function start(){
  if(!window.AMO_LW){setTimeout(start,50);return}
  ["amoSearch","amoSort","lwStock"].forEach(function(i){$(i).addEventListener(i==="amoSearch"?"input":"change",render)});
  document.querySelectorAll('.lw-filter input[name]').forEach(function(i){i.addEventListener("change",render)});
  var b=qs.get("brand"),q=qs.get("q"),c=qs.get("cat");
  if(q)$("amoSearch").value=q;
  if(b)document.querySelectorAll('input[name="brand"]').forEach(function(i){if(i.value.toLowerCase()===b.toLowerCase())i.checked=true});
  if(c)document.querySelectorAll('input[name="category"]').forEach(function(i){if(i.dataset.slug===c)i.checked=true});
  AMO_LW.load(function(list){all=list;render()});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
