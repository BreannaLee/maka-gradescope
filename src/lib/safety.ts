// Safety & moderation auto-flagging

interface SafetyCheckResult {
  flagType: string
  severity: 'warning' | 'hard_reject'
  description: string
}

// Keywords/phrases that indicate potential safety concerns for children's content
const HARD_REJECT_PATTERNS = [
  { pattern: /\b(violence|violent|weapon|gun|knife|blood|gore|kill|murder|death)\b/i, type: 'violence', desc: 'Content contains violence-related language inappropriate for children' },
  { pattern: /\b(drug|alcohol|beer|wine|drunk|smoking|cigarette|vape)\b/i, type: 'substance', desc: 'Content references substances inappropriate for children' },
  { pattern: /\b(sexual|nudity|naked|explicit)\b/i, type: 'sexual_content', desc: 'Content contains sexually suggestive language' },
  { pattern: /\b(hate|racist|discrimination|slur)\b/i, type: 'hate_speech', desc: 'Content contains potentially hateful or discriminatory language' },
]

const WARNING_PATTERNS = [
  { pattern: /\b(scary|frightening|horror|monster attack|nightmare)\b/i, type: 'fear_content', desc: 'Content may contain fear-inducing elements that could be too intense for young children' },
  { pattern: /\b(stranger|kidnap|lost child|abandoned)\b/i, type: 'stranger_danger', desc: 'Content references potentially distressing scenarios involving strangers or abandonment' },
  { pattern: /\b(bully|mean|tease|mock|humiliat)\b/i, type: 'bullying', desc: 'Content depicts bullying behavior — ensure it is resolved constructively' },
  { pattern: /\b(diet|fat|ugly|stupid|dumb)\b/i, type: 'negative_messaging', desc: 'Content contains potentially harmful body image or self-esteem language' },
  { pattern: /\b(commercial|buy|purchase|product|brand name|advertisement)\b/i, type: 'commercial_content', desc: 'Content may contain commercial or advertising language' },
]

// Age-appropriateness checks
const AGE_CONCERNS: Record<string, { pattern: RegExp; type: string; desc: string }[]> = {
  '0-2': [
    { pattern: /\b(complex plot|subplot|flashback|time skip)\b/i, type: 'age_complexity', desc: 'Content structure may be too complex for ages 0-2' },
    { pattern: /\b(sarcasm|irony|metaphor)\b/i, type: 'age_language', desc: 'Language devices like sarcasm or metaphor are not appropriate for ages 0-2' },
  ],
  '2-4': [
    { pattern: /\b(complex subplot|multiple storyline|flashback)\b/i, type: 'age_complexity', desc: 'Narrative structure may be too complex for ages 2-4' },
  ],
  '4-6': [],
}

export function checkSafety(content: string, ageBracket: string): SafetyCheckResult[] {
  const flags: SafetyCheckResult[] = []

  // Hard reject checks
  for (const rule of HARD_REJECT_PATTERNS) {
    if (rule.pattern.test(content)) {
      flags.push({
        flagType: rule.type,
        severity: 'hard_reject',
        description: rule.desc,
      })
    }
  }

  // Warning checks
  for (const rule of WARNING_PATTERNS) {
    if (rule.pattern.test(content)) {
      flags.push({
        flagType: rule.type,
        severity: 'warning',
        description: rule.desc,
      })
    }
  }

  // Age-specific checks
  const ageRules = AGE_CONCERNS[ageBracket] || []
  for (const rule of ageRules) {
    if (rule.pattern.test(content)) {
      flags.push({
        flagType: rule.type,
        severity: 'warning',
        description: rule.desc,
      })
    }
  }

  return flags
}

export function calculateCreatorGrade(evaluationScores: number[]): string | null {
  if (evaluationScores.length === 0) return null

  // Weight recent scores more heavily
  const weighted = evaluationScores.map((score, i) => {
    const recencyWeight = 1 + (i / evaluationScores.length) * 0.5
    return { score, weight: recencyWeight }
  })

  const totalWeight = weighted.reduce((s, w) => s + w.weight, 0)
  const weightedAvg = weighted.reduce((s, w) => s + w.score * w.weight, 0) / totalWeight

  if (weightedAvg >= 9.5) return 'A+'
  if (weightedAvg >= 9.0) return 'A'
  if (weightedAvg >= 8.5) return 'A-'
  if (weightedAvg >= 8.0) return 'B+'
  if (weightedAvg >= 7.0) return 'B'
  if (weightedAvg >= 6.5) return 'B-'
  if (weightedAvg >= 6.0) return 'C+'
  if (weightedAvg >= 5.5) return 'C'
  if (weightedAvg >= 5.0) return 'C-'
  if (weightedAvg >= 3.0) return 'D'
  return 'F'
}
