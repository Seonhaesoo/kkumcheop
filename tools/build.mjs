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
const tp = M.dayPillarOf(today.y, today.m, today.d);
const tg = M.ganjiName(tp.stem, tp.branch);
const tel = M.STEMS[tp.stem].el;
const WD = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const wd = WD[new Date(Date.UTC(today.y, today.m - 1, today.d)).getUTCDay()];
const TODAY_LINE = {
  '목': '목(木)의 기운이 도는 날입니다. 자라고 뻗어나가는 상징이 강조되니, 꿈속의 시작·성장·새 인연에 관한 장면을 더 크게 읽어도 좋아요.',
  '화': '화(火)의 기운이 도는 날입니다. 드러나고 퍼지는 상징이 강조되니, 꿈속의 감정·명예·소문·열정에 관한 장면이 더 또렷하게 읽힙니다.',
  '토': '토(土)의 기운이 도는 날입니다. 쌓고 지키는 상징이 강조되니, 재물·집·가족·안정에 관한 꿈의 무게가 평소보다 커집니다.',
  '금': '금(金)의 기운이 도는 날입니다. 자르고 정리하는 상징이 강조되니, 이별·결단·마무리·정리에 관한 장면을 눈여겨보세요.',
  '수': '수(水)의 기운이 도는 날입니다. 흐르고 스며드는 상징이 강조되니, 물·지혜·숨은 감정·소통에 관한 장면이 더 깊게 읽힙니다.'
};
const todayBox = () => `<div class="today">오늘 <b>${today.y}년 ${today.m}월 ${today.d}일 ${wd}</b>은 <b>${tg.kor}(${tg.han})일</b>, ${TODAY_LINE[tel]} <a href="${SAJU}/day/${BUILD_ISO}/">오늘의 일진 풀이(사주첩)</a></div>`;

