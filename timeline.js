// Philosophy timeline + star map — deep-sky museum variant.
const {
  useState,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect
} = React;
const REL_COLORS = {
  teacher: 'oklch(0.70 0.13 240)',
  develop: 'oklch(0.72 0.13 165)',
  critique: 'oklch(0.65 0.18 25)',
  influence: 'oklch(0.75 0.12 75)'
};
const REL_LABELS = {
  teacher: {
    zh: '师徒',
    en: 'Teacher → Student'
  },
  develop: {
    zh: '继承与发展',
    en: 'Inherit & Develop'
  },
  critique: {
    zh: '批判与反对',
    en: 'Critique & Opposition'
  },
  influence: {
    zh: '思想影响',
    en: 'Influence'
  }
};
const YEAR_ANCHORS = [{
  y: -650,
  x: 0.00
}, {
  y: -500,
  x: 0.04
}, {
  y: -300,
  x: 0.13
}, {
  y: 1,
  x: 0.19
}, {
  y: 500,
  x: 0.24
}, {
  y: 1000,
  x: 0.29
}, {
  y: 1400,
  x: 0.35
}, {
  y: 1600,
  x: 0.43
}, {
  y: 1750,
  x: 0.52
}, {
  y: 1850,
  x: 0.64
}, {
  y: 1900,
  x: 0.75
}, {
  y: 1950,
  x: 0.88
}, {
  y: 1970,
  x: 1.00
}];
function yearToRatio(year) {
  for (let i = 0; i < YEAR_ANCHORS.length - 1; i++) {
    const a = YEAR_ANCHORS[i],
      b = YEAR_ANCHORS[i + 1];
    if (year >= a.y && year <= b.y) {
      const t = (year - a.y) / (b.y - a.y);
      return a.x + t * (b.x - a.x);
    }
  }
  return year < YEAR_ANCHORS[0].y ? 0 : 1;
}
const WORLD_W = 11200;
const WORLD_PAD_L = 80;
const WORLD_PAD_R = 64;
function yearToX(y) {
  return WORLD_PAD_L + yearToRatio(y) * (WORLD_W - WORLD_PAD_L - WORLD_PAD_R);
}
function fmtYearShort(y, lang) {
  if (y == null) return '';
  if (y < 0) return `${-y} ${lang === 'zh' ? '前' : 'BCE'}`;
  return `${y}`;
}
function fmtLife(p, lang) {
  const approx = p.approx ? lang === 'zh' ? '约' : 'c. ' : '';
  const b = fmtYearShort(p.year, lang);
  const d = p.died != null ? fmtYearShort(p.died, lang) : lang === 'zh' ? '在世' : 'living';
  return `${approx}${b} – ${d}`;
}
const PAL = {
  bg: '#06080f',
  bgInk: '#0a0f1e',
  bgPanel: '#0c1122',
  ink: '#f2ecdc',
  inkMid: 'rgba(242,236,220,0.78)',
  inkSoft: 'rgba(242,236,220,0.55)',
  inkFaint: 'rgba(242,236,220,0.18)',
  inkLine: 'rgba(242,236,220,0.28)',
  nodeHalo: 'rgba(242,236,220,0.08)',
  ring: 'rgba(242,236,220,0.35)',
  gold: 'oklch(0.82 0.10 85)',
  goldSoft: 'rgba(219,190,112,0.24)',
  goldFaint: 'rgba(219,190,112,0.10)',
  blueFaint: 'rgba(92,118,168,0.10)'
};
const FONT_SERIF_ZH = 'ui-serif, "Songti SC", "STSong", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, Georgia, serif';
const FONT_SERIF_EN = 'Georgia, "Times New Roman", "Songti SC", "STSong", serif';
const FONT_MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace';
const ENABLE_REMOTE_PORTRAITS = new URLSearchParams(window.location.search).get('portraits') === '1';
const REMOTE_PORTRAIT_TIMEOUT_MS = 1600;
const CANON_PHILOSOPHER_IDS = new Set(['socrates', 'plato', 'aristotle', 'augustine', 'aquinas', 'machiavelli', 'descartes', 'locke', 'hume', 'kant', 'hegel', 'marx', 'nietzsche', 'wittgenstein', 'heidegger']);
const PERSONALITY_AXES = [{
  key: 'knowledge',
  left: 'R',
  right: 'E',
  leftLabel: '理性',
  rightLabel: '经验'
}, {
  key: 'order',
  left: 'O',
  right: 'F',
  leftLabel: '秩序',
  rightLabel: '自由'
}, {
  key: 'mode',
  left: 'C',
  right: 'A',
  leftLabel: '沉思',
  rightLabel: '行动'
}, {
  key: 'stance',
  left: 'S',
  right: 'B',
  leftLabel: '怀疑',
  rightLabel: '信念'
}];
const PERSONALITY_QUESTIONS = [{
  id: 'q1',
  axis: 'knowledge',
  leftValue: 'R',
  rightValue: 'E',
  question: '当你遇到一个复杂问题，你更相信哪种路径？',
  leftLabel: '先找清晰原则',
  rightLabel: '先看真实经验'
}, {
  id: 'q2',
  axis: 'knowledge',
  leftValue: 'R',
  rightValue: 'E',
  question: '你更容易被哪类解释打动？',
  leftLabel: '结构严密的论证',
  rightLabel: '贴近生活的观察'
}, {
  id: 'q3',
  axis: 'knowledge',
  leftValue: 'R',
  rightValue: 'E',
  question: '面对争论时，你会优先追问什么？',
  leftLabel: '概念是否一致',
  rightLabel: '事实是否成立'
}, {
  id: 'q4',
  axis: 'order',
  leftValue: 'O',
  rightValue: 'F',
  question: '你理想中的思想世界更像什么？',
  leftLabel: '一座有秩序的建筑',
  rightLabel: '一片可漫游的旷野'
}, {
  id: 'q5',
  axis: 'order',
  leftValue: 'O',
  rightValue: 'F',
  question: '当规则束缚了表达，你通常会？',
  leftLabel: '先理解规则的理由',
  rightLabel: '寻找突破规则的可能'
}, {
  id: 'q6',
  axis: 'order',
  leftValue: 'O',
  rightValue: 'F',
  question: '你更欣赏哪种哲学气质？',
  leftLabel: '建立体系',
  rightLabel: '打开可能性'
}, {
  id: 'q7',
  axis: 'mode',
  leftValue: 'C',
  rightValue: 'A',
  question: '思想对你最重要的作用是？',
  leftLabel: '让内心变得清明',
  rightLabel: '让现实发生改变'
}, {
  id: 'q8',
  axis: 'mode',
  leftValue: 'C',
  rightValue: 'A',
  question: '如果你发现一个真理，你更想？',
  leftLabel: '继续理解它',
  rightLabel: '把它付诸实践'
}, {
  id: 'q9',
  axis: 'mode',
  leftValue: 'C',
  rightValue: 'A',
  question: '你面对时代问题时，更像哪一种人？',
  leftLabel: '凝视深处的人',
  rightLabel: '走入现场的人'
}, {
  id: 'q10',
  axis: 'stance',
  leftValue: 'S',
  rightValue: 'B',
  question: '面对一个宏大的信念，你的第一反应是？',
  leftLabel: '先拆开检验',
  rightLabel: '先理解它为何动人'
}, {
  id: 'q11',
  axis: 'stance',
  leftValue: 'S',
  rightValue: 'B',
  question: '你更害怕哪一种思想状态？',
  leftLabel: '过早相信',
  rightLabel: '永远不敢相信'
}, {
  id: 'q12',
  axis: 'stance',
  leftValue: 'S',
  rightValue: 'B',
  question: '你更愿意把人生理解为？',
  leftLabel: '持续追问的过程',
  rightLabel: '逐渐承担的承诺'
}];
const PERSONALITY_TYPES = {
  ROCS: {
    name: '批判理性的守夜人',
    subtitle: '你在秩序中保持清醒，在信念前保留审判。',
    philosophers: ['kant'],
    keywords: ['边界', '自律', '批判', '清明'],
    message: '你不是为了否定而怀疑，而是为了让真正值得相信的东西站得更稳。你的哲学气质，是在混乱中保留尺度。',
    description: '你偏爱严密的原则、稳定的结构和冷静的检验。你会先问“凭什么”，再决定是否相信。',
    xhsTitle: '我的哲学人格：批判理性的守夜人'
  },
  ROCB: {
    name: '理念城邦的建筑师',
    subtitle: '你相信真理需要形式，灵魂需要秩序。',
    philosophers: ['plato', 'aquinas'],
    keywords: ['理念', '秩序', '教育', '上升'],
    message: '你天然会把零散经验推向更高的图景。对你来说，生活不是随波逐流，而是让灵魂慢慢靠近更好的形式。',
    description: '你倾向于用宏大的结构理解人生，并相信思想可以塑造更好的共同生活。',
    xhsTitle: '我的哲学人格：理念城邦的建筑师'
  },
  ROAS: {
    name: '现实结构的解剖者',
    subtitle: '你用理性拆开制度，也用行动逼近真相。',
    philosophers: ['marx'],
    keywords: ['结构', '批判', '实践', '解放'],
    message: '你不会满足于漂亮解释。你会追问它背后的权力、劳动和利益，并想知道世界是否还能被重新安排。',
    description: '你重视体系分析，也重视现实改变。思想对你来说不是装饰，而是进入现实的工具。',
    xhsTitle: '我的哲学人格：现实结构的解剖者'
  },
  ROAB: {
    name: '历史精神的登山者',
    subtitle: '你相信冲突不是终点，而是更高理解的路。',
    philosophers: ['hegel'],
    keywords: ['辩证', '历史', '整体', '生成'],
    message: '你能在矛盾中看见运动，在失败中看见新的阶段。你的天赋，是把破碎经验组织成一条正在展开的道路。',
    description: '你倾向于从整体、历史和发展中理解问题，并相信行动会进入更大的理性进程。',
    xhsTitle: '我的哲学人格：历史精神的登山者'
  },
  RFCS: {
    name: '怀疑起点的独行者',
    subtitle: '你先清空世界，再寻找不可动摇的一点。',
    philosophers: ['descartes'],
    keywords: ['怀疑', '主体', '清晰', '起点'],
    message: '你愿意独自穿过不确定，只为找到一个真正属于自己的起点。你的清醒，有时看起来孤独，但它很有力量。',
    description: '你重视内在确定性，也不轻易接受现成答案。你会从怀疑出发，寻找更可靠的基础。',
    xhsTitle: '我的哲学人格：怀疑起点的独行者'
  },
  RFCB: {
    name: '价值旷野的重估者',
    subtitle: '你不怕推翻旧神，只怕生命失去强度。',
    philosophers: ['nietzsche'],
    keywords: ['重估', '创造', '风格', '生命力'],
    message: '你身上有一种不愿被驯服的诚实。你会质疑继承来的价值，也会逼自己活出更锋利、更有风格的答案。',
    description: '你偏向自由、创造和内在强度。你相信哲学不是安慰，而是重新估量生命。',
    xhsTitle: '我的哲学人格：价值旷野的重估者'
  },
  RFAS: {
    name: '自由现场的选择者',
    subtitle: '你知道没有现成答案，所以必须自己负责。',
    philosophers: ['sartre'],
    keywords: ['自由', '选择', '责任', '处境'],
    message: '你不轻易把人生交给命运、规则或他人的定义。你的哲学气质，是在没有保证的地方，仍然选择承担。',
    description: '你倾向于把思想落实为选择和行动，并对既定身份保持警惕。',
    xhsTitle: '我的哲学人格：自由现场的选择者'
  },
  RFAB: {
    name: '自然契约的点火者',
    subtitle: '你相信自由不该只是口号，也应成为生活制度。',
    philosophers: ['rousseau'],
    keywords: ['自由', '契约', '共同体', '热忱'],
    message: '你对人的可能性仍保有热度。你会对不公感到不安，也会相信更真实的自由需要被共同创造。',
    description: '你重视自由、公共生活与人的可塑性，愿意把信念推向行动。',
    xhsTitle: '我的哲学人格：自然契约的点火者'
  },
  EOCS: {
    name: '经验迷雾的怀疑者',
    subtitle: '你相信经验，但不迷信经验给出的故事。',
    philosophers: ['hume'],
    keywords: ['经验', '习惯', '怀疑', '温和'],
    message: '你看得见人类理性的边界，也懂得许多确定感只是习惯的影子。你的温和，是一种非常锋利的诚实。',
    description: '你偏向经验观察和冷静怀疑，善于拆解因果、自我和信念中的过度自信。',
    xhsTitle: '我的哲学人格：经验迷雾的怀疑者'
  },
  EOCB: {
    name: '万物分类的观察者',
    subtitle: '你从具体事物出发，为世界建立可理解的秩序。',
    philosophers: ['aristotle'],
    keywords: ['观察', '分类', '德性', '目的'],
    message: '你相信思想不该飘离世界。真正的智慧，是看见事物如何成为它自己，也看见人如何在生活中养成德性。',
    description: '你重视观察、分类和实践理性，倾向于从具体世界中发现稳定结构。',
    xhsTitle: '我的哲学人格：万物分类的观察者'
  },
  EOAS: {
    name: '新工具的实验者',
    subtitle: '你把知识看作改变世界的方法。',
    philosophers: ['bacon'],
    keywords: ['方法', '实验', '知识', '改造'],
    message: '你不满足于空洞玄想。你想知道什么方法真正有效，什么知识能扩大人的能力。',
    description: '你相信经验、方法和行动的力量，喜欢把问题转化为可检验、可推进的步骤。',
    xhsTitle: '我的哲学人格：新工具的实验者'
  },
  EOAB: {
    name: '自由制度的奠基者',
    subtitle: '你相信经验能教育心灵，制度应保护自由。',
    philosophers: ['locke'],
    keywords: ['经验', '权利', '宽容', '制度'],
    message: '你对人保持实际而温和的信任。你知道自由需要边界，也知道好的制度应当给人成长的空间。',
    description: '你偏向经验主义、有限权力和个人自由，愿意用稳健方式改善共同生活。',
    xhsTitle: '我的哲学人格：自由制度的奠基者'
  },
  EFCS: {
    name: '语言迷宫的拆线人',
    subtitle: '你不急着回答，而是先看问题如何被语言制造。',
    philosophers: ['wittgenstein'],
    keywords: ['语言', '规则', '澄清', '边界'],
    message: '你擅长听出一句话里的陷阱。你知道许多困惑不是没有答案，而是问题本身需要被重新看见。',
    description: '你重视日常经验与语言用法，对抽象体系保持距离，擅长澄清问题。',
    xhsTitle: '我的哲学人格：语言迷宫的拆线人'
  },
  EFCB: {
    name: '存在林中的倾听者',
    subtitle: '你从经验深处听见存在的问题。',
    philosophers: ['heidegger'],
    keywords: ['存在', '时间', '栖居', '显现'],
    message: '你不会只问事情有什么用，也会问它如何向你显现。你的敏感，让平常世界重新变得陌生而深邃。',
    description: '你偏向经验、自由和沉思，愿意在日常生活中追问存在、时间与意义。',
    xhsTitle: '我的哲学人格：存在林中的倾听者'
  },
  EFAS: {
    name: '权力谱系的破壁者',
    subtitle: '你在经验现场追踪权力如何塑造我们。',
    philosophers: ['foucault'],
    keywords: ['权力', '话语', '身体', '谱系'],
    message: '你对“理所当然”有天然的不信任。你会看见制度如何进入身体，也会寻找从缝隙中重新行动的可能。',
    description: '你偏向经验、开放、行动和怀疑，擅长把思想带入历史现场与权力结构。',
    xhsTitle: '我的哲学人格：权力谱系的破壁者'
  },
  EFAB: {
    name: '实践后果的造路人',
    subtitle: '你相信真理要在生活中发生作用。',
    philosophers: ['dewey', 'james'],
    keywords: ['实践', '经验', '成长', '民主'],
    message: '你不把思想供在高处。对你来说，一个观念是否有生命，要看它能否改善经验、连接他人、打开未来。',
    description: '你偏向经验、自由、行动和信念，重视实践后果与持续成长。',
    xhsTitle: '我的哲学人格：实践后果的造路人'
  }
};

