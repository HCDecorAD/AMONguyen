// Run against `wrangler dev --local --port 8793 --var TEST_ADMIN_TOKEN:local-e2e`
const base=process.env.E2E_BASE||'http://127.0.0.1:8793',sup=process.env.TEST_ADMIN_TOKEN||'local-e2e';
const call=async(path,{method='GET',token=sup,store='store_amo',body}={})=>{const h={'content-type':'application/json','x-store-id':store};if(token)h.authorization='Bearer '+token;const r=await fetch(base+path,{method,headers:h,body:body?JSON.stringify(body):undefined});let data={};try{data=await r.json()}catch{}return{status:r.status,data}};
const pub=async(path)=>{const r=await fetch(base+path);let data={};try{data=await r.json()}catch{}return{status:r.status,data,cc:r.headers.get('cache-control')}};
const eq=(a,b,m)=>{if(a!==b)throw Error(`${m}: expected ${b}, got ${a}`);console.log('ok -',m)};
const u=Date.now(),slug='e2e-cat-'+u;
const p=await call('/api/products',{method:'POST',body:{name:'E2E Catalog '+u,slug,description:'mo ta',status:'active',price:1500000}});eq(p.status,201,'create active product');
const d=await call('/api/products',{method:'POST',body:{name:'E2E Draft '+u,slug:'draft-'+u,status:'draft',price:1}});eq(d.status,201,'create draft product');
await call('/api/images',{method:'POST',body:{product_id:p.data.id,url:'/api/media/med_x',alt:'a'}});
const v1=await call('/api/variants',{method:'POST',body:{product_id:p.data.id,sku:'E2E-'+u+'-41',size:'41',on_hand:5}});eq(v1.status,201,'variant in stock');
const v2=await call('/api/variants',{method:'POST',body:{product_id:p.data.id,sku:'E2E-'+u+'-42',size:'42',on_hand:0,sale_price:1200000}});eq(v2.status,201,'variant sold out');
await call('/api/variants',{method:'POST',body:{product_id:d.data.id,sku:'E2E-D-'+u,size:'40',on_hand:9}});
const L=await pub('/api/public/products?store=store_amo');eq(L.status,200,'public list without auth');eq(L.cc,'public, max-age=30','cacheable');
const it=L.data.items.find(x=>x.slug===slug);eq(!!it,true,'active product listed');
eq(L.data.items.some(x=>x.slug==='draft-'+u),false,'draft hidden');
eq(it.available,1,'available flag');eq(JSON.stringify(it.sizes),'["41"]','only in-stock sizes');eq(it.price,1500000,'price');eq(it.image.startsWith('http'),true,'image absolute');
eq(JSON.stringify(it).includes('cost'),false,'no cost leaked');
const D=await pub('/api/public/product?store=store_amo&slug='+slug);eq(D.status,200,'detail');eq(D.data.variants.length,2,'two variants');
const s41=D.data.variants.find(v=>v.size==='41'),s42=D.data.variants.find(v=>v.size==='42');eq(s41.available,5,'stock 5');eq(s42.available,0,'sold out 0');eq(s42.price,1200000,'variant sale price');
eq((await pub('/api/public/product?store=store_amo&slug=draft-'+u)).status,404,'draft detail 404');
eq((await pub('/api/public/product?store=store_amo&slug=nope-'+u)).status,404,'unknown 404');
eq((await pub('/api/public/product?store=store_amo')).status,400,'slug required');
eq((await pub('/api/public/products?store=store_nope')).status>=400,true,'unknown store rejected');
// order flow from the public side
const o=await call('/api/orders',{method:'POST',token:null,body:{items:[{variant_id:s41.id,qty:2}],customer:{name:'Khach Test',phone:'0900000000',address:'1 Test'}}});eq(o.status,201,'public order created');eq(o.data.total,3000000,'order total');
const o2=await call('/api/orders',{method:'POST',token:null,body:{items:[{variant_id:s42.id,qty:1}],customer:{name:'K',phone:'0900000001',address:'x'}}});eq(o2.status>=400,true,'sold-out variant rejected');
console.log('CATALOG_E2E PASS');
