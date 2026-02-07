import { analyzePost } from './analysisEngine';

const DEFAULT_FRAMEWORKS = [
  {
    id: 'wish-knew',
    template: 'Things I wish I knew {timeframe}',
    matchers: [/wish i knew/i, /if i knew then/i],
    tags: { format: 'List', emotion: 'Relatable', difficulty: 'Easy' },
    expansions: [
      'Things I wish I knew at 18',
      'Things I wish I knew in my early 20s',
      'Things I wish I knew before chasing discipline',
      'Things I wish I knew when I felt lost',
    ],
  },
  {
    id: 'habits-ruining',
    template: 'Habits that secretly ruin {focus}',
    matchers: [/habits.*ruin/i, /silently ruining/i],
    tags: { format: 'List', emotion: 'Fear', difficulty: 'Easy' },
    expansions: [
      '8 habits silently ruining your focus',
      'Habits that quietly kill your momentum',
      'Habits that sabotage consistency without you noticing',
    ],
  },
  {
    id: 'truth-no-one-talks',
    template: 'The truth about {topic} no one talks about',
    matchers: [/truth about.*no one talks/i, /nobody tells you/i],
    tags: { format: 'Story', emotion: 'Relatable', difficulty: 'Medium' },
    expansions: [
      'The uncomfortable truth about motivation',
      'The truth about consistency no one mentions',
      'The truth about discipline that surprised me',
    ],
  },
  {
    id: 'start-from-zero',
    template: 'If I had to grow from 0 again…',
    matchers: [/start from zero/i, /grow from 0/i],
    tags: { format: 'Story', emotion: 'Aspiration', difficulty: 'Medium' },
    expansions: [
      'If I had to grow from 0 on Threads again…',
      'If I had to rebuild my habits from scratch…',
      'If I had to restart my career today…',
    ],
  },
  {
    id: 'mistakes-cost',
    template: 'Mistakes that cost me {loss}',
    matchers: [/mistakes.*cost/i, /cost me years/i],
    tags: { format: 'List', emotion: 'Relatable', difficulty: 'Easy' },
    expansions: [
      'Mistakes I made in my early 20s that cost me years',
      'Mistakes that slowed my growth for a year',
      'Mistakes that kept me stuck longer than I wanted',
    ],
  },
  {
    id: 'nobody-tells-you',
    template: 'Things nobody tells you about {topic}',
    matchers: [/nobody tells you/i, /no one tells you/i],
    tags: { format: 'List', emotion: 'Relatable', difficulty: 'Easy' },
    expansions: [
      'Things nobody tells you about consistency',
      'Things nobody tells you about building habits',
      'Things nobody tells you about staying motivated',
    ],
  },
  {
    id: 'quiet-killers',
    template: 'The small things that kill {goal}',
    matchers: [/kills your/i, /quietly kill/i],
    tags: { format: 'List', emotion: 'Fear', difficulty: 'Easy' },
    expansions: [
      'The small things that kill momentum fast',
      'The small things that kill your focus daily',
      'The small things that kill consistency',
    ],
  },
  {
    id: 'identity-shift',
    template: 'The mindset shift that changed my {goal}',
    matchers: [/mindset shift/i, /changed my/i],
    tags: { format: 'Story', emotion: 'Aspiration', difficulty: 'Medium' },
    expansions: [
      'The mindset shift that changed my consistency',
      'The mindset shift that made discipline easier',
      'The mindset shift that unlocked focus for me',
    ],
  },
  {
    id: 'rules-i-follow',
    template: 'Rules I follow to keep {goal} simple',
    matchers: [/rules i follow/i, /rules that keep/i],
    tags: { format: 'List', emotion: 'Aspiration', difficulty: 'Easy' },
    expansions: [
      'Rules I follow to keep momentum simple',
      'Rules I follow to stay consistent',
      'Rules I follow to keep focus locked in',
    ],
  },
];

const STORAGE_KEY = 'dvt-cache-v1';

const toDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

const buildFrameworksFromPosts = (viralPosts = []) => {
  const matchedFrameworks = new Set();
  const normalizedPosts = viralPosts.map((post) => post.toLowerCase());
  DEFAULT_FRAMEWORKS.forEach((framework) => {
    if (framework.matchers.some((matcher) => normalizedPosts.some((post) => matcher.test(post)))) {
      matchedFrameworks.add(framework.id);
    }
  });

  const frameworks = DEFAULT_FRAMEWORKS.filter((framework) => matchedFrameworks.has(framework.id));
  return frameworks.length > 0 ? frameworks : DEFAULT_FRAMEWORKS;
};

const expandFrameworks = (frameworks) => {
  const ideas = [];
  frameworks.forEach((framework) => {
    framework.expansions.forEach((text, index) => {
      ideas.push({
        id: `${framework.id}-${index}`,
        frameworkId: framework.id,
        text,
        tags: framework.tags,
      });
    });
  });
  return ideas;
};

const dedupeIdeas = (ideas) => {
  const seen = new Set();
  return ideas.filter((idea) => {
    const key = idea.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const scoreIdeas = (ideas) => {
  return ideas.map((idea) => {
    const result = analyzePost(idea.text);
    return {
      ...idea,
      score: Number((result.viral / 10).toFixed(1)),
    };
  });
};

const selectDailyIdeas = (ideas, count, dateKey, forceRefresh) => {
  if (typeof window !== 'undefined' && !forceRefresh) {
    const cached = window.localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.dateKey === dateKey && Array.isArray(parsed.ideas)) {
        return parsed.ideas;
      }
    }
  }

  const seededIdeas = [...ideas].sort((a, b) => {
    const aKey = `${a.id}-${dateKey}`;
    const bKey = `${b.id}-${dateKey}`;
    return aKey.localeCompare(bKey);
  });

  const selected = seededIdeas.slice(0, count);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ dateKey, ideas: selected })
    );
  }

  return selected;
};

export const generateDailyTopics = ({ viralPosts, count = 5, threshold = 7.5, forceRefresh = false } = {}) => {
  const dateKey = toDateKey();
  const frameworks = buildFrameworksFromPosts(viralPosts);
  const expandedIdeas = dedupeIdeas(expandFrameworks(frameworks));
  const scoredIdeas = scoreIdeas(expandedIdeas);
  const filtered = scoredIdeas.filter((idea) => idea.score >= threshold);
  const finalPool = filtered.length >= count ? filtered : scoredIdeas;
  const sortedPool = [...finalPool].sort((a, b) => b.score - a.score);

  return selectDailyIdeas(sortedPool, count, dateKey, forceRefresh);
};

export const getFrameworkLibrary = () => DEFAULT_FRAMEWORKS;
