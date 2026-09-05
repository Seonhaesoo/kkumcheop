# 꿈첩 夢帖

꿈에 나온 상징을 상황별로 나누어 길몽·흉몽과 전통 해몽·심리적 의미·태몽을 정리하는 정적 사이트. [사주첩](https://sajucheop.com)·[생일첩](https://saengil.sajucheop.com)의 자매 사이트.

**사이트**: https://dream.sajucheop.com

## 구조

| 경로 | 내용 |
|---|---|
| `/d/{symbol}/` | 상징 페이지 — 개요, 상황별 요약 목록, 심리 해석, 태몽, 오늘의 일진 |
| `/d/{symbol}/{variant}/` | 상황 페이지 — 본문·조언, 같은 상징의 다른 상황 |
| `/c/{cat}/` | 분류 (동물·사람·신체·자연·사물·돈·행동·장소·죽음·연애·음식·재난) |
| `/gilmong/` `/hyungmong/` `/taemong/` | 모음 |
| `/index.json` | 검색 색인 (브라우저에서만 읽음) |

콘텐츠는 `data/dreams/*.mjs` 에 손으로 쓴다. 스키마는 `data/dreams/index.mjs` 상단 주석 참고. 빌드가 slug 중복·luck 값·본문 길이를 검증한다.

## 빌드

```
node tools/build.mjs     # dist/ 생성
node server.js           # http://localhost:8323
```

`dist/` 는 커밋하지 않는다. GitHub Actions 가 push 및 매일 01:30 KST(오늘의 일진 갱신)에 빌드·배포한다.