/* ---------- 유틸 ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const paras = (s) => (Array.isArray(s) ? s : String(s).split(/\n\s*\n/)).map((p) => `<p>${p.trim()}</p>`).join('\n');
const LUCK = { good: '길몽', bad: '흉몽', mixed: '반반' };
const badge = (l, big) => `<span class="luck ${l}${big ? ' big' : ''}">${LUCK[l]}</span>`;
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
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-JCDJSNZX4J');</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9924140539322407" crossorigin="anonymous"></script>`;
const seal = (ch, size) => `<svg width="${size}" height="${size}" viewBox="0 0 30 30" aria-hidden="true"><rect x="1.5" y="1.5" width="27" height="27" rx="6" fill="#B8382D"/><text x="15" y="20.5" text-anchor="middle" font-family="'Noto Serif KR',serif" font-size="15" font-weight="600" fill="#F6F1E8">${ch}</text></svg>`;
const SEARCH = `<form class="search" id="search" role="search" autocomplete="off"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="#9A8F7E" stroke-width="1.8"/><path d="M16.5 16.5L21 21" stroke="#9A8F7E" stroke-width="1.8" stroke-linecap="round"/></svg><input type="search" name="q" placeholder="꿈에 나온 것을 검색 — 뱀, 이빨, 돈, 죽음…" aria-label="꿈 검색"><div class="res" hidden></div></form>`;

function shell(o) {
  const ld = o.jsonld ? `<script type="application/ld+json">${JSON.stringify(o.jsonld)}</script>` : '';
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
${GA}
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<link rel="canonical" href="${SITE}${o.url}">
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
<body>
<div class="app">
<nav class="family-bar" aria-label="첩 시리즈">
  <a class="fb-item" href="${SAJU}/" title="사주첩 — 사주풀이"><i aria-hidden="true">四</i>사주첩</a>
  <a class="fb-item" href="${SAENGIL}/" title="생일첩 — 생년월일로 보는 나이·띠"><i aria-hidden="true">生</i>생일첩</a>
  <a class="fb-item on" href="/" aria-current="page"><i aria-hidden="true">夢</i>꿈첩</a>
  <a class="fb-item" href="${TAROT}/" title="타로첩 — 타로 카드 78장 의미"><i aria-hidden="true">占</i>타로첩</a>
</nav>
<header class="hdr">
  <a class="brand" href="/">${seal('夢', 26)}<span class="brand-name">꿈첩</span></a>
  <nav class="nav"><a href="/c/animal/">동물</a><a href="/c/person/">사람</a><a href="/gilmong/">길몽</a><a href="/taemong/">태몽</a></nav>
</header>
${SEARCH}
${o.body}
<footer>
  <div class="frow"><span>© 꿈첩 · <a href="${SAJU}/">사주첩</a> 자매 사이트</span><nav><a href="/about/">소개</a><a href="/terms/">이용약관</a><a href="/privacy/">개인정보</a></nav></div>
  <p class="fnote">꿈 해몽은 전통 해몽서와 상징 심리학을 바탕으로 한 참고용 콘텐츠입니다. 꿈은 개인의 경험과 감정에 따라 달리 읽히며, 중요한 결정의 근거로 삼지 마세요.</p>
</footer>
</div>
<script src="/js/app.js" defer></script>
</body>
</html>
`;
}
const crumbs = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: SITE + it.url })) });
const article = (title, desc, url) => ({ '@context': 'https://schema.org', '@type': 'Article', headline: title, description: desc, datePublished: BUILD_ISO, dateModified: BUILD_ISO, inLanguage: 'ko', author: { '@type': 'Organization', name: '꿈첩' }, publisher: { '@type': 'Organization', name: '꿈첩' }, mainEntityOfPage: SITE + url });

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
const counts = (s) => ({ good: s.variants.filter((v) => v.luck === 'good').length, bad: s.variants.filter((v) => v.luck === 'bad').length, mixed: s.variants.filter((v) => v.luck === 'mixed').length });

/* ---------- 상징 페이지 ---------- */
function symbolPage(s) {
  const url = sUrl(s), c = catOf(s), n = counts(s);
  const title = s.title || `${q(s)} 해몽 — ${s.name} 꿈 뜻 ${s.variants.length}가지 (길몽·흉몽 구분)`;
  const desc = s.desc || `${q(s)}의 의미를 상황별로 풀이합니다. ${s.variants.slice(0, 4).map((v) => v.title).join(', ')} 등 ${s.variants.length}가지 상황의 길흉과 해석${s.taemong ? ', 태몽 풀이' : ''}까지.`;
  const list = s.variants.map((v) => `<li><a href="${vUrl(s, v)}">${esc(v.title)}</a> ${badge(v.luck)}<p>${esc(v.summary)}</p></li>`).join('\n');
  const body = `
<div class="overline">꿈첩 · <a href="${cUrl(c)}">${c.name}</a></div>
<h1>${esc(s.h1 || q(s) + ' 해몽')}</h1>
<p class="lead">${esc(s.lead)}</p>
<div class="chips"><span>길몽 <b>${n.good}</b></span><span>흉몽 <b>${n.bad}</b></span><span>반반 <b>${n.mixed}</b></span>${s.taemong ? '<span><b>태몽</b>으로도 봄</span>' : ''}<span>${c.name}</span></div>

<section>
<h2>${esc(s.name)} 꿈, 상황별로 보기</h2>
<ul class="vl">
${list}
</ul>
</section>

<section>
<h2>${esc(s.name)}이 꿈에 나오는 뜻</h2>
${paras(s.intro)}
${s.psych ? `<h3>심리적으로 읽으면</h3>${paras(s.psych)}` : ''}
<p class="callout">${esc(s.luckNote)}</p>
</section>

${s.taemong ? `<section><h2>${esc(s.name)} 태몽</h2>${paras(s.taemong)}<p class="note">태몽은 아기의 생년월일이 정해진 뒤 <a href="${SAENGIL}/">생일첩</a>에서 띠·별자리·일주와 함께 보면 더 재미있습니다.</p></section>` : ''}

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
<h3>${esc(q(s))}은 길몽인가요, 흉몽인가요?</h3>
<p>${esc(s.luckNote)} 위 목록에서 내가 꾼 장면과 가장 가까운 상황을 고르면 됩니다.</p>
<h3>같은 꿈을 여러 번 꾸면 어떤 뜻인가요?</h3>
<p>반복되는 꿈은 마음이 아직 정리하지 못한 주제가 있다는 신호로 읽습니다. ${esc(s.name)}이 거듭 나온다면 ${esc(s.repeat || '그 상징이 가리키는 관계나 상황을 현실에서 한 번 점검해 보세요.')}</p>
<h3>꿈 해몽은 얼마나 믿을 수 있나요?</h3>
<p>전통 해몽은 오랜 경험이 쌓인 상징 사전이고, 심리학은 꿈을 무의식의 언어로 봅니다. 둘 다 "정답"이라기보다 자신을 돌아보는 거울로 쓰는 것이 가장 유익합니다.</p>
</section>
`;
  write(url, shell({ url, title, desc, body, jsonld: [crumbs([{ name: '꿈첩', url: '/' }, { name: c.name, url: cUrl(c) }, { name: q(s), url }]), article(title, desc, url)] }));
}

