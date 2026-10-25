const base=process.env.E2E_BASE||"http://127.0.0.1:8787",token=process.env.TEST_ADMIN_TOKEN||"local-e2e";
const admin={"content-type":"application/json","x-store-id":"store_amo",authorization:"Bearer "+token};
const publicHeaders={"content-type":"application/json","x-store-id":"store_amo"};
async function q(path,method="GET",body,isPublic=false){const r=await fetch(base+path,{method,headers:isPublic?publicHeaders:admin,body:body?JSON.stringify(body):undefined}),x=await r.json();if(!r.ok)throw Error(path+" "+r.status+" "+JSON.stringify(x));return x}
const tag=Date.now(),code="E2E-AFF-"+tag,sku="E2E-AFF-SKU-"+tag;
await q("/api/affiliate/partners","POST",{name:"E2E Affiliate",referral_code:code});
const click=await q("/api/affiliate/click?store=store_amo","POST",{site_id:"SITE-001",referral_code:code,landing_url:"https://amonguyen.com/?ref="+code},true);
if(!click.tracked||!click.click_id)throw Error("click not tracked");
const draft=await q("/api/v1/product-drafts","POST",{name:"E2E Affiliate Fixture",sku,selling_price:100000,on_hand:2});
await q("/api/v1/product-drafts/"+draft.id+"/state","POST",{to:"review"});
const product=await q("/api/v1/product-drafts/"+draft.id+"/promote","POST",{}),channel=(await q("/api/v1/channels")).items.find(x=>x.active);
const listing=await q("/api/v1/listings","POST",{product_id:product.product_id,channel_id:channel.id});
await q("/api/v1/listings/"+listing.id+"/state","POST",{to:"review"});await q("/api/v1/listings/"+listing.id+"/state","POST",{to:"approved"});await q("/api/v1/listings/"+listing.id+"/activate","POST",{});
const order=await q("/api/orders","POST",{customer:{name:"E2E Affiliate",phone:"0900000099",address:"Local test only"},items:[{variant_id:product.variant_id,qty:1}],affiliate:{site_id:"SITE-001",referral_code:code}},true);
if(!order.affiliate_attributed)throw Error("order attribution missing");
for(const to of ["confirmed","packing","shipping","completed"])await q("/api/v1/orders/"+order.id+"/state","POST",{to});
const dashboard=await q("/api/affiliate/dashboard"),partner=dashboard.partners.find(x=>x.referral_code===code);
if(!partner||partner.clicks!==1||partner.conversions!==1||partner.commission!==10000)throw Error("commission mismatch "+JSON.stringify(partner));
console.log(JSON.stringify({ok:true,flow:["referral","click","checkout","order","conversion","commission"],order_id:order.id,click_id:click.click_id,commission:partner.commission},null,2));
