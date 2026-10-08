/* 쿠팡 파트너스 상자 — 태몽 풀이 옆에만, 검색 결과로 보내는 간편 링크.
 * 링크는 파트너스 '간편 링크 만들기'에서 https://www.coupang.com/np/search?component=&q=<검색어>&channel=user 꼴로 만든다.
 * 2026-10-08 생성(채널 기본값). dream.sajucheop.com 은 파트너스 '내 정보'에 사이트로 등록함. href 가 빈 칸이면 상자를 내지 않는다.
 * 상자에는 공정위 지침에 따른 대가성 문구(DISCLOSURE)를 반드시 같이 보인다. */

export const DISCLOSURE = '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.';

const L = {
  test: { href: 'https://link.coupang.com/a/hGcMW10uNo', label: '임신테스트기', note: '태몽을 꿨다면 확인해 볼 때' },
  book: { href: 'https://link.coupang.com/a/hGcM6IDH1U', label: '태교 동화책', note: '태교를 시작할 때' },
};

export const hasCoupang = () => Object.values(L).some((x) => x.href);

export function coupangBox() {
  const items = Object.values(L).filter((x) => x.href);
  if (!items.length) return '';
  return `<aside class="cp-box"><p class="cp-h">쿠팡에서 함께 보기</p><ul>${items.map((x) => `<li><a href="${x.href}" target="_blank" rel="sponsored noopener">${x.label} 보러 가기</a><small>${x.note}</small></li>`).join('')}</ul><p class="cp-note">${DISCLOSURE}</p></aside>`;
}
