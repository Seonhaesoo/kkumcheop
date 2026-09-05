/* 꿈첩 콘텐츠 색인 — 분류와 상징 모음
 * 상징 스키마:
 *  { slug, name, cat, q?('뱀꿈' 같은 검색형 표기, 기본 name+'꿈'), aliases?: [], hot?: true,
 *    lead: 한 줄 요약, intro: [문단...], psych?: 문단, luckNote: 길흉 판단 한 줄, repeat?: 반복해서 꿀 때 한 줄,
 *    taemong?: 문단 | null, related?: [slug...],
 *    variants: [{ slug, title, luck: 'good'|'bad'|'mixed', summary: 한 줄, body: 문단(빈 줄로 구분 가능), advice: 한 줄 }] } */
import animals from './animals.mjs';
import bodyMoney from './body-money.mjs';
import spiritLovePerson from './spirit-love-person.mjs';
import actionNature from './action-nature.mjs';
import objectEtc from './object-etc.mjs';
import peoplePlaces from './people-places.mjs';
import emotionMisc from './emotion-misc.mjs';
import misc8 from './misc-8.mjs';
import animals2 from './animals-2.mjs';
import bodyObject2 from './body-object-2.mjs';
import action2 from './action-2.mjs';
import naturePlace2 from './nature-place-2.mjs';
import animalsPlaces3 from './animals-places-3.mjs';
import objectBody3 from './object-body-3.mjs';
import misc15 from './misc-15.mjs';
import misc16 from './misc-16.mjs';
import misc17 from './misc-17.mjs';
import misc18 from './misc-18.mjs';
import misc19 from './misc-19.mjs';
import misc20 from './misc-20.mjs';

export const CATS = [
  { slug: 'animal', name: '동물', desc: '뱀·돼지·개·호랑이·용처럼 꿈에 나오는 동물의 뜻. 동물 꿈은 재물과 인연, 본능의 상징으로 가장 자주 묻는 꿈입니다.' },
  { slug: 'person', name: '사람', desc: '가족·연인·전 애인·연예인·모르는 사람이 나오는 꿈. 사람 꿈은 관계와 내 마음의 상태를 비춥니다.' },
  { slug: 'body', name: '신체', desc: '이빨·머리카락·피·눈처럼 몸에 관한 꿈. 신체 꿈은 건강과 자존감, 가까운 사람의 일을 뜻합니다.' },
  { slug: 'nature', name: '자연·날씨', desc: '물·불·바다·산·비·눈·하늘에 관한 꿈. 자연 꿈은 운의 흐름과 감정의 상태를 크게 보여줍니다.' },
  { slug: 'object', name: '사물', desc: '신발·차·집·옷·거울처럼 물건에 관한 꿈. 사물 꿈은 지위·이동·재산의 변화를 뜻합니다.' },
  { slug: 'money', name: '돈·재물', desc: '돈을 줍는 꿈, 잃는 꿈, 복권·금·보석 꿈. 재물 꿈은 뜻이 뒤집히는 경우가 많아 상황이 중요합니다.' },
  { slug: 'action', name: '행동·상황', desc: '떨어지는 꿈, 쫓기는 꿈, 나는 꿈, 시험 보는 꿈, 늦는 꿈. 상황 꿈은 지금 마음의 압박과 소망을 보여줍니다.' },
  { slug: 'place', name: '장소', desc: '학교·화장실·집·병원·바다처럼 장소가 중심인 꿈. 장소는 내가 처한 처지와 무대를 상징합니다.' },
  { slug: 'spirit', name: '죽음·귀신·조상', desc: '죽는 꿈, 돌아가신 분, 귀신, 장례식 꿈. 죽음 꿈은 뜻밖에 길몽이 많습니다.' },
  { slug: 'love', name: '연애·결혼·임신', desc: '결혼하는 꿈, 임신하는 꿈, 바람피우는 꿈, 고백받는 꿈. 관계의 변화와 새 시작을 뜻합니다.' },
  { slug: 'food', name: '음식', desc: '과일·고기·밥·술 등 먹는 꿈. 음식 꿈은 재물과 건강, 태몽과 이어집니다.' },
  { slug: 'disaster', name: '사고·재난', desc: '교통사고·화재·지진·전쟁 꿈. 큰 변화와 정리의 신호로 읽는 꿈입니다.' }
];

export const DREAMS = [...animals, ...bodyMoney, ...spiritLovePerson, ...actionNature, ...objectEtc, ...peoplePlaces, ...emotionMisc, ...misc8, ...animals2, ...bodyObject2, ...action2, ...naturePlace2, ...animalsPlaces3, ...objectBody3, ...misc15, ...misc16, ...misc17, ...misc18, ...misc19, ...misc20];
