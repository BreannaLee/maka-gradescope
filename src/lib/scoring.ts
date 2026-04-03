export const DOMAINS = [
  {
    key: 'character',
    label: 'Character',
    icon: '💪',
    color: '#6E55FF',
    indicators: [
      { name: 'Persistence & grit', keywords: ['persist', 'grit', 'try again', 'keep going', 'don\'t give up', 'determination'] },
      { name: 'Honesty & integrity', keywords: ['honest', 'truth', 'integrity', 'admit', 'mistake', 'trustworthy'] },
      { name: 'Kindness & compassion', keywords: ['kind', 'compassion', 'help', 'share', 'care', 'generous', 'gentle'] },
      { name: 'Courage', keywords: ['courage', 'brave', 'fear', 'stand up', 'try new', 'bold'] },
    ],
  },
  {
    key: 'connection',
    label: 'Connection',
    icon: '❤️',
    color: '#FB5BC5',
    indicators: [
      { name: 'Caregiver bonding', keywords: ['parent', 'caregiver', 'family', 'hug', 'comfort', 'safe', 'love'] },
      { name: 'Empathy modeling', keywords: ['empathy', 'feel', 'emotion', 'understand', 'recognize', 'feelings'] },
      { name: 'Family representation', keywords: ['family', 'diverse', 'representation', 'household', 'siblings'] },
      { name: 'Co-viewing moments', keywords: ['camera', 'viewer', 'participate', 'together', 'join', 'ask audience'] },
    ],
  },
  {
    key: 'play',
    label: 'Play',
    icon: '🎨',
    color: '#FFE23D',
    indicators: [
      { name: 'Imaginative play', keywords: ['imagine', 'pretend', 'creative', 'fantasy', 'make-believe', 'dream'] },
      { name: 'Sensory exploration', keywords: ['texture', 'color', 'sound', 'touch', 'smell', 'sense', 'sensory'] },
      { name: 'Humor & joy', keywords: ['funny', 'humor', 'laugh', 'joy', 'delight', 'silly', 'fun'] },
      { name: 'Open-ended activities', keywords: ['open-ended', 'explore', 'discover', 'no wrong answer', 'experiment'] },
    ],
  },
  {
    key: 'thinking',
    label: 'Thinking',
    icon: '🧠',
    color: '#4DC9FF',
    indicators: [
      { name: 'Problem solving', keywords: ['problem', 'solve', 'figure out', 'solution', 'challenge', 'work through'] },
      { name: 'Curiosity & questioning', keywords: ['why', 'what if', 'curious', 'question', 'wonder', 'explore'] },
      { name: 'Executive function', keywords: ['plan', 'sequence', 'wait', 'impulse', 'organize', 'step by step'] },
      { name: 'Critical thinking', keywords: ['compare', 'decide', 'choice', 'think', 'reason', 'evaluate'] },
    ],
  },
  {
    key: 'social',
    label: 'Social',
    icon: '🤝',
    color: '#38E388',
    indicators: [
      { name: 'Conflict resolution', keywords: ['conflict', 'resolve', 'compromise', 'sorry', 'apologize', 'disagree', 'make up'] },
      { name: 'Social cues', keywords: ['facial', 'expression', 'body language', 'tone', 'gesture', 'cue'] },
      { name: 'Inclusivity', keywords: ['include', 'diverse', 'everyone', 'belong', 'different', 'welcome', 'accept'] },
      { name: 'Cooperation & turn-taking', keywords: ['cooperat', 'together', 'share', 'turn', 'team', 'help each other'] },
    ],
  },
  {
    key: 'physical',
    label: 'Physical',
    icon: '🏃',
    color: '#FF5B15',
    indicators: [
      { name: 'Movement & motor skills', keywords: ['run', 'jump', 'dance', 'climb', 'motor', 'move', 'balance'] },
      { name: 'Body awareness', keywords: ['body', 'part', 'sensation', 'stretch', 'breathe', 'awareness'] },
      { name: 'Health & safety', keywords: ['health', 'safe', 'wash', 'clean', 'eat', 'sleep', 'hygiene'] },
      { name: 'Movement prompts', keywords: ['move along', 'follow', 'do this', 'stand up', 'clap', 'wave'] },
    ],
  },
  {
    key: 'academic',
    label: 'Academic',
    icon: '📚',
    color: '#D99CFF',
    indicators: [
      { name: 'Language & literacy', keywords: ['letter', 'word', 'read', 'rhyme', 'story', 'book', 'literacy', 'alphabet'] },
      { name: 'Numeracy', keywords: ['count', 'number', 'math', 'pattern', 'add', 'subtract', 'shape'] },
      { name: 'Scientific thinking', keywords: ['cause', 'effect', 'observe', 'predict', 'experiment', 'science', 'nature'] },
      { name: 'Vocabulary expansion', keywords: ['new word', 'vocabulary', 'meaning', 'define', 'learn word'] },
    ],
  },
] as const

