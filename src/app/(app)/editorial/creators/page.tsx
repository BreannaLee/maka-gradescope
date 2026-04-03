import { prisma } from '@/lib/prisma'

export default async function CreatorsPage() {
  const creators = await prisma.user.findMany({
    where: { role: 'creator' },
    include: {
      projects: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-maka-dark mb-2">Creators</h1>
      <p className="text-sm text-gray-500 mb-6">{creators.length} creators</p>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Name</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Email</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Grade</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Projects</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {creators.map((creator) => (
              <tr key={creator.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 text-sm font-medium text-maka-dark">{creator.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{creator.email}</td>
                <td className="px-4 py-3">
                  {creator.creatorGrade ? (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-maka-cyan/20 text-cyan-700">
                      {creator.creatorGrade}
                    </span>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{creator.projects.length}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    creator.status === 'active' ? 'bg-maka-green/20 text-green-700' :
                    creator.status === 'deactivated' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {creator.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
