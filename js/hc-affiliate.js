/* HC Affiliate Hub — SITE-001 AMO Nguyen. Public attribution only; commissions are server-side. */
(function () {
  'use strict';
  var KEY = 'hc_affiliate_site001';
  var TTL = 30 * 24 * 60 * 60 * 1000;
  var param = new URLSearchParams(location.search);
  var incoming = param.get('ref') || param.get('affiliate_ref');
  function valid(v) { return typeof v === 'string' && /^[A-Za-z0-9_-]{3,80}$/.test(v); }
  function read() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (data && valid(data.ref) && Date.now() - data.ts < TTL && data.ts <= Date.now()) return data;
    } catch (e) {}
    return null;
  }
  if (valid(incoming)) {
    try { localStorage.setItem(KEY, JSON.stringify({ ref: incoming, ts: Date.now(), site: 'SITE-001' })); } catch (e) {}
  }
  window.HCAffiliate = Object.freeze({
    site: 'SITE-001',
    getRef: function () { var d = read(); return d ? d.ref : null; },
    getAttribution: function () {
      var d = read();
      return d ? { site_id: 'SITE-001', referral_code: d.ref } : null;
    }
  });
})();