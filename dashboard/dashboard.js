const API_BASE_URL = 'http://localhost:8000'; // ML API
const BACKEND_URL = 'http://localhost:5001'; // Backend API

let allResults = [];

// DOM Elements
const analyzeBtn = document.getElementById('analyzeBtn');
const refreshBtn = document.getElementById('refreshBtn');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const resultsContainer = document.getElementById('resultsContainer');
const emptyState = document.getElementById('emptyState');
const statsGrid = document.getElementById('statsGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const timeLimitSelect = document.getElementById('timeLimitSelect');

// Event Listeners
analyzeBtn.addEventListener('click', analyzeWebsites);
refreshBtn.addEventListener('click', checkDatabase);
searchInput.addEventListener('input', filterResults);
categoryFilter.addEventListener('change', filterResults);

// Initialize
checkDatabase();

async function analyzeWebsites() {
    setLoading(true);
    const hours = timeLimitSelect.value;
    const timeText = hours ? `past ${getTimeText(hours)}` : 'all time';
    showStatus(`Analyzing websites from ${timeText}...`, 'info');
    
    try {
        const url = hours 
            ? `${API_BASE_URL}/analyze?hours=${hours}`
            : `${API_BASE_URL}/analyze`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        allResults = data.results || [];
        displayResults(allResults);
        updateStats(allResults);
        populateCategoryFilter(allResults);
        showStatus(`✓ Successfully analyzed ${data.total} websites from ${timeText}`, 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showStatus(`✗ Error: ${error.message}`, 'error');
    } finally {
        setLoading(false);
    }
}

function getTimeText(hours) {
    hours = parseInt(hours);
    if (hours === 1) return '1 hour';
    if (hours === 24) return '24 hours';
    if (hours === 168) return 'week';
    if (hours < 24) return `${hours} hours`;
    return `${hours / 24} days`;
}

async function checkDatabase() {
    try {
        const response = await fetch(`${API_BASE_URL}/check_db`);
        const data = await response.json();
        
        if (data.status === 'Connected to MongoDB') {
            showStatus(`✓ Connected - ${data.total_websites} websites in database`, 'success');
        }
    } catch (error) {
        showStatus('✗ Cannot connect to API', 'error');
    }
}

function displayResults(results) {
    if (!results || results.length === 0) {
        resultsContainer.style.display = 'none';
        statsGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    resultsContainer.style.display = 'block';
    statsGrid.style.display = 'grid';
    
    resultsDiv.innerHTML = results.map(result => `
        <div class="result-card">
            <div class="result-header">
                <div class="result-title">${escapeHtml(result.title || 'Untitled')}</div>
                <span class="result-category category-${result.category.toLowerCase().replace(/\s+/g, '-')}">
                    ${result.category}
                </span>
            </div>
            <div class="result-url">🔗 ${escapeHtml(result.url)}</div>
            <div class="result-description">"${escapeHtml(result.description)}"</div>
            <div class="result-footer">
                <span>User: ${result.userId}</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span>${result.confidence}%</span>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${result.confidence}%"></div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function updateStats(results) {
    const total = results.length;
    const avgConfidence = (results.reduce((sum, r) => sum + r.confidence, 0) / total).toFixed(1);
    
    const categoryCounts = results.reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
    }, {});
    
    const topCategory = Object.keys(categoryCounts).reduce((a, b) => 
        categoryCounts[a] > categoryCounts[b] ? a : b
    );
    
    document.getElementById('totalWebsites').textContent = total;
    document.getElementById('avgConfidence').textContent = `${avgConfidence}%`;
    document.getElementById('topCategory').textContent = topCategory;
}

function populateCategoryFilter(results) {
    const categories = [...new Set(results.map(r => r.category))].sort();
    categoryFilter.innerHTML = '<option value="">All Categories</option>' + 
        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function filterResults() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    
    const filtered = allResults.filter(result => {
        const matchesSearch = !searchTerm || 
            result.url.toLowerCase().includes(searchTerm) ||
            result.title.toLowerCase().includes(searchTerm) ||
            result.description.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !selectedCategory || result.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });
    
    displayResults(filtered);
}

function setLoading(isLoading) {
    analyzeBtn.disabled = isLoading;
    const btnText = analyzeBtn.querySelector('.btn-text');
    const loader = analyzeBtn.querySelector('.loader');
    
    if (isLoading) {
        btnText.textContent = 'Analyzing...';
        loader.style.display = 'block';
    } else {
        btnText.textContent = 'Analyze All Websites';
        loader.style.display = 'none';
    }
}

function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
