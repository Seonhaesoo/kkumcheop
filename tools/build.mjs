/* 꿈첩 정적 사이트 생성기
 *  /d/{symbol}/            상징 페이지 (개요·상황별 요약·태몽·오늘의 일진)
 *  /d/{symbol}/{variant}/  상황 페이지 (본문·조언·형제 상황)
 *  /c/{cat}/               분류 페이지
 *  /gilmong/ /hyungmong/ /taemong/  모음 페이지
 *  index.json              검색 색인
 * 사용: node tools/build.mjs */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { DREAMS, CATS } from '../data/dreams/index.mjs';
import { coupangBox, hasCoupang } from '../data/coupang.mjs';
import { DEEP, SYMDEEP, DEEP_DATE } from '../data/deep.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist');
const SRC = path.join(ROOT, 'src');
const SITE = 'https://dream.sajucheop.com';
const SAJU = 'https://sajucheop.com';
const SAENGIL = 'http://saengil.sajucheop.com';
const TAROT = 'https://tarot.sajucheop.com';

/* ---------- 엔진 (오늘의 일진) ---------- */
const w = {};
const ctx = { window: w, self: w, globalThis: w, console, Date, Math, JSON };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'engine/manseryeok.js'), 'utf8'), ctx, { filename: 'manseryeok.js' });
const M = w.Manseryeok;
const t = new Date(Date.now() + 9 * 3600e3);
const today = { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
const pad = (n) => String(n).padStart(2, '0');
const BUILD_ISO = `${today.y}-${pad(today.m)}-${pad(today.d)}`;
const CONTENT_DATE = '2026-10-03';   /* 해몽 글을 마지막으로 고친 날 — 사이트맵 lastmod·Article 날짜. 글을 고칠 때만 바꾼다(매 빌드 날짜로 두면 구글이 lastmod 를 믿지 않는다) */
const FIRST_PUBLISHED = '2026-09-03';   /* 꿈첩을 처음 올린 무렵 */
const tp = M.dayPillarOf(today.y, today.m, today.d);
const tg = M.ganjiName(tp.stem, tp.branch);
const tel = M.STEMS[tp.stem].el;
const WD = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const wd = WD[new Date(Date.UTC(today.y, today.m - 1, today.d)).getUTCDay()];
const TODAY_LINE = {
  '목': '목(木)의 기운이 도는 날입니다. 자라고 뻗어나가는 상징이 강조되니, 꿈속의 시작·성장·새 인연에 관한 장면을 더 크게 읽어도 좋습니다.',
  '화': '화(火)의 기운이 도는 날입니다. 드러나고 퍼지는 상징이 강조되니, 꿈속의 감정·명예·소문·열정에 관한 장면이 더 또렷하게 읽힙니다.',
  '토': '토(土)의 기운이 도는 날입니다. 쌓고 지키는 상징이 강조되니, 재물·집·가족·안정에 관한 꿈의 무게가 평소보다 커집니다.',
  '금': '금(金)의 기운이 도는 날입니다. 자르고 정리하는 상징이 강조되니, 이별·결단·마무리·정리에 관한 장면을 눈여겨보세요.',
  '수': '수(水)의 기운이 도는 날입니다. 흐르고 스며드는 상징이 강조되니, 물·지혜·숨은 감정·소통에 관한 장면이 더 깊게 읽힙니다.'
};
const homeToday = () => `<section class="today-a hg-d" id="today"><p class="ta-h">오늘 꾼 꿈이라면</p><p class="ta-date">${today.m}월 ${today.d}일 ${wd} · ${tg.kor}(${tg.han})일</p><p class="ta-line">${TODAY_LINE[tel]}</p><a class="ta-more" href="${SAJU}/day/${BUILD_ISO}/">오늘의 일진 풀이 보기 →</a><a class="ta-more" href="${SAJU}/2027/ddi/">2027 띠별 신년운세 →</a></section>`;
const todayBox = () => `<div class="today">오늘 <b>${today.y}년 ${today.m}월 ${today.d}일 ${wd}</b>은 <b>${tg.kor}(${tg.han})일</b>, ${TODAY_LINE[tel]} <a href="${SAJU}/day/${BUILD_ISO}/">오늘의 일진 풀이(사주첩)</a></div>`;

/* ---------- 유틸 ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const paras = (s) => (Array.isArray(s) ? s : String(s).split(/\n\s*\n/)).map((p) => `<p>${p.trim()}</p>`).join('\n');
const LUCK = { good: '길몽', bad: '흉몽', mixed: '반반' };
const badge = (l, big) => `<span class="luck ${l}${big ? ' big' : ''}">${LUCK[l]}</span>`;
/* 새 디자인(2026-10-16) — 제목 밑 판정 상자, 아이콘(휴대폰 아래 메뉴·첫 화면) */
const VERDICT = { good: '좋은 꿈', bad: '조심할 꿈', mixed: '장면 따라 달라요' };
const ICON = {
  home: '<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z"/>',
  cats: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  good: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.3l2.7 2.7L16 9.6"/>',
  bad: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.8v5"/><path d="M12 16.2h.01"/>',
  taemong: '<path d="M12 20v-7"/><path d="M12 13c0-4 3-6 7-6 0 4-3 6-7 6z"/><path d="M12 15c0-3-2.5-5-6-5 0 3 2.5 5 6 5z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 6.5v7"/><path d="M12 17.5h.01"/>',
  wave: '<path d="M4.5 13c2.5-3.5 5-3.5 7.5 0s5 3.5 7.5 0"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
};
const ico = (k, size = 24, color = 'currentColor', sw = 2) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
const VD_ICON = { good: 'check', bad: 'alert', mixed: 'wave' };
const verdict = (v) => `<div class="verdict ${v.luck}"><div class="vd-h"><span class="vd-ic">${ico(VD_ICON[v.luck], 20, '#FFFFFF', 2.6)}</span><b>${VERDICT[v.luck]}</b><span>${LUCK[v.luck]}</span></div><p>${esc(v.summary)}</p></div>`;
const crumbNav = (items) => `<nav class="overline" aria-label="현재 위치">${items.map(([n, u]) => `<a href="${u}">${esc(n)}</a>`).join(' › ')}</nav>`;
const faqBox = (qas) => `<div class="faq">${qas.map(([fq, fa]) => `<div class="qa"><h3>${esc(fq)}</h3><p>${fa}</p></div>`).join('')}</div>`;
const vRow = (x, y) => `<li><a href="${vUrl(x, y)}"><span>${esc(y.title)}</span>${badge(y.luck)}</a></li>`;
const sUrl = (s) => `/d/${s.slug}/`;
const vUrl = (s, v) => `/d/${s.slug}/${v.slug}/`;
const cUrl = (c) => `/c/${c.slug}/`;
const catOf = (s) => CATS.find((c) => c.slug === s.cat);
const q = (s) => s.q || `${s.name}꿈`;
const bySlug = Object.fromEntries(DREAMS.map((s) => [s.slug, s]));

/* 데이터 검증 */
{
  const seen = new Set();
  for (const s of DREAMS) {
    if (seen.has(s.slug)) throw new Error('중복 slug: ' + s.slug);
    seen.add(s.slug);
    if (!catOf(s)) throw new Error('분류 없음: ' + s.slug + ' / ' + s.cat);
    if (!s.variants || s.variants.length < 3) throw new Error('상황 3개 미만: ' + s.slug);
    const vs = new Set();
    for (const v of s.variants) {
      if (vs.has(v.slug)) throw new Error('중복 상황 slug: ' + s.slug + '/' + v.slug);
      vs.add(v.slug);
      if (!LUCK[v.luck]) throw new Error('luck 값 오류: ' + s.slug + '/' + v.slug);
      if (!v.body || v.body.length < 120) throw new Error('본문 짧음: ' + s.slug + '/' + v.slug);
    }
    for (const r of s.related || []) if (!bySlug[r]) console.warn('관련 상징 없음(무시): ' + s.slug + ' → ' + r);
  }
}

/* ---------- 셸 ---------- */
const GA = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-JCDJSNZX4J"></script>
<script>if(location.hostname.indexOf('localhost')<0&&location.hostname.indexOf('127.0.0.1')<0&&location.protocol!=='file:'&&!navigator.webdriver&&!/bot|crawl|spider|slurp|yeti|daumoa|bingpreview|headless|lighthouse|scrap|facebookexternalhit|compatible;|mediapartners|adsbot/i.test(navigator.userAgent)){window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-JCDJSNZX4J');}</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9924140539322407" crossorigin="anonymous"></script>`;
const seal = (ch, size) => `<svg width="${size}" height="${size}" viewBox="0 0 30 30" aria-hidden="true"><rect x="1" y="1" width="28" height="28" rx="7" fill="#B23A2E"/><text x="15" y="20.5" text-anchor="middle" font-family="'Noto Serif KR',serif" font-size="15" font-weight="700" fill="#FFFFFF">${ch}</text></svg>`;
/* 검색창 — big: 첫 화면·페이지 아래(찾기 버튼), top: 머리글 안 작은 칸. 자바스크립트가 없으면 /?q= 로 넘어간다 */
const SEARCH = (kind) => {
  const big = kind === 'big';
  return `<form class="search${big ? ' big' : ''}" action="/" role="search" autocomplete="off"><div class="sbox"><svg width="${big ? 22 : 18}" height="${big ? 22 : 18}" viewBox="0 0 24 24" fill="none" stroke="${big ? '#1A1612' : '#5C5348'}" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></svg><input type="search" name="q" enterkeyhint="search" placeholder="${big ? '예: 뱀, 이빨 빠지는 꿈' : '다른 꿈 찾기'}" aria-label="꿈에 나온 것 검색">${big ? '<button type="submit">찾기</button>' : ''}</div><div class="res" hidden></div></form>`;
};
const SECTION_OF = (u) => (u === '/' ? 'home' : /^\/(d|c)\//.test(u || '') ? 'cats' : u === '/gilmong/' ? 'good' : u === '/hyungmong/' ? 'bad' : u === '/taemong/' ? 'taemong' : '');
const TABS = [['/', 'home', '홈'], ['/d/', 'cats', '분류'], ['/gilmong/', 'good', '길몽'], ['/hyungmong/', 'bad', '흉몽'], ['/taemong/', 'taemong', '태몽']];
const DNAV = [['/d/', 'cats', '분류별 목록'], ['/gilmong/', 'good', '좋은 꿈'], ['/hyungmong/', 'bad', '조심할 꿈'], ['/taemong/', 'taemong', '태몽']];

/* 2026-10-08 구글 스팸 업데이트 대응 — 상황 페이지(/d/상징/상황/)는 구글에만 검색 제외(googlebot noindex, follow), 네이버·빙은 그대로.
 * 구글 노출이 있던 상황 페이지만 남긴다(서치콘솔 9/1~10/8). 상징·분류·모음 페이지는 모두 남김. 구글용 sitemap.xml 에서 빼고 전체는 sitemap-all.xml */
/* 2026-10-13 보강 풀이(data/deep.mjs)를 넣은 상황 페이지는 내용이 충분해 구글에도 다시 연다 */
const G_KEEP = new Set(['/d/rain/gentle/', '/d/rain/soaked/', '/d/rain/umbrella/', '/d/rain/storm/', ...Object.keys(DEEP).map((k) => `/d/${k}/`)]);
const gNo = (url) => /^\/d\/[^/]+\/[^/]+\/$/.test(url || '') && !G_KEEP.has(url);
function shell(o) {
  const ld = o.jsonld ? `<script type="application/ld+json">${JSON.stringify(o.jsonld)}</script>` : '';
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
${GA}
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="max-image-preview:large">${gNo(o.url) ? '\n<meta name="googlebot" content="noindex, follow">' : ''}
<link rel="alternate" type="application/rss+xml" title="새 글" href="/rss.xml">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<link rel="canonical" href="${SITE}${o.url}">
<meta name="naver-site-verification" content="43e59931542f2de4dafe5651d4511709e31e3017">
<meta name="naver-site-verification" content="65b80458c8d3b90078ab55e4a3c3a2c7dee6332f">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<meta name="google-site-verification" content="50EAycnUsMXh9QFJPnt6HyF9vFgtOHGu0A8HO0EOp_U">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=Noto+Serif+KR:wght@400;600;700&display=swap">
<link rel="stylesheet" href="/css/style.css">
${ld}
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE}${o.url}">
</head>
<body${o.home ? ' class="home"' : ''}>
<header class="top"><div class="top-in">
  <a class="brand" href="/" aria-label="꿈첩 처음으로">${seal('夢', 30)}<span class="brand-name">꿈첩</span></a>
  <nav class="dnav" aria-label="주 메뉴">${DNAV.map(([u, k, n]) => `<a href="${u}"${SECTION_OF(o.url) === k ? ' aria-current="page"' : ''}>${n}</a>`).join('')}</nav>
  ${o.home ? '' : SEARCH('top')}
  <nav class="fam-inline" aria-label="첩 시리즈"><b>첩 시리즈</b><a href="${SAJU}/">사주첩</a><a href="${TAROT}/">타로첩</a><a href="${SAENGIL}/">생일첩</a></nav>
  <details class="menu"><summary aria-label="메뉴">${ico('menu', 24, '#1A1612', 1.8)}</summary><div class="menu-panel">
    <p class="mp-h">꿈 찾기</p><a href="/d/">분류별 전체 목록</a><a href="/gilmong/">좋은 꿈 모음 <small>길몽</small></a><a href="/hyungmong/">조심할 꿈 모음 <small>흉몽</small></a><a href="/taemong/">태몽</a>
    <p class="mp-h">첩 시리즈</p><a href="${SAJU}/"><i class="mi" aria-hidden="true">四</i>사주첩 <small>사주풀이</small></a><a href="${SAENGIL}/"><i class="mi" aria-hidden="true">生</i>생일첩 <small>생일 사전</small></a><a href="${TAROT}/"><i class="mi" aria-hidden="true">占</i>타로첩 <small>타로 카드</small></a>
  </div></details>
</div></header>
<main>
${o.home ? o.body : `<div class="doc">
${o.body}
<div class="again"><b>다른 꿈도 꾸셨나요?</b>${SEARCH('big')}</div>
</div>`}
</main>
<footer class="foot">
  <div class="wrap foot-in">
    <div class="f-about"><div class="f-brand">꿈첩</div><p>꿈 해몽은 전통 해몽서와 상징 심리학을 바탕으로 한 참고용 콘텐츠입니다. 꿈은 개인의 경험과 감정에 따라 달리 읽히며, 중요한 결정의 근거로 삼지 마세요.</p></div>
    <nav class="f-col" aria-label="꿈 찾아보기"><p class="fh">꿈 찾기</p><a href="/d/">전체 목록</a><a href="/c/animal/">동물 꿈</a><a href="/c/person/">사람 꿈</a><a href="/gilmong/">길몽 모음</a><a href="/hyungmong/">흉몽 모음</a><a href="/taemong/">태몽</a></nav>
    <nav class="f-col" aria-label="첩 시리즈"><p class="fh">첩 시리즈</p><a href="${SAJU}/">사주첩</a><a href="${SAENGIL}/">생일첩</a><a href="${TAROT}/">타로첩</a><a href="https://bodyzip.com/">바디집</a></nav>
    <nav class="f-col" aria-label="안내"><p class="fh">안내</p><a href="/about/">소개</a><a href="/terms/">이용약관</a><a href="/privacy/">개인정보</a></nav>
  </div>
  <p class="wrap f-copy">© 꿈첩 · <a href="${SAJU}/">사주첩</a> 자매 사이트</p>
</footer>
<nav class="tabbar" aria-label="아래 메뉴">${TABS.map(([u, k, n]) => `<a href="${u}"${SECTION_OF(o.url) === k ? ' aria-current="page"' : ''}>${ico(k)}${n}</a>`).join('')}</nav>
<script src="/js/app.js" defer></script>
</body>
</html>
`;
}
/* 보강한 페이지만 고친 날을 새로 — 사이트맵 lastmod·Article dateModified */
const DEEP_URLS = new Set([...Object.keys(DEEP), ...Object.keys(SYMDEEP)].map((k) => `/d/${k}/`));
const modOf = (u) => (DEEP_URLS.has(u) ? DEEP_DATE : CONTENT_DATE);
const crumbs = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: SITE + it.url })) });
const article = (title, desc, url) => ({ '@context': 'https://schema.org', '@type': 'Article', headline: title, description: desc, datePublished: FIRST_PUBLISHED, dateModified: modOf(url), inLanguage: 'ko', author: { '@type': 'Organization', name: '꿈첩' }, publisher: { '@type': 'Organization', name: '꿈첩' }, mainEntityOfPage: SITE + url });

const urls = [];
function write(url, html) {
  const file = path.join(OUT, url, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  urls.push(url);
}
const relatedGrid = (s) => {
  const rel = (s.related || []).map((r) => bySlug[r]).filter(Boolean);
  const cat = DREAMS.filter((x) => x.cat === s.cat && x !== s && !rel.includes(x)).slice(0, Math.max(0, 8 - rel.length));
  return `<div class="grid">${rel.concat(cat).map((x) => `<a href="${sUrl(x)}"><b>${esc(x.name)}</b><small>${x.variants.length}가지</small></a>`).join('')}</div>`;
};
const similar = (s, v) => {
  const rel = (s.related || []).map((r) => bySlug[r]).filter(Boolean);
  const out = [];
  for (let round = 0; round < 3 && out.length < 4; round++) for (const x of rel) {
    if (out.length >= 4) break;
    const cand = x.variants.filter((y) => y.luck === v.luck).concat(x.variants.filter((y) => y.luck !== v.luck));
    if (cand[round]) out.push([x, cand[round]]);
  }
  return out;
};
const counts = (s) => ({ good: s.variants.filter((v) => v.luck === 'good').length, bad: s.variants.filter((v) => v.luck === 'bad').length, mixed: s.variants.filter((v) => v.luck === 'mixed').length });

/* ---------- 상징 페이지 ---------- */
function symbolPage(s) {
  const url = sUrl(s), c = catOf(s), n = counts(s);
  const title = s.title || `${q(s)} 해몽 — ${s.name} 꿈 뜻 ${s.variants.length}가지 (길몽·흉몽 구분)`;
  const desc = s.desc || `${q(s)}의 의미를 상황별로 풀이합니다. ${s.variants.slice(0, 4).map((v) => v.title).join(', ')} 등 ${s.variants.length}가지 상황의 길흉과 해석${s.taemong ? ', 태몽 풀이' : ''}까지.`;
  const list = s.variants.map((v) => `<li><a href="${vUrl(s, v)}">${esc(v.title)}</a> ${badge(v.luck)}<p>${esc(v.summary)}</p></li>`).join('\n');
  const body = `
${crumbNav([['꿈첩', '/'], [c.name, cUrl(c)]])}
<h1>${esc(s.h1 || q(s) + ' 해몽')}</h1>
<p class="lead">${esc(s.lead)}</p>
<div class="chips"><span>길몽 <b>${n.good}</b></span><span>흉몽 <b>${n.bad}</b></span><span>반반 <b>${n.mixed}</b></span>${s.taemong ? '<span><b>태몽</b>으로도 봄</span>' : ''}<span>${c.name}</span></div>

<section>
<h2>${esc(s.name)} 꿈, 상황별로 보기</h2>
<ul class="vl">
${list}
</ul>
</section>
${SYMDEEP[s.slug] ? `<section><h2>${esc(SYMDEEP[s.slug].h2)}</h2><ul class="scenes">${SYMDEEP[s.slug].rows.map(([k, t]) => `<li><b>${esc(k)}</b><span>${esc(t)}</span></li>`).join('')}</ul></section>` : ''}

<section>
<h2>${esc(s.name)} 꿈이 뜻하는 것</h2>
${paras(s.intro)}
${s.psych ? `<h3>심리적으로 읽으면</h3>${paras(s.psych)}` : ''}
<p class="callout">${esc(s.luckNote)}</p>
</section>

${s.taemong ? `<section><h2>${esc(s.name)} 태몽</h2>${paras(s.taemong)}<p class="note">태몽은 아기의 생년월일이 정해진 뒤 <a href="${SAENGIL}/">생일첩</a>에서 띠·별자리·일주와 함께 보면 더 재미있습니다.</p>${coupangBox()}</section>` : ''}

<section>
<h2>오늘 꾼 꿈이라면</h2>
${todayBox()}
</section>

<section>
<h2>함께 보는 꿈</h2>
${relatedGrid(s)}
</section>

<section>
<h2>자주 묻는 질문</h2>
${faqBox([
  [`${q(s)}은 길몽인가요, 흉몽인가요?`, `${esc(s.luckNote)} 위 목록에서 내가 꾼 장면과 가장 가까운 상황을 고르면 됩니다.`],
  ['같은 꿈을 여러 번 꾸면 어떤 뜻인가요?', `반복되는 꿈은 마음이 아직 정리하지 못한 주제가 있다는 신호로 읽습니다. ${esc(s.name)} 꿈이 거듭 나온다면 ${esc(s.repeat || '그 상징이 가리키는 관계나 상황을 현실에서 한 번 점검해 보세요.')}`],
  ['꿈 해몽은 얼마나 믿을 수 있나요?', '전통 해몽은 오랜 경험이 쌓인 상징 사전이고, 심리학은 꿈을 무의식의 언어로 봅니다. 둘 다 "정답"이라기보다 자신을 돌아보는 거울로 쓰는 것이 가장 유익합니다.'],
])}
</section>
`;
  write(url, shell({ url, title, desc, body, jsonld: [crumbs([{ name: '꿈첩', url: '/' }, { name: c.name, url: cUrl(c) }, { name: q(s), url }]), article(title, desc, url)] }));
}

/* ---------- 상황 페이지 ---------- */
function variantPage(s, v, i) {
  const url = vUrl(s, v), c = catOf(s);
  const title = `${v.title} — ${LUCK[v.luck]}, ${q(s)} 해몽`;
  const desc = `${v.title}은 ${LUCK[v.luck]}${v.luck === 'mixed' ? '(상황에 따라 다름)' : ''}으로 봅니다. ${v.summary}`;
  const sib = s.variants.filter((x) => x !== v).map((x) => vRow(s, x)).join('\n');
  const pv = s.variants[i - 1], nx = s.variants[i + 1];
  const dp = DEEP[`${s.slug}/${v.slug}`], sim = similar(s, v);
  const body = `
${crumbNav([['꿈첩', '/'], [c.name, cUrl(c)], [q(s), sUrl(s)]])}
<h1>${esc(v.title)}</h1>
${verdict(v)}

<section>
<h2>이 꿈의 뜻</h2>
${paras(v.body)}
<div class="advice"><b>이렇게 해 보세요</b><p>${esc(v.advice)}</p></div>
</section>
${dp ? `
<section>
<h2>꿈속 장면에 따라 달라지는 풀이</h2>
<ul class="scenes">${dp.scenes.map(([k, t]) => `<li><b>${esc(k)}</b><span>${esc(t)}</span></li>`).join('')}</ul>
</section>

<section>
<h2>이럴 때 자주 꿉니다</h2>
${paras(dp.when)}
</section>

<section>
<h2>자주 묻는 질문</h2>
${faqBox(dp.faq.map(([fq, fa]) => [fq, esc(fa)]))}
</section>
` : ''}
<section>
<h2>다른 ${esc(s.name)} 꿈</h2>
<ul class="vl rows">
${sib}
</ul>
<a class="more-btn" href="${sUrl(s)}">${esc(q(s))} ${s.variants.length}가지 한 번에 보기${s.taemong ? ' · 태몽 풀이' : ''}</a>
</section>
${sim.length ? `
<section>
<h2>비슷한 꿈</h2>
<ul class="vl rows">
${sim.map(([x, y]) => vRow(x, y)).join('\n')}
</ul>
</section>
` : ''}
<section>
<h2>오늘 꾼 꿈이라면</h2>
${todayBox()}
</section>

<section>
<h2>함께 보는 꿈</h2>
${relatedGrid(s)}
</section>

<p class="pn">${pv ? `<a href="${vUrl(s, pv)}">← ${esc(pv.title)}</a>` : '<span></span>'}${nx ? `<a href="${vUrl(s, nx)}">${esc(nx.title)} →</a>` : '<span></span>'}</p>
`;
  write(url, shell({ url, title, desc, body, jsonld: [crumbs([{ name: '꿈첩', url: '/' }, { name: c.name, url: cUrl(c) }, { name: q(s), url: sUrl(s) }, { name: v.title, url }]), article(title, desc, url)] }));
}

/* ---------- 분류·모음·홈 ---------- */
function catPage(c) {
  const url = cUrl(c);
  const list = DREAMS.filter((s) => s.cat === c.slug);
  const body = `
<div class="overline">꿈첩 · 분류</div>
<h1>${esc(c.name)} 꿈 해몽</h1>
<p class="lead">${esc(c.desc)}</p>
<section>
<div class="grid g2">${list.map((s) => `<a href="${sUrl(s)}"><b>${esc(q(s))}</b><small>${s.variants.slice(0, 3).map((v) => v.title).join(' · ')} 등 ${s.variants.length}가지</small></a>`).join('')}</div>
</section>
<section>
<h2>다른 분류</h2>
<div class="grid g3">${CATS.map((x) => `<a href="${cUrl(x)}"${x === c ? ' class="cur"' : ''}><b>${x.name}</b><small>${DREAMS.filter((s) => s.cat === x.slug).length}가지</small></a>`).join('')}</div>
</section>
`;
  write(url, shell({ url, title: `${c.name} 꿈 해몽 — ${list.map((s) => s.name).slice(0, 6).join('·')} 꿈의 뜻`, desc: `${c.desc} ${list.map((s) => q(s)).join(', ')} 해몽.`, body, jsonld: crumbs([{ name: '꿈첩', url: '/' }, { name: c.name, url }]) }));
}

function luckPage(kind) {
  const url = kind === 'good' ? '/gilmong/' : '/hyungmong/';
  const name = kind === 'good' ? '길몽' : '흉몽';
  const items = DREAMS.flatMap((s) => s.variants.filter((v) => v.luck === kind).map((v) => ({ s, v })));
  const body = `
<div class="overline">꿈첩 · 모음</div>
<h1>${name} 모음 — ${kind === 'good' ? '좋은 꿈' : '조심할 꿈'} ${items.length}가지</h1>
<p class="lead">${kind === 'good' ? '전통적으로 재물·명예·인연·건강의 좋은 징조로 읽는 꿈들입니다. 같은 상징이라도 장면에 따라 뜻이 갈리니, 내가 꾼 장면과 가까운 것을 고르세요.' : '전통적으로 조심하라는 뜻으로 읽는 꿈들입니다. 흉몽은 예언이 아니라 "지금 신경 쓰이는 것"을 비추는 거울에 가까우니, 겁내기보다 점검의 계기로 삼으세요.'}</p>
<section>
<ul class="vl">
${items.map(({ s, v }) => `<li><a href="${vUrl(s, v)}">${esc(v.title)}</a> <span class="note">${esc(q(s))}</span><p>${esc(v.summary)}</p></li>`).join('\n')}
</ul>
</section>
<p class="note"><a href="${kind === 'good' ? '/hyungmong/' : '/gilmong/'}">${kind === 'good' ? '흉몽' : '길몽'} 모음 보기</a> · <a href="/taemong/">태몽 모음</a></p>
`;
  write(url, shell({ url, title: `${name} 모음 — ${kind === 'good' ? '좋은 꿈' : '조심할 꿈'} ${items.length}가지 상황별 해몽`, desc: `${name}으로 보는 꿈 ${items.length}가지. ${items.slice(0, 6).map((x) => x.v.title).join(', ')} 등.`, body, jsonld: crumbs([{ name: '꿈첩', url: '/' }, { name: name + ' 모음', url }]) }));
}

function taemongPage() {
  const url = '/taemong/';
  const list = DREAMS.filter((s) => s.taemong);
  const body = `
<div class="overline">꿈첩 · 모음</div>
<h1>태몽 해몽 — 태몽으로 보는 꿈 ${list.length}가지</h1>
<p class="lead">태몽은 임신 전후에 본인이나 가족이 꾸는, 아이의 탄생을 알리는 꿈입니다. 동물·과일·자연물이 크고 선명하게 나오며 꿈에서 깬 뒤에도 또렷이 기억나는 것이 특징입니다. 상징별로 전통적으로 어떤 아이를 뜻한다고 보는지 정리했습니다.</p>
<section>
${list.map((s) => `<h2><a href="${sUrl(s)}">${esc(s.name)} 태몽</a></h2>${paras(s.taemong)}`).join('\n')}
</section>
<p class="callout">태몽으로 아들·딸을 가리는 것은 속설이며 과학적 근거는 없습니다. 출산예정일과 임신 주수는 <a href="https://bodyzip.com/due-date/">바디집</a>에서 계산할 수 있고, 아이가 태어나면 <a href="${SAENGIL}/">생일첩</a>에서 생년월일로 띠·별자리·일주를, <a href="${SAJU}/">사주첩</a>에서 사주를 볼 수 있습니다.</p>
${coupangBox()}
`;
  write(url, shell({ url, title: `태몽 해몽 — 뱀·돼지·용·물고기 등 태몽 ${list.length}가지의 뜻`, desc: `태몽으로 보는 꿈 ${list.length}가지. ${list.slice(0, 8).map((s) => s.name).join('·')} 태몽의 전통적 의미.`, body, jsonld: crumbs([{ name: '꿈첩', url: '/' }, { name: '태몽', url }]) }));
}

function homePage() {
  const total = DREAMS.reduce((a, s) => a + s.variants.length, 0);
  const all = DREAMS.flatMap((s) => s.variants);
  const nGood = all.filter((v) => v.luck === 'good').length, nBad = all.filter((v) => v.luck === 'bad').length, nTae = DREAMS.filter((s) => s.taemong).length;
  /* 많이 찾는 꿈 칩 — 네이버·구글에서 많이 들어오는 상징 */
  const HOT = ['snake', 'pig', 'poop', 'teeth', 'money', 'death', 'ancestor', 'water', 'ex', 'bug'].map((k) => bySlug[k]).filter(Boolean);
  const kkum = (n) => (/는$/.test(n) ? n + ' 꿈' : n);
  const tiles = CATS.map((c) => {
    const list = DREAMS.filter((s) => s.cat === c.slug);
    if (!list.length) return '';
    /* 예시는 많이 찾는 상징부터, 한 줄(12자 안쪽)에 들어가는 만큼 */
    const ex = [];
    for (const x of list.filter((s) => s.hot).concat(list.filter((s) => !s.hot))) { if (ex.length >= 3 || (ex.length && ex.concat(x.name).join('·').length > 12)) break; ex.push(x.name); }
    return `<a href="${cUrl(c)}"><span class="tn">${c.name}<i>${list.length}가지</i></span><small>${esc(ex.slice(0, -1).concat(kkum(ex[ex.length - 1])).join('·'))}</small></a>`;
  }).join('');
  /* 요즘 많이 찾는 꿈 — 보강 풀이를 넣은 상황(2026-10-13 네이버 도착 상위 순) */
  const top = Object.keys(DEEP).slice(0, 8).map((k) => { const [a, b] = k.split('/'); const s = bySlug[a], v = s && s.variants.find((x) => x.slug === b); return v ? `<li><a href="${vUrl(s, v)}"><em>${esc(v.title)}</em>${badge(v.luck)}</a></li>` : ''; }).join('');
  const chev = ico('chev', 18, '#5C5348');
  const body = `
<section class="hero"><div class="wrap">
<h1>어젯밤 무슨 꿈을<br> 꾸셨나요?</h1>
<p class="hero-sub">꿈에 나온 것 하나만 적으면 상황별 풀이가 나와요. ${DREAMS.length}가지 꿈, ${total}가지 상황.</p>
${SEARCH('big')}
<h2 class="sec hot-h">많이 찾는 꿈</h2>
<nav class="hot" aria-label="많이 찾는 꿈">${HOT.map((s) => `<a href="${sUrl(s)}">${esc(kkum(s.name))}</a>`).join('')}</nav>
</div></section>

<div class="wrap hg">
<section class="hg-a"><h2 class="sec">좋은 꿈인지부터 볼까요?</h2><div class="pick">
<a href="/gilmong/"><span class="pi good">${ico('check', 22, '#1F6B45', 2.2)}</span><span class="pt"><b>좋은 꿈 모음</b><small>길몽 · ${nGood}가지</small></span>${chev}</a>
<a href="/hyungmong/"><span class="pi bad">${ico('alert', 22, '#A3302A', 2.4)}</span><span class="pt"><b>조심할 꿈 모음</b><small>흉몽 · ${nBad}가지</small></span>${chev}</a>
<a href="/taemong/"><span class="pi mixed">胎</span><span class="pt"><b>태몽</b><small>아기 꿈 · ${nTae}가지</small></span>${chev}</a>
</div></section>
<section class="hg-b" id="cats"><div class="sec-row"><h2 class="sec">분류로 찾기</h2><a href="/d/">${DREAMS.length}가지 전체 목록 →</a></div><nav class="cats" aria-label="분류">${tiles}</nav></section>
<section class="hg-c"><h2 class="sec">요즘 많이 찾는 꿈</h2><ol class="toplist">${top}</ol><p class="legend"><span>${badge('good')} 좋은 꿈</span><span>${badge('bad')} 조심할 꿈</span><span>${badge('mixed')} 장면 따라</span></p></section>
${homeToday()}
</div>

<section class="wrap how"><h2 class="sec">꿈첩은 이렇게 써요</h2><ol>
<li><span class="num">1</span><div><b>꿈에 나온 것 하나</b><p>뱀, 이빨, 돌아가신 할머니처럼 가장 또렷했던 것 하나만 적어요.</p></div></li>
<li><span class="num">2</span><div><b>상황 고르기</b><p>뱀에게 물렸는지, 뱀을 잡았는지에 따라 뜻이 달라요. 장면마다 풀이가 따로 있어요.</p></div></li>
<li><span class="num">3</span><div><b>좋은 꿈인지 먼저</b><p>맨 위 색 표시로 길몽·흉몽을 보고, 아래에서 이유와 할 일을 읽어요.</p></div></li>
</ol></section>

<section class="wrap story">
<h2>꿈첩이 꿈을 읽는 방식</h2>
<p>같은 뱀이라도 물리는 꿈과 잡는 꿈은 뜻이 다릅니다. 그래서 꿈첩은 상징 하나를 여러 <strong>상황</strong>으로 나누어 풉니다. 상황마다 전통 해몽의 길흉과 심리적 의미를 나란히 적습니다. 전통 해몽은 조선의 해몽서와 구전 속설을, 심리 해석은 꿈을 무의식의 언어로 보는 관점을 따릅니다.</p>
<p>꿈은 앞날을 맞히는 예언보다 지금 내 마음이 붙들고 있는 것을 보여 주는 거울에 가깝습니다. 흉몽이라고 겁낼 필요는 없고, 길몽이라고 안심만 할 일도 아닙니다. 꿈이 가리키는 관계와 상황을 현실에서 한 번 살펴보는 계기로 삼으면 충분합니다.</p>
</section>
`;
  write('/', shell({ home: true, url: '/', title: '꿈첩 — 꿈해몽 사전, 상황별 길몽·흉몽·태몽 풀이', desc: `뱀꿈·이빨 빠지는 꿈·똥꿈·죽는 꿈… 꿈에 나온 것을 검색하면 상황별 길흉과 전통 해몽, 심리적 의미, 태몽 풀이까지. ${DREAMS.length}가지 상징 ${total}가지 상황.`, body, jsonld: { '@context': 'https://schema.org', '@type': 'WebSite', name: '꿈첩', url: SITE + '/', potentialAction: { '@type': 'SearchAction', target: SITE + '/?q={search_term_string}', 'query-input': 'required name=search_term_string' } } }));
}

/* ---------- /d/ 전체 목록 — 모든 상징과 상황으로 가는 한 장 (구글이 한 번 읽으면 1,150여 주소를 모두 알게) ---------- */
function dictPage() {
  const url = '/d/';
  const total = DREAMS.reduce((a, s) => a + s.variants.length, 0);
  const groups = CATS.map((c) => ({ c, list: DREAMS.filter((s) => s.cat === c.slug).sort((a, b) => a.name.localeCompare(b.name, 'ko')) })).filter((g) => g.list.length);
  const body = `
<div class="overline">꿈첩 · 전체 목록</div>
<h1>꿈해몽 사전 전체 목록</h1>
<p class="lead">꿈첩에 있는 꿈 ${DREAMS.length}가지와 상황 ${total}가지를 분류별로 모두 모았습니다. 꿈 이름을 누르면 상황별 요약과 태몽 풀이가, 상황을 누르면 그 장면의 길흉과 해몽이 나옵니다.</p>
<style>.dict h2{margin-top:26px}.dict .sym{margin:12px 0 0}.dict .sym b a{font-size:16px}.dict .sym small{display:block;margin-top:3px;line-height:1.9;color:var(--muted)}.dict .sym small a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--line)}</style>
<div class="dict">
${groups.map((g) => `<section><h2><a href="${cUrl(g.c)}">${esc(g.c.name)} 꿈</a> <small>${g.list.length}가지</small></h2>
${g.list.map((s) => `<div class="sym"><b><a href="${sUrl(s)}">${esc(q(s))}</a></b><small>${s.variants.map((v) => `<a href="${vUrl(s, v)}">${esc(v.title)}</a>`).join(' · ')}</small></div>`).join('\n')}</section>`).join('\n')}
</div>
`;
  write(url, shell({ url, title: `꿈해몽 사전 전체 목록 — 꿈 ${DREAMS.length}가지·상황 ${total}가지`, desc: `뱀꿈·돼지꿈·이빨 빠지는 꿈부터 ${DREAMS.length}가지 꿈과 ${total}가지 상황을 분류별로 모두 모은 꿈해몽 사전 목록입니다.`, body, jsonld: crumbs([{ name: '꿈첩', url: '/' }, { name: '전체 목록', url }]) }));
}

function staticPages() {
  const doc = (url, title, desc, body) => write(url, shell({ url, title, desc, body: `<div class="overline">꿈첩</div><h1>${title}</h1><section>${body}</section>` }));
  doc('/about/', '꿈첩 소개', '꿈첩은 사주첩·생일첩과 함께하는 꿈해몽 사전입니다.', `
<p>꿈첩(夢帖)은 <a href="${SAJU}/">사주첩</a>과 <a href="${SAENGIL}/">생일첩</a>의 자매 사이트입니다. 첩(帖)은 글을 모아 묶던 책을 뜻하고, 꿈첩은 꿈에 나오는 상징을 한 장씩 모읍니다.</p>
<p>상징마다 여러 상황으로 나누어 전통 해몽의 길흉과 심리적 의미를 함께 적고, 태몽으로 보는 상징은 태몽 풀이를 덧붙입니다. 오늘의 일진은 사주첩의 만세력 엔진으로 계산해 매일 갱신합니다.</p>
<p>검색어는 브라우저 안에서만 처리되며 서버로 전송되지 않습니다. 문의는 <a href="${SAJU}/">사주첩</a> 하단 연락처를 이용해 주세요.</p>`);
  doc('/terms/', '이용약관', '꿈첩 이용약관.', `
<p>꿈첩(이하 "사이트")은 꿈의 상징을 전통 해몽과 심리학적 관점에서 풀이해 제공하는 무료 정보 서비스입니다.</p>
<h3>1. 콘텐츠의 성격</h3><p>사이트의 해몽은 참고·오락용 콘텐츠이며 미래를 예측하거나 보장하지 않습니다. 건강·재산·인간관계 등 중요한 결정은 반드시 스스로의 판단과 전문가의 조언에 따르세요.</p>
<h3>2. 책임의 한계</h3><p>사이트는 콘텐츠를 이용하다 생긴 어떤 손해에도 책임지지 않습니다.</p>
<h3>3. 저작권</h3><p>사이트의 글과 디자인은 꿈첩에 저작권이 있습니다. 출처를 밝힌 인용과 링크는 자유롭게 하실 수 있으나, 무단 복제·재배포는 금지합니다.</p>
<h3>4. 광고</h3><p>사이트는 Google AdSense 광고를 게재하며, 광고 수익으로 운영됩니다.</p>
<p class="note">시행일: ${BUILD_ISO}</p>`);
  doc('/privacy/', '개인정보처리방침', '꿈첩 개인정보처리방침.', `
<p>꿈첩은 방문자의 개인정보를 소중히 다룹니다.</p>
<h3>1. 수집하는 정보</h3><p>사이트는 회원가입을 받지 않으며 이름·연락처 등 개인정보를 직접 수집하지 않습니다. 검색어는 브라우저 안에서만 처리됩니다.</p>
<h3>2. 쿠키와 제3자 서비스</h3><p>사이트는 방문 통계를 위해 Google Analytics를, 광고 게재를 위해 Google AdSense를 사용합니다.${hasCoupang() ? ' 태몽 풀이의 쿠팡 링크(쿠팡 파트너스)를 누르면 쿠팡으로 이동하며, 그 뒤 구매가 생기면 꿈첩이 일정액의 수수료를 받을 수 있습니다. 이 과정의 쿠키는 쿠팡이 관리합니다.' : ''} Google은 쿠키를 이용해 방문 기록과 관심사에 맞춘 광고를 보여줄 수 있습니다. 맞춤 광고는 <a href="https://www.google.com/settings/ads" rel="noopener">Google 광고 설정</a>에서, 쿠키 사용은 브라우저 설정에서 거부할 수 있습니다. 자세한 내용은 <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">Google 정책 페이지</a>를 참고하세요.</p>
<h3>3. 정보의 보관과 파기</h3><p>사이트가 직접 보관하는 개인정보는 없습니다.</p>
<h3>4. 문의</h3><p>개인정보 관련 문의는 <a href="${SAJU}/">사주첩</a>의 연락처로 보내 주세요.</p>
<p class="note">시행일: ${BUILD_ISO}</p>`);
  fs.writeFileSync(path.join(OUT, '404.html'), shell({ url: '/404', title: '페이지를 찾을 수 없습니다', desc: '꿈첩', body: `<h1>아직 없는 꿈이에요</h1><p class="lead">주소가 잘못되었거나 아직 풀이하지 않은 꿈입니다. 위 검색창에서 비슷한 상징을 찾아보세요.</p><p class="note"><a href="/">홈으로</a></p>` }));
}

function indexJson() {
  const items = [];
  for (const s of DREAMS) {
    items.push({ t: q(s), u: sUrl(s), k: [s.name, ...(s.aliases || [])].join(' '), l: '' });
    for (const v of s.variants) items.push({ t: v.title, u: vUrl(s, v), k: s.name, l: v.luck });
  }
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(items));
}
function sitemap() {
  const sm = (list) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${list.map((u) => `<url><loc>${SITE}${u}</loc><lastmod>${u === '/' ? BUILD_ISO : modOf(u)}</lastmod></url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sm(urls.filter((u) => !gNo(u))));   /* 구글용(robots.txt) */
  fs.writeFileSync(path.join(OUT, 'sitemap-all.xml'), sm(urls));   /* 전체 — 네이버·빙 제출용 */
  fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
}

/* ---------- 실행 ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(SRC, OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'CNAME'), SITE.replace('https://', '') + '\n');
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
for (const s of DREAMS) { symbolPage(s); s.variants.forEach((v, i) => variantPage(s, v, i)); }
CATS.forEach((c) => { if (DREAMS.some((s) => s.cat === c.slug)) catPage(c); });
luckPage('good'); luckPage('bad'); taemongPage();
homePage(); dictPage(); staticPages(); indexJson(); sitemap();
console.log(`꿈첩 빌드 완료: 상징 ${DREAMS.length}, 상황 ${DREAMS.reduce((a, s) => a + s.variants.length, 0)}, 페이지 ${urls.length} · 오늘 ${tg.kor}일`);

/* RSS 피드 — 네이버 서치어드바이저에 한 번 등록하면 새 글을 알아서 가져간다 (tools/feeds.mjs) */
await import('./feeds.mjs');
