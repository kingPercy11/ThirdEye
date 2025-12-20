# ThirdEye 👁️

A comprehensive website tracking and classification system that monitors your browsing activity, analyzes websites using AI, and provides insightful analytics through an interactive dashboard.

## 🌟 Features

- **🔍 Real-time Activity Tracking** - Chrome extension tracks your browsing activity automatically
- **🤖 AI-Powered Classification** - Uses Google Gemini AI to generate website descriptions
- **📊 Machine Learning Analysis** - Classifies websites into categories using trained ML models
- **📈 Interactive Dashboard** - Beautiful React dashboard with real-time statistics and filters
- **💾 MongoDB Storage** - Persistent storage of all browsing data
- **🎯 Smart Filtering** - Filter by category, search, and time range
- **⚡ Modular Architecture** - Clean, maintainable codebase with separation of concerns

## 🏗️ Architecture

ThirdEye consists of 4 main components:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chrome Extension                          │
│                   (Tracks browsing activity)                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Backend Server (Node.js)                     │
│                  Port 5001 - Stores activity data                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                        MongoDB Database                          │
│                   (Persistent data storage)                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                   ML/Analysis Service (Python)                   │
│        Port 8000 - Classifies & analyzes websites with AI        │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Dashboard (React + Vite)                      │
│              Port 5173 - Visualizes data & analytics             │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
ThirdEye/
├── backend/                 # Node.js/Express API server
│   ├── models/             # Mongoose schemas
│   ├── controllers/        # Request handlers
│   ├── services/           # Business logic
│   ├── routes/             # Route definitions
│   ├── middleware/         # Custom middleware (CORS, logging)
│   └── server.js           # Main entry point
│
├── ml/                      # Python ML/AI service
│   ├── config/             # Database, Gemini API, ML models
│   ├── services/           # Classification, description, activity services
│   ├── routes/             # FastAPI route handlers
│   ├── utils/              # Preprocessing, serializers
│   ├── middleware/         # CORS configuration
│   ├── dataset/            # Training data
│   ├── server.py           # Main FastAPI app
│   ├── analyse.py          # Backward compatibility wrapper
│   └── classification.py   # Model training script
│
├── dashboard/               # React dashboard
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   └── vite.config.js      # Vite configuration
│
├── content/                 # Chrome extension content scripts
├── background/              # Chrome extension background service
├── popup/                   # Chrome extension popup UI
├── assets/                  # Extension icons and assets
└── manifest.json            # Chrome extension manifest
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (running locally or cloud instance)
- **Chrome Browser** (for extension)
- **Google Gemini API Key** (optional, for AI descriptions)

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd ThirdEye
```

#### 2. Setup Backend

```bash
cd backend
npm install

# Create .env file
echo "MONGO_URI=mongodb://localhost:27017/third_eye" > .env
echo "PORT=5001" >> .env
```

#### 3. Setup ML Service

```bash
cd ../ml
pip install -r requirements.txt

# Create .env file
echo "MONGO_URI=mongodb://localhost:27017/third_eye" > .env
echo "GEMINI_API_KEY=your_gemini_api_key_here" >> .env

# Download NLTK data (first time only)
python -c "import nltk; nltk.download('stopwords'); nltk.download('punkt')"
```

#### 4. Setup Dashboard

```bash
cd ../dashboard
npm install
```

#### 5. Setup Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `ThirdEye` folder
5. The extension icon should appear in your toolbar

### Running the Application

You need to run **3 services simultaneously** (use 3 terminal windows):

#### Terminal 1: Backend Server

```bash
cd backend
npm run dev
# Runs on http://localhost:5001
```

#### Terminal 2: ML Analysis Service

```bash
cd ml
uvicorn analyse:app --reload
# Runs on http://localhost:8000
```

Or using npm script from root:

```bash
npm run ml
```

#### Terminal 3: Dashboard

```bash
cd dashboard
npm run dev
# Runs on http://localhost:5173
```

Or using npm script from root:

```bash
npm run dashboard
```

### Quick Start (Alternative)

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run ml

# Terminal 3
npm run dashboard
```

