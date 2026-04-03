import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { hashSync } from 'bcryptjs'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename2 = fileURLToPath(import.meta.url)
const __dirname2 = path.dirname(__filename2)
const dbPath = path.resolve(__dirname2, '..', 'dev.db')

const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  // Clear existing data
  await prisma.subIndicatorScore.deleteMany()
  await prisma.domainScore.deleteMany()
  await prisma.timestampedFeedback.deleteMany()
  await prisma.evaluation.deleteMany()
  await prisma.chatMessage.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.safetyFlag.deleteMany()
  await prisma.stage.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.article.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()

  // Create demo users
  const creator = await prisma.user.create({
    data: {
      email: 'creator@maka.demo',
      passwordHash: hashSync('demo1234', 10),
      role: 'creator',
      name: 'Alex Rivera',
      bio: 'Children\'s content creator specializing in educational music videos for ages 2-6.',
      status: 'active',
      creatorGrade: 'B+',
      approvedCount: 3,
    },
  })

  const editor1 = await prisma.user.create({
    data: {
      email: 'editor@maka.demo',
      passwordHash: hashSync('demo1234', 10),
      role: 'editorial_t1',
      name: 'Jordan Chen',
      bio: 'Tier 1 editorial screener',
      status: 'active',
    },
  })

  const editor2 = await prisma.user.create({
    data: {
      email: 'senior@maka.demo',
      passwordHash: hashSync('demo1234', 10),
      role: 'editorial_t2',
      name: 'Sam Okafor',
      bio: 'Senior reviewer and editorial lead',
      status: 'active',
    },
  })

  // Create sample projects
  const project1 = await prisma.project.create({
    data: {
      creatorId: creator.id,
      title: "Benny's Bakery Adventure",
      seriesName: 'Benny the Bear',
      season: 1,
      episode: 1,
      ageBracket: '2-4',
      estimatedDuration: '8 min',
      currentStage: 'script',
      status: 'in_progress',
    },
  })

  // Stages for project 1
  const ideaStage1 = await prisma.stage.create({
    data: {
      projectId: project1.id,
      stageType: 'idea',
      status: 'completed',
      version: 1,
      chatbotSummary: 'Benny the Bear learns to bake with Grandma, exploring patience, measurement, and sharing. Target: ages 2-4. Focus on sensory exploration and counting.',
    },
  })

  await prisma.stage.create({
    data: {
      projectId: project1.id,
      stageType: 'script',
      status: 'draft',
      version: 1,
    },
  })

  await prisma.stage.create({
    data: {
      projectId: project1.id,
      stageType: 'video',
      status: 'not_started',
      version: 1,
    },
  })

  // Evaluation for idea stage
  const eval1 = await prisma.evaluation.create({
    data: {
      stageId: ideaStage1.id,
      evaluationType: 'auto',
      overallScore: 7.8,
      overallGrade: 'B',
      summary: 'Strong concept with good developmental breadth. The bakery setting naturally supports academic (counting, measuring) and social (sharing, patience) domains. Consider adding more movement prompts and body awareness cues.',
      suggestedSteps: JSON.stringify([
        'Add a scene where Benny and Grandma dance while waiting for the bread to bake',
        'Include a moment where Benny names his feelings when the first loaf doesn\'t rise',
        'Add a co-viewing prompt asking kids to pretend to knead dough along with Benny',
      ]),
    },
  })

  // Domain scores for eval1
  const domainData = [
    { domain: 'character', score: 8.2, grade: 'B+', benchmark: 7.8, feedback: 'Strong character development with Benny showing persistence when the bread doesn\'t rise the first time.' },
    { domain: 'connection', score: 8.5, grade: 'A-', benchmark: 7.2, feedback: 'Excellent caregiver bonding through the Benny-Grandma relationship. Great empathy modeling.' },
    { domain: 'play', score: 7.8, grade: 'B', benchmark: 7.5, feedback: 'Good sensory exploration with baking textures and smells. Could add more imaginative play.' },
    { domain: 'thinking', score: 7.5, grade: 'B', benchmark: 7.0, feedback: 'Good problem-solving when the first loaf fails. Consider adding more "why" questions.' },
    { domain: 'social', score: 8.0, grade: 'B+', benchmark: 7.3, feedback: 'Strong sharing and cooperation themes. Nice turn-taking in the kitchen.' },
    { domain: 'physical', score: 6.2, grade: 'C+', benchmark: 6.8, feedback: 'Limited movement integration. Add kneading movements, dance break, or stretching.' },
    { domain: 'academic', score: 8.4, grade: 'B+', benchmark: 7.1, feedback: 'Excellent numeracy with measuring and counting. Good vocabulary with baking terms.' },
  ]

  for (const d of domainData) {
    await prisma.domainScore.create({
      data: {
        evaluationId: eval1.id,
        ...d,
      },
    })
  }

  // Chat messages for project 1
  await prisma.chatMessage.createMany({
    data: [
      { projectId: project1.id, stageType: 'idea', role: 'assistant', content: "Hi! I'm Maka — your creative partner. Let's brainstorm your first idea. What age group are you creating for?" },
      { projectId: project1.id, stageType: 'idea', role: 'user', content: "I want to make a show about a bear named Benny who bakes with his grandma. For ages 2-4." },
      { projectId: project1.id, stageType: 'idea', role: 'assistant', content: "I love that! A bakery setting is wonderful for this age group — it naturally supports so many developmental domains. The Benny-Grandma relationship gives us a strong Connection anchor. What if we explored Benny learning patience while waiting for bread to rise? That could build Character (persistence) and Thinking (understanding cause and effect). What's the main adventure or challenge in this episode?" },
      { projectId: project1.id, stageType: 'idea', role: 'user', content: "Benny tries to bake his own loaf for the first time but it doesn't rise. Grandma helps him figure out what went wrong and they try again together." },
      { projectId: project1.id, stageType: 'idea', role: 'assistant', content: "That's a great narrative arc! The failure-and-retry structure is perfect for modeling persistence and grit. Here's what I'm seeing:\n\n• **Character**: Benny tries again after failure — great persistence modeling\n• **Connection**: Grandma as supportive guide, not taking over\n• **Academic**: Measuring ingredients (numeracy), naming ingredients (vocabulary)\n• **Thinking**: Figuring out what went wrong (problem-solving)\n• **Social**: Working together, sharing the finished bread\n\nWhat if we also added a sensory moment where Benny describes the texture of the dough? That could boost the **Play** domain with sensory exploration. Want me to do a quick developmental check on what we have so far?" },
    ],
  })

  // Project 2 - more advanced
  const project2 = await prisma.project.create({
    data: {
      creatorId: creator.id,
      title: 'Ocean Friends: Coral\'s Big Discovery',
      seriesName: 'Ocean Friends',
      season: 1,
      episode: 1,
      ageBracket: '4-6',
      estimatedDuration: '12 min',
      currentStage: 'idea',
      status: 'draft',
    },
  })

  await prisma.stage.create({
    data: {
      projectId: project2.id,
      stageType: 'idea',
      status: 'draft',
      version: 1,
    },
  })
  await prisma.stage.create({
    data: { projectId: project2.id, stageType: 'script', status: 'not_started', version: 1 },
  })
  await prisma.stage.create({
    data: { projectId: project2.id, stageType: 'video', status: 'not_started', version: 1 },
  })

  // Project 3 - approved
  const project3 = await prisma.project.create({
    data: {
      creatorId: creator.id,
      title: 'Melody\'s Music Garden',
      seriesName: 'Melody & Friends',
      season: 1,
      episode: 1,
      ageBracket: '0-2',
      estimatedDuration: '5 min',
      currentStage: 'video',
      status: 'approved',
    },
  })

  const ideaStage3 = await prisma.stage.create({
    data: { projectId: project3.id, stageType: 'idea', status: 'completed', version: 1 },
  })
  const scriptStage3 = await prisma.stage.create({
    data: { projectId: project3.id, stageType: 'script', status: 'completed', version: 1 },
  })
  const videoStage3 = await prisma.stage.create({
    data: { projectId: project3.id, stageType: 'video', status: 'completed', version: 1 },
  })

  const eval3 = await prisma.evaluation.create({
    data: {
      stageId: videoStage3.id,
      evaluationType: 'editorial',
      evaluatorId: editor1.id,
      overallScore: 8.6,
      overallGrade: 'A-',
      summary: 'Beautifully produced content with excellent developmental alignment across all domains. The musical elements naturally support academic, physical, and play domains.',
      suggestedSteps: JSON.stringify([
        'Consider adding more diverse family representation in future episodes',
        'The pacing is perfect for the 0-2 bracket — maintain this tempo',
      ]),
    },
  })

  // Project 4 - submitted for review
  const project4 = await prisma.project.create({
    data: {
      creatorId: creator.id,
      title: 'Counting with Cleo',
      seriesName: 'Cleo the Cat',
      season: 1,
      episode: 1,
      ageBracket: '2-4',
      estimatedDuration: '7 min',
      currentStage: 'idea',
      status: 'submitted',
    },
  })

  const ideaStage4 = await prisma.stage.create({
    data: {
      projectId: project4.id,
      stageType: 'idea',
      status: 'submitted',
      version: 1,
      submittedAt: new Date(),
      chatbotSummary: 'Cleo the Cat explores her garden, counting butterflies, flowers, and ladybugs. Interactive counting prompts for viewers.',
    },
  })
  await prisma.stage.create({
    data: { projectId: project4.id, stageType: 'script', status: 'not_started', version: 1 },
  })
  await prisma.stage.create({
    data: { projectId: project4.id, stageType: 'video', status: 'not_started', version: 1 },
  })

  const eval4 = await prisma.evaluation.create({
    data: {
      stageId: ideaStage4.id,
      evaluationType: 'auto',
      overallScore: 7.1,
      overallGrade: 'B',
      summary: 'Solid numeracy concept with good viewer interaction. Could strengthen social and character domains.',
      suggestedSteps: JSON.stringify([
        'Add a friend character for Cleo to encourage social domain',
        'Include a moment where Cleo makes a counting mistake and self-corrects (character/grit)',
        'Add a movement prompt — have viewers hop like the butterflies',
      ]),
    },
  })

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: creator.id,
        type: 'eval_complete',
        title: 'Evaluation Complete',
        message: 'Your idea for "Benny\'s Bakery Adventure" has been evaluated. Score: B',
        link: `/projects/${project1.id}`,
        read: true,
      },
      {
        userId: creator.id,
        type: 'review_complete',
        title: 'Review Complete',
        message: '"Melody\'s Music Garden" has been approved! Score: A-',
        link: `/projects/${project3.id}`,
        read: true,
      },
      {
        userId: creator.id,
        type: 'eval_complete',
        title: 'Evaluation Complete',
        message: 'Your idea for "Counting with Cleo" has been evaluated. Score: B',
        link: `/projects/${project4.id}`,
        read: false,
      },
    ],
  })

  // Learning center articles with real content
  await prisma.article.createMany({
    data: [
      {
        title: 'Understanding Maka\'s 7 Developmental Domains',
        content: `## Overview\n\nMaka evaluates children's content across seven developmental domains, each grounded in early childhood development research. Understanding these domains is the first step to creating content that truly supports young learners.\n\n## The 7 Domains\n\n### Character\nCharacter development focuses on building internal qualities like persistence, honesty, kindness, and courage. Content should model these traits through characters who face challenges and respond with integrity. For ages 0-2, this means simple cause-and-effect moments. For ages 4-6, characters can navigate more complex moral decisions.\n\n### Connection\nConnection measures how well content supports caregiver bonding, empathy modeling, family representation, and co-viewing moments. The strongest content creates natural pause points where a caregiver and child can interact together.\n\n### Play\nPlay encompasses imaginative play, sensory exploration, humor, and open-ended activities. Content that invites children to pretend, create, and explore scores highest in this domain.\n\n### Thinking\nThinking covers problem-solving, curiosity, executive function, and critical thinking. Content should pose age-appropriate challenges and model "thinking out loud" strategies.\n\n### Social\nSocial development includes conflict resolution, reading social cues, inclusivity, and cooperation. Diverse characters working together and resolving disagreements constructively are hallmarks of strong social content.\n\n### Physical\nPhysical development tracks movement integration, body awareness, health messaging, and movement prompts. The best content invites children to move, dance, or mimic physical actions.\n\n### Academic\nAcademic readiness covers language and literacy, numeracy, scientific thinking, and vocabulary expansion. Academic concepts should be woven naturally into the narrative rather than presented as explicit lessons.\n\n## How Scoring Works\n\nEach domain is scored from 0-10 based on four sub-indicators. Scores are weighted by stage — for example, Physical domain carries less weight at the Idea stage since movement details are typically refined during Script and Video stages.\n\n> Tip: You don't need to score perfectly in every domain. Focus on 3-4 domains that naturally align with your story, and ensure the others are at least addressed.`,
        contentType: 'article',
        domains: JSON.stringify(['character', 'connection', 'play', 'thinking', 'social', 'physical', 'academic']),
        published: true,
      },
      {
        title: 'Writing for Ages 0-2: Pacing and Repetition',
        content: `## Why Pacing Matters\n\nFor children ages 0-2, the world is a sensory experience. They're still developing object permanence, language recognition, and attention spans measured in seconds, not minutes. Your content's pacing is not just a stylistic choice — it's a developmental necessity.\n\n## Key Principles\n\n### Keep It Slow\nScenes should last 8-15 seconds minimum. Rapid cuts disorient babies and toddlers. Let each visual breathe. A flower blooming, a character waving — give the child time to process what they see.\n\n### Repetition Is Your Friend\nRepetition builds neural pathways. When a character says "Hello!" three times with the same gesture, a 14-month-old starts to anticipate it. That anticipation is learning.\n\n### Simple Vocabulary, Clear Pronunciation\nUse 1-2 syllable words. Speak slowly. Pause between phrases. Research shows that infant-directed speech with exaggerated prosody supports language acquisition.\n\n## Practical Tips\n\n- Limit episodes to 3-5 minutes maximum\n- Use no more than 2-3 characters per episode\n- Repeat key phrases at least 3 times\n- Include 2-3 second pauses after questions (even if rhetorical)\n- Favor warm, saturated colors over muted palettes\n- Use gentle, predictable music with simple melodies\n\n> Remember: For this age group, less is genuinely more. A 3-minute episode with 5 words repeated beautifully will outperform a 10-minute episode packed with content.`,
        contentType: 'article',
        domains: JSON.stringify(['academic', 'play']),
        published: true,
      },
      {
        title: 'Gold Standard Example: "Luna\'s Lullaby"',
        content: `## About This Example\n\n"Luna's Lullaby" is a 4-minute episode from the Dreamtime series that scored A- across all developmental domains. It demonstrates how a simple concept — a parent singing a child to sleep — can hit every domain when crafted intentionally.\n\n## What Makes It Work\n\n### Connection (Score: 9.2)\nThe entire episode is a co-viewing experience. Luna and her mother sing together, with natural pauses where the viewer can join in. The physical closeness (rocking, holding) models caregiver bonding.\n\n### Play (Score: 8.8)\nThe lullaby incorporates imaginative elements — Luna imagines floating through clouds, dancing with stars. Sensory details are rich: "soft like a blanket," "warm like sunshine."\n\n### Physical (Score: 8.5)\nGentle movement prompts are embedded naturally: rocking side to side, stretching arms like a star, curling up small like a seed. These don't interrupt the story flow.\n\n### Character (Score: 8.0)\nLuna shows courage when the room goes dark ("I'm not scared, I have my song") and kindness when she sings to her stuffed bear first.\n\n## Key Takeaways\n\n- A single setting (bedroom) can support all 7 domains\n- Movement prompts work best when they match the emotional tone\n- Co-viewing moments feel natural when characters address the camera warmly\n- Simplicity and intentionality beat complexity every time`,
        contentType: 'example',
        domains: JSON.stringify(['connection', 'play', 'physical']),
        published: true,
      },
      {
        title: 'Integrating Movement Prompts in Your Content',
        content: `## Why Movement Matters\n\nChildren ages 0-6 learn through their bodies. Movement isn't just physical development — it supports cognitive function, emotional regulation, and social skills. Research shows that children who move during learning retain 40% more information.\n\n## Types of Movement Prompts\n\n### Mirror Movements\nA character performs an action and invites the viewer to copy: "Can you clap your hands like me?" These work best for ages 0-3 and build body awareness.\n\n### Narrative Movements\nMovement is woven into the story: "Let's tiptoe past the sleeping dragon!" The child moves because they're part of the adventure, not because they were told to exercise.\n\n### Transition Movements\nUse movement to bridge scenes: "Let's wiggle to the garden!" This makes transitions feel purposeful rather than abrupt.\n\n### Freeze & Feel\nAfter active movement, pause for body awareness: "Now freeze! Can you feel your heart beating fast?" This builds interoception — awareness of internal body signals.\n\n## Common Mistakes\n\n- Movements that are too complex for the target age\n- Too many movement prompts (2-3 per 5-minute episode is ideal)\n- Movement that interrupts emotional moments\n- Forgetting to model the movement on screen\n\n## Placement Tips\n\n- Place the first movement prompt within the first 90 seconds\n- Space prompts at least 60 seconds apart\n- End with a calming movement (deep breath, gentle sway)\n- Ensure movements are safe for small spaces — not all children watch in large rooms`,
        contentType: 'video',
        domains: JSON.stringify(['physical']),
        published: true,
      },
      {
        title: 'Character Development for Early Learners',
        content: `## Characters They Can Grow With\n\nFor young children, characters aren't just entertainment — they're role models. A well-developed character teaches children how to navigate emotions, relationships, and challenges in the real world.\n\n## Age-Appropriate Character Traits\n\n### Ages 0-2: Recognition & Comfort\nCharacters should be simple, consistent, and warm. A bear who always waves hello. A sun that always smiles. Predictability builds trust.\n\n### Ages 2-4: Modeling Basic Virtues\nCharacters can now demonstrate simple virtues: sharing a toy, saying sorry, trying again after falling down. Keep motivations simple and visible — "Benny shared because he saw his friend was sad."\n\n### Ages 4-6: Internal Conflict\nCharacters can experience competing desires: wanting to play but needing to help. This models executive function and introduces the concept that doing the right thing can be hard but worthwhile.\n\n## The "Show, Don't Tell" Principle\n\nDon't have a narrator say "Benny was brave." Show Benny's hands shaking, show him taking a deep breath, show him stepping forward. Children learn from watching behavior, not from hearing labels.\n\n## Social Domain Intersection\n\nCharacter development naturally supports the Social domain. When one character shows kindness to another, you're simultaneously building Character (the trait) and Social (the interaction). Look for these intersections — they're where your score multiplies.\n\n## Common Pitfalls\n\n- Characters who are perfect from the start (no growth arc)\n- Moral lessons delivered as lectures rather than story\n- Punishment-based consequences instead of natural consequences\n- Characters whose traits change episode to episode without explanation`,
        contentType: 'article',
        domains: JSON.stringify(['character', 'social']),
        published: true,
      },
      {
        title: 'Building Empathy Through Storytelling',
        content: `## The Empathy Pipeline\n\nEmpathy isn't a single skill — it's a developmental pipeline. For children ages 0-6, there are three stages: emotional contagion (ages 0-1), emotional recognition (ages 1-3), and perspective-taking (ages 3-6). Your content should target the appropriate stage.\n\n## Emotional Contagion (0-1)\nBabies mirror emotions they see. A smiling face on screen triggers a smile. A crying character triggers distress. At this age, keep emotional displays simple and predominantly positive.\n\n## Emotional Recognition (1-3)\nToddlers begin naming feelings: happy, sad, mad, scared. Content should explicitly name emotions: "Look at Benny's face — he's feeling sad." Pause after naming the emotion to let the child process.\n\n## Perspective-Taking (3-6)\nOlder preschoolers can begin to understand that others feel differently than they do. Content can model this: "Benny is happy, but look — his friend feels left out. What do you think his friend is feeling?"\n\n## Techniques That Work\n\n### The Feeling Check-In\nCharacters pause mid-story to acknowledge how they feel. "I feel frustrated because my tower keeps falling." This normalizes emotional awareness.\n\n### The Empathy Bridge\nOne character notices another's emotion and responds: "You look sad. Do you want a hug?" This models the full empathy cycle: notice, name, respond.\n\n### The Viewer Prompt\nDirect address works beautifully for empathy: "How do you think Luna is feeling right now?" Pause for 3 seconds. Even if the child can't answer verbally, the cognitive work is happening.\n\n## Connection to the Connection Domain\n\nEmpathy content scores highest in the Connection domain (empathy modeling sub-indicator) but also supports Social (reading social cues) and Character (kindness and compassion). A single well-crafted empathy scene can boost three domains simultaneously.`,
        contentType: 'video',
        domains: JSON.stringify(['connection', 'social']),
        published: true,
      },
    ],
  })

  console.log('Seed data created successfully!')
  console.log(`Creator: creator@maka.demo / demo1234`)
  console.log(`Editor T1: editor@maka.demo / demo1234`)
  console.log(`Editor T2: senior@maka.demo / demo1234`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
