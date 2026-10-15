/* 꿈첩 — 검색 (index.json 을 브라우저에서만 읽는다) · 메뉴 닫기 · 글자를 치는 동안 아래 메뉴 숨김
 * 검색창은 여러 개일 수 있다(머리글·첫 화면·페이지 아래) */
(function () {
  'use strict';
  var forms = document.querySelectorAll('form.search');
  var index = null, loading = null;
  var LUCK = { good: '길몽', bad: '흉몽', mixed: '반반' };
  function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, '').replace(/꿈$/, ''); }
  function load() {
    if (index || loading) return loading || Promise.resolve(index);
    loading = fetch('/index.json').then(function (r) { return r.json(); }).then(function (j) { index = j; return j; }).catch(function () { index = []; return index; });
    return loading;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function find(qs) {
    var nq = norm(qs), hits = [];
    if (!nq) return hits;
    for (var i = 0; i < index.length; i++) {
      var it = index[i], t = norm(it.t), k = norm(it.k);
      var score = t.indexOf(nq) === 0 ? 3 : t.indexOf(nq) >= 0 ? 2 : k.indexOf(nq) >= 0 ? 1 : 0;
      if (score) hits.push({ it: it, s: score + (it.l ? 0 : 0.5) });
    }
    hits.sort(function (a, b) { return b.s - a.s; });
    return hits.slice(0, 12);
  }
  Array.prototype.forEach.call(forms, function (form) {
    var input = form.querySelector('input'), box = form.querySelector('.res'), timer = null;
    if (!input || !box) return;
    function render(qs) {
      if (!norm(qs)) { box.hidden = true; box.innerHTML = ''; return; }
      var hits = find(qs);
      box.innerHTML = hits.length
        ? hits.map(function (h) { return '<a href="' + h.it.u + '"><span>' + esc(h.it.t) + '</span>' + (h.it.l ? '<span class="luck ' + h.it.l + '">' + LUCK[h.it.l] + '</span>' : '<small>전체 풀이</small>') + '</a>'; }).join('')
        : '<div class="none">아직 없는 꿈이에요. 비슷한 말로 다시 찾아보세요. 예: 뱀, 이빨, 돈, 죽음</div>';
      box.hidden = false;
    }
    form._render = render;
    input.addEventListener('focus', function () { load(); document.body.classList.add('typing'); });
    input.addEventListener('blur', function () { document.body.classList.remove('typing'); });
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { load().then(function () { render(input.value); }); }, 80);
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      load().then(function () { render(input.value); var first = box.querySelector('a'); if (first) location.href = first.getAttribute('href'); });
    });
    document.addEventListener('click', function (e) { if (!form.contains(e.target)) box.hidden = true; });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') box.hidden = true; });
  });
  /* /?q=뱀 으로 들어온 경우 — 큰 검색창에 채운다 */
  try {
    var m = location.search.match(/[?&]q=([^&]+)/), f = document.querySelector('form.search.big') || forms[0];
    if (m && f && f._render) { var inp = f.querySelector('input'); inp.value = decodeURIComponent(m[1].replace(/\+/g, ' ')); load().then(function () { f._render(inp.value); inp.focus(); }); }
  } catch (err) { /* 무시 */ }
  /* 메뉴 — 바깥을 누르거나 Esc 로 닫기 */
  var menu = document.querySelector('details.menu');
  if (menu) {
    document.addEventListener('click', function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
  }
})();
