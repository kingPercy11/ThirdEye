import React from 'react'

function Filters({ searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, categories }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Classification Results</h2>
      
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by URL or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors min-w-[200px]"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default Filters
