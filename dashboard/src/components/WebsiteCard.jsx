import React from 'react'

const categoryColors = {
  Shopping: 'bg-yellow-100 text-yellow-800',
  News: 'bg-blue-100 text-blue-800',
  Education: 'bg-green-100 text-green-800',
  Health: 'bg-pink-100 text-pink-800',
  Sports: 'bg-orange-100 text-orange-800',
  Travel: 'bg-indigo-100 text-indigo-800',
  default: 'bg-gray-100 text-gray-800'
}

function WebsiteCard({ website }) {
  const categoryColor = categoryColors[website.category] || categoryColors.default

  return (
    <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-primary hover:shadow-xl hover:translate-x-1 transition-all duration-200">
      <div className="flex justify-between items-start mb-4 gap-4 flex-wrap">
        <h3 className="text-xl font-semibold text-gray-800 flex-1">
          {website.title || 'Untitled'}
        </h3>
        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap ${categoryColor}`}>
          {website.category}
        </span>
      </div>

      <div className="text-gray-600 text-sm mb-3 break-all">
        🔗 {website.url}
      </div>

      <p className="text-gray-700 italic mb-4">
        "{website.description}"
      </p>

      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>User: {website.userId}</span>
        
        <div className="flex items-center gap-3">
          <span className="font-medium">{website.confidence}%</span>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-primary transition-all duration-300"
              style={{ width: `${website.confidence}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default WebsiteCard
