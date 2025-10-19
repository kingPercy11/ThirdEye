import React from 'react'

function Controls({ onAnalyze, onRefresh, loading }) {
  return (
    <div className="flex flex-wrap gap-4 mb-8">
      <button
        onClick={onAnalyze}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-white text-primary font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
        <span>{loading ? 'Analyzing...' : 'Analyze All Websites'}</span>
      </button>

      <button
        onClick={onRefresh}
        className="px-6 py-3 bg-white/20 text-white font-semibold rounded-lg backdrop-blur-sm hover:bg-white/30 transition-all"
      >
        Refresh Data
      </button>
    </div>
  )
}

export default Controls