// --- Unified Cameo Portrait -----------------------------------------------
// Fetches a thumbnail from Wikipedia (REST summary API). Falls back to an
// engraved silhouette while loading or if the article has no image.
const WIKI_OVERRIDES = window.PHI_DATA && window.PHI_DATA.WIKI_TITLES || {};
const LOCAL_PORTRAITS = window.PHI_LOCAL_PORTRAITS || {};
const PORTRAIT_OVERRIDES = ENABLE_REMOTE_PORTRAITS ? {
  descartes: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Frans_Hals_-_Portret_van_Ren%C3%A9_Descartes.jpg/256px-Frans_Hals_-_Portret_van_Ren%C3%A9_Descartes.jpg'
} : {};
const _wikiCache = new Map();
function wikiTitleFor(id, en) {
  if (WIKI_OVERRIDES[id]) return WIKI_OVERRIDES[id];
  return (en || id).replace(/^c\.\s*/, '').replace(/\s/g, '_');
}
async function fetchWikiThumb(title) {
  if (!ENABLE_REMOTE_PORTRAITS) return null;
  if (_wikiCache.has(title)) return _wikiCache.get(title);
  const promise = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REMOTE_PORTRAIT_TIMEOUT_MS);
    try {
      let normalizedTitle = title;
      try {
        normalizedTitle = decodeURIComponent(title);
      } catch {}
      const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(normalizedTitle)}`, {
        signal: controller.signal
      });
      if (!r.ok) return null;
      const j = await r.json();
      return j.thumbnail?.source || j.originalimage?.source || null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  })();
  _wikiCache.set(title, promise);
  return promise;
}
function Silhouette({
  id,
  size
}) {
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = n => {
    const x = Math.sin(seed * 1.37 + n * 2.9) * 10000;
    return x - Math.floor(x);
  };
  const fwd = seed % 2 === 0 ? 1 : -1;
  const noseOut = 1.5 + r(1) * 1.2;
  const chin = r(2) * 1.4;
  const browBump = r(3) * 0.8;
  const hairK = Math.floor(r(4) * 5);
  const beardK = r(5) > 0.45 ? Math.floor(r(6) * 3) + 1 : 0;
  const tp = 16,
    fh = 22 + browBump,
    np = 30,
    mp = 36,
    cp = 42 + chin;
  const path = `M 25 48 C 24.5 48 22 ${tp + 14} 22 ${tp + 4} C 22 ${tp - 2} 28 ${tp - 3} 33 ${tp - 2} C 40 ${tp - 1} 44 ${tp + 3} 45 ${tp + 12} L 45.3 ${fh - 1} C 45.7 ${fh} 46.3 ${fh + 2.2} 46.7 ${fh + 4} L ${47 + noseOut} ${np - 1} L ${47 + noseOut * 0.7} ${np + 1.5} L 46 ${np + 3.5} L 45.6 ${mp - 1} L 46.4 ${mp + 1} L 45.6 ${mp + 3} L 45 ${cp - 2} L 44 ${cp} L 41 ${cp + 2} L 36 ${cp + 2.5} L 33 50 L 33 56 L 52 64 L 12 64 L 12 54 L 22 50 Z`;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 64 64",
    width: size,
    height: size,
    style: {
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("clipPath", {
    id: `c-${id}`
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "31"
  }))), /*#__PURE__*/React.createElement("g", {
    clipPath: `url(#c-${id})`
  }, /*#__PURE__*/React.createElement("rect", {
    width: "64",
    height: "64",
    fill: PAL.bgInk
  }), /*#__PURE__*/React.createElement("g", {
    transform: fwd === -1 ? 'translate(64 0) scale(-1 1)' : ''
  }, /*#__PURE__*/React.createElement("path", {
    d: path,
    fill: "rgba(242,236,220,0.7)"
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "30.5",
    fill: "none",
    stroke: PAL.ring,
    strokeWidth: "0.8"
  }));
}
function Cameo({
  id,
  en,
  size = 46
}) {
  const localSrc = LOCAL_PORTRAITS[id] || null;
  const [src, setSrc] = useState(localSrc || PORTRAIT_OVERRIDES[id] || null);
  const [errored, setErrored] = useState(false);
  useEffect(() => {
    let cancel = false;
    const directSrc = LOCAL_PORTRAITS[id] || PORTRAIT_OVERRIDES[id] || null;
    setSrc(directSrc);
    setErrored(false);
    if (directSrc && !ENABLE_REMOTE_PORTRAITS) return () => {
      cancel = true;
    };
    fetchWikiThumb(wikiTitleFor(id, en)).then(url => {
      if (!cancel) {
        if (url) setSrc(url);else if (!directSrc) setErrored(true);
      }
    });
    return () => {
      cancel = true;
    };
  }, [id, en]);
  if (!src || errored) return /*#__PURE__*/React.createElement(Silhouette, {
    id: id,
    size: size
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "",
    loading: "lazy",
    onError: () => setErrored(true),
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      objectFit: 'cover',
      objectPosition: 'center 25%',
      display: 'block',
      filter: 'grayscale(0.55) contrast(1.05) sepia(0.12)',
      background: PAL.bgInk
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      boxShadow: `inset 0 0 0 0.5px ${PAL.ring}`,
      pointerEvents: 'none'
    }
  }));
}
function PhilosophyTimeline({
  fixedHeight = null
}) {
  const {
    ERAS,
    SCHOOLS,
    RELATIONS,
    PHILOSOPHERS
  } = window.PHI_DATA;
  const [lang, setLang] = useState(() => localStorage.getItem('phi-lang') || 'zh');
  const [density, setDensity] = useState('curated');
  const [activeSchool, setActiveSchool] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [mobileLegendOpen, setMobileLegendOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [savedPersonality, setSavedPersonality] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('phi-personality-result') || 'null');
    } catch {
      return null;
    }
  });
  const [windowW, setWindowW] = useState(() => window.innerWidth || 1200);
  const [scrollX, setScrollX] = useState(0);
  const [viewportW, setViewportW] = useState(1200);
  const [viewportH, setViewportH] = useState(540);
  const isMobile = windowW <= 720;
  useEffect(() => {
    localStorage.setItem('phi-lang', lang);
  }, [lang]);
  const scrollerRef = useRef(null);
  useEffect(() => {
    const update = () => setWindowW(window.innerWidth || 1200);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      setViewportW(el.clientWidth);
      setViewportH(el.clientHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Curated mode is a canonical "around top 50" reading path. Full mode keeps
  // the wider atlas for exploration.
  const CORE_PHILOSOPHER_IDS = useMemo(() => new Set(['thales', 'pythagoras', 'heraclitus', 'parmenides', 'democritus', 'protagoras', 'socrates', 'plato', 'aristotle', 'epicurus', 'zeno_citium', 'plotinus', 'augustine', 'avicenna', 'averroes', 'aquinas', 'ockham', 'machiavelli', 'montaigne', 'bacon', 'hobbes', 'descartes', 'spinoza', 'locke', 'leibniz', 'berkeley', 'hume', 'voltaire', 'rousseau', 'kant', 'hegel', 'schopenhauer', 'mill', 'kierkegaard', 'marx', 'peirce', 'james', 'nietzsche', 'frege', 'husserl', 'dewey', 'russell', 'wittgenstein', 'heidegger', 'sartre', 'quine', 'adorno', 'rawls', 'foucault', 'habermas', 'derrida', 'kripke']), []);
  const visiblePhilosophers = useMemo(() => density === 'curated' ? PHILOSOPHERS.filter(p => CORE_PHILOSOPHER_IDS.has(p.id)) : PHILOSOPHERS, [density, PHILOSOPHERS, CORE_PHILOSOPHER_IDS]);
  const schoolCounts = useMemo(() => Object.fromEntries(SCHOOLS.map(s => [s.id, visiblePhilosophers.filter(p => p.schools.includes(s.id)).length])), [SCHOOLS, visiblePhilosophers]);
  useEffect(() => {
    if (density === 'curated' && selectedId && !CORE_PHILOSOPHER_IDS.has(selectedId)) {
      setSelectedId(null);
    }
  }, [density, selectedId, CORE_PHILOSOPHER_IDS]);
  useEffect(() => {
    if (activeSchool && !schoolCounts[activeSchool]) setActiveSchool(null);
  }, [activeSchool, schoolCounts]);
  const nodes = useMemo(() => {
    const h = Math.max(460, viewportH);
    const yMin = isMobile ? 42 : 60,
      yMax = h - (isMobile ? 120 : 70);
    const byYear = [...visiblePhilosophers].sort((a, b) => a.year - b.year);
    const placed = [];
    const minDx = isMobile ? 116 : 130,
      minDy = isMobile ? 82 : 96;
    const collides = (x, y) => placed.some(n => Math.abs(n.x - x) < minDx && Math.abs(n.y - y) < minDy);
    const defaultYTries = [0, 55, -55, 110, -110, 165, -165, 220, -220, 80, -80, 140, -140, 200, -200];
    const canonYTries = [-58, -105, -12, 38, -150, 88, 0, 140, -200, 190];
    for (const p of byYear) {
      const school = SCHOOLS.find(s => s.id === p.schools[0]) || SCHOOLS[0];
      const x0 = yearToX(p.year);
      const baseY = yMin + school.lane * (yMax - yMin);
      const yTries = CANON_PHILOSOPHER_IDS.has(p.id) ? canonYTries : defaultYTries;
      let found = null;
      // 1) try vertical offsets at original x
      for (const dy of yTries) {
        const y = Math.min(yMax, Math.max(yMin, baseY + dy));
        if (!collides(x0, y)) {
          found = {
            x: x0,
            y
          };
          break;
        }
      }
      // 2) sweep x outward, retrying vertical offsets at each
      if (!found) {
        for (let dx = 30; dx <= 900 && !found; dx += 30) {
          for (const sgn of [1, -1]) {
            const xx = x0 + sgn * dx;
            for (const dy of yTries) {
              const y = Math.min(yMax, Math.max(yMin, baseY + dy));
              if (!collides(xx, y)) {
                found = {
                  x: xx,
                  y
                };
                break;
              }
            }
            if (found) break;
          }
        }
      }
      // 3) last resort: accept the original slot
      if (!found) found = {
        x: x0,
        y: baseY
      };
      placed.push({
        id: p.id,
        x: found.x,
        y: found.y,
        data: p
      });
    }
    return Object.fromEntries(placed.map(n => [n.id, n]));
  }, [viewportH, visiblePhilosophers, isMobile]);
  const edges = useMemo(() => RELATIONS.map(([from, to, kind]) => ({
    from,
    to,
    kind
  })).filter(e => nodes[e.from] && nodes[e.to]), [nodes]);
  const focusId = hoveredId || selectedId;
  const focused = useMemo(() => {
    if (!focusId) return {
      nodes: new Set(),
      edges: new Set()
    };
    const nodeSet = new Set([focusId]);
    const edgeSet = new Set();
    edges.forEach((e, i) => {
      if (e.from === focusId || e.to === focusId) {
        edgeSet.add(i);
        nodeSet.add(e.from);
        nodeSet.add(e.to);
      }
    });
    return {
      nodes: nodeSet,
      edges: edgeSet
    };
  }, [focusId, edges]);
  const isInFilter = p => !activeSchool || p.schools.includes(activeSchool);
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => setScrollX(el.scrollLeft);
    el.addEventListener('scroll', onScroll, {
      passive: true
    });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  const jumpToEra = era => {
    const el = scrollerRef.current;
    if (!el) return;
    const r = (yearToRatio(era.start) + yearToRatio(era.end)) / 2;
    el.scrollTo({
      left: Math.max(0, WORLD_PAD_L + r * (WORLD_W - WORLD_PAD_L - WORLD_PAD_R) - el.clientWidth / 2),
      behavior: 'smooth'
    });
  };
  const jumpToSchool = schoolId => {
    const el = scrollerRef.current;
    if (!el || !schoolId) return;
    const first = Object.values(nodes).filter(n => n.data.schools.includes(schoolId)).sort((a, b) => a.data.year - b.data.year)[0];
    if (first) {
      setSelectedId(null);
      el.scrollTo({
        left: Math.max(0, first.x - el.clientWidth * 0.32),
        behavior: 'smooth'
      });
    }
  };
  const jumpToPhilosopher = id => {
    const n = nodes[id];
    const el = scrollerRef.current;
    if (!n || !el) return;
    setSelectedId(id);
    setMobileListOpen(false);
    el.scrollTo({
      left: Math.max(0, n.x - el.clientWidth * (isMobile ? 0.42 : 0.5)),
      behavior: 'smooth'
    });
  };
  const openPersonalityTest = () => {
    setMobileListOpen(false);
    setMobileLegendOpen(false);
    setTestOpen(true);
  };
  const handlePersonalityComplete = result => {
    setSavedPersonality(result);
    localStorage.setItem('phi-personality-result', JSON.stringify(result));
  };
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let down = false,
      startX = 0,
      startLeft = 0;
    const md = e => {
      if (e.target.closest('.phi-node, .phi-panel, button, a, input')) return;
      down = true;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      el.style.cursor = 'grabbing';
    };
    const mm = e => {
      if (!down) return;
      el.scrollLeft = startLeft - (e.clientX - startX);
    };
    const mu = () => {
      down = false;
      el.style.cursor = '';
    };
    el.addEventListener('pointerdown', md);
    window.addEventListener('pointermove', mm);
    window.addEventListener('pointerup', mu);
    return () => {
      el.removeEventListener('pointerdown', md);
      window.removeEventListener('pointermove', mm);
      window.removeEventListener('pointerup', mu);
    };
  }, []);
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = e => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    el.addEventListener('wheel', onWheel, {
      passive: false
    });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);
  const selected = selectedId ? PHILOSOPHERS.find(p => p.id === selectedId) : null;
  const visibleEdges = edges;
  const scrollByDir = dx => scrollerRef.current?.scrollBy({
    left: dx,
    behavior: 'smooth'
  });
  const worldHeight = Math.max(420, viewportH);
  return /*#__PURE__*/React.createElement("div", {
    className: "phi-root",
    style: {
      background: PAL.bg,
      color: PAL.ink,
      height: fixedHeight || '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: lang === 'zh' ? FONT_SERIF_ZH : FONT_SERIF_EN,
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Header, {
    lang: lang,
    setLang: setLang,
    isMobile: isMobile,
    onOpenTest: openPersonalityTest
  }), /*#__PURE__*/React.createElement(EraBar, {
    eras: ERAS,
    onJump: jumpToEra,
    scrollX: scrollX,
    viewportW: viewportW,
    lang: lang,
    isMobile: isMobile
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      position: 'relative',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: scrollerRef,
    "data-scroller": "phi",
    style: {
      position: 'absolute',
      inset: 0,
      overflowX: 'scroll',
      overflowY: 'hidden',
      cursor: isMobile ? 'default' : 'grab',
      background: `radial-gradient(ellipse at 22% 20%, rgba(114,124,160,0.10) 0%, transparent 44%),
                       radial-gradient(ellipse at 72% 76%, rgba(109,70,120,0.07) 0%, transparent 48%),
                       linear-gradient(180deg, rgba(242,236,220,0.018), transparent 18%, rgba(219,190,112,0.018) 100%),
                       ${PAL.bg}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: WORLD_W,
      height: '100%',
      minHeight: worldHeight
    }
  }, /*#__PURE__*/React.createElement(StarBackground, {
    h: worldHeight
  }), /*#__PURE__*/React.createElement(EraDividers, {
    eras: ERAS,
    h: worldHeight
  }), /*#__PURE__*/React.createElement("svg", {
    width: WORLD_W,
    height: worldHeight,
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none'
    }
  }, visibleEdges.map((e, i) => {
    const a = nodes[e.from],
      b = nodes[e.to];
    if (!a || !b) return null;
    const edgeIdx = edges.indexOf(e);
    const isFocused = focused.edges.has(edgeIdx);
    const faded = focusId && !isFocused;
    const outFilter = activeSchool && !(isInFilter(a.data) && isInFilter(b.data));
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 - 18 - Math.min(34, Math.abs(b.x - a.x) * 0.05);
    const d = `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
    const canonLink = CANON_PHILOSOPHER_IDS.has(e.from) || CANON_PHILOSOPHER_IDS.has(e.to);
    const baseOpacity = isMobile ? e.kind === 'influence' ? 0.035 : canonLink ? 0.075 : 0.055 : e.kind === 'influence' ? 0.10 : canonLink ? 0.20 : 0.14;
    const opacity = outFilter ? isMobile ? 0.012 : 0.025 : faded ? isMobile ? 0.022 : 0.045 : isFocused ? 0.9 : baseOpacity;
    return /*#__PURE__*/React.createElement("path", {
      key: i,
      d: d,
      stroke: REL_COLORS[e.kind],
      strokeWidth: isFocused ? 1.55 : isMobile ? canonLink ? 0.55 : 0.42 : canonLink ? 0.75 : 0.55,
      fill: "none",
      strokeLinecap: "round",
      strokeDasharray: e.kind === 'influence' ? '2.5 5' : '0',
      style: {
        opacity,
        transition: 'opacity .3s, stroke-width .3s, filter .3s',
        filter: isFocused ? `drop-shadow(0 0 3px ${REL_COLORS[e.kind]})` : 'none'
      }
    });
  })), Object.values(nodes).map(n => {
    const p = n.data;
    const isCanon = CANON_PHILOSOPHER_IDS.has(n.id);
    const inFilter = isInFilter(p);
    const isFocused = focused.nodes.has(n.id);
    const dim = focusId && !isFocused || activeSchool && !inFilter;
    const displayName = lang === 'zh' ? p.zh : p.en;
    const q = getVerifiedQuote(p, lang);
    const portraitSize = isMobile ? isFocused ? isCanon ? 56 : 50 : isCanon ? 44 : 38 : isFocused ? isCanon ? 62 : 54 : isCanon ? 50 : 44;
    return /*#__PURE__*/React.createElement("div", {
      key: n.id,
      className: "phi-node",
      onMouseEnter: () => setHoveredId(n.id),
      onMouseLeave: () => setHoveredId(null),
      onClick: () => setSelectedId(s => s === n.id ? null : n.id),
      style: {
        position: 'absolute',
        left: n.x,
        top: n.y,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        opacity: dim ? 0.16 : 1,
        transition: 'opacity .3s, transform .3s',
        zIndex: isFocused ? 4 : isCanon ? 3 : 2,
        width: isMobile ? 104 : 126
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: portraitSize,
        height: portraitSize,
        borderRadius: '50%',
        margin: '0 auto',
        boxShadow: isCanon ? isFocused ? `0 0 0 1px ${PAL.gold}, 0 0 0 5px ${PAL.goldSoft}, 0 0 28px rgba(219,190,112,0.18), 0 12px 30px rgba(0,0,0,0.34)` : `0 0 0 1px ${PAL.gold}, 0 0 0 4px ${PAL.goldFaint}, 0 8px 22px rgba(219,190,112,0.12)` : isFocused ? `0 0 0 1.3px ${PAL.ink}, 0 6px 18px ${PAL.nodeHalo}` : `0 2px 6px ${PAL.nodeHalo}`,
        transition: 'width .2s, height .2s, box-shadow .2s',
        overflow: 'hidden',
        background: PAL.bgInk,
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement(Cameo, {
      id: n.id,
      en: p.en,
      size: portraitSize
    }), isCanon && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      "aria-hidden": true,
      style: {
        position: 'absolute',
        inset: 3,
        borderRadius: '50%',
        border: '1px solid rgba(255,232,165,0.26)',
        pointerEvents: 'none'
      }
    }), /*#__PURE__*/React.createElement("div", {
      "aria-hidden": true,
      style: {
        position: 'absolute',
        inset: 7,
        borderRadius: '50%',
        border: '1px solid rgba(255,232,165,0.11)',
        pointerEvents: 'none'
      }
    }), /*#__PURE__*/React.createElement("div", {
      "aria-hidden": true,
      style: {
        position: 'absolute',
        left: '50%',
        top: -1,
        width: 1,
        height: 5,
        background: 'rgba(255,232,165,0.55)',
        transform: 'translateX(-50%)',
        pointerEvents: 'none'
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: isMobile ? isCanon ? 11.5 : 10.5 : isCanon ? 12.5 : 11.5,
        lineHeight: 1.2,
        marginTop: isCanon ? 7 : 5,
        whiteSpace: 'nowrap',
        color: isCanon ? 'oklch(0.88 0.08 88)' : PAL.inkMid,
        fontWeight: isCanon ? 600 : 500,
        fontFamily: lang === 'zh' ? FONT_SERIF_ZH : FONT_SERIF_EN,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textShadow: isCanon ? '0 0 14px rgba(219,190,112,0.15)' : 'none'
      }
    }, displayName), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: isMobile ? 8 : 8.5,
        color: isCanon ? 'rgba(242,236,220,0.62)' : PAL.inkSoft,
        fontFamily: FONT_MONO,
        marginTop: 2,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap'
      }
    }, fmtLife(p, lang)), q && hoveredId === n.id && !selectedId && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translate(-50%, 6px)',
        width: 180,
        padding: '6px 10px',
        background: PAL.bgInk,
        border: `1px solid ${PAL.inkLine}`,
        fontSize: 11,
        color: PAL.ink,
        lineHeight: 1.35,
        fontStyle: 'italic',
        pointerEvents: 'none',
        boxShadow: `0 6px 18px ${PAL.nodeHalo}`,
        zIndex: 5
      }
    }, lang === 'zh' ? `「${q}」` : `"${q}"`)));
  }))), /*#__PURE__*/React.createElement(SchoolSelector, {
    schools: SCHOOLS,
    activeSchool: activeSchool,
    counts: schoolCounts,
    onSelect: id => {
      setActiveSchool(id);
      jumpToSchool(id);
    },
    onClear: () => setActiveSchool(null),
    lang: lang,
    isMobile: isMobile
  }), !isMobile && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: () => scrollByDir(-600),
    "aria-label": lang === 'zh' ? '向左浏览' : 'Scroll left',
    style: arrowStyle('left')
  }, /*#__PURE__*/React.createElement(NavChevron, {
    dir: "left"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => scrollByDir(600),
    "aria-label": lang === 'zh' ? '向右浏览' : 'Scroll right',
    style: arrowStyle('right')
  }, /*#__PURE__*/React.createElement(NavChevron, {
    dir: "right"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: isMobile ? 12 : 14,
      right: isMobile ? 12 : 24,
      display: 'flex',
      border: '1px solid rgba(242,236,220,0.15)',
      fontFamily: FONT_MONO,
      background: 'rgba(8,12,24,0.58)',
      zIndex: 6,
      boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
      backdropFilter: 'blur(12px)'
    }
  }, [['curated', lang === 'zh' ? '精要' : 'Core', CORE_PHILOSOPHER_IDS.size], ['full', lang === 'zh' ? '全量' : 'Full', PHILOSOPHERS.length]].map(([k, label, count]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setDensity(k),
    style: {
      height: isMobile ? 34 : 'auto',
      minWidth: isMobile ? 58 : 64,
      padding: isMobile ? '0 8px' : '5px 10px 6px',
      cursor: 'pointer',
      background: density === k ? 'rgba(219,190,112,0.10)' : 'transparent',
      color: density === k ? PAL.ink : PAL.inkSoft,
      border: 'none',
      borderBottom: density === k ? `1px solid ${PAL.gold}` : '1px solid transparent',
      font: 'inherit',
      display: 'flex',
      flexDirection: isMobile ? 'row' : 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isMobile ? 4 : 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 8.5,
      color: density === k ? PAL.gold : PAL.inkSoft,
      letterSpacing: '0.04em'
    }
  }, count)))), isMobile && /*#__PURE__*/React.createElement(MobileActionBar, {
    lang: lang,
    listOpen: mobileListOpen,
    legendOpen: mobileLegendOpen,
    testOpen: testOpen,
    onToggleList: () => {
      setMobileListOpen(o => !o);
      setMobileLegendOpen(false);
    },
    onToggleLegend: () => {
      setMobileLegendOpen(o => !o);
      setMobileListOpen(false);
    },
    onOpenTest: openPersonalityTest
  }), /*#__PURE__*/React.createElement(RelationLegend, {
    lang: lang,
    isMobile: isMobile,
    open: mobileLegendOpen
  }), !isMobile && /*#__PURE__*/React.createElement(MiniMap, {
    eras: ERAS,
    nodes: Object.values(nodes),
    scrollX: scrollX,
    viewportW: viewportW,
    activeSchool: activeSchool,
    isInFilter: isInFilter,
    worldHeight: worldHeight,
    onSeek: r => {
      const el = scrollerRef.current;
      if (el) el.scrollTo({
        left: r * WORLD_W - el.clientWidth / 2,
        behavior: 'smooth'
      });
    },
    lang: lang
  }), isMobile && mobileListOpen && /*#__PURE__*/React.createElement(MobilePhilosopherList, {
    eras: ERAS,
    philosophers: visiblePhilosophers,
    lang: lang,
    selectedId: selectedId,
    onJump: jumpToPhilosopher,
    onClose: () => setMobileListOpen(false)
  })), selected && /*#__PURE__*/React.createElement(DetailPanel, {
    philosopher: selected,
    lang: lang,
    onClose: () => setSelectedId(null),
    schools: SCHOOLS,
    relations: edges.filter(e => e.from === selectedId || e.to === selectedId),
    philosophers: PHILOSOPHERS,
    onJump: jumpToPhilosopher,
    isMobile: isMobile
  }), testOpen && /*#__PURE__*/React.createElement(PersonalityTestPanel, {
    lang: lang,
    isMobile: isMobile,
    philosophers: PHILOSOPHERS,
    savedResult: savedPersonality,
    onClose: () => setTestOpen(false),
    onComplete: handlePersonalityComplete,
    onJump: id => {
      setTestOpen(false);
      jumpToPhilosopher(id);
    }
  }));
}
function arrowStyle(dir) {
  return {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    [dir]: 16,
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'rgba(10,15,30,0.38)',
    border: `1px solid rgba(242,236,220,0.16)`,
    color: 'rgba(242,236,220,0.76)',
    cursor: 'pointer',
    padding: 0,
    zIndex: 5,
    opacity: 0.86,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 24px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.02)',
    backdropFilter: 'blur(10px)'
  };
}
function NavChevron({
  dir
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 18 18",
    "aria-hidden": "true",
    style: {
      display: 'block',
      transform: dir === 'left' ? 'rotate(180deg)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 4.5 L11.5 9 L7 13.5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }));
}
function Header({
  lang,
  setLang,
  isMobile = false,
  onOpenTest
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      padding: isMobile ? '12px 14px 9px' : '16px 24px 12px',
      borderBottom: '1px solid rgba(242,236,220,0.10)',
      boxShadow: '0 1px 0 rgba(219,190,112,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: isMobile ? 10 : 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: isMobile ? 0 : 18,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: isMobile ? 24 : 30,
      fontWeight: 500,
      letterSpacing: lang === 'zh' ? '0.08em' : 0,
      fontFamily: lang === 'zh' ? FONT_SERIF_ZH : FONT_SERIF_EN,
      fontStyle: lang === 'en' ? 'italic' : 'normal',
      color: PAL.ink,
      lineHeight: 1,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, lang === 'zh' ? '西方哲学史' : 'A History of Western Philosophy'), !isMobile && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      width: 1,
      height: 22,
      background: PAL.inkLine,
      alignSelf: 'center'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: PAL.inkSoft,
      fontFamily: FONT_SERIF_EN,
      fontStyle: 'italic',
      fontVariant: 'small-caps'
    }
  }, "Historia Philosophiae Occidentalis"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? 6 : 14
    }
  }, !isMobile && /*#__PURE__*/React.createElement("button", {
    onClick: onOpenTest,
    style: {
      height: 28,
      padding: '0 12px',
      border: '1px solid rgba(219,190,112,0.28)',
      borderBottomColor: PAL.gold,
      background: 'rgba(219,190,112,0.06)',
      color: PAL.ink,
      cursor: 'pointer',
      fontFamily: FONT_MONO,
      fontSize: 10,
      letterSpacing: '0.12em'
    }
  }, lang === 'zh' ? '人格测试' : 'Test'), /*#__PURE__*/React.createElement("div", {
    "aria-label": "Language",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: FONT_MONO,
      fontSize: 10,
      color: PAL.inkSoft,
      padding: '3px 2px'
    }
  }, [['zh', '中文'], ['en', 'EN']].map(([k, l], i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: k
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      color: PAL.inkFaint
    }
  }, "/"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setLang(k),
    "aria-pressed": lang === k,
    style: {
      padding: '3px 4px',
      cursor: 'pointer',
      border: 'none',
      borderBottom: lang === k ? `1px solid ${PAL.gold}` : '1px solid transparent',
      background: 'transparent',
      color: lang === k ? PAL.ink : PAL.inkSoft,
      font: 'inherit',
      letterSpacing: '0.08em'
    }
  }, l))))));
}
function SchoolSelector({
  schools,
  activeSchool,
  counts,
  onSelect,
  onClear,
  lang,
  isMobile = false
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const active = activeSchool ? schools.find(s => s.id === activeSchool) : null;
  const label = active ? lang === 'zh' ? active.zh : active.en : lang === 'zh' ? '流派' : 'School';
  useEffect(() => {
    setOpen(false);
  }, [activeSchool]);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = e => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [open]);
  return /*#__PURE__*/React.createElement("div", {
    ref: panelRef,
    className: "phi-panel",
    style: {
      position: 'absolute',
      top: isMobile ? 12 : 14,
      left: isMobile ? 12 : 24,
      zIndex: 7,
      fontFamily: lang === 'zh' ? FONT_SERIF_ZH : FONT_SERIF_EN
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(o => !o),
    "aria-expanded": open,
    style: {
      height: isMobile ? 34 : 30,
      minWidth: isMobile ? 82 : 76,
      maxWidth: isMobile ? 132 : 148,
      padding: '0 10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      background: 'rgba(10,15,30,0.46)',
      color: active ? PAL.ink : PAL.inkSoft,
      border: `1px solid ${active ? PAL.goldSoft : 'rgba(242,236,220,0.16)'}`,
      borderBottomColor: active ? PAL.gold : 'rgba(242,236,220,0.20)',
      boxShadow: active ? `0 10px 26px rgba(0,0,0,0.20), 0 0 18px ${PAL.goldFaint}` : `0 10px 22px rgba(0,0,0,0.16)`,
      backdropFilter: 'blur(10px)',
      cursor: 'pointer',
      fontSize: isMobile ? 13 : 12.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: 10,
      color: active ? PAL.gold : PAL.inkSoft,
      transform: open ? 'rotate(180deg)' : 'none',
      transition: 'transform .15s'
    }
  }, "\u2304")), active && /*#__PURE__*/React.createElement("button", {
    onClick: onClear,
    style: {
      height: 30,
      padding: '0 7px',
      border: 'none',
      background: 'transparent',
      color: PAL.inkSoft,
      cursor: 'pointer',
      fontFamily: FONT_MONO,
      fontSize: 8.5,
      letterSpacing: '0.08em'
    }
  }, lang === 'zh' ? '清除' : 'Clear')), open && /*#__PURE__*/React.createElement("div", {
    style: {
      position: isMobile ? 'fixed' : 'static',
      left: isMobile ? 0 : 'auto',
      right: isMobile ? 0 : 'auto',
      bottom: isMobile ? 0 : 'auto',
      marginTop: isMobile ? 0 : 8,
      width: isMobile ? '100%' : 218,
      maxHeight: isMobile ? '62vh' : 310,
      overflowY: 'auto',
      padding: isMobile ? '12px 0 18px' : '7px 0',
      background: 'rgba(8,12,24,0.88)',
      border: '1px solid rgba(242,236,220,0.18)',
      borderLeft: isMobile ? 'none' : '1px solid rgba(242,236,220,0.18)',
      borderRight: isMobile ? 'none' : '1px solid rgba(242,236,220,0.18)',
      borderBottom: isMobile ? 'none' : '1px solid rgba(242,236,220,0.18)',
      boxShadow: '0 18px 42px rgba(0,0,0,0.34), inset 0 1px 0 rgba(219,190,112,0.08)',
      backdropFilter: 'blur(14px)'
    }
  }, isMobile && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px 10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      letterSpacing: '0.16em',
      color: PAL.inkSoft,
      fontFamily: FONT_MONO
    }
  }, lang === 'zh' ? '选择流派' : 'Choose School'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(false),
    style: {
      background: 'transparent',
      border: 'none',
      color: PAL.inkSoft,
      fontSize: 20,
      lineHeight: 1,
      cursor: 'pointer'
    }
  }, "\xD7")), schools.map(s => {
    const count = counts[s.id] || 0;
    const on = activeSchool === s.id;
    const disabled = count === 0;
    return /*#__PURE__*/React.createElement("button", {
      key: s.id,
      disabled: disabled,
      onClick: () => {
        if (disabled) return;
        setOpen(false);
        onSelect(s.id);
      },
      style: {
        width: '100%',
        padding: isMobile ? '10px 16px' : '7px 9px',
        border: 'none',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        columnGap: 10,
        background: on ? 'rgba(219,190,112,0.11)' : 'transparent',
        color: disabled ? PAL.inkFaint : on ? PAL.ink : PAL.inkMid,
        cursor: disabled ? 'default' : 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        fontSize: isMobile ? 14 : 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        paddingLeft: 8,
        borderLeft: `2px solid ${on ? PAL.gold : 'transparent'}`,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, lang === 'zh' ? s.zh : s.en), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: FONT_MONO,
        fontSize: 9,
        color: on ? PAL.gold : PAL.inkSoft
      }
    }, count));
  })));
}