/* ---------- 상황 페이지 ---------- */
function variantPage(s, v, i) {
  const url = vUrl(s, v), c = catOf(s);
  const title = `${v.title} — ${LUCK[v.luck]}, ${q(s)} 해몽`;
  const desc = `${v.title}은 ${LUCK[v.luck]}${v.luck === 'mixed' ? '(상황에 따라 다름)' : ''}으로 봅니다. ${v.summary}`;
  const sib = s.variants.filter((x) => x !== v).map((x) => `<li><a href="${vUrl(s, x)}">${esc(x.title)}</a> ${badge(x.luck)}<p>${esc(x.summary)}</p></li>`).join('\n');
  const pv = s.variants[i - 1], nx = s.variants[i + 1];
  const body = `
<div class="overline">꿈첩 · <a href="${cUrl(c)}">${c.name}</a> · <a href="${sUrl(s)}">${esc(q(s))}</a></div>
<h1>${esc(v.title)}</h1>
<p class="lead">${badge(v.luck, true)} ${esc(v.summary)}</p>

<section>
<h2>이 꿈의 뜻</h2>
${paras(v.body)}
<p class="callout"><strong>이렇게 해보세요.</strong> ${esc(v.advice)}</p>
</section>

<section>
<h2>오늘 꾼 꿈이라면</h2>
${todayBox()}
</section>

<section>
<h2>다른 ${esc(s.name)} 꿈</h2>
<ul class="vl">
${sib}
</ul>
<p class="note"><a href="${sUrl(s)}">${esc(q(s))} 전체 풀이와 태몽 보기</a></p>
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
<p class="lead">태몽은 임신 전후에 본인이나 가족이 꾸는, 아이의 탄생을 알리는 꿈입니다. 동물·과일·자연물이 크고 선명하게 나오며 꿈에서 깬 뒤에도 또렷이 기억나는 것이 특징이에요. 상징별로 전통적으로 어떤 아이를 뜻한다고 보는지 정리했습니다.</p>
<section>
${list.map((s) => `<h2><a href="${sUrl(s)}">${esc(s.name)} 태몽</a></h2>${paras(s.taemong)}`).join('\n')}
</section>
<p class="callout">태몽으로 아들·딸을 가리는 것은 속설이며 과학적 근거는 없습니다. 아이가 태어나면 <a href="${SAENGIL}/">생일첩</a>에서 생년월일로 띠·별자리·일주를, <a href="${SAJU}/">사주첩</a>에서 사주를 볼 수 있어요.</p>
`;
  write(url, shell({ url, title: `태몽 해몽 — 뱀·돼지·용·물고기 등 태몽 ${list.length}가지의 뜻`, desc: `태몽으로 보는 꿈 ${list.length}가지. ${list.slice(0, 8).map((s) => s.name).join('·')} 태몽의 전통적 의미.`, body, jsonld: crumbs([{ name: '꿈첩', url: '/' }, { name: '태몽', url }]) }));
}

