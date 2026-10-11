// Run against `wrangler dev --local --port 8793 --var TEST_ADMIN_TOKEN:local-e2e`
const base=process.env.E2E_BASE||'http://127.0.0.1:8793',sup=process.env.TEST_ADMIN_TOKEN||'local-e2e';
const call=async(path,{method='GET',token=sup,store='store_amo',body}={})=>{const h={'content-type':'application/json','x-store-id':store};if(token)h.authorization='Bearer '+token;const r=await fetch(base+path,{method,headers:h,body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json().catch(()=>({}))}};
const eq=(a,b,m)=>{if(a!==b)throw Error(`${m}: expected ${b}, got ${a}`)};
const u=Date.now();
// second store so we can prove isolation
const s2=await call('/api/stores',{method:'POST',body:{code:'T'+String(u).slice(-6),name:'Test shop '+u}});eq(s2.status,201,'create store');const S2=s2.data.id;
// owner for store 1 and a staff + viewer
const own=await call('/api/v1/members',{method:'POST',body:{email:`owner${u}@example.test`,role:'owner'}});eq(own.status,201,'create owner');
const OWN=own.data.key;
const stf=await call('/api/v1/members',{method:'POST',token:OWN,body:{email:`staff${u}@example.test`,role:'staff'}});eq(stf.status,201,'owner creates staff');
const vw=await call('/api/v1/members',{method:'POST',token:OWN,body:{email:`view${u}@example.test`,role:'viewer'}});eq(vw.status,201,'owner creates viewer');
const STF=stf.data.key,VW=vw.data.key;
// identity
const me=await call('/api/auth/me',{token:OWN});eq(me.status,200,'me');eq(me.data.role,'owner','me role');eq(me.data.store.id,'store_amo','me store');
// member with NO x-store-id header falls back to own store
const noHdr=await fetch(base+'/api/auth/me',{headers:{authorization:'Bearer '+OWN}});eq((await noHdr.json()).store.id,'store_amo','default store = member store');
// isolation: store_amo key cannot touch the other store
eq((await call('/api/products',{token:OWN,store:S2})).status,401,'owner key blocked on other store');
eq((await call('/api/products',{token:OWN,store:S2,method:'POST',body:{name:'x'}})).status,401,'owner key cannot write other store');
// super-only: member cannot list/create stores
const list=await call('/api/stores',{token:OWN});eq(list.data.items.length,1,'member sees only own store');
eq((await call('/api/stores',{method:'POST',token:OWN,body:{code:'EVIL',name:'x'}})).status,401,'member cannot create store');
// bad key
eq((await call('/api/products',{token:OWN.slice(0,-3)+'xxx'})).status,401,'wrong secret rejected');
eq((await call('/api/products',{token:null})).status,401,'no token rejected');
// roles
eq((await call('/api/products',{token:VW})).status,200,'viewer can read');
eq((await call('/api/products',{token:VW,method:'POST',body:{name:'nope'}})).status,401,'viewer cannot write');
const p=await call('/api/products',{token:STF,method:'POST',body:{name:'Staff product '+u,price:1000}});eq(p.status,201,'staff can write');
eq((await call('/api/v1/members',{token:STF})).status,401,'staff cannot list members');
eq((await call('/api/v1/members',{token:STF,method:'POST',body:{email:'a@b.co'}})).status,401,'staff cannot create members');
// CSV-style product import with images, sale price, published flag; staff stages, manager+ commits
const sku='CSV-'+u;
const j=await call('/api/v1/import-jobs',{method:'POST',token:STF,body:{kind:'products',source_type:'csv',filename:'t.csv',mapping:{SKU:'sku',Name:'name','Regular price':'selling_price','Sale price':'sale_price',Stock:'on_hand',Images:'images',Published:'published'}}});eq(j.status,201,'job');
const st=await call(`/api/v1/import-jobs/${j.data.id}/stage`,{method:'POST',token:STF,body:{rows:[{SKU:sku,Name:'CSV item',"Regular price":500000,"Sale price":450000,Stock:4,Images:'https://example.test/a.jpg|https://example.test/b.jpg',Published:'1'}]}});eq(st.status,200,'stage');
const dr=await call(`/api/v1/import-jobs/${j.data.id}/dry-run`,{method:'POST',token:STF});eq(dr.data.ok,true,'dry-run ok');
eq((await call(`/api/v1/import-jobs/${j.data.id}/state`,{method:'POST',token:STF,body:{to:'review'}})).status,401,'staff cannot advance governance');
eq((await call(`/api/v1/import-jobs/${j.data.id}/state`,{method:'POST',token:OWN,body:{to:'review'}})).status,200,'owner review');
eq((await call(`/api/v1/import-jobs/${j.data.id}/state`,{method:'POST',token:OWN,body:{to:'approved'}})).status,200,'owner approve');
eq((await call(`/api/v1/import-jobs/${j.data.id}/commit`,{method:'POST',token:OWN})).status,200,'commit');
const prods=(await call('/api/products',{token:OWN})).data.items;const prod=prods.find(x=>x.name==='CSV item');
eq(prod.status,'active','published flag honoured');eq(prod.sale_price,450000,'sale price');
const imgs=(await call('/api/images?product_id='+prod.id,{token:OWN})).data.items;eq(imgs.length,2,'two images imported');
// rollback removes images too
eq((await call(`/api/v1/import-jobs/${j.data.id}/rollback`,{method:'POST',token:OWN})).status,200,'rollback');
eq((await call('/api/images?product_id='+prod.id,{token:OWN})).data.items.length,0,'images rolled back');
// rotate / revoke
const rot=await call(`/api/v1/members/${vw.data.id}/rotate`,{method:'POST',token:OWN});eq(rot.status,200,'rotate');
eq((await call('/api/products',{token:VW})).status,401,'old key dead after rotate');
eq((await call('/api/products',{token:rot.data.key})).status,200,'new key works');
eq((await call(`/api/v1/members/${stf.data.id}/revoke`,{method:'POST',token:OWN})).status,200,'revoke');
eq((await call('/api/products',{token:STF})).status,401,'revoked key dead');
// super admin still works everywhere
eq((await call('/api/products',{store:S2})).status,200,'super admin reads any store');
console.log('MEMBERS_E2E PASS');