export type DomainKey = typeof DOMAINS[number]['key']

export function scoreToGrade(score: number): string {
  if (score >= 9.5) return 'A+'
  if (score >= 9.0) return 'A'
  if (score >= 8.5) return 'A-'
  if (score >= 8.0) return 'B+'
  if (score >= 7.0) return 'B'
  if (score >= 6.5) return 'B-'
  if (score >= 6.0) return 'C+'
  if (score >= 5.5) return 'C'
  if (score >= 5.0) return 'C-'
  if (score >= 3.0) return 'D'
  return 'F'
}

export function gradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#38E388'
  if (grade.startsWith('B')) return '#4DC9FF'
  if (grade.startsWith('C')) return '#FFE23D'
  if (grade.startsWith('D')) return '#FF5B15'
  return '#FB5BC5'
}

export function statusColor(grade: string): 'green' | 'amber' | 'red' {
  const score = gradeToMinScore(grade)
  if (score >= 7.0) return 'green'
  if (score >= 5.5) return 'amber'
  return 'red'
}

function gradeToMinScore(grade: string): number {
  const map: Record<string, number> = {
    'A+': 9.5, 'A': 9.0, 'A-': 8.5,
    'B+': 8.0, 'B': 7.0, 'B-': 6.5,
    'C+': 6.0, 'C': 5.5, 'C-': 5.0,
    'D': 3.0, 'F': 0,
  }
  return map[grade] ?? 0
}

// Hardcoded benchmarks for V1
export const BENCHMARKS: Record<string, number> = {
  character: 7.8,
  connection: 7.2,
  play: 7.5,
  thinking: 7.0,
  social: 7.3,
  physical: 6.8,
  academic: 7.1,
}

// Stage-specific domain weights
const STAGE_WEIGHTS: Record<string, Record<string, number>> = {
  idea: {
    character: 1.0, connection: 1.0, play: 1.0, thinking: 0.6, social: 1.0, physical: 0.6, academic: 1.0,
  },
  script: {
    character: 1.0, connection: 1.0, play: 1.0, thinking: 1.0, social: 1.0, physical: 0.7, academic: 0.7,
  },
  video: {
    character: 1.0, connection: 1.0, play: 1.0, thinking: 1.0, social: 1.0, physical: 1.0, academic: 1.0,
  },
}