## 🔧 Configuration

### Environment Variables

#### Backend (`.env` in `backend/`)

```env
MONGO_URI=mongodb://localhost:27017/third_eye
PORT=5001
```

#### ML Service (`.env` in `ml/`)

```env
MONGO_URI=mongodb://localhost:27017/third_eye
GEMINI_API_KEY=your_gemini_api_key_here
```

**Note:** Gemini API key is optional. If not provided, the system will use fallback descriptions.

## 📖 Usage

### 1. Browse the Web

- Install and activate the ThirdEye extension
- Browse normally - the extension tracks all visited websites
- Activity data is automatically sent to the backend

### 2. Analyze Your Activity

- Open the dashboard at `http://localhost:5173`
- Click **"Analyze Websites"** to process your browsing data
- The ML service will:
  - Fetch all activities from MongoDB
  - Generate AI descriptions using Gemini
  - Classify websites into categories
  - Calculate confidence scores

### 3. View Analytics

- See total time spent, website count, and category breakdown
- Filter by category or search for specific websites
- View detailed information for each website:
  - URL and title
  - Time spent
  - AI-generated description
  - Category classification
  - Confidence score

## 🎯 API Endpoints

### Backend Server (Port 5001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/activity` | Save browsing activity |
| GET | `/api/activities` | Get all activities |
| GET | `/api/check-mongo` | Check MongoDB connection |
| POST | `/api/test-data` | Add test data (development) |
| GET | `/api/debug` | Debug endpoint |

### ML Service (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service info |
| GET | `/analyze` | Analyze & classify all websites |
| GET | `/analyze?hours=24` | Analyze last 24 hours |
| GET | `/data` | Get all activities |
| GET | `/data/{id}` | Get specific activity |
| GET | `/check_db` | Check database connection |
| GET | `/check-mongo` | Comprehensive MongoDB check |

## 🧪 Development

### Training the ML Model

```bash
cd ml
python classification.py
```

This will:
- Load training data from `dataset/website_classification.csv`
- Train a LinearSVC classifier
- Save `vectorizer.pkl`, `model.pkl`, and `encoder.pkl`

### Testing the Classifier

```bash
cd ml
python test.py
```

### Project Scripts

```bash
# Backend development
npm run dev

# Dashboard development
npm run dashboard

# ML service
npm run ml

# Production backend
npm start
```

## 🛠️ Tech Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM

### ML/AI Service
- **Python** - Runtime
- **FastAPI** - Web framework
- **scikit-learn** - Machine learning
- **Google Gemini AI** - Description generation
- **NLTK** - Text preprocessing
- **PyMongo** - MongoDB client

### Chrome Extension
- **Manifest V3** - Extension platform
- **Service Workers** - Background processing
- **Content Scripts** - Page interaction

## 🔒 Privacy & Security

- All data is stored locally in your MongoDB instance
- No data is sent to external services except Google Gemini (optional)
- The extension only tracks URLs and page titles
- CORS protection on all API endpoints
- No personal information is collected

## 🐛 Troubleshooting

### ML Service Won't Start

```bash
# Ensure all dependencies are installed
pip install -r requirements.txt

# Check if model files exist
ls ml/*.pkl

# If missing, train the model
python ml/classification.py
```

### Backend Connection Issues

```bash
# Check MongoDB is running
mongosh

# Verify connection string in .env
cat backend/.env

# Check backend logs for errors
```

### Dashboard Not Loading Data

1. Ensure backend is running on port 5001
2. Ensure ML service is running on port 8000
3. Check browser console for errors
4. Verify MongoDB has data: `db.activities.find()`

### Extension Not Tracking

1. Reload the extension in `chrome://extensions/`
2. Check extension popup for errors
3. Ensure backend URL in manifest.json is correct
4. Check browser console on visited pages

## 📝 License

ISC

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- Google Gemini AI for website descriptions
- scikit-learn for ML classification
- MongoDB for data storage
- React and Vite for the dashboard

---

**Made with ❤️ for better browsing insights**
