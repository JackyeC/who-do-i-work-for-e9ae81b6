(function() {
  'use strict';
  var BADGE_BASE = 'https://wdiwf.jackyeclayton.com';
  var API_BASE = 'https://aeulesuqxcnaonlxcjcm.supabase.co/rest/v1';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXR5YnFkeGFkbW93aml2dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjU0MTcsImV4cCI6MjA4ODQwMTQxN30.gM_5tF5Qs8f0LUfE9ZB5PM-TeHhDVe4KZF6_p60A3Lc';

  function getFootprintLabel(score) {
    if (score >= 70) return 'High Concentration';
    if (score >= 40) return 'Mixed Influence';
    if (score >= 15) return 'Moderate';
    return 'Low Activity';
  }

  function getFootprintColor(score) {
    if (score >= 75) return '#dc2626';
    if (score >= 50) return '#d97706';
    if (score >= 25) return '#2563eb';
    return '#16a34a';
  }

  function renderBadge(container, company, theme) {
    var color = getFootprintColor(company.civic_footprint_score);
    var label = getFootprintLabel(company.civic_footprint_score);
    var isDark = theme === 'dark';
    var bg = isDark ? '#1e293b' : '#ffffff';
    var fg = isDark ? '#f1f5f9' : '#1e293b';
    var muted = isDark ? '#94a3b8' : '#64748b';
    var border = isDark ? '#334155' : '#e2e8f0';
    var profileUrl = BADGE_BASE + '/company/' + company.slug;

    var html = '<a href="' + profileUrl + '" target="_blank" rel="noopener noreferrer" ' +
      'style="display:inline-flex;align-items:center;gap:10px;padding:10px 16px;' +
      'border-radius:8px;border:1px solid ' + border + ';background:' + bg + ';' +
      'text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;' +
      'transition:box-shadow 0.2s;max-width:320px" ' +
      'onmouseover="this.style.boxShadow=\'0 2px 8px rgba(0,0,0,0.1)\'" ' +
      'onmouseout="this.style.boxShadow=\'none\'">' +
      '<svg width="28" height="28" viewBox="0 0 28 28" fill="none">' +
        '<rect width="28" height="28" rx="6" fill="#1e3a5f"/>' +
        '<path d="M14 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6.4c-1.32 0-2.4-1.08-2.4-2.4S12.68 9.6 14 9.6s2.4 1.08 2.4 2.4-1.08 2.4-2.4 2.4zM14 17.6c-2.67 0-8 1.34-8 4v1.6h16v-1.6c0-2.66-5.33-4-8-4z" fill="white"/>' +
      '</svg>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-size:11px;color:' + muted + ';font-weight:500;letter-spacing:0.3px">CIVIC FOOTPRINT</div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-top:2px">' +
          '<span style="font-size:18px;font-weight:700;color:' + fg + '">' + company.civic_footprint_score + '</span>' +
          '<span style="font-size:11px;color:' + muted + '">/100</span>' +
          '<span style="font-size:10px;padding:2px 6px;border-radius:99px;background:' + color + '15;color:' + color + ';font-weight:600">' + label + '</span>' +
        '</div>' +
        '<div style="font-size:10px;color:' + muted + ';margin-top:2px">Transparency Profile Available · CivicLens</div>' +
      '</div>' +
    '</a>';

    container.innerHTML = html;
  }

  function init() {
    var badges = document.querySelectorAll('[data-civiclens-badge]');
    for (var i = 0; i < badges.length; i++) {
      (function(el) {
        var slug = el.getAttribute('data-civiclens-badge');
        var theme = el.getAttribute('data-theme') || 'light';
        if (!slug) return;

        var xhr = new XMLHttpRequest();
        xhr.open('GET', API_BASE + '/companies?slug=eq.' + encodeURIComponent(slug) + '&select=name,slug,civic_footprint_score,confidence_rating,industry');
        xhr.setRequestHeader('apikey', ANON_KEY);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.onload = function() {
          if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            if (data && data.length > 0) {
              renderBadge(el, data[0], theme);
            } else {
              el.innerHTML = '<span style="font-size:12px;color:#94a3b8">Company not found on CivicLens</span>';
            }
          }
        };
        xhr.send();
      })(badges[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
