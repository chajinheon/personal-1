export interface Quote {
  text: string;
  author: string;
}

export const studyQuotes: Quote[] = [
  // 1-10: 카뮈
  { text: "한겨울에야 나는 내 안에 여름이 계속 도사리고 있음을 깨달았다.", author: "알베르 카뮈 (Albert Camus)" },
  { text: "삶에 대한 절망 없이는 삶에 대한 사랑도 없다.", author: "알베르 카뮈 (Albert Camus)" },
  { text: "행복이란 그 자체가 긴 인내이다.", author: "알베르 카뮈 (Albert Camus)" },
  { text: "진정으로 중대한 철학적 문제는 오직 하나뿐이다. 그것은 자살이다.", author: "알베르 카뮈 (Albert Camus)" },
  { text: "인생의 의미를 찾는 것을 멈추지 않는 한 결코 살아갈 수 없다.", author: "알베르 카뮈 (Albert Camus)" },
  { text: "모든 위대한 행위와 모든 위대한 사상은 우스꽝스러운 시작을 갖는다.", author: "알베르 카뮈 (Albert Camus)" },
  { text: "눈물이 마르지 않는 한, 우리는 아직 끝난 것이 아니다.", author: "알베르 카뮈 (Albert Camus)" },
  { text: "미래에 대한 진정한 관대함은 현재에 모든 것을 바치는 것이다.", author: "알베르 카뮈 (Albert Camus)" },
  { text: "가을은 모든 잎이 꽃이 되는 두 번째 봄이다.", author: "알베르 카뮈 (Albert Camus)" },
  { text: "자유는 오직 스스로 쟁취하는 자의 몫이다.", author: "알베르 카뮈 (Albert Camus)" },

  // 11-20: 니체
  { text: "나를 죽이지 못하는 고통은 나를 더욱 강하게 만든다.", author: "프리드리히 니체 (Friedrich Nietzsche)" },
  { text: "살아야 할 이유를 아는 사람은 어떤 방식이든 견뎌낼 수 있다.", author: "프리드리히 니체 (Friedrich Nietzsche)" },
  { text: "춤추는 별을 잉태하려면 반드시 스스로의 내면에 혼돈을 지녀야 한다.", author: "프리드리히 니체 (Friedrich Nietzsche)" },
  { text: "아모르 파티 (운명애). 네 운명을 사랑하라.", author: "프리드리히 니체 (Friedrich Nietzsche)" },
  { text: "위대한 것을 성취하려면 고통마저 기꺼이 감내해야 한다.", author: "프리드리히 니체 (Friedrich Nietzsche)" },
  { text: "심연을 오랫동안 들여다보면 심연 또한 너를 들여다본다.", author: "프리드리히 니체 (Friedrich Nietzsche)" },
  { text: "인간은 극복되어야 할 그 무엇이다.", author: "프리드리히 니체 (Friedrich Nietzsche)" },
  { text: "모든 신념은 거짓말보다 더 큰 진리의 적이다.", author: "프리드리히 니체 (Friedrich Nietzsche)" },
  { text: "자신의 길을 가는 사람은 누구와도 만나지 않는다.", author: "프리드리히 니체 (Friedrich Nietzsche)" },
  { text: "가장 높은 산에 오르는 자는 모든 비극을 비웃는다.", author: "프리드리히 니체 (Friedrich Nietzsche)" },

  // 21-30: 마르쿠스 아우렐리우스 (스토아 철학)
  { text: "우리가 통제할 수 있는 것은 오직 우리의 마음뿐이다. 이를 깨달으면 힘을 얻게 될 것이다.", author: "마르쿠스 아우렐리우스 (Marcus Aurelius)" },
  { text: "장애물이 곧 길이다. 행동을 가로막는 것이 오히려 행동을 나아가게 한다.", author: "마르쿠스 아우렐리우스 (Marcus Aurelius)" },
  { text: "우리가 듣는 모든 것은 사실이 아니라 의견이다. 우리가 보는 모든 것은 진실이 아니라 관점이다.", author: "마르쿠스 아우렐리우스 (Marcus Aurelius)" },
  { text: "좋은 사람이란 무엇인가를 논쟁하는 데 시간을 낭비하지 마라. 스스로 그런 사람이 되어라.", author: "마르쿠스 아우렐리우스 (Marcus Aurelius)" },
  { text: "고통은 사물 자체 때문이 아니라 당신의 평가 때문이다.", author: "마르쿠스 아우렐리우스 (Marcus Aurelius)" },
  { text: "인생의 아름다움에 머물러라. 별들을 바라보고, 당신이 별들과 함께 달리고 있다고 생각하라.", author: "마르쿠스 아우렐리우스 (Marcus Aurelius)" },
  { text: "최고의 복수는 너에게 상처를 준 사람처럼 되지 않는 것이다.", author: "마르쿠스 아우렐리우스 (Marcus Aurelius)" },
  { text: "영혼은 그 생각의 색깔로 물든다.", author: "마르쿠스 아우렐리우스 (Marcus Aurelius)" },
  { text: "운명이 너를 묶어둔 그 환경을 받아들이고 사랑하라.", author: "마르쿠스 아우렐리우스 (Marcus Aurelius)" },
  { text: "오늘 할 수 있는 일을 내일로 미루지 마라.", author: "마르쿠스 아우렐리우스 (Marcus Aurelius)" },

  // 31-40: 세네카 & 에픽테토스 (스토아 철학)
  { text: "우리는 현실보다 상상 속에서 더 자주 고통받는다.", author: "세네카 (Seneca)" },
  { text: "항해하는 자가 자신이 목적하는 항구를 모른다면, 어떤 바람도 순풍이 될 수 없다.", author: "세네카 (Seneca)" },
  { text: "우리의 자신감 부족은 어려움의 결과가 아니다. 어려움은 우리의 자신감 부족에서 비롯된다.", author: "세네카 (Seneca)" },
  { text: "죽음을 두려워하는 자는 결코 살아있는 자로서 가치 있는 일을 할 수 없다.", author: "세네카 (Seneca)" },
  { text: "일어난 일 자체가 사람을 괴롭히는 것이 아니라, 그 일에 대해 그들이 취하는 관념이 사람을 괴롭힌다.", author: "에픽테토스 (Epictetus)" },
  { text: "당신이 먼저 무엇이 되고자 하는지 스스로에게 말하라. 그런 다음 당신이 해야 할 일을 하라.", author: "에픽테토스 (Epictetus)" },
  { text: "인간이 어떤 존재인지를 보여주는 것은 다름 아닌 어려움이다.", author: "에픽테토스 (Epictetus)" },
  { text: "상황이 당신이 원하는 대로 일어나기를 요구하지 마라. 상황이 일어나는 대로 일어나기를 원하라.", author: "에픽테토스 (Epictetus)" },
  { text: "자신의 철학을 설명하려 하지 마라. 그것을 체현하라.", author: "에픽테토스 (Epictetus)" },
  { text: "이미 알고 있다고 생각하는 것을 배우기 시작하는 것은 불가능하다.", author: "에픽테토스 (Epictetus)" },

  // 41-50: 빅터 프랭클 & 사르트르 (실존주의)
  { text: "어떤 상황에서든 자신의 태도를 선택할 수 있는 '마지막 자유'만은 빼앗을 수 없다.", author: "빅터 프랭클 (Viktor Frankl)" },
  { text: "자극과 반응 사이에는 공간이 있다. 그 공간에는 반응을 선택할 수 있는 우리의 자유와 힘이 있다.", author: "빅터 프랭클 (Viktor Frankl)" },
  { text: "성공을 목표로 삼지 마라. 성공에 집착할수록 더 빗나가게 될 것이다.", author: "빅터 프랭클 (Viktor Frankl)" },
  { text: "상황을 더 이상 변화시킬 수 없을 때, 우리는 우리 자신을 변화시키도록 도전받는다.", author: "빅터 프랭클 (Viktor Frankl)" },
  { text: "우리가 삶에 무엇을 기대하는지는 중요하지 않다. 오히려 삶이 우리에게 무엇을 기대하는지가 중요하다.", author: "빅터 프랭클 (Viktor Frankl)" },
  { text: "고통은 의미를 찾는 순간 더 이상 고통이기를 멈춘다.", author: "빅터 프랭클 (Viktor Frankl)" },
  { text: "인생을 두 번째로 사는 것처럼, 그리고 첫 번째 인생에서 잘못 행동했던 바로 그 행동을 지금 막 하려는 것처럼 살아라.", author: "빅터 프랭클 (Viktor Frankl)" },
  { text: "인간의 자유는 상황을 회피하는 데 있는 것이 아니라, 그 상황에 맞서는 데 있다.", author: "장폴 사르트르 (Jean-Paul Sartre)" },
  { text: "인간은 자유롭도록 선고받았다. 자신이 하는 모든 것에 대해 책임을 져야 하기 때문이다.", author: "장폴 사르트르 (Jean-Paul Sartre)" },
  { text: "자기가 사는 사회를 이해하려면 가장 혜택받지 못한 계층의 관점에서 바라보아야 한다.", author: "장폴 사르트르 (Jean-Paul Sartre)" },


  // 61-70: 문학가 및 철학자 (괴테, 톨스토이 등)
  { text: "인간은 노력하는 한 방황하는 것이다.", author: "요한 볼프강 폰 괴테 (Johann W. von Goethe)" },
  { text: "중요한 것은 행위이지 명성이 아니다.", author: "요한 볼프강 폰 괴테 (Johann W. von Goethe)" },
  { text: "태초에 행위가 있었느니라!", author: "요한 볼프강 폰 괴테 (Johann W. von Goethe)" },
  { text: "모두가 세상을 변화시키려고 생각하지만, 아무도 자기 자신을 변화시키려고는 생각하지 않는다.", author: "레프 톨스토이 (Leo Tolstoy)" },
  { text: "경험이란 모든 사람이 자신의 실수에 붙이는 이름이다.", author: "오스카 와일드 (Oscar Wilde)" },
  { text: "인생은 자신을 찾는 것이 아니라, 자신을 창조하는 것이다.", author: "조지 버나드 쇼 (George Bernard Shaw)" },
  { text: "당신이 세상에서 보고 싶은 변화, 그 자체가 되어라.", author: "마하트마 간디 (Mahatma Gandhi)" },
  { text: "미래는 현재 우리가 무엇을 하고 있는가에 달려 있다.", author: "마하트마 간디 (Mahatma Gandhi)" },
  { text: "당신이 동의하지 않는 한, 그 누구도 당신에게 상처를 줄 수 없다.", author: "에리히 프롬 (Erich Fromm)" },
  { text: "용기란 두려움이 없는 것이 아니라, 두려움보다 더 중요한 무언가가 있다고 판단하는 것이다.", author: "암브로스 레드문 (Ambrose Redmoon)" },

  // 71-80: 근현대 위인 (루스벨트, 에디슨 등)
  { text: "우리가 할 수 있는 최선은, 지금 있는 곳에서, 가진 것을 가지고, 할 수 있는 일을 하는 것이다.", author: "시어도어 루스벨트 (Theodore Roosevelt)" },
  { text: "희망은 어둠 속에서 시작된다. 기어코 다시 일어나려는 고집스러운 의지이다.", author: "안네 라모트 (Anne Lamott)" },
  { text: "나는 폭풍이 두렵지 않다. 나의 배를 조종하는 법을 배우고 있기 때문이다.", author: "루이자 메이 올컷 (Louisa May Alcott)" },
  { text: "어떤 일을 할 수 있다고 생각하든, 할 수 없다고 생각하든, 당신의 생각은 항상 옳다.", author: "헨리 포드 (Henry Ford)" },

  { text: "성공이란 열정을 잃지 않고 실패를 거듭할 수 있는 능력이다.", author: "윈스턴 처칠 (Winston Churchill)" },
  { text: "어제와 똑같이 살면서 다른 미래를 기대하는 것은 정신병의 초기 증상이다.", author: "알베르트 아인슈타인 (Albert Einstein)" },


  // 91-100: 극복과 끈기에 관한 울림 있는 통찰
  { text: "당신의 한계는 당신이 스스로 정한 것일 뿐이다.", author: "에픽테토스 (Epictetus)" },
  { text: "지혜로운 자는 남을 탓하지 않고 자신을 돌아본다.", author: "소크라테스 (Socrates)" },
  { text: "위대한 정신은 항상 평범한 정신들의 격렬한 반대에 부딪혀 왔다.", author: "알베르트 아인슈타인 (Albert Einstein)" },
  { text: "당신이 할 수 있는 가장 큰 모험은 당신이 꿈꾸던 삶을 사는 것이다.", author: "오프라 윈프리 (Oprah Winfrey)" },
  { text: "자신을 믿어라. 자신의 능력을 믿지 않고는 성공적이고 행복할 수 없다.", author: "노먼 빈센트 필 (Norman Vincent Peale)" },
  { text: "모든 성취의 시작점은 갈망이다.", author: "나폴레온 힐 (Napoleon Hill)" },
  { text: "우리가 두려워해야 할 유일한 것은 두려움 그 자체이다.", author: "프랭클린 D. 루스벨트 (F. D. Roosevelt)" },
  { text: "시작하는 방법은 말을 그만두고 행동을 시작하는 것이다.", author: "월트 디즈니 (Walt Disney)" },
  { text: "당신이 지금 어디에 있는지는 중요하지 않다. 어디로 향하고 있는지가 중요하다.", author: "브라이언 트레이시 (Brian Tracy)" },
  { text: "포기해야겠다는 생각이 들 때야말로 성공에 가까워진 때이다.", author: "밥 파슨스 (Bob Parsons)" }
];

export function getRandomQuote(): Quote {
  const randomIndex = Math.floor(Math.random() * studyQuotes.length);
  return studyQuotes[randomIndex];
}
