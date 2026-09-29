(async function(){
  try{
    const r=await fetch('config/home.json?ts='+Date.now(),{cache:'no-store'});
    if(!r.ok)return; const c=await r.json();
    const set=(q,v)=>{const e=document.querySelector(q);if(e&&v!=null)e.textContent=v};
    const img=(q,v)=>{const e=document.querySelector(q);if(e&&v)e.src=v};
    set('.amo-home-eyebrow',c.hero?.eyebrow);
    set('.amo-home-hero h1',c.hero?.title);
    set('.amo-home-lead',c.hero?.lead);
    set('.amo-home-btn-primary',c.hero?.primaryLabel);
    set('.amo-home-actions .amo-home-text-link',c.hero?.secondaryLabel);
    img('[data-amo-asset="home-hero"]',c.hero?.image);
    set('.amo-home-editorial-copy .amo-home-kicker',c.editorial?.kicker);
    set('.amo-home-editorial-copy h2',c.editorial?.title);
    set('.amo-home-editorial-copy>p:not(.amo-home-kicker)',c.editorial?.text);
    img('[data-amo-asset="home-editorial"]',c.editorial?.image);
    const grid=document.querySelector('.amo-home-style-grid');
    if(grid&&Array.isArray(c.styles)) grid.innerHTML=c.styles.map((x,i)=>`<a href="${x.url||'#'}" class="amo-home-style-card"><div><img src="${x.image||''}" alt="${x.title||''}"></div><span>${String(i+1).padStart(2,'0')}</span><h3>${x.title||''}</h3><p>${x.subtitle||''}</p></a>`).join('');
  }catch(e){console.warn('AMO CMS content unavailable',e)}
})();