import React from 'react'

function Stats({ websites }) {
  const total = websites.length
  const avgConfidence = (
    websites.reduce((sum, w) => sum + w.confidence, 0) / total
  ).toFixed(1)

  const categoryCounts = websites.reduce((acc, w) => {
    acc[w.category] = (acc[w.category] || 0) + 1
    return acc
  }, {})

  const topCategory = Object.keys(categoryCounts).reduce((a, b) =>
    categoryCounts[a] > categoryCounts[b] ? a : b
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard label="Total Websites" value={total} />
      <StatCard label="Avg Confidence" value={`${avgConfidence}%`} />
      <StatCard label="Top Category" value={topCategory} />
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg text-center">
      <div className="text-4xl font-bold text-primary mb-2">{value}</div>
      <div className="text-gray-600 uppercase text-sm tracking-wide">{label}</div>
    </div>
  )
}

export default Stats
