// Run against `wrangler dev --local --port 8793 --var TEST_ADMIN_TOKEN:local-e2e`
const base=process.env.E2E_BASE||'http://127.0.0.1:8793',sup=process.env.TEST_ADMIN_TOKEN||'local-e2e';
const call=async(path,{method='GET',token=sup,store='store_amo',body}={})=>{const h={'content-type':'application/json','x-store-id':store};if(token)h.authorization='Bearer '+token;const r=await fetch(base+path,{method,headers:h,body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json().catch(()=>({}))}};
const eq=(a,b,m)=>{if(a!==b)throw Error(`${m}: expected ${b}, got ${a}`);console.log('ok -',m)};
const u=Date.now();
const own=await call('/api/v1/members',{method:'POST',body:{email:`o${u}@example.test`,role:'owner'}});const OWN=own.data.key;
const stf=await call('/api/v1/members',{method:'POST',token:OWN,body:{email:`s${u}@example.test`,role:'staff'}});const STF=stf.data.key;
const vw=await call('/api/v1/members',{method:'POST',token:OWN,body:{email:`v${u}@example.test`,role:'viewer'}});const VW=vw.data.key;
// 1x1 png
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
eq((await call('/api/v1/media',{method:'POST',token:VW,body:{data:'data:image/png;base64,'+png}})).status,401,'viewer cannot upload');
eq((await call('/api/v1/media',{method:'POST',token:null,body:{data:png}})).status,401,'anonymous cannot upload');
const up=await call('/api/v1/media',{method:'POST',token:STF,body:{name:'a.png',data:'data:image/png;base64,'+png}});eq(up.status,201,'staff uploads png');
const html=Buffer.from('<script>alert(1)</script>').toString('base64');
eq((await call('/api/v1/media',{method:'POST',token:STF,body:{data:html}})).status,400,'non-image rejected (magic bytes)');
eq((await call('/api/v1/media',{method:'POST',token:STF,body:{data:'A'.repeat(1200000)}})).status,400,'oversize rejected');
const r=await fetch(base+'/api/media/'+up.data.id);eq(r.status,200,'public GET without headers');eq(r.headers.get('content-type'),'image/png','content-type');
eq((await r.arrayBuffer()).byteLength,Buffer.from(png,'base64').length,'bytes round-trip');
eq((await fetch(base+'/api/media/med_nope12345')).status,404,'unknown id 404');
eq((await call('/api/v1/media',{token:VW})).status,401,'viewer cannot list');
eq((await call('/api/v1/media',{token:STF})).data.items.length>=1,true,'staff lists');
eq((await call('/api/v1/media/'+up.data.id,{method:'DELETE',token:STF})).status,401,'staff cannot delete');
eq((await call('/api/v1/media/'+up.data.id,{method:'DELETE',token:OWN})).status,200,'owner deletes');
eq((await fetch(base+'/api/media/'+up.data.id)).status,404,'gone after delete');
console.log('MEDIA_E2E PASS');
