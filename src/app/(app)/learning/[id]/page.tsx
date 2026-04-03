import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DOMAINS } from '@/lib/scoring'
import ArticleDetail from './ArticleDetail'

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) redirect('/login')

  const { id } = await params
  const article = await prisma.article.findUnique({ where: { id } })
  if (!article) notFound()

  return (
    <ArticleDetail
      article={JSON.parse(JSON.stringify(article))}
      domains={DOMAINS.map((d) => ({ key: d.key, label: d.label, icon: d.icon, color: d.color }))}
    />
  )
}
