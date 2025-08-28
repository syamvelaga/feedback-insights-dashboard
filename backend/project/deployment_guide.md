# Python API Deployment Guide

## Local Development
1. Install dependencies:
   \`\`\`bash
   pip install -r requirements_api.txt
   \`\`\`

2. Run the API:
   \`\`\`bash
   python api_server.py
   \`\`\`

3. API will be available at: `http://localhost:5000`

## API Endpoints

### POST /api/process-sheets
Process Google Sheets data and return sentiment analysis

**Request Body:**
\`\`\`json
{
  "url": "https://script.googleusercontent.com/macros/echo?user_content_key=..."
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "total_entries": 10,
  "processed_data": [...],
  "negative_entries": [...],
  "sentiment_distribution": {...},
  "instructor_stats": {...}
}
\`\`\`

### GET /api/health
Health check endpoint

## Deployment Options

### 1. Heroku
1. Create `Procfile`:
   \`\`\`
   web: python api_server.py
   \`\`\`
2. Deploy to Heroku

### 2. Railway
1. Connect your GitHub repo
2. Railway will auto-detect Python and deploy

### 3. Render
1. Connect GitHub repo
2. Set build command: `pip install -r requirements_api.txt`
3. Set start command: `python api_server.py`

### 4. PythonAnywhere
1. Upload files to PythonAnywhere
2. Configure WSGI file
3. Set up web app

## Environment Variables
- `FLASK_ENV=production` (for production)
- `PORT=5000` (or your preferred port)

## Usage in Frontend
\`\`\`javascript
const response = await fetch('YOUR_API_URL/api/process-sheets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'YOUR_GOOGLE_SHEETS_URL'
  })
});

const data = await response.json();
console.log(data);
