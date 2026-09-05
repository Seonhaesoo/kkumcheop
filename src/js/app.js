/* 꿈첩 — 검색 (index.json 을 브라우저에서만 읽는다) */
(function () {
  'use strict';
  var form = document.getElementById('search');
  if (!form) return;
  var input = form.querySelector('input'), box = form.querySelector('.res');
  var index = null, loading = null, timer = null;
  var LUCK = { good: '길몽', bad: '흉몽', mixed: '반반' };
  function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, '').replace(/꿈$/, ''); }
  function load() {
    if (index || loading) return loading;
    loading = fetch('/index.json').then(function (r) { return r.json(); }).then(function (j) { index = j; return j; }).catch(function () { index = []; return index; });
    return loading;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function render(qs) {
    var nq = norm(qs);
    if (!nq) { box.hidden = true; box.innerHTML = ''; return; }
    var hits = [];
    for (var i = 0; i < index.length; i++) {
      var it = index[i], t = norm(it.t), k = norm(it.k);
      var score = t.indexOf(nq) === 0 ? 3 : t.indexOf(nq) >= 0 ? 2 : k.indexOf(nq) >= 0 ? 1 : 0;
      if (score) hits.push({ it: it, s: score + (it.l ? 0 : 0.5) });
    }
    hits.sort(function (a, b) { return b.s - a.s; });
    hits = hits.slice(0, 12);
    box.innerHTML = hits.length
      ? hits.map(function (h) { return '<a href="' + h.it.u + '">' + esc(h.it.t) + '<small>' + (h.it.l ? LUCK[h.it.l] : '전체 풀이') + '</small></a>'; }).join('')
      : '<div class="none">아직 없는 꿈이에요. 비슷한 말로 다시 찾아보세요 — 예: 뱀, 이빨, 돈, 죽음</div>';
    box.hidden = false;
  }
  input.addEventListener('focus', load);
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
  /* /?q=뱀 으로 들어온 경우 */
  try {
    var m = location.search.match(/[?&]q=([^&]+)/);
    if (m) { input.value = decodeURIComponent(m[1].replace(/\+/g, ' ')); load().then(function () { render(input.value); input.focus(); }); }
  } catch (err) { /* 무시 */ }
})();
