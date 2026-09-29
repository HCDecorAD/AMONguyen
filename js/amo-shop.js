window.AMO=window.AMO||{};
window.AMO.Shop=(function(){
 const API="https://hc-shop-engine.huycuongonline.workers.dev",STORE="store_amo";let products=[];
 const money=n=>new Intl.NumberFormat("vi-VN").format(Number(n||0))+" đ";
 const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 function render(){
  const grid=document.getElementById("amoProductGrid"),empty=document.getElementById("amoEmptyState"),q=(document.getElementById("amoSearch")?.value||"").toLowerCase(),sort=document.getElementById("amoSort")?.value||"newest";
  let a=products.filter(p=>p.status==="active"&&p.name.toLowerCase().includes(q));
  if(sort==="price-asc")a.sort((x,y)=>(x.sale_price??x.price)-(y.sale_price??y.price));if(sort==="price-desc")a.sort((x,y)=>(y.sale_price??y.price)-(x.sale_price??x.price));
  grid.innerHTML=a.map((p,i)=>'<article class="amo-product-card" tabindex="0"><div class="amo-asset-box amo-product-img"><img src="assets/images/demo/shoe-demo-'+((i%5)+1)+'.jpg" alt="'+esc(p.name)+'" class="amo-asset-img" loading="lazy"></div><div class="amo-product-info"><h3 class="amo-product-name">'+esc(p.name)+'</h3><p class="amo-product-status">'+money(p.sale_price??p.price)+'</p></div></article>').join("");
  empty.style.display=a.length?"none":"block";
 }
 async function init(){const grid=document.getElementById("amoProductGrid");if(!grid)return;try{const r=await fetch(API+"/api/products",{headers:{"x-store-id":STORE}}),d=await r.json();products=d.items||[];render()}catch(e){console.warn("HC Shop API unavailable",e)}
  document.getElementById("amoSearch")?.addEventListener("input",render);document.getElementById("amoSort")?.addEventListener("change",render);
 }
 return{init}
})();
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",window.AMO.Shop.init);else window.AMO.Shop.init();