export function evaluateContent(description: string, ageBracket: string, stage: string) {
  const lowerDesc = description.toLowerCase()
  const weights = STAGE_WEIGHTS[stage] || STAGE_WEIGHTS.video

  const domainScores = DOMAINS.map((domain) => {
    let domainScore = 0

    domain.indicators.forEach((indicator) => {
      let indicatorScore = 0
      let matchCount = 0

      indicator.keywords.forEach((keyword) => {
        if (lowerDesc.includes(keyword.toLowerCase())) {
          matchCount++
        }
      })

      if (matchCount > 0) {
        // Base score for mentioning + bonus for depth
        indicatorScore = Math.min(1.5 + matchCount * 0.5, 2.5)
      }

      domainScore += indicatorScore
    })

    // Apply stage weight
    domainScore = Math.min(domainScore * (weights[domain.key] ?? 1.0), 10)

    // Add slight randomness for realism (±0.3)
    domainScore = Math.max(0, Math.min(10, domainScore + (Math.random() - 0.5) * 0.6))
    domainScore = Math.round(domainScore * 10) / 10

    return {
      domain: domain.key,
      score: domainScore,
      grade: scoreToGrade(domainScore),
      feedback: generateDomainFeedback(domain.key, domainScore, stage),
      benchmark: BENCHMARKS[domain.key] ?? 7.0,
      subIndicators: domain.indicators.map((ind) => {
        const hasMatch = ind.keywords.some((k) => lowerDesc.includes(k.toLowerCase()))
        const subScore = hasMatch ? Math.floor(Math.random() * 2) + 3 : Math.floor(Math.random() * 2) + 1
        return {
          indicatorName: ind.name,
          score: Math.min(subScore, 5),
          maxScore: 5,
        }
      }),
    }
  })

  const overallScore = Math.round(
    (domainScores.reduce((sum, d) => sum + d.score, 0) / domainScores.length) * 10
  ) / 10

  return {
    domainScores,
    overallScore,
    overallGrade: scoreToGrade(overallScore),
  }
}

function generateDomainFeedback(domain: string, score: number, stage: string): string {
  const feedbackMap: Record<string, Record<string, string>> = {
    character: {
      high: 'Strong character development with clear moral themes. Characters demonstrate persistence and kindness effectively.',
      mid: 'Some character traits are present but could be more explicitly modeled. Consider adding moments where characters demonstrate grit or compassion.',
      low: 'Character development needs significant strengthening. Try incorporating moments of honesty, courage, or kindness into the narrative.',
    },
    connection: {
      high: 'Excellent caregiver bonding and empathy modeling. The content creates meaningful co-viewing opportunities.',
      mid: 'Some connection elements present. Consider adding more moments where characters recognize and name emotions.',
      low: 'Connection themes are underdeveloped. Add caregiver interactions and empathy modeling to strengthen this domain.',
    },
    play: {
      high: 'Wonderful imaginative play and sensory exploration. The content balances humor with creative open-ended activities.',
      mid: 'Play elements are present but could be enriched. Add more sensory details and open-ended creative moments.',
      low: 'Play domain needs more attention. Incorporate imaginative scenarios, sensory exploration, and joyful moments.',
    },
    thinking: {
      high: 'Great problem-solving sequences and curiosity-driven exploration. Characters model strong executive function.',
      mid: 'Some thinking elements present. Add more "what if" questions and step-by-step problem-solving moments.',
      low: 'Thinking domain needs development. Include problem-solving scenarios and moments that encourage curiosity.',
    },
    social: {
      high: 'Excellent social modeling with diverse, inclusive characters. Conflict resolution is handled age-appropriately.',
      mid: 'Social elements are present but could be stronger. Consider adding more cooperation and turn-taking scenarios.',
      low: 'Social domain needs attention. Include diverse characters, conflict resolution, and cooperative activities.',
    },
    physical: {
      high: 'Strong movement integration with great body awareness cues. Movement prompts are well-placed and engaging.',
      mid: 'Some physical elements present. Consider adding more movement breaks and body awareness moments.',
      low: 'Physical domain needs strengthening. Add movement prompts, dance breaks, or body awareness activities.',
    },
    academic: {
      high: 'Rich language and literacy integration. Academic concepts are woven naturally into the narrative.',
      mid: 'Some academic elements present. Consider adding more vocabulary expansion and counting opportunities.',
      low: 'Academic domain needs development. Weave in letter awareness, counting, or scientific thinking naturally.',
    },
  }

  const level = score >= 7.0 ? 'high' : score >= 5.0 ? 'mid' : 'low'
  return feedbackMap[domain]?.[level] ?? 'Evaluation pending.'
}
