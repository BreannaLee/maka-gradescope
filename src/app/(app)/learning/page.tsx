import { prisma } from '@/lib/prisma'
import { DOMAINS } from '@/lib/scoring'
import LearningCenter from './LearningCenter'

export default async function LearningCenterPage() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <LearningCenter
      articles={JSON.parse(JSON.stringify(articles))}
      domains={DOMAINS.map((d) => ({ key: d.key, label: d.label, icon: d.icon }))}
    />
  )
}