function homePage() {
  const hot = DREAMS.filter((s) => s.hot).concat(DREAMS.filter((s) => !s.hot)).slice(0, 24);
  const total = DREAMS.reduce((a, s) => a + s.variants.length, 0);
  const body = `
<h1>꿈첩 <span style="font-size:15px;color:var(--faint);font-weight:400">夢帖</span></h1>
<p class="lead">간밤에 본 것을 검색하면 상황별로 <strong>길몽인지 흉몽인지</strong>, 전통 해몽과 심리적 의미, 태몽 풀이까지 한 장에 담아 드립니다. 지금 ${DREAMS.length}가지 상징, ${total}가지 상황이 있고 계속 늘어납니다.</p>
<section>
<h2>많이 찾는 꿈</h2>
<div class="grid">${hot.map((s) => `<a href="${sUrl(s)}"><b>${esc(s.name)}</b><small>${s.variants.length}가지</small></a>`).join('')}</div>
</section>
<section>
<h2>분류로 찾기</h2>
<div class="grid g3">${CATS.map((c) => { const n = DREAMS.filter((s) => s.cat === c.slug).length; return n ? `<a href="${cUrl(c)}"><b>${c.name}</b><small>${n}가지</small></a>` : ''; }).join('')}</div>
</section>
<section>
<h2>모음</h2>
<div class="grid g3"><a href="/gilmong/"><b>길몽 모음</b><small>좋은 꿈</small></a><a href="/hyungmong/"><b>흉몽 모음</b><small>조심할 꿈</small></a><a href="/taemong/"><b>태몽</b><small>아기 꿈</small></a></div>
</section>
<section>
<h2>오늘 꾼 꿈이라면</h2>
${todayBox()}
</section>
<section>
<h2>꿈첩이 꿈을 읽는 방식</h2>
<p>같은 뱀이라도 물리는 꿈과 잡는 꿈은 뜻이 다릅니다. 그래서 꿈첩은 상징 하나를 여러 <strong>상황</strong>으로 나누고, 상황마다 전통 해몽의 길흉과 심리적 의미를 함께 적습니다. 전통 해몽은 조선의 해몽서와 구전 속설을, 심리 해석은 꿈을 무의식의 언어로 보는 관점을 따릅니다.</p>
<p>꿈은 예언이 아니라 지금 내 마음이 붙들고 있는 것을 보여주는 거울에 가깝습니다. 흉몽이라고 겁낼 필요는 없고, 길몽이라고 안심만 할 일도 아니에요. 꿈이 가리키는 관계와 상황을 현실에서 한 번 살펴보는 계기로 삼으면 충분합니다.</p>
</section>
`;
  write('/', shell({ url: '/', title: '꿈첩 — 꿈해몽 사전, 상황별 길몽·흉몽·태몽 풀이', desc: `뱀꿈·이빨 빠지는 꿈·똥꿈·죽는 꿈… 꿈에 나온 것을 검색하면 상황별 길흉과 전통 해몽, 심리적 의미, 태몽 풀이까지. ${DREAMS.length}가지 상징 ${total}가지 상황.`, body, jsonld: { '@context': 'https://schema.org', '@type': 'WebSite', name: '꿈첩', url: SITE + '/', potentialAction: { '@type': 'SearchAction', target: SITE + '/?q={search_term_string}', 'query-input': 'required name=search_term_string' } } }));
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
<h3>2. 책임의 한계</h3><p>사이트는 콘텐츠의 이용으로 발생한 어떠한 손해에 대해서도 책임지지 않습니다.</p>
<h3>3. 저작권</h3><p>사이트의 글과 디자인은 꿈첩에 저작권이 있습니다. 출처를 밝힌 인용과 링크는 자유롭게 하실 수 있으나, 무단 복제·재배포는 금지합니다.</p>
<h3>4. 광고</h3><p>사이트는 Google AdSense 광고를 게재하며, 광고 수익으로 운영됩니다.</p>
<p class="note">시행일: ${BUILD_ISO}</p>`);
  doc('/privacy/', '개인정보처리방침', '꿈첩 개인정보처리방침.', `
<p>꿈첩은 방문자의 개인정보를 소중히 다룹니다.</p>
<h3>1. 수집하는 정보</h3><p>사이트는 회원가입을 받지 않으며 이름·연락처 등 개인정보를 직접 수집하지 않습니다. 검색어는 브라우저 안에서만 처리됩니다.</p>
<h3>2. 쿠키와 제3자 서비스</h3><p>사이트는 방문 통계를 위해 Google Analytics를, 광고 게재를 위해 Google AdSense를 사용합니다. Google은 쿠키를 이용해 방문 기록과 관심사에 기반한 광고를 보여줄 수 있습니다. 맞춤 광고는 <a href="https://www.google.com/settings/ads" rel="noopener">Google 광고 설정</a>에서, 쿠키 사용은 브라우저 설정에서 거부할 수 있습니다. 자세한 내용은 <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">Google 정책 페이지</a>를 참고하세요.</p>
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
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${SITE}${u}</loc><lastmod>${BUILD_ISO}</lastmod></url>`).join('\n')}\n</urlset>\n`);
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
homePage(); staticPages(); indexJson(); sitemap();
console.log(`꿈첩 빌드 완료: 상징 ${DREAMS.length}, 상황 ${DREAMS.reduce((a, s) => a + s.variants.length, 0)}, 페이지 ${urls.length} · 오늘 ${tg.kor}일`);
