import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Header from './components/Header'
import Stats from './components/Stats'
import Controls from './components/Controls'
import Filters from './components/Filters'
import WebsiteGrid from './components/WebsiteGrid'
import Toast from './components/Toast'

const API_BASE_URL = 'http://localhost:8000'

function App() {
  const [websites, setWebsites] = useState([])
  const [filteredWebsites, setFilteredWebsites] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  const [dbStatus, setDbStatus] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    checkDatabase()
  }, [])

  useEffect(() => {
    filterWebsites()
  }, [websites, searchTerm, selectedCategory])

  const checkDatabase = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/check_db`)
      setDbStatus(response.data)
      showToast(`✓ Connected - ${response.data.total_websites} websites in database`, 'success')
    } catch (error) {
      showToast('✗ Cannot connect to API', 'error')
    }
  }

  const analyzeWebsites = async () => {
    setLoading(true)
    showToast('Analyzing websites...', 'info')
    
    try {
      const response = await axios.get(`${API_BASE_URL}/analyze`)
      setWebsites(response.data.results || [])
      showToast(`✓ Successfully analyzed ${response.data.total} websites`, 'success')
    } catch (error) {
      showToast(`✗ Error: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const filterWebsites = () => {
    let filtered = websites

    if (searchTerm) {
      filtered = filtered.filter(site =>
        site.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter(site => site.category === selectedCategory)
    }

    setFilteredWebsites(filtered)
  }

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 5000)
  }

  const categories = [...new Set(websites.map(w => w.category))].sort()

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <Controls 
          onAnalyze={analyzeWebsites}
          onRefresh={checkDatabase}
          loading={loading}
        />

        {toast.show && <Toast message={toast.message} type={toast.type} />}

        {websites.length > 0 && (
          <>
            <Stats websites={websites} />
            
            <Filters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
            />

            <WebsiteGrid websites={filteredWebsites} />
          </>
        )}

        {websites.length === 0 && !loading && (
          <div className="text-center py-20 text-white">
            <div className="text-6xl mb-6">📊</div>
            <h3 className="text-2xl font-semibold mb-3">No Data Yet</h3>
            <p className="text-lg opacity-90">Click "Analyze All Websites" to start classification</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
