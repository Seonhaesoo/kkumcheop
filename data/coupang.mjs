/* 쿠팡 파트너스 상자 — 태몽 풀이 옆에만, 검색 결과로 보내는 간편 링크.
 * 링크는 파트너스 '간편 링크 만들기'에서 https://www.coupang.com/np/search?component=&q=<검색어>&channel=user 꼴로 만든다.
 * 2026-10-08 생성(채널 기본값). dream.sajucheop.com 은 파트너스 '내 정보'에 사이트로 등록함.
 * 태교 동화책은 '상품 링크'로 고른 상품(img 는 쿠팡 썸네일, 석 달에 한 번 확인). 임신테스트기는 의료기기라 사진 없이 검색 링크. href 가 빈 칸이면 상자를 내지 않는다.
 * 상자에는 공정위 지침에 따른 대가성 문구(DISCLOSURE)를 반드시 같이 보인다. */

export const DISCLOSURE = '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.';

const L = {
  test: { href: 'https://link.coupang.com/a/hGcMW10uNo', label: '임신테스트기', note: '태몽을 꿨다면 확인해 볼 때' },
  book: { href: 'https://link.coupang.com/a/hGd6Pe2BYi', img: 'https://thumbnail5.coupangcdn.com/thumbnails/remote/212x212ex/image/vendor_inventory/b09d/cf04f25b3ad5ce2fe6eeb321e9641cd6bbe956a5f95e401a56948e1e3885.jpg', label: '하루 5분 탈무드 태교 동화', note: '태교를 시작할 때' },
};

export const hasCoupang = () => Object.values(L).some((x) => x.href);

export function coupangBox() {
  const items = Object.values(L).filter((x) => x.href);
  if (!items.length) return '';
  return `<aside class="cp-box"><p class="cp-h">태몽을 꿨다면</p><div class="cp-list">${items.map((x) => `<a class="cp-item" href="${x.href}" target="_blank" rel="sponsored noopener">${x.img ? `<img class="cp-img" src="${x.img}" alt="" width="80" height="80" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ''}<span class="cp-t"><b>${x.label}</b><small>${x.note}</small></span><span class="cp-go">쿠팡에서 보기</span></a>`).join('')}</div><p class="cp-note">${DISCLOSURE}</p></aside>`;
}

/* 2026-11-16 쿠팡 다이나믹 배너 '고객 관심 기반 추천'(파트너스 배너 1019568) — 보는 사람이 쿠팡에서 본 상품을 띄워 고정 상자보다 클릭이 잘 나온다.
 * 본문이 끝난 자리(다른 꿈 검색 위)에 한 번만. 폭은 화면에 맞춰 최대 680px(휴대폰에서는 화면 폭). subId 로 사이트별 실적을 가른다.
 * g.js 는 스크립트가 놓인 자리에 iframe 을 끼우므로 상자 안에 둔다. 대가성 문구는 상자 아래에 늘 보인다. */
export function dynBanner(subId = 'dream') {
  return `<aside class="cp-box cp-dyn"><p class="cp-h">쿠팡 추천 상품</p><div class="cp-dyn-slot"><script src="https://ads-partners.coupang.com/g.js"></script><script>(function(){var s=document.currentScript,w=Math.min(680,Math.max(280,(s.parentNode&&s.parentNode.clientWidth)||680));new PartnersCoupang.G({"id":1019568,"trackingCode":"AF3659962","subId":"${subId}","template":"carousel","width":String(w),"height":"140"});})();</script></div><p class="cp-note">${DISCLOSURE}</p></aside>`;
}