// --- Era icons ---------------------------------------------------------
// Each icon is a tiny line-engraving emblem rendered in currentColor.
// 24×24 viewBox; stroke-only so they read as classical etchings.
function EraIcon({
  id,
  size = 22
}) {
  const s = size;
  const common = {
    width: s,
    height: s,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: {
      display: 'block'
    }
  };
  switch (id) {
    case 'ancient':
      // Parthenon temple
      return /*#__PURE__*/React.createElement("svg", common, /*#__PURE__*/React.createElement("path", {
        d: "M3.2 9.2 L12 4.2 L20.8 9.2 Z"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M4.5 10.6 H19.5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M5.4 12.2 H18.6"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M6.2 12.2 V19"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M9.1 12.2 V19"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 12.2 V19"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M14.9 12.2 V19"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M17.8 12.2 V19"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M4.1 19 H19.9"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M3.2 21 H20.8"
      }));
    case 'medieval':
      // Tall Gothic cathedral
      return /*#__PURE__*/React.createElement("svg", common, /*#__PURE__*/React.createElement("path", {
        d: "M12 2.8 L14.3 8.2 V21"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 2.8 L9.7 8.2 V21"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M6.2 21 V11.5 L8.5 8.4 L10.8 11.5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M17.8 21 V11.5 L15.5 8.4 L13.2 11.5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M10 21 V15 Q12 11.6 14 15 V21"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 15.2 V21"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M4.8 21 H19.2"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "9.5",
        r: "1.15"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 6.4 V8"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M11.2 7.2 H12.8"
      }));
    case 'renaissance':
      // Dome, proportion, human measure
      return /*#__PURE__*/React.createElement("svg", common, /*#__PURE__*/React.createElement("path", {
        d: "M4 19 Q12 6 20 19"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M4 19 H20"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 6 V19"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12.5",
        r: "4.1"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M9.2 15.4 L12 8.2 L14.8 15.4"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M7.8 12.3 H16.2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M10.4 4.8 H13.6"
      }));
    case 'early_modern':
      // Telescope and orbit
      return /*#__PURE__*/React.createElement("svg", common, /*#__PURE__*/React.createElement("path", {
        d: "M4.5 14.5 L16.5 7.5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M15.5 6 L19.5 8.3 L17.2 11.9 L13.2 9.6 Z"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M5.4 13.2 L8.3 17.8"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M7 16.6 L4.7 20"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M7 16.6 L11 19.4"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M5.5 7.5 C7.7 4.5 12.8 3.8 16.3 6.3"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M18.6 11.3 C18.8 15.8 14.9 19.7 10.3 19.6"
      }));
    case 'modern':
      // Factory, machine, critique
      return /*#__PURE__*/React.createElement("svg", common, /*#__PURE__*/React.createElement("path", {
        d: "M4 21 V11.5 L8.6 14.2 V11.5 L13.2 14.2 V9.2 H20 V21"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M15.2 9.2 V5.4 H18.8 V9.2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M7 17 H8.6"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M11 17 H12.6"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M15 17 H16.6"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "16.4",
        cy: "5",
        r: "1.5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M14.9 5 H13.4"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M19.4 5 H20.7"
      }));
    case 'contemporary':
      // Networked constellation
      return /*#__PURE__*/React.createElement("svg", common, /*#__PURE__*/React.createElement("circle", {
        cx: "5.5",
        cy: "7",
        r: "1.35"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "17.8",
        cy: "5.8",
        r: "1.35"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12.4",
        r: "1.55"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "6.3",
        cy: "18",
        r: "1.35"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "18.6",
        cy: "17.2",
        r: "1.35"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12.8",
        cy: "20.2",
        r: "0.9"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M5.5 7 L12 12.4 L17.8 5.8"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M6.3 18 L12 12.4 L18.6 17.2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M5.5 7 L6.3 18 L12.8 20.2 L18.6 17.2 L17.8 5.8"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 12.4 L12.8 20.2"
      }));
    default:
      return /*#__PURE__*/React.createElement("svg", common, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "6"
      }));
  }
}
function EraBar({
  eras,
  onJump,
  scrollX,
  viewportW,
  lang,
  isMobile = false
}) {
  const activeEra = useMemo(() => {
    const rawRatio = (scrollX + viewportW / 2 - WORLD_PAD_L) / (WORLD_W - WORLD_PAD_L - WORLD_PAD_R);
    const centerRatio = Math.min(1, Math.max(0, rawRatio));
    let year = YEAR_ANCHORS[YEAR_ANCHORS.length - 1].y;
    for (let i = 0; i < YEAR_ANCHORS.length - 1; i++) {
      const a = YEAR_ANCHORS[i],
        b = YEAR_ANCHORS[i + 1];
      if (centerRatio >= a.x && centerRatio <= b.x) {
        const t = (centerRatio - a.x) / (b.x - a.x);
        year = a.y + t * (b.y - a.y);
        break;
      }
    }
    return eras.find(e => year >= e.start && year < e.end) || eras[0];
  }, [scrollX, viewportW, eras]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      padding: isMobile ? '0 4px' : '0 24px',
      borderBottom: '1px solid rgba(242,236,220,0.10)',
      fontFamily: FONT_MONO,
      fontSize: 10,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      height: isMobile ? 42 : 46,
      background: 'linear-gradient(180deg, rgba(242,236,220,0.018), rgba(242,236,220,0.004))',
      overflowX: 'hidden'
    }
  }, eras.map((e, i) => {
    const isActive = activeEra.id === e.id;
    return /*#__PURE__*/React.createElement("button", {
      key: e.id,
      onClick: () => onJump(e),
      style: {
        flex: 1,
        minWidth: 0,
        padding: isMobile ? '0 3px' : '0 14px',
        textAlign: isMobile ? 'center' : 'left',
        background: 'transparent',
        border: 'none',
        borderLeft: 'none',
        color: isActive ? PAL.ink : PAL.inkSoft,
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isMobile ? 'center' : 'flex-start',
        gap: isMobile ? 3 : 11,
        position: 'relative',
        transition: 'color .25s'
      }
    }, i > 0 && /*#__PURE__*/React.createElement("div", {
      "aria-hidden": true,
      style: {
        position: 'absolute',
        left: 0,
        top: 12,
        bottom: 12,
        width: 1,
        background: 'linear-gradient(180deg, transparent, rgba(242,236,220,0.13), transparent)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        color: isActive ? PAL.gold : PAL.inkSoft,
        opacity: isActive ? 1 : 0.55,
        transition: 'color .3s, opacity .3s',
        display: 'flex',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement(EraIcon, {
      id: e.id,
      size: isMobile ? 15 : 20
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0,
        flex: isMobile ? '0 1 auto' : 1,
        display: 'flex',
        alignItems: 'baseline',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: isMobile ? 10.5 : 13,
        fontWeight: 500,
        fontFamily: lang === 'zh' ? FONT_SERIF_ZH : FONT_SERIF_EN,
        textTransform: 'none',
        letterSpacing: 0,
        fontStyle: lang === 'en' ? 'italic' : 'normal',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, lang === 'zh' ? e.zh : e.en), !isMobile && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        color: PAL.inkSoft,
        opacity: isActive ? 0.9 : 0.55,
        whiteSpace: 'nowrap',
        flexShrink: 0
      }
    }, e.start < 0 ? `${-e.start}B` : e.start)), isActive && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: -1,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${PAL.gold}, transparent)`
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: 0,
        height: 16,
        background: 'linear-gradient(180deg, transparent, rgba(219,190,112,0.05))',
        pointerEvents: 'none'
      }
    })));
  }));
}
function StarBackground({
  h
}) {
  const stars = useMemo(() => {
    const out = [];
    for (let i = 0; i < 320; i++) {
      const r = n => {
        const x = Math.sin(i * 9.17 + n) * 10000;
        return x - Math.floor(x);
      };
      const layer = i % 11 === 0 ? 'near' : i % 3 === 0 ? 'mid' : 'far';
      out.push({
        x: r(1) * WORLD_W,
        y: r(2) * h,
        size: layer === 'near' ? 1.2 + r(3) * 1.6 : layer === 'mid' ? 0.65 + r(3) * 0.9 : 0.35 + r(3) * 0.55,
        op: layer === 'near' ? 0.28 + r(4) * 0.32 : layer === 'mid' ? 0.16 + r(4) * 0.20 : 0.08 + r(4) * 0.13,
        warm: r(5) > 0.74
      });
    }
    return out;
  }, [h]);
  return /*#__PURE__*/React.createElement("svg", {
    width: WORLD_W,
    height: h,
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("radialGradient", {
    id: "phi-dust",
    cx: "50%",
    cy: "50%",
    r: "50%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "rgba(219,190,112,0.10)"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "rgba(219,190,112,0)"
  }))), YEAR_ANCHORS.filter((_, i) => i % 2 === 0).map((a, i) => /*#__PURE__*/React.createElement("ellipse", {
    key: `dust-${i}`,
    cx: yearToX(a.y),
    cy: h * (0.26 + i % 5 * 0.12),
    rx: 180 + i % 3 * 80,
    ry: 90 + i % 4 * 24,
    fill: "url(#phi-dust)",
    opacity: "0.20"
  })), stars.map((s, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: s.x,
    cy: s.y,
    r: s.size,
    fill: s.warm ? '#dbc070' : '#f2ecdc',
    opacity: s.op
  })));
}
function EraDividers({
  eras,
  h
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: WORLD_W,
    height: h,
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none'
    }
  }, eras.map((e, i) => {
    if (i === 0) return null;
    const x = yearToX(e.start);
    return /*#__PURE__*/React.createElement("line", {
      key: e.id,
      x1: x,
      y1: 0,
      x2: x,
      y2: h,
      stroke: "rgba(242,236,220,0.12)",
      strokeWidth: "1",
      strokeDasharray: "1 8"
    });
  }));
}
function MobileActionBar({
  lang,
  listOpen,
  legendOpen,
  testOpen,
  onToggleList,
  onToggleLegend,
  onOpenTest
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 12,
      height: 42,
      zIndex: 8,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 8,
      pointerEvents: 'none'
    }
  }, [[lang === 'zh' ? '列表' : 'List', listOpen, onToggleList], [lang === 'zh' ? '关系' : 'Relations', legendOpen, onToggleLegend], [lang === 'zh' ? '测试' : 'Test', testOpen, onOpenTest]].map(([label, active, onClick]) => /*#__PURE__*/React.createElement("button", {
    key: label,
    onClick: onClick,
    style: {
      pointerEvents: 'auto',
      border: `1px solid ${active ? PAL.goldSoft : 'rgba(242,236,220,0.16)'}`,
      borderBottomColor: active ? PAL.gold : 'rgba(242,236,220,0.20)',
      background: active ? 'rgba(219,190,112,0.12)' : 'rgba(8,12,24,0.62)',
      color: active ? PAL.ink : PAL.inkMid,
      boxShadow: '0 12px 26px rgba(0,0,0,0.22)',
      backdropFilter: 'blur(14px)',
      fontFamily: lang === 'zh' ? FONT_SERIF_ZH : FONT_SERIF_EN,
      fontSize: 13,
      cursor: 'pointer'
    }
  }, label)));
}
function RelationLegend({
  lang,
  isMobile = false,
  open = true
}) {
  if (isMobile && !open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: isMobile ? 12 : 24,
      bottom: isMobile ? 62 : 18,
      background: 'rgba(8,12,24,0.66)',
      border: '1px solid rgba(242,236,220,0.18)',
      padding: '10px 14px',
      zIndex: 5,
      fontFamily: FONT_MONO,
      boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
      backdropFilter: 'blur(12px)',
      width: isMobile ? 190 : 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      letterSpacing: '0.26em',
      textTransform: 'uppercase',
      color: PAL.inkSoft,
      marginBottom: 8
    }
  }, lang === 'zh' ? '关系 Relations' : 'Relations'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, Object.entries(REL_LABELS).map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 11,
      color: PAL.inkMid
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "26",
    height: "6"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "0",
    y1: "3",
    x2: "26",
    y2: "3",
    stroke: REL_COLORS[k],
    strokeWidth: "1.35",
    strokeLinecap: "round",
    strokeDasharray: k === 'influence' ? '3 3' : '0'
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: lang === 'zh' ? FONT_SERIF_ZH : 'inherit'
    }
  }, lang === 'zh' ? v.zh : v.en)))));
}
function MobilePhilosopherList({
  eras,
  philosophers,
  lang,
  selectedId,
  onJump,
  onClose
}) {
  const grouped = eras.map(era => ({
    era,
    people: philosophers.filter(p => p.era === era.id).sort((a, b) => a.year - b.year)
  })).filter(group => group.people.length);
  return /*#__PURE__*/React.createElement("div", {
    className: "phi-panel",
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      maxHeight: '72vh',
      zIndex: 12,
      background: 'linear-gradient(180deg, rgba(15,20,36,0.96), rgba(8,12,24,0.96))',
      borderTop: '1px solid rgba(242,236,220,0.18)',
      boxShadow: '0 -22px 48px rgba(0,0,0,0.36)',
      backdropFilter: 'blur(16px)',
      overflowY: 'auto',
      padding: '12px 14px 20px',
      boxSizing: 'border-box',
      fontFamily: lang === 'zh' ? FONT_SERIF_ZH : FONT_SERIF_EN
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: -12,
      zIndex: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      margin: '-12px -14px 10px',
      padding: '12px 14px 10px',
      background: 'linear-gradient(180deg, rgba(15,20,36,0.98), rgba(15,20,36,0.90))',
      borderBottom: '1px solid rgba(242,236,220,0.10)',
      backdropFilter: 'blur(14px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: PAL.ink,
      fontSize: 15,
      letterSpacing: lang === 'zh' ? '0.06em' : 0
    }
  }, lang === 'zh' ? '哲学家列表' : 'Philosophers'), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: 'transparent',
      border: 'none',
      color: PAL.inkSoft,
      fontSize: 22,
      lineHeight: 1,
      cursor: 'pointer'
    }
  }, "\xD7")), grouped.map(({
    era,
    people
  }) => /*#__PURE__*/React.createElement("section", {
    key: era.id,
    style: {
      paddingTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      color: PAL.gold,
      marginBottom: 7
    }
  }, /*#__PURE__*/React.createElement(EraIcon, {
    id: era.id,
    size: 16
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontFamily: FONT_MONO,
      letterSpacing: '0.14em',
      color: PAL.inkSoft
    }
  }, lang === 'zh' ? era.zh : era.en)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 7
    }
  }, people.map(p => {
    const active = selectedId === p.id;
    return /*#__PURE__*/React.createElement("button", {
      key: p.id,
      onClick: () => onJump(p.id),
      style: {
        minWidth: 0,
        display: 'grid',
        gridTemplateColumns: '32px minmax(0, 1fr)',
        alignItems: 'center',
        gap: 8,
        padding: '7px 8px',
        border: `1px solid ${active ? PAL.goldSoft : 'rgba(242,236,220,0.12)'}`,
        background: active ? 'rgba(219,190,112,0.10)' : 'rgba(242,236,220,0.025)',
        color: active ? PAL.ink : PAL.inkMid,
        textAlign: 'left',
        cursor: 'pointer',
        font: 'inherit'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 32,
        height: 32,
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: CANON_PHILOSOPHER_IDS.has(p.id) ? `0 0 0 1px ${PAL.gold}, 0 0 0 3px ${PAL.goldFaint}` : `0 0 0 1px ${PAL.ring}`
      }
    }, /*#__PURE__*/React.createElement(Cameo, {
      id: p.id,
      en: p.en,
      size: 32
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, lang === 'zh' ? p.zh : p.en), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 1,
        fontSize: 8.5,
        color: PAL.inkSoft,
        fontFamily: FONT_MONO,
        whiteSpace: 'nowrap'
      }
    }, fmtLife(p, lang))));
  })))));
}
function calculatePersonalityResult(answers) {
  const scores = Object.fromEntries(PERSONALITY_AXES.map(a => [a.key, 0]));
  PERSONALITY_QUESTIONS.forEach(q => {
    const v = answers[q.id];
    if (!v) return;
    scores[q.axis] += v - 3;
  });
  const id = PERSONALITY_AXES.map(axis => scores[axis.key] <= 0 ? axis.left : axis.right).join('');
  return {
    id,
    type: PERSONALITY_TYPES[id] || PERSONALITY_TYPES.ROCS,
    scores,
    answers,
    createdAt: new Date().toISOString()
  };
}
function PersonalityTestPanel({
  lang,
  isMobile,
  philosophers,
  savedResult,
  onClose,
  onComplete,
  onJump
}) {
  const [answers, setAnswers] = useState(savedResult?.answers || {});
  const [step, setStep] = useState(savedResult ? PERSONALITY_QUESTIONS.length : 0);
  const [saveStatus, setSaveStatus] = useState('');
  const complete = step >= PERSONALITY_QUESTIONS.length && Object.keys(answers).length === PERSONALITY_QUESTIONS.length;
  const result = complete ? calculatePersonalityResult(answers) : null;
  const q = PERSONALITY_QUESTIONS[Math.min(step, PERSONALITY_QUESTIONS.length - 1)];
  const progress = complete ? 1 : step / PERSONALITY_QUESTIONS.length;
  const choose = value => {
    const nextAnswers = {
      ...answers,
      [q.id]: value
    };
    setAnswers(nextAnswers);
    if (step >= PERSONALITY_QUESTIONS.length - 1) {
      const nextResult = calculatePersonalityResult(nextAnswers);
      setStep(PERSONALITY_QUESTIONS.length);
      onComplete(nextResult);
    } else {
      setStep(s => s + 1);
    }
  };
  const reset = () => {
    setAnswers({});
    setStep(0);
    setSaveStatus('');
  };
  const saveCard = async () => {
    if (!result) return;
    setSaveStatus(lang === 'zh' ? '生成中...' : 'Rendering...');
    try {
      await downloadPersonalityCard(result, philosophers);
      setSaveStatus(lang === 'zh' ? '已生成图片' : 'Image ready');
    } catch (err) {
      setSaveStatus(lang === 'zh' ? '生成失败，请重试' : 'Failed, try again');
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 30,
      background: isMobile ? 'rgba(3,5,11,0.58)' : 'rgba(3,5,11,0.48)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      padding: isMobile ? 0 : 24,
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "phi-panel",
    style: {
      width: isMobile ? '100%' : 760,
      maxWidth: '100%',
      maxHeight: isMobile ? '92vh' : '86vh',
      overflowY: 'auto',
      background: 'linear-gradient(180deg, rgba(15,20,36,0.97), rgba(8,12,24,0.96))',
      border: isMobile ? '1px solid rgba(242,236,220,0.16)' : '1px solid rgba(242,236,220,0.18)',
      borderLeft: isMobile ? 'none' : '1px solid rgba(242,236,220,0.18)',
      borderRight: isMobile ? 'none' : '1px solid rgba(242,236,220,0.18)',
      borderBottom: isMobile ? 'none' : '1px solid rgba(242,236,220,0.18)',
      boxShadow: '0 24px 60px rgba(0,0,0,0.42)',
      padding: isMobile ? '16px 16px 22px' : '24px',
      boxSizing: 'border-box',
      fontFamily: lang === 'zh' ? FONT_SERIF_ZH : FONT_SERIF_EN
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      letterSpacing: '0.18em',
      color: PAL.gold,
      fontFamily: FONT_MONO
    }
  }, lang === 'zh' ? 'PHILOSOPHY TEST' : 'PHILOSOPHY TEST'), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: isMobile ? 20 : 24,
      color: PAL.ink
    }
  }, lang === 'zh' ? '哲学人格测试' : 'Philosophy Personality Test')), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: 'transparent',
      border: 'none',
      color: PAL.inkSoft,
      fontSize: 24,
      lineHeight: 1,
      cursor: 'pointer'
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 2,
      background: 'rgba(242,236,220,0.10)',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${Math.round(progress * 100)}%`,
      height: '100%',
      background: `linear-gradient(90deg, ${PAL.gold}, rgba(219,190,112,0.28))`,
      transition: 'width .25s'
    }
  })), result ? /*#__PURE__*/React.createElement(PersonalityResult, {
    result: result,
    philosophers: philosophers,
    isMobile: isMobile,
    lang: lang,
    onRetake: reset,
    onSave: saveCard,
    saveStatus: saveStatus,
    onJump: onJump
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: isMobile ? 14 : 18,
      alignItems: 'stretch'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid rgba(242,236,220,0.14)',
      background: 'rgba(242,236,220,0.025)',
      padding: isMobile ? 18 : 24,
      minHeight: isMobile ? 360 : 390,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: 10,
      letterSpacing: '0.12em',
      color: PAL.inkSoft
    }
  }, String(step + 1).padStart(2, '0'), " / ", PERSONALITY_QUESTIONS.length), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      fontSize: isMobile ? 21 : 25,
      lineHeight: 1.45,
      color: PAL.ink
    }
  }, q.question)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 26
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: isMobile ? 10 : 12
    }
  }, [{
    side: 'left',
    value: 1,
    label: q.leftLabel,
    mark: q.leftValue
  }, {
    side: 'right',
    value: 5,
    label: q.rightLabel,
    mark: q.rightValue
  }].map(option => /*#__PURE__*/React.createElement("button", {
    key: option.side,
    onClick: () => choose(option.value),
    style: {
      minHeight: isMobile ? 88 : 112,
      padding: isMobile ? '16px 15px' : '20px 18px',
      border: '1px solid rgba(242,236,220,0.16)',
      borderBottomColor: 'rgba(219,190,112,0.34)',
      background: option.side === 'left' ? 'linear-gradient(135deg, rgba(219,190,112,0.09), rgba(8,12,24,0.46))' : 'linear-gradient(135deg, rgba(8,12,24,0.46), rgba(92,118,168,0.11))',
      color: PAL.ink,
      cursor: 'pointer',
      textAlign: 'left',
      boxShadow: 'inset 0 1px 0 rgba(242,236,220,0.04)',
      fontFamily: lang === 'zh' ? FONT_SERIF_ZH : FONT_SERIF_EN
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: 10,
      letterSpacing: '0.14em',
      color: option.side === 'left' ? PAL.gold : PAL.inkSoft,
      marginBottom: 10
    }
  }, option.mark), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: isMobile ? 18 : 21,
      lineHeight: 1.45,
      color: PAL.ink
    }
  }, option.label)))))), step > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: () => setStep(s => Math.max(0, s - 1)),
    style: {
      justifySelf: 'start',
      height: 32,
      padding: '0 12px',
      border: '1px solid rgba(242,236,220,0.16)',
      background: 'transparent',
      color: PAL.inkMid,
      cursor: 'pointer'
    }
  }, lang === 'zh' ? '上一题' : 'Back'))));
}
function PersonalityResult({
  result,
  philosophers,
  isMobile,
  lang,
  onRetake,
  onSave,
  saveStatus,
  onJump
}) {
  const type = result.type;
  const people = type.philosophers.map(id => philosophers.find(p => p.id === id)).filter(Boolean);
  const cardHeight = isMobile ? 'auto' : 400;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '300px minmax(0, 1fr)',
      gap: isMobile ? 18 : 22,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(ShareCardPreview, {
    result: result,
    people: people,
    isMobile: isMobile
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onSave,
    style: personalityButtonStyle(true)
  }, lang === 'zh' ? '保存分享图' : 'Save Image'), /*#__PURE__*/React.createElement("button", {
    onClick: onRetake,
    style: personalityButtonStyle(false)
  }, lang === 'zh' ? '重新测试' : 'Retake')), saveStatus && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      color: PAL.inkSoft,
      fontSize: 11,
      fontFamily: FONT_MONO
    }
  }, saveStatus)), /*#__PURE__*/React.createElement("div", {
    className: "phi-panel",
    style: {
      height: cardHeight,
      maxHeight: isMobile ? 420 : cardHeight,
      overflowY: 'auto',
      border: '1px solid rgba(242,236,220,0.14)',
      background: 'linear-gradient(180deg, rgba(242,236,220,0.035), rgba(8,12,24,0.28))',
      padding: isMobile ? 16 : 18,
      boxSizing: 'border-box',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: PAL.gold,
      fontFamily: FONT_MONO,
      fontSize: 10,
      letterSpacing: '0.18em'
    }
  }, result.id), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '8px 0 6px',
      fontSize: isMobile ? 25 : 32,
      lineHeight: 1.15,
      fontWeight: 500,
      color: PAL.ink
    }
  }, type.name), /*#__PURE__*/React.createElement("div", {
    style: {
      color: PAL.inkMid,
      fontSize: 14,
      lineHeight: 1.7
    }
  }, type.subtitle), people.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 14
    }
  }, people.map(p => /*#__PURE__*/React.createElement("button", {
    key: p.id,
    onClick: () => onJump(p.id),
    style: {
      display: 'grid',
      gridTemplateColumns: '28px minmax(0, 1fr)',
      alignItems: 'center',
      gap: 8,
      minWidth: 0,
      maxWidth: isMobile ? '100%' : 188,
      padding: '5px 8px 5px 5px',
      border: '1px solid rgba(219,190,112,0.18)',
      background: 'rgba(242,236,220,0.025)',
      color: PAL.inkMid,
      cursor: 'pointer',
      font: 'inherit'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: '50%',
      overflow: 'hidden',
      boxShadow: `0 0 0 1px ${PAL.goldSoft}`
    }
  }, /*#__PURE__*/React.createElement(Cameo, {
    id: p.id,
    en: p.en,
    size: 28
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontSize: 12
    }
  }, p.zh || p.en)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 7,
      marginTop: 14
    }
  }, type.keywords.map(k => /*#__PURE__*/React.createElement("span", {
    key: k,
    style: {
      border: '1px solid rgba(219,190,112,0.22)',
      color: PAL.gold,
      padding: '3px 8px',
      fontSize: 11,
      fontFamily: FONT_MONO
    }
  }, k))), /*#__PURE__*/React.createElement("p", {
    style: {
      color: PAL.inkMid,
      fontSize: 14,
      lineHeight: 1.85,
      margin: '18px 0 0'
    }
  }, type.description), /*#__PURE__*/React.createElement("blockquote", {
    style: {
      margin: '16px 0 0',
      padding: '12px 14px',
      border: '1px solid rgba(242,236,220,0.10)',
      background: 'rgba(242,236,220,0.025)',
      color: PAL.ink,
      lineHeight: 1.75,
      fontSize: 14
    }
  }, type.message), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, PERSONALITY_AXES.map(axis => {
    const score = result.scores[axis.key] || 0;
    const pct = Math.max(0, Math.min(100, (score + 6) / 12 * 100));
    return /*#__PURE__*/React.createElement("div", {
      key: axis.key
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 10,
        color: PAL.inkSoft,
        fontFamily: FONT_MONO
      }
    }, /*#__PURE__*/React.createElement("span", null, axis.leftLabel), /*#__PURE__*/React.createElement("span", null, axis.rightLabel)), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 3,
        marginTop: 5,
        position: 'relative',
        background: 'rgba(242,236,220,0.12)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: -3,
        left: `${pct}%`,
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: PAL.gold,
        transform: 'translateX(-50%)',
        boxShadow: `0 0 14px ${PAL.goldSoft}`
      }
    })));
  }))));
}
function ShareCardPreview({
  result,
  people,
  isMobile
}) {
  const type = result.type;
  const titleSize = isMobile ? Math.max(18, 24 - Math.max(0, type.name.length - 7) * 1.4) : Math.max(20, 27 - Math.max(0, type.name.length - 7) * 1.6);
  const mainPerson = people[0];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '3 / 4',
      width: '100%',
      border: '1px solid rgba(219,190,112,0.24)',
      background: `radial-gradient(circle at 50% 16%, rgba(219,190,112,0.12), transparent 32%),
                   radial-gradient(circle at 18% 78%, rgba(92,118,168,0.12), transparent 28%),
                   linear-gradient(180deg, rgba(13,18,33,0.96), rgba(5,8,17,0.98))`,
      padding: isMobile ? 18 : 22,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: 'inset 0 1px 0 rgba(219,190,112,0.10), 0 18px 40px rgba(0,0,0,0.24)',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      inset: 10,
      border: '1px solid rgba(242,236,220,0.08)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      left: '12%',
      right: '12%',
      top: '48%',
      height: 1,
      background: 'linear-gradient(90deg, transparent, rgba(219,190,112,0.22), transparent)',
      transform: 'rotate(-8deg)',
      pointerEvents: 'none'
    }
  }), [0, 1, 2, 3, 4, 5, 6].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    "aria-hidden": true,
    style: {
      position: 'absolute',
      left: `${14 + i * 17 % 72}%`,
      top: `${16 + i * 23 % 66}%`,
      width: i % 3 === 0 ? 3 : 2,
      height: i % 3 === 0 ? 3 : 2,
      borderRadius: '50%',
      background: i % 2 ? 'rgba(242,236,220,0.35)' : 'rgba(219,190,112,0.42)',
      pointerEvents: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: isMobile ? 8 : 8.8,
      letterSpacing: '0.14em',
      color: PAL.gold
    }
  }, "\u897F\u65B9\u54F2\u5B66\u53F2 \xB7 \u54F2\u5B66\u4EBA\u683C\u6D4B\u8BD5"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: isMobile ? 18 : 20,
      color: PAL.ink,
      fontSize: titleSize,
      lineHeight: 1.12,
      fontWeight: 500,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      letterSpacing: 0
    }
  }, type.name), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      color: PAL.inkMid,
      fontSize: isMobile ? 11.5 : 12,
      lineHeight: 1.48
    }
  }, type.subtitle)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: isMobile ? '10px 0' : '12px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '0 auto',
      width: isMobile ? 86 : 94,
      height: isMobile ? 86 : 94,
      borderRadius: '50%',
      border: `1px solid ${PAL.gold}`,
      color: PAL.gold,
      overflow: 'hidden',
      boxShadow: `0 0 0 7px ${PAL.goldFaint}, 0 0 32px rgba(219,190,112,0.10)`,
      background: PAL.bgInk,
      position: 'relative'
    }
  }, mainPerson && /*#__PURE__*/React.createElement(Cameo, {
    id: mainPerson.id,
    en: mainPerson.en,
    size: isMobile ? 86 : 94
  }), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      inset: 6,
      borderRadius: '50%',
      border: '1px solid rgba(255,232,165,0.22)',
      pointerEvents: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      color: PAL.ink,
      fontSize: isMobile ? 13.5 : 14.5
    }
  }, people.map(p => p.zh || p.en).join(' · '))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, type.keywords.map(k => /*#__PURE__*/React.createElement("span", {
    key: k,
    style: {
      border: '1px solid rgba(242,236,220,0.13)',
      color: PAL.inkMid,
      padding: '2px 6px',
      fontSize: isMobile ? 9.5 : 10
    }
  }, k))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: PAL.inkSoft,
      fontFamily: FONT_MONO,
      fontSize: isMobile ? 8.8 : 9.2,
      letterSpacing: '0.13em'
    }
  }, result.id), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      width: isMobile ? 32 : 36,
      height: isMobile ? 32 : 36,
      border: '1px solid rgba(242,236,220,0.16)',
      background: 'linear-gradient(90deg, rgba(242,236,220,0.18) 1px, transparent 1px), linear-gradient(rgba(242,236,220,0.18) 1px, transparent 1px)',
      backgroundSize: '9px 9px',
      opacity: 0.42
    }
  }))));
}
function personalityButtonStyle(primary) {
  return {
    height: 34,
    padding: '0 13px',
    border: `1px solid ${primary ? PAL.goldSoft : 'rgba(242,236,220,0.16)'}`,
    borderBottomColor: primary ? PAL.gold : 'rgba(242,236,220,0.20)',
    background: primary ? 'rgba(219,190,112,0.10)' : 'transparent',
    color: primary ? PAL.ink : PAL.inkMid,
    cursor: 'pointer',
    fontFamily: FONT_SERIF_ZH,
    fontSize: 12
  };
}
function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const chars = Array.from(text);
  let line = '';
  let lines = [];
  chars.forEach(ch => {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  lines = lines.slice(0, maxLines);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return y + lines.length * lineHeight;
}
function fitCanvasText(ctx, text, x, y, maxWidth, maxFontSize, minFontSize, fontFamily, color) {
  let size = maxFontSize;
  do {
    ctx.font = `${size}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth || size <= minFontSize) break;
    size -= 2;
  } while (size >= minFontSize);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  return size;
}
function loadCanvasImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      reject(new Error('image load timeout'));
    }, REMOTE_PORTRAIT_TIMEOUT_MS);
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = error => {
      clearTimeout(timer);
      reject(error);
    };
    img.src = src;
  });
}
async function renderPersonalityCardToPng(result, philosophers) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d');
  const type = result.type;
  const people = type.philosophers.map(id => philosophers.find(p => p.id === id)).filter(Boolean);
  const firstPerson = people[0];
  const portraitUrl = firstPerson ? LOCAL_PORTRAITS[firstPerson.id] || PORTRAIT_OVERRIDES[firstPerson.id] || (await fetchWikiThumb(wikiTitleFor(firstPerson.id, firstPerson.en))) : null;
  const portrait = portraitUrl ? await loadCanvasImage(portraitUrl).catch(() => null) : null;
  const bg = ctx.createLinearGradient(0, 0, 0, 1440);
  bg.addColorStop(0, '#12182b');
  bg.addColorStop(1, '#050811');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1440);
  for (let i = 0; i < 180; i++) {
    const x = (Math.sin(i * 17.13) * 10000 % 1 + 1) % 1 * 1080;
    const y = (Math.sin(i * 9.71) * 10000 % 1 + 1) % 1 * 1440;
    const r = i % 9 === 0 ? 2.1 : 1.1;
    ctx.globalAlpha = i % 7 === 0 ? 0.38 : 0.18;
    ctx.fillStyle = i % 5 === 0 ? '#dbc070' : '#f2ecdc';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(219,190,112,0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(58, 58, 964, 1324);
  ctx.strokeStyle = 'rgba(242,236,220,0.10)';
  ctx.strokeRect(82, 82, 916, 1276);
  ctx.fillStyle = '#dbc070';
  ctx.font = `24px ${FONT_MONO}`;
  ctx.letterSpacing = '2px';
  ctx.fillText('西方哲学史 · 哲学人格测试', 104, 140);
  fitCanvasText(ctx, type.name, 104, 248, 872, 56, 42, FONT_SERIF_ZH, '#f2ecdc');
  ctx.fillStyle = 'rgba(242,236,220,0.72)';
  ctx.font = `30px ${FONT_SERIF_ZH}`;
  wrapCanvasText(ctx, type.subtitle, 106, 392, 820, 42, 2);
  ctx.save();
  ctx.translate(540, 590);
  ctx.strokeStyle = '#dbc070';
  ctx.fillStyle = 'rgba(219,190,112,0.08)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 116, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 146, 0, Math.PI * 2);
  ctx.stroke();
  if (portrait) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, 108, 0, Math.PI * 2);
    ctx.clip();
    const side = Math.min(portrait.width, portrait.height);
    const sx = (portrait.width - side) / 2;
    const sy = Math.max(0, (portrait.height - side) * 0.22);
    ctx.drawImage(portrait, sx, sy, side, side, -108, -108, 216, 216);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,232,165,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 98, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#dbc070';
    ctx.font = `88px ${FONT_SERIF_ZH}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const mark = firstPerson ? (firstPerson.zh || firstPerson.en).slice(0, 1) : result.id.slice(0, 1);
    ctx.fillText(mark, 0, 4);
  }
  ctx.restore();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f2ecdc';
  ctx.font = `34px ${FONT_SERIF_ZH}`;
  ctx.fillText(people.map(p => p.zh || p.en).join(' · '), 540, 784);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#dbc070';
  ctx.font = `26px ${FONT_MONO}`;
  ctx.fillText(type.keywords.join(' / '), 104, 882);
  ctx.fillStyle = 'rgba(242,236,220,0.82)';
  ctx.font = `32px ${FONT_SERIF_ZH}`;
  wrapCanvasText(ctx, type.message, 104, 958, 872, 52, 4);
  ctx.strokeStyle = 'rgba(242,236,220,0.10)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(104, 1128);
  ctx.lineTo(976, 1128);
  ctx.stroke();
  let y = 1170;
  PERSONALITY_AXES.forEach(axis => {
    const score = result.scores[axis.key] || 0;
    const pct = Math.max(0, Math.min(1, (score + 6) / 12));
    ctx.fillStyle = 'rgba(242,236,220,0.58)';
    ctx.font = `20px ${FONT_SERIF_ZH}`;
    ctx.fillText(axis.leftLabel, 104, y);
    ctx.textAlign = 'right';
    ctx.fillText(axis.rightLabel, 820, y);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(242,236,220,0.15)';
    ctx.fillRect(220, y - 11, 536, 4);
    ctx.fillStyle = '#dbc070';
    ctx.beginPath();
    ctx.arc(220 + pct * 536, y - 9, 8, 0, Math.PI * 2);
    ctx.fill();
    y += 38;
  });
  ctx.textAlign = 'left';
  ctx.strokeStyle = 'rgba(242,236,220,0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(878, 1178, 82, 82);
  ctx.fillStyle = 'rgba(242,236,220,0.12)';
  for (let i = 0; i < 9; i++) {
    ctx.fillRect(890 + i % 3 * 21, 1190 + Math.floor(i / 3) * 21, i % 2 ? 9 : 14, i % 2 ? 14 : 9);
  }
  ctx.fillStyle = 'rgba(242,236,220,0.40)';
  ctx.font = `16px ${FONT_MONO}`;
  ctx.fillText('SHARE', 889, 1290);
  ctx.fillStyle = 'rgba(242,236,220,0.44)';
  ctx.font = `20px ${FONT_MONO}`;
  ctx.fillText(`TYPE ${result.id}`, 104, 1340);
  ctx.textAlign = 'right';
  ctx.fillText('Historia Philosophiae Occidentalis', 976, 1340);
  return canvas.toDataURL('image/png');
}
async function downloadPersonalityCard(result, philosophers) {
  const url = await renderPersonalityCardToPng(result, philosophers);
  const a = document.createElement('a');
  a.href = url;
  a.download = `philosophy-personality-${result.id}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
function MiniMap({
  eras,
  nodes,
  scrollX,
  viewportW,
  onSeek,
  isInFilter,
  activeSchool,
  worldHeight
}) {
  const ref = useRef(null);
  const mmW = 520;
  const mmH = 28;
  const ratio = scrollX / WORLD_W;
  const windowW = viewportW / WORLD_W * mmW;
  const onClickMap = e => {
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    onSeek(x);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 18,
      left: 24,
      background: 'rgba(8,12,24,0.55)',
      border: '1px solid rgba(242,236,220,0.16)',
      padding: '7px 10px',
      display: 'flex',
      alignItems: 'center',
      zIndex: 5,
      boxShadow: '0 12px 28px rgba(0,0,0,0.16)',
      backdropFilter: 'blur(12px)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    ref: ref,
    width: mmW,
    height: mmH,
    onClick: onClickMap,
    style: {
      cursor: 'pointer',
      display: 'block'
    }
  }, eras.map((e, i) => {
    if (i === 0) return null;
    const x = yearToX(e.start) / WORLD_W * mmW;
    return /*#__PURE__*/React.createElement("line", {
      key: e.id,
      x1: x,
      y1: 3,
      x2: x,
      y2: mmH - 3,
      stroke: "rgba(242,236,220,0.14)",
      strokeWidth: "0.7",
      strokeDasharray: "1 3"
    });
  }), nodes.map(n => {
    const inFilter = !activeSchool || isInFilter(n.data);
    return /*#__PURE__*/React.createElement("circle", {
      key: n.id,
      cx: n.x / WORLD_W * mmW,
      cy: 4 + n.y / worldHeight * (mmH - 8),
      r: CANON_PHILOSOPHER_IDS.has(n.id) ? 1.55 : 1.05,
      fill: CANON_PHILOSOPHER_IDS.has(n.id) ? PAL.gold : PAL.ink,
      opacity: inFilter ? CANON_PHILOSOPHER_IDS.has(n.id) ? 0.72 : 0.46 : 0.07
    });
  }), /*#__PURE__*/React.createElement("rect", {
    x: ratio * mmW,
    y: 2,
    width: windowW,
    height: mmH - 4,
    fill: "rgba(219,190,112,0.05)"
  }), /*#__PURE__*/React.createElement("line", {
    x1: ratio * mmW,
    y1: 1,
    x2: ratio * mmW + windowW,
    y2: 1,
    stroke: PAL.gold,
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: ratio * mmW,
    y: 2,
    width: windowW,
    height: mmH - 4,
    fill: "none",
    stroke: "rgba(242,236,220,0.52)",
    strokeWidth: "0.8"
  })));
}
const PROFILE_OVERRIDES = {
  socrates: {
    life: '苏格拉底没有留下自己的著作，却几乎改变了哲学的方向。他在雅典街头与青年、政客和智者辩论，把哲学从解释自然转向追问“我应当怎样生活”。最终，他因“不敬神”和“败坏青年”的指控受审并饮鸩而死。',
    life_en: 'Socrates left no writings, yet changed the direction of philosophy. In the streets of Athens he questioned young men, politicians, and Sophists, turning philosophy from nature toward the question of how one ought to live. He was tried for impiety and corrupting the youth, and accepted death by hemlock.',
    idea: '苏格拉底把哲学从自然解释转向人的灵魂、德性与知识。他用诘问法揭示概念中的矛盾，强调真正的智慧始于承认无知，并把德性理解为与知识密切相关的实践生活。',
    idea_en: 'Socrates turned philosophy toward the soul, virtue, and knowledge. His questioning exposed contradictions in ordinary concepts, joined wisdom with awareness of ignorance, and treated virtue as a matter of examined life.',
    works: ['无著作传世', '《申辩篇》（柏拉图记述）', '《克力同篇》（柏拉图记述）'],
    works_en: ['No writings survive', 'Apology (Plato)', 'Crito (Plato)']
  },
  plato: {
    life: '柏拉图是苏格拉底的学生，也亲历了雅典民主的动荡和老师之死。此后他创办学园，用对话体保存并重塑苏格拉底的问题，把政治、教育、灵魂和真理放进同一个宏大的哲学剧场。',
    life_en: 'Plato was Socrates’ student and witnessed both Athenian political turmoil and his teacher’s death. He later founded the Academy and used philosophical dialogues to preserve and transform Socratic questioning into a vast drama of politics, education, soul, and truth.',
    idea: '柏拉图区分可变的感性世界与稳定的理念世界，认为知识指向理念而不只是意见。他把伦理学、政治哲学、形而上学和教育结合起来，提出灵魂秩序与城邦正义相互映照。',
    idea_en: 'Plato distinguished the changing sensible world from stable Forms, making knowledge more than opinion. He joined ethics, politics, metaphysics, and education through the analogy between the ordered soul and the just city.',
    works: ['《理想国》', '《斐多篇》', '《蒂迈欧篇》'],
    works_en: ['Republic', 'Phaedo', 'Timaeus']
  },
  aristotle: {
    life: '亚里士多德曾在柏拉图学园学习二十年，后来又做过亚历山大的老师。他的兴趣几乎覆盖当时全部知识领域，从生物、逻辑到政治制度，像是在为世界建立一套可观察、可分类、可论证的知识秩序。',
    life_en: 'Aristotle studied for twenty years in Plato’s Academy and later tutored Alexander. His interests covered nearly every field of inquiry, from biology and logic to constitutions, as if he were building an observable, classifiable, and arguable order of knowledge.',
    idea: '亚里士多德以实体、形式、目的和潜能/现实解释自然与存在。他建立系统逻辑，强调德性来自习惯与中道，并把人理解为在城邦中实现理性能力的政治动物。',
    idea_en: 'Aristotle explained being and nature through substance, form, purpose, and potentiality/actuality. He founded systematic logic, understood virtue as habituated excellence, and saw human beings as rational political animals.',
    works: ['《形而上学》', '《尼各马可伦理学》', '《政治学》'],
    works_en: ['Metaphysics', 'Nicomachean Ethics', 'Politics']
  },
  augustine: {
    life: '奥古斯丁早年热衷修辞、欲望和摩尼教，后来在漫长的精神挣扎中皈依基督教。他的写作把个人忏悔、时间体验和帝国崩塌后的历史焦虑联系起来，使哲学第一次如此深入地进入内心生活。',
    life_en: 'Augustine moved through rhetoric, ambition, desire, and Manichaeism before converting to Christianity after a long inner struggle. His writing joined confession, time-consciousness, and the anxiety of a collapsing empire, bringing philosophy deeply into inward life.',
    idea: '奥古斯丁把柏拉图传统与基督教神学结合，强调内在自我、记忆、时间意识、恩典与意志。他的思想深刻塑造了中世纪关于罪、自由、历史和上帝之城的讨论。',
    idea_en: 'Augustine joined Platonism with Christian theology, emphasizing inwardness, memory, time, grace, and will. He shaped medieval debates about sin, freedom, history, and the City of God.',
    works: ['《忏悔录》', '《上帝之城》', '《论三位一体》'],
    works_en: ['Confessions', 'The City of God', 'On the Trinity']
  },
  aquinas: {
    life: '阿奎那身处大学兴起和亚里士多德思想重新进入欧洲的时代。他像一位冷静的建筑师，把信仰、理性、自然和伦理安置进严密体系，试图说明思想越清楚，信仰反而越不必害怕理性。',
    life_en: 'Aquinas lived as universities were rising and Aristotle was reentering Europe. Like a calm architect, he placed faith, reason, nature, and ethics into a disciplined system, arguing that clear thinking need not threaten belief.',
    idea: '阿奎那综合亚里士多德哲学与基督教神学，区分自然理性与启示真理，同时认为二者最终不冲突。他用目的论、自然法和存在论证明来建立系统的经院哲学结构。',
    idea_en: 'Aquinas synthesized Aristotelian philosophy and Christian theology, distinguishing natural reason from revelation while holding them ultimately compatible. He built scholastic doctrine through teleology, natural law, and arguments for God.',
    works: ['《神学大全》', '《反异教大全》', '《论存在与本质》'],
    works_en: ['Summa Theologiae', 'Summa Contra Gentiles', 'On Being and Essence']
  },
  machiavelli: {
    life: '马基雅维利曾是佛罗伦萨共和国的外交官，亲眼见过城邦政治、战争和权力更替的残酷。失势后他写下《君主论》，把政治从“应当如何高尚”拉回到“权力事实上如何运作”。',
    life_en: 'Machiavelli served as a Florentine diplomat and saw city-state politics, war, and regime change at close range. After losing office, he wrote The Prince, shifting political thought from how rulers ought ideally to be toward how power actually works.',
    idea: '马基雅维利把政治从传统德性伦理和神学目的中相对分离出来，关注权力如何取得、维持和失去。他开启了现代政治现实主义，强调制度、军队、时运与政治行动的有效性。',
    idea_en: 'Machiavelli partly separated politics from traditional virtue ethics and theology, asking how power is acquired, preserved, and lost. He founded modern political realism through institutions, arms, fortune, and effective action.',
    works: ['《君主论》', '《论李维》', '《佛罗伦萨史》'],
    works_en: ['The Prince', 'Discourses on Livy', 'Florentine Histories']
  },
  descartes: {
    life: '笛卡尔生活在科学革命展开的时代，数学、机械论和新自然科学正在改写知识图景。他选择从怀疑开始，试图找到一个无论传统、感官还是权威都无法动摇的确定起点。',
    life_en: 'Descartes lived during the scientific revolution, when mathematics, mechanism, and new natural science were reshaping knowledge. He began from doubt in search of a certainty that tradition, the senses, and authority could not shake.',
    idea: '笛卡尔以方法怀疑寻找不可动摇的知识基础，提出“我思故我在”，并区分思维实体与广延实体。他把数学化方法带入哲学，成为近代理性主义和主体哲学的重要起点。',
    idea_en: 'Descartes used methodic doubt to find an indubitable foundation for knowledge: cogito, ergo sum. His mind/body distinction and mathematical method made him a central origin of modern rationalism and subject philosophy.',
    works: ['《方法谈》', '《第一哲学沉思集》', '《哲学原理》'],
    works_en: ['Discourse on Method', 'Meditations on First Philosophy', 'Principles of Philosophy']
  },
  locke: {
    life: '洛克经历了英国政治危机、宗教冲突和光荣革命。他关心的不只是知识从哪里来，也包括政府权力凭什么合法、个人自由为何不能被任意夺走。',
    life_en: 'Locke lived through English political crisis, religious conflict, and the Glorious Revolution. He asked not only where knowledge comes from, but also why political authority is legitimate and why individual liberty cannot be arbitrarily taken away.',
    idea: '洛克反对天赋观念，认为知识来自经验，并以白板说解释心灵的形成。在政治哲学中，他以自然权利、同意和有限政府论证自由主义国家的基础。',
    idea_en: 'Locke rejected innate ideas and grounded knowledge in experience. Politically, he argued from natural rights, consent, and limited government, giving modern liberalism one of its classic foundations.',
    works: ['《人类理解论》', '《政府论两篇》', '《论宽容书信》'],
    works_en: ['An Essay Concerning Human Understanding', 'Two Treatises of Government', 'A Letter Concerning Toleration']
  },
  hume: {
    life: '休谟出身苏格兰启蒙运动，他以优雅而锋利的文风挑战哲学家的自信。他看似温和，却把因果、归纳、自我和宗教信念都推到必须重新解释的位置。',
    life_en: 'Hume emerged from the Scottish Enlightenment and wrote with unusual elegance and sharpness. His tone was often calm, but he forced causation, induction, the self, and religious belief to be explained anew.',
    idea: '休谟把经验主义推向怀疑论，指出因果性、归纳和自我同一性并不能由理性必然证明，而是源于习惯、想象和心理联结。他也强调情感在道德判断中的基础作用。',
    idea_en: 'Hume pushed empiricism into skepticism: causation, induction, and personal identity cannot be rationally proven as necessities, but arise from habit and imagination. He also grounded moral judgment in sentiment.',
    works: ['《人性论》', '《人类理解研究》', '《道德原则研究》'],
    works_en: ['A Treatise of Human Nature', 'An Enquiry Concerning Human Understanding', 'An Enquiry Concerning the Principles of Morals']
  },
  kant: {
    life: '康德一生大多在柯尼斯堡度过，却试图回答整个启蒙时代最棘手的问题：科学如何可能，自由如何可能，道德为何有约束力。他的批判哲学像一次思想审判，要求理性先说明自己的权力边界。',
    life_en: 'Kant spent most of his life in Königsberg, yet addressed the Enlightenment’s hardest questions: how science is possible, how freedom is possible, and why morality binds us. His critical philosophy asks reason to judge its own powers and limits.',
    idea: '康德试图调和理性主义与经验主义，认为经验知识依赖主体先天形式与范畴的组织。他在伦理学中提出自律与定言命令，在美学和目的论中重构判断力。',
    idea_en: 'Kant reconciled rationalism and empiricism by arguing that experience depends on a priori forms and categories. His ethics centers on autonomy and the categorical imperative; his aesthetics rethinks judgment.',
    works: ['《纯粹理性批判》', '《实践理性批判》', '《判断力批判》'],
    works_en: ['Critique of Pure Reason', 'Critique of Practical Reason', 'Critique of Judgment']
  },
  hegel: {
    life: '黑格尔经历法国大革命、拿破仑战争和现代国家成形的时代。他把这些历史震动看作理性在现实中展开的线索，试图写出一部概念如何穿过冲突而成长的哲学史诗。',
    life_en: 'Hegel lived through the French Revolution, the Napoleonic wars, and the formation of the modern state. He read these upheavals as signs of reason unfolding in reality and wrote philosophy as the history of concepts growing through conflict.',
    idea: '黑格尔把现实理解为理性与历史展开的过程，强调矛盾、否定和扬弃推动概念发展。他的绝对精神体系把逻辑、自然、历史、艺术、宗教和哲学纳入总体辩证结构。',
    idea_en: 'Hegel understood reality as the historical unfolding of reason, driven by contradiction, negation, and sublation. His system integrated logic, nature, history, art, religion, and philosophy within dialectical development.',
    works: ['《精神现象学》', '《逻辑学》', '《法哲学原理》'],
    works_en: ['Phenomenology of Spirit', 'Science of Logic', 'Elements of the Philosophy of Right']
  },
  marx: {
    life: '马克思在工业资本主义急速扩张的十九世纪写作，流亡、贫困和政治斗争贯穿其一生。他把哲学、经济学和革命实践拧在一起，追问现代社会为何生产财富也生产压迫。',
    life_en: 'Marx wrote during the rapid expansion of industrial capitalism, while exile, poverty, and political struggle marked his life. He fused philosophy, economics, and revolutionary practice to ask why modern society produces both wealth and domination.',
    idea: '马克思把黑格尔辩证法转向现实的社会生产和阶级关系，提出历史唯物主义、资本批判和异化理论。他认为哲学必须进入改变现实的实践，而不只是解释世界。',
    idea_en: 'Marx redirected Hegelian dialectic toward material production and class relations, developing historical materialism, critique of capital, and alienation theory. Philosophy must become practical transformation, not mere interpretation.',
    works: ['《资本论》', '《德意志意识形态》', '《1844年经济学哲学手稿》'],
    works_en: ['Capital', 'The German Ideology', 'Economic and Philosophic Manuscripts of 1844']
  },
  nietzsche: {
    life: '尼采先是古典语文学者，后来成为四处漂泊、与学院保持距离的思想写作者。疾病、孤独和欧洲价值危机塑造了他的风格：短句、断片、宣言和锤子般的批判。',
    life_en: 'Nietzsche began as a classical philologist and later became a wandering writer at a distance from the academy. Illness, solitude, and Europe’s crisis of values shaped his style: aphorism, fragment, proclamation, and critique with a hammer.',
    idea: '尼采批判传统形而上学、基督教道德和现代虚无主义，提出价值重估、权力意志、永恒轮回与超人。他把哲学写作变成谱系学、心理学和风格实验。',
    idea_en: 'Nietzsche criticized metaphysics, Christian morality, and modern nihilism through revaluation, will to power, eternal recurrence, and the Übermensch. His philosophy is also genealogy, psychology, and stylistic experiment.',
    works: ['《查拉图斯特拉如是说》', '《善恶的彼岸》', '《道德谱系学》'],
    works_en: ['Thus Spoke Zarathustra', 'Beyond Good and Evil', 'On the Genealogy of Morality']
  },
  wittgenstein: {
    life: '维特根斯坦出身维也纳富裕家庭，却不断逃离既定生活：参军、隐居、教小学、再回剑桥。他的哲学也像两次彻底重启，先追求逻辑的边界，后来转向日常语言的复杂用法。',
    life_en: 'Wittgenstein came from a wealthy Viennese family but repeatedly fled settled paths: soldier, recluse, village schoolteacher, and Cambridge philosopher. His philosophy itself restarted twice, first at the limits of logic and later in ordinary language.',
    idea: '维特根斯坦前期把语言、逻辑与世界的图像关系推到极限；后期则强调意义来自语言游戏和生活形式。他深刻改变了分析哲学对意义、规则和哲学问题的理解。',
    idea_en: 'Early Wittgenstein analyzed language as logical picture of the world; later Wittgenstein treated meaning as use within language-games and forms of life. He transformed debates about meaning, rules, and philosophical problems.',
    works: ['《逻辑哲学论》', '《哲学研究》', '《论确定性》'],
    works_en: ['Tractatus Logico-Philosophicus', 'Philosophical Investigations', 'On Certainty']
  },
  heidegger: {
    life: '海德格尔从神学和现象学出发，在《存在与时间》中提出一个看似古老却被遗忘的问题：存在究竟是什么意思。他的思想极具穿透力，也因其政治选择而始终伴随争议。',
    life_en: 'Heidegger began from theology and phenomenology, then asked in Being and Time an ancient but forgotten question: what does Being mean? His thought is powerful and unsettling, and remains shadowed by his political choices.',
    idea: '海德格尔重新提出存在问题，以此在、在世存在、时间性和向死而在分析人的存在结构。后期思想转向语言、技术和存在的显现方式，对现象学、诠释学和存在主义影响深远。',
    idea_en: 'Heidegger renewed the question of Being through Dasein, being-in-the-world, temporality, and being-toward-death. Later he turned to language, technology, and the disclosure of Being.',
    works: ['《存在与时间》', '《形而上学导论》', '《林中路》'],
    works_en: ['Being and Time', 'Introduction to Metaphysics', 'Off the Beaten Track']
  }
};
const VERIFIED_QUOTES = {
  socrates: {
    zh: '未经审视的人生不值得过。',
    en: 'The unexamined life is not worth living.'
  },
  protagoras: {
    zh: '人是万物的尺度。',
    en: 'Man is the measure of all things.'
  },
  aristotle: {
    zh: '人天生是政治动物。',
    en: 'Man is by nature a political animal.'
  },
  descartes: {
    zh: '我思，故我在。',
    en: 'I think, therefore I am.'
  },
  hume: {
    zh: '理性是激情的奴隶。',
    en: 'Reason is, and ought only to be the slave of the passions.'
  },
  rousseau: {
    zh: '人生而自由，却无处不在枷锁之中。',
    en: 'Man is born free, and everywhere he is in chains.'
  },
  kant: {
    zh: '要有勇气运用你自己的理性。',
    en: 'Have the courage to use your own understanding.'
  },
  marx: {
    zh: '哲学家们只是用不同的方式解释世界，问题在于改变世界。',
    en: 'The philosophers have only interpreted the world, in various ways; the point is to change it.'
  },
  nietzsche: {
    zh: '上帝死了。',
    en: 'God is dead.'
  },
  wittgenstein: {
    zh: '对于不可说的东西，我们必须保持沉默。',
    en: 'Whereof one cannot speak, thereof one must be silent.'
  },
  beauvoir: {
    zh: '女人不是天生的，而是后天形成的。',
    en: 'One is not born, but rather becomes, a woman.'
  },
  sartre: {
    zh: '他人即地狱。',
    en: 'Hell is other people.'
  },
  rawls: {
    zh: '正义是社会制度的首要德性。',
    en: 'Justice is the first virtue of social institutions.'
  },
  derrida: {
    zh: '文本之外别无一物。',
    en: 'There is nothing outside the text.'
  }
};
function getVerifiedQuote(p, lang) {
  const item = VERIFIED_QUOTES[p.id];
  if (!item) return null;
  return lang === 'en' ? item.en || item.zh : item.zh;
}
const WORK_OVERRIDES = {
  thales: ['无著作传世'],
  pythagoras: ['无著作传世'],
  heraclitus: ['《论自然》（残篇）'],
  parmenides: ['《论自然》（残篇）'],
  democritus: ['《小宇宙秩序》（佚）'],
  protagoras: ['《论真理》（佚）'],
  epicurus: ['《致美诺寇的信》', '《主要教义》'],
  zeno_citium: ['《论自然》（佚）'],
  plotinus: ['《九章集》'],
  anselm: ['《宣讲》', '《为什么上帝成为人》'],
  avicenna: ['《治疗论》', '《救治论》', '《医学典范》'],
  averroes: ['《决定性论述》', '《不一致的不一致》'],
  ockham: ['《逻辑大全》', '《箴言书注》'],
  bacon: ['《新工具》', '《学术的进展》'],
  hobbes: ['《利维坦》', '《论公民》'],
  spinoza: ['《伦理学》', '《神学政治论》'],
  leibniz: ['《单子论》', '《神义论》', '《人类理智新论》'],
  berkeley: ['《人类知识原理》', '《海拉斯与斐洛诺斯三篇对话》'],
  rousseau: ['《社会契约论》', '《爱弥儿》', '《论人类不平等的起源》'],
  mill: ['《论自由》', '《功利主义》', '《逻辑体系》'],
  kierkegaard: ['《非此即彼》', '《恐惧与战栗》', '《致死的疾病》'],
  schopenhauer: ['《作为意志和表象的世界》', '《附录与补遗》'],
  frege: ['《概念文字》', '《算术基础》'],
  husserl: ['《逻辑研究》', '《观念》', '《欧洲科学的危机》'],
  russell: ['《数学原理》', '《哲学问题》', '《西方哲学史》'],
  dewey: ['《民主与教育》', '《经验与自然》'],
  sartre: ['《存在与虚无》', '《存在主义是一种人道主义》'],
  arendt: ['《人的境况》', '《极权主义的起源》', '《艾希曼在耶路撒冷》'],
  rawls: ['《正义论》', '《政治自由主义》'],
  foucault: ['《规训与惩罚》', '《词与物》', '《性史》'],
  habermas: ['《交往行为理论》', '《公共领域的结构转型》'],
  derrida: ['《论文字学》', '《声音与现象》', '《书写与差异》'],
  quine: ['《从逻辑的观点看》', '《词与物》'],
  kripke: ['《命名与必然性》', '《维特根斯坦论规则与私人语言》'],
  popper: ['《科学发现的逻辑》', '《开放社会及其敌人》'],
  kuhn: ['《科学革命的结构》'],
  gadamer: ['《真理与方法》'],
  levinas: ['《总体与无限》', '《异于存在》'],
  machiavelli: PROFILE_OVERRIDES.machiavelli.works,
  descartes: PROFILE_OVERRIDES.descartes.works,
  locke: PROFILE_OVERRIDES.locke.works,
  hume: PROFILE_OVERRIDES.hume.works,
  kant: PROFILE_OVERRIDES.kant.works,
  hegel: PROFILE_OVERRIDES.hegel.works,
  marx: PROFILE_OVERRIDES.marx.works,
  nietzsche: PROFILE_OVERRIDES.nietzsche.works,
  wittgenstein: PROFILE_OVERRIDES.wittgenstein.works,
  heidegger: PROFILE_OVERRIDES.heidegger.works,
  augustine: PROFILE_OVERRIDES.augustine.works,
  aquinas: PROFILE_OVERRIDES.aquinas.works,
  plato: PROFILE_OVERRIDES.plato.works,
  aristotle: PROFILE_OVERRIDES.aristotle.works,
  socrates: PROFILE_OVERRIDES.socrates.works
};
const WORK_OVERRIDES_EN = {
  socrates: PROFILE_OVERRIDES.socrates.works_en,
  plato: PROFILE_OVERRIDES.plato.works_en,
  aristotle: PROFILE_OVERRIDES.aristotle.works_en,
  augustine: PROFILE_OVERRIDES.augustine.works_en,
  aquinas: PROFILE_OVERRIDES.aquinas.works_en,
  machiavelli: PROFILE_OVERRIDES.machiavelli.works_en,
  descartes: PROFILE_OVERRIDES.descartes.works_en,
  locke: PROFILE_OVERRIDES.locke.works_en,
  hume: PROFILE_OVERRIDES.hume.works_en,
  kant: PROFILE_OVERRIDES.kant.works_en,
  hegel: PROFILE_OVERRIDES.hegel.works_en,
  marx: PROFILE_OVERRIDES.marx.works_en,
  nietzsche: PROFILE_OVERRIDES.nietzsche.works_en,
  wittgenstein: PROFILE_OVERRIDES.wittgenstein.works_en,
  heidegger: PROFILE_OVERRIDES.heidegger.works_en
};
const ERA_LIFE_LINES = {
  ancient: {
    zh: '他生活在希腊城邦和罗马思想世界成形的时期，哲学还在同时追问自然、灵魂、德性与共同生活的秩序。',
    en: 'This figure belongs to the Greek and Roman formation of philosophy, when inquiry into nature, soul, virtue, and common life was still being invented.'
  },
  medieval: {
    zh: '他处在古典哲学、宗教信仰和大学制度相互交汇的时代，许多问题都围绕理性如何理解信仰、存在和善展开。',
    en: 'This figure worked where classical philosophy, religious faith, and emerging institutions of learning met, around questions of reason, being, and the good.'
  },
  renaissance: {
    zh: '他站在中世纪秩序松动和现代世界开启的门槛上，人的行动、政治判断和知识方法开始获得新的重量。',
    en: 'This figure stands near the threshold between medieval order and the modern world, when human action, political judgment, and method gained new force.'
  },
  early_modern: {
    zh: '他面对的是科学革命、宗教冲突和现代国家兴起后的新世界：知识如何可靠，权力如何合法，主体如何确定自身。',
    en: 'This figure faced the new world of scientific revolution, religious conflict, and modern statehood: reliable knowledge, legitimate power, and the self-certainty of the subject.'
  },
  modern: {
    zh: '他写作于工业化、革命、民族国家和现代学科快速扩张的时代，哲学开始更直接地面对历史、社会和人的有限性。',
    en: 'This figure wrote amid industrialization, revolution, nation-states, and expanding disciplines, when philosophy confronted history, society, and human finitude more directly.'
  },
  contemporary: {
    zh: '他属于二十世纪以来的思想现场，语言、权力、科学、主体和社会制度都不再被视为理所当然。',
    en: 'This figure belongs to the intellectual field since the twentieth century, where language, power, science, subjectivity, and institutions could no longer be taken for granted.'
  }
};
const SCHOOL_IDEA_LINES = {
  presocratic: {
    zh: '它的吸引力在于：哲学第一次尝试不用神话，而用概念去说明世界从何而来、由什么构成。',
    en: 'Its appeal lies in philosophy’s first attempt to explain the world through concepts rather than myth.'
  },
  classical: {
    zh: '这里真正重要的是：哲学开始把“什么是真理”与“怎样生活才好”放在一起追问。',
    en: 'What matters here is the joining of truth with the question of how one should live.'
  },
  hellenistic: {
    zh: '它把哲学带回日常生活，关心人在不安、欲望和命运面前如何获得平静。',
    en: 'It brings philosophy back to daily life: how to live calmly amid desire, anxiety, and fortune.'
  },
  stoic: {
    zh: '斯多葛思想的锋芒在于把自由放进内心判断：外部世界未必由我决定，但我可以训练自己如何回应。',
    en: 'Stoicism places freedom in judgment: the outer world may not be ours to command, but our response can be trained.'
  },
  epicurean: {
    zh: '伊壁鸠鲁传统并不是纵欲，而是通过理解自然、节制欲望来摆脱恐惧。',
    en: 'Epicureanism is not indulgence, but freedom from fear through understanding nature and moderating desire.'
  },
  skeptic: {
    zh: '怀疑主义最有力量之处，是迫使人们区分真正知道的东西和只是习惯相信的东西。',
    en: 'Skepticism forces a distinction between what we truly know and what we merely habitually believe.'
  },
  neoplatonic: {
    zh: '新柏拉图主义把世界理解为从最高原则流溢而出的层级，也把哲学变成灵魂回返自身源头的道路。',
    en: 'Neoplatonism sees reality as an emanating hierarchy and philosophy as the soul’s return toward its source.'
  },
  scholastic: {
    zh: '经院哲学的魅力不在繁琐，而在它相信最困难的问题也可以被耐心地区分、反驳和论证。',
    en: 'Scholasticism’s power lies in the belief that even the hardest questions can be patiently distinguished, argued, and tested.'
  },
  rationalism: {
    zh: '理性主义的核心冲动，是寻找比感官经验更稳定的根据，让知识像数学一样清楚。',
    en: 'Rationalism seeks foundations firmer than the senses, making knowledge as clear as mathematics.'
  },
  empiricism: {
    zh: '经验主义提醒人们：观念再宏大，也要回到经验、感知和可检验的人类心理。',
    en: 'Empiricism recalls thought to experience, perception, and testable features of human understanding.'
  },
  enlightenment: {
    zh: '启蒙思想把理性带入公共生活，追问迷信、专制和不平等为何能够支配人。',
    en: 'Enlightenment thought brings reason into public life, challenging superstition, despotism, and inherited inequality.'
  },
  idealism: {
    zh: '唯心主义关心主体如何参与世界的构成，而不是把心灵只看作被动接收外物的镜子。',
    en: 'Idealism asks how subjectivity helps constitute the world, rather than treating mind as a passive mirror.'
  },
  german_classical: {
    zh: '德国古典哲学把自由、理性和历史放在一起，试图说明现代人如何成为自己的立法者。',
    en: 'German classical philosophy joins freedom, reason, and history to explain how modern agents legislate for themselves.'
  },
  materialism: {
    zh: '唯物主义把思想拉回身体、劳动、自然和社会条件，提醒哲学不要只在观念内部打转。',
    en: 'Materialism returns thought to body, labor, nature, and social conditions, resisting philosophy’s enclosure within ideas alone.'
  },
  pragmatism: {
    zh: '实用主义把真理放进行动后果中考察：一个观念如何改变经验，比它是否高悬在空中更重要。',
    en: 'Pragmatism tests truth through consequences: what an idea does to experience matters more than its abstract purity.'
  },
  analytic: {
    zh: '分析哲学的锋利来自对语言、逻辑和论证结构的敏感：很多哲学谜题也许首先是表达方式的问题。',
    en: 'Analytic philosophy’s sharpness comes from attention to language, logic, and argument: many puzzles begin in expression.'
  },
  phenomenology: {
    zh: '现象学要求暂时放下现成理论，回到经验如何显现给我们的第一现场。',
    en: 'Phenomenology suspends ready-made theory to return to how experience first appears to us.'
  },
  existentialism: {
    zh: '存在主义把哲学推向个人处境：自由、焦虑、死亡和选择不是抽象概念，而是每个人必须承担的事实。',
    en: 'Existentialism pushes philosophy into personal situation: freedom, anxiety, death, and choice are facts to be borne.'
  },
  structuralism: {
    zh: '结构主义让人看到，意义常常不是孤立产生的，而来自符号、规则和差异构成的系统。',
    en: 'Structuralism shows that meaning often arises not in isolation but from systems of signs, rules, and differences.'
  },
  poststructuralism: {
    zh: '后结构主义追问看似稳定的意义、主体和制度如何被话语建成，又如何可能被拆开。',
    en: 'Post-structuralism asks how apparently stable meanings, subjects, and institutions are made by discourse and can be unsettled.'
  },
  critical: {
    zh: '批判理论关心思想如何卷入权力与社会结构，也关心人怎样从看似自然的支配中醒来。',
    en: 'Critical theory asks how thought is entangled with power and social structure, and how domination becomes visible.'
  },
  linguistic: {
    zh: '语言哲学提醒我们，理解人类心灵和社会生活，往往要先理解语言如何组织世界。',
    en: 'Linguistic philosophy reminds us that mind and social life are often understood through language’s organization of the world.'
  }
};
function extractWorksFromBlurb(text) {
  if (!text) return [];
  const matches = [...text.matchAll(/《([^》]+)》/g)].map(m => `《${m[1]}》`);
  return [...new Set(matches)].slice(0, 3);
}
function getProfileWorks(p, lang, blurb) {
  const direct = lang === 'en' ? WORK_OVERRIDES_EN[p.id] : WORK_OVERRIDES[p.id];
  if (direct && direct.length) return direct.slice(0, 3);
  const fromBlurb = extractWorksFromBlurb(blurb);
  return fromBlurb.length ? fromBlurb : [];
}
function getProfileLife(p, profile, lang, blurb) {
  const direct = lang === 'en' ? profile.life_en : profile.life;
  if (direct) return direct;
  const eraLine = ERA_LIFE_LINES[p.era]?.[lang] || ERA_LIFE_LINES.modern[lang];
  if (lang === 'en') return `${p.en} (${fmtLife(p, lang)}). ${eraLine} ${blurb || ''}`;
  return `${p.zh}（${fmtLife(p, lang)}）。${eraLine}${blurb ? ` ${blurb}` : ''}`;
}
function getProfileIdea(p, profile, lang, blurb) {
  const direct = lang === 'en' ? profile.idea_en : profile.idea;
  if (direct) return direct;
  const schoolLine = SCHOOL_IDEA_LINES[p.schools[0]]?.[lang] || '';
  if (lang === 'en') return `${blurb || 'A distinctive voice in the history of philosophy.'}${schoolLine ? ` ${schoolLine}` : ''}`;
  return `${blurb || '他是西方哲学史中值得继续追问的一位思想者。'}${schoolLine ? ` ${schoolLine}` : ''}`;
}
function DetailPanel({
  philosopher,
  lang,
  onClose,
  schools,
  isMobile = false
}) {
  const p = philosopher;
  const isCanon = CANON_PHILOSOPHER_IDS.has(p.id);
  const schoolNames = p.schools.map(id => schools.find(s => s.id === id)).filter(Boolean);
  const profile = PROFILE_OVERRIDES[p.id] || {};
  const blurb = lang === 'en' && p.blurb_en ? p.blurb_en : p.blurb;
  const quote = getVerifiedQuote(p, lang);
  const idea = getProfileIdea(p, profile, lang, blurb);
  const name = lang === 'zh' ? p.zh : p.en;
  const nameAlt = lang === 'zh' ? p.en : p.zh;
  const works = getProfileWorks(p, lang, blurb);
  const lifeText = getProfileLife(p, profile, lang, blurb);
  return /*#__PURE__*/React.createElement("div", {
    className: "phi-panel",
    style: {
      position: 'absolute',
      right: isMobile ? 0 : 24,
      left: isMobile ? 0 : 'auto',
      top: isMobile ? 'auto' : 118,
      bottom: isMobile ? 0 : 80,
      width: isMobile ? 'auto' : 360,
      maxHeight: isMobile ? '76vh' : 'none',
      background: 'linear-gradient(180deg, rgba(15,20,36,0.94), rgba(8,12,24,0.92))',
      border: '1px solid rgba(242,236,220,0.18)',
      borderLeft: isMobile ? 'none' : '1px solid rgba(242,236,220,0.18)',
      borderRight: isMobile ? 'none' : '1px solid rgba(242,236,220,0.18)',
      borderBottom: isMobile ? 'none' : '1px solid rgba(242,236,220,0.18)',
      borderTopColor: isCanon ? PAL.goldSoft : 'rgba(242,236,220,0.22)',
      boxShadow: `0 22px 48px rgba(0,0,0,0.34), inset 0 1px 0 ${isCanon ? PAL.goldFaint : 'rgba(242,236,220,0.04)'}`,
      overflowY: 'auto',
      zIndex: 10,
      padding: isMobile ? '20px 18px 22px' : '26px 24px 20px',
      boxSizing: 'border-box',
      backdropFilter: 'blur(16px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      top: 0,
      left: 24,
      right: 24,
      height: 1,
      background: `linear-gradient(90deg, transparent, ${isCanon ? PAL.gold : 'rgba(242,236,220,0.24)'}, transparent)`
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      position: 'absolute',
      right: 12,
      top: 10,
      background: 'transparent',
      border: 'none',
      fontSize: 22,
      color: PAL.inkSoft,
      cursor: 'pointer',
      fontFamily: FONT_SERIF_EN,
      lineHeight: 1
    }
  }, "\xD7"), isMobile && /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      width: 38,
      height: 3,
      borderRadius: 3,
      background: 'rgba(242,236,220,0.22)',
      margin: '-8px auto 14px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: `${isMobile ? 58 : 68}px minmax(0, 1fr)`,
      alignItems: 'center',
      columnGap: isMobile ? 12 : 15
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: isMobile ? 58 : 68,
      height: isMobile ? 58 : 68,
      flexShrink: 0,
      borderRadius: '50%',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: isCanon ? `0 0 0 1px ${PAL.gold}, 0 0 0 4px ${PAL.goldFaint}, 0 12px 28px rgba(0,0,0,0.28)` : `0 0 0 1px ${PAL.ring}, 0 10px 24px rgba(0,0,0,0.20)`
    }
  }, /*#__PURE__*/React.createElement(Cameo, {
    id: p.id,
    en: p.en,
    size: isMobile ? 54 : 64
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: isMobile ? 22 : 24,
      fontWeight: 500,
      lineHeight: 1.1,
      color: isCanon ? 'oklch(0.89 0.07 88)' : PAL.ink,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontFamily: lang === 'zh' ? FONT_SERIF_ZH : FONT_SERIF_EN
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      marginTop: 6,
      minWidth: 0,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontStyle: 'italic',
      color: PAL.inkSoft,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: isMobile ? 120 : 150
    }
  }, nameAlt), schoolNames.map(s => /*#__PURE__*/React.createElement("span", {
    key: s.id,
    style: {
      fontSize: 9.5,
      padding: '2px 6px',
      border: '1px solid rgba(242,236,220,0.16)',
      fontFamily: FONT_MONO,
      letterSpacing: '0.04em',
      color: PAL.inkSoft,
      background: 'rgba(242,236,220,0.032)',
      whiteSpace: 'nowrap'
    }
  }, lang === 'zh' ? s.zh : s.en))))), quote && /*#__PURE__*/React.createElement("blockquote", {
    style: {
      margin: '12px 0 10px',
      padding: '5px 0',
      borderLeft: 'none',
      fontSize: isMobile ? 13 : 13.5,
      fontFamily: lang === 'zh' ? FONT_SERIF_ZH : FONT_SERIF_EN,
      lineHeight: 1.55,
      color: isCanon ? PAL.ink : PAL.inkMid
    }
  }, quote), /*#__PURE__*/React.createElement(ProfileSection, {
    title: lang === 'zh' ? '生平' : 'Life',
    lang: lang
  }, lifeText), /*#__PURE__*/React.createElement(ProfileSection, {
    title: lang === 'zh' ? '核心思想' : 'Core Ideas',
    lang: lang
  }, idea), works.length > 0 && /*#__PURE__*/React.createElement(ProfileSection, {
    title: lang === 'zh' ? '代表作' : 'Works',
    lang: lang
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, works.map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      color: PAL.inkMid
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: isCanon ? PAL.gold : PAL.inkSoft,
      fontFamily: FONT_MONO,
      fontSize: 9
    }
  }, String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("span", null, w))))));
}
function ProfileSection({
  title,
  children,
  lang
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      marginTop: 14,
      paddingTop: 12,
      borderTop: '1px solid rgba(242,236,220,0.10)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      fontFamily: FONT_MONO,
      color: PAL.inkSoft,
      marginBottom: 7
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      lineHeight: 1.72,
      color: PAL.inkMid,
      fontFamily: lang === 'zh' ? FONT_SERIF_ZH : FONT_SERIF_EN
    }
  }, children));
}
Object.assign(window, {
  PhilosophyTimeline,
  PAL,
  Cameo
});