// Run against `wrangler dev --local --port 8793 --var TEST_ADMIN_TOKEN:local-e2e`
const base=process.env.E2E_BASE||'http://127.0.0.1:8793',sup=process.env.TEST_ADMIN_TOKEN||'local-e2e';
const call=async(path,{method='GET',token=sup,store='store_amo',body}={})=>{const h={'content-type':'application/json','x-store-id':store};if(token)h.authorization='Bearer '+token;const r=await fetch(base+path,{method,headers:h,body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json().catch(()=>({}))}};
const eq=(a,b,m)=>{if(a!==b)throw Error(`${m}: expected ${b}, got ${a}`);console.log('ok -',m)};
const u=Date.now(),mail=`kh${u}@example.test`,vid='vis'+u;
// admin sets up an active product with stock (draft -> promote -> listing -> activate)
const dr=await call('/api/v1/product-drafts',{method:'POST',body:{name:'Giay test '+u,sku:'E2E-'+u,selling_price:1000000,on_hand:50}});eq(dr.status,201,'create draft');
await call('/api/v1/product-drafts/'+dr.data.id+'/state',{method:'POST',body:{to:'review'}});
const pm=await call('/api/v1/product-drafts/'+dr.data.id+'/promote',{method:'POST',body:{}});eq(pm.status,201,'promote draft');
const pid=pm.data.product_id,vid_=pm.data.variant_id;
const ch=(await call('/api/v1/channels')).data.items.find(x=>x.active);
const ls=await call('/api/v1/listings',{method:'POST',body:{product_id:pid,channel_id:ch.id}});
for(const to of ['review','approved'])await call('/api/v1/listings/'+ls.data.id+'/state',{method:'POST',body:{to}});
eq((await call('/api/v1/listings/'+ls.data.id+'/activate',{method:'POST',body:{}})).status,200,'activate listing');
// register validation
eq((await call('/api/c/register',{method:'POST',token:null,body:{name:'A',email:mail,password:'short',consent:true}})).status,400,'short password rejected');
eq((await call('/api/c/register',{method:'POST',token:null,body:{name:'A',email:mail,password:'matkhau123'}})).status,400,'consent required');
// anonymous visit then register -> visit linked
eq((await call('/api/c/event',{method:'POST',token:null,body:{type:'visit',ref:'/shop.html',visitor_id:vid}})).status,200,'anonymous visit event');
eq((await call('/api/c/event',{method:'POST',token:null,body:{type:'hack',visitor_id:vid}})).status,400,'bad event type rejected');
const reg=await call('/api/c/register',{method:'POST',token:null,body:{name:'Khach Test',email:mail,phone:'09'+String(u).slice(-8),password:'matkhau123',consent:true,visitor_id:vid}});eq(reg.status,201,'register');
const T=reg.data.token;
eq((await call('/api/c/register',{method:'POST',token:null,body:{name:'Dup',email:mail,password:'matkhau123',consent:true}})).status,400,'duplicate email rejected');
// login
eq((await call('/api/c/login',{method:'POST',token:null,body:{login:mail,password:'sai-mat-khau'}})).status,401,'wrong password');
const lg=await call('/api/c/login',{method:'POST',token:null,body:{login:mail.toUpperCase(),password:'matkhau123'}});eq(lg.status,200,'login (case-insens. email)');
eq((await call('/api/c/me',{token:T})).data.customer.email,mail,'me');
eq((await call('/api/c/me',{token:null})).status,401,'me needs login');
// store isolation: customer token invalid in another store
const s2=await call('/api/stores',{method:'POST',body:{code:'C'+String(u).slice(-6),name:'Shop 2'}});
eq((await call('/api/c/me',{token:T,store:s2.data.id})).status,401,'customer token not valid in other store');
// customer token cannot act as admin
eq((await call('/api/customers',{token:T})).status,401,'customer token is not admin');
// promos: coupon 10%, product 20%
const cp=await call('/api/v1/promotions',{method:'POST',body:{name:'Chao he',code:'he'+u,scope:'coupon',percent:10,min_order:500000,max_uses:1}});eq(cp.status,201,'create coupon');
eq((await call('/api/v1/promotions',{method:'POST',body:{name:'x',code:'HE'+u,scope:'coupon',percent:5}})).status,400,'duplicate coupon rejected');
eq((await call('/api/v1/promotions',{method:'POST',body:{name:'x',code:'BIG',scope:'coupon',percent:99}})).status,400,'percent > 90 rejected');
const q1=await call('/api/c/coupon?code=he'+u+'&subtotal=1000000',{token:T});eq(q1.data.discount,100000,'coupon preview 10%');
eq((await call('/api/c/coupon?code=he'+u+'&subtotal=100000',{token:T})).data.discount,0,'below min order');
// order with coupon
const ord=await call('/api/orders',{method:'POST',token:T,body:{items:[{variant_id:vid_,qty:1}],coupon:'HE'+u,customer:{name:'Khach Test',phone:'0900000001',address:'HCM'}}});eq(ord.status,201,'order with coupon');
eq(ord.data.discount,100000,'order discount applied');eq(ord.data.total,900000,'order total after coupon');
// coupon exhausted (max_uses 1)
const ord2=await call('/api/orders',{method:'POST',token:T,body:{items:[{variant_id:vid_,qty:1}],coupon:'HE'+u,customer:{name:'K',phone:'0900000001',address:'HCM'}}});eq(ord2.status,400,'exhausted coupon rejected');
// product promo 20% (auto) -> unit price 800000
eq((await call('/api/v1/promotions',{method:'POST',body:{name:'Sale giay',scope:'product',scope_ref:pid,percent:20}})).status,201,'create product promo');
const ord3=await call('/api/orders',{method:'POST',token:T,body:{items:[{variant_id:vid_,qty:1}],customer:{name:'K',phone:'0900000001',address:'HCM'}}});eq(ord3.data.total,800000,'product promo applied to line');
// tiers: complete orders -> spent -> tier discount
const list=await call('/api/v1/customers?q=Khach');eq(list.status,200,'admin list customers');
const me=list.data.items.find(c=>c.email===mail);eq(!!me,true,'customer visible to admin');eq(me.visits>=1,true,'anonymous visit linked to account');
await call('/api/v1/tiers',{method:'POST',body:{tiers:[{name:'Thanh vien',min_spent:0,percent:0},{name:'Bac',min_spent:700000,percent:15}]}});
const ords=(await call('/api/v1/orders')).data.items||[];const mine=ords.find(o=>o.order_no===ord.data.order_no);
for(const to of ['confirmed','packing','shipping','completed'])var st=await call('/api/v1/orders/'+mine.id+'/state',{method:'POST',body:{to}});console.log('complete order',st.status,JSON.stringify(st.data).slice(0,120));
const me2=await call('/api/c/me',{token:T});console.log('tier',JSON.stringify(me2.data.tier),'spent',me2.data.spent);
// admin detail and block
const det=await call('/api/v1/customers/'+me.id);eq(det.status,200,'customer detail');eq(det.data.events.length>=1,true,'events recorded');
eq((await call('/api/v1/customers/'+me.id,{method:'PATCH',body:{status:'blocked'}})).status,200,'block customer');
eq((await call('/api/c/me',{token:T})).status,401,'blocked customer session dead');
eq((await call('/api/c/login',{method:'POST',token:null,body:{login:mail,password:'matkhau123'}})).status,401,'blocked customer cannot login');
// viewer cannot read PII
// ---- lead capture ----
const lv='lead'+u,lm=`lead${u}@example.test`;
eq((await call('/api/c/lead',{method:'POST',token:null,body:{email:lm,visitor_id:lv}})).status,400,'lead needs consent');
eq((await call('/api/c/lead',{method:'POST',token:null,body:{email:'nope',consent:true,visitor_id:lv}})).status,400,'lead needs valid contact');
eq((await call('/api/c/lead',{method:'POST',token:null,body:{email:lm,consent:true,visitor_id:lv,source:'facebook'}})).status,201,'lead saved');
eq((await call('/api/c/lead',{method:'POST',token:null,body:{email:lm,consent:true,visitor_id:lv}})).status,201,'duplicate lead idempotent');
const L=(await call('/api/v1/customers?q=lead'+u)).data.items.filter(c=>c.email===lm);eq(L.length,1,'lead stored once');eq(L[0].source,'facebook','lead source kept');eq(L[0].has_account?1:0,0,'lead has no account');
// lead for a registered email must not reveal or alter the account
const rm=`reg${u}@example.test`;eq((await call('/api/c/register',{method:'POST',token:null,body:{name:'Reg',email:rm,password:'matkhau123',consent:true}})).status,201,'register second customer');
eq((await call('/api/c/lead',{method:'POST',token:null,body:{email:rm,consent:true,visitor_id:lv}})).status,201,'lead on registered email gives same response');
const dup=(await call('/api/v1/customers?q=reg'+u)).data.items.filter(c=>c.email===rm);eq(dup.length,1,'no duplicate row for registered email');eq(dup[0].has_account?1:0,1,'account row untouched');
// welcome coupon appears in config + lead response
await call('/api/v1/promotions',{method:'POST',body:{name:'Welcome',code:'WELCOME',scope:'coupon',percent:10}});
eq(!!(await call('/api/c/config',{token:null})).data.welcome,true,'config exposes welcome offer');
eq((await call('/api/c/lead',{method:'POST',token:null,body:{phone:'09'+String(u).slice(-8).split('').reverse().join(''),consent:true,visitor_id:lv+'b'}})).data.coupon.code,'WELCOME','lead gets welcome code');
eq((await call('/api/c/lead',{method:'POST',token:null,body:{phone:'0912345678',consent:true,visitor_id:lv}})).status,429,'lead rate limited per visitor');
console.log('ALL OK');
