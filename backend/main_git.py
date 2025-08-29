from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from textblob import TextBlob
import logging
import os
import json
from datetime import datetime

# ---------------- Logging ----------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------- FastAPI App ----------------
app = FastAPI()

# Allow CORS for all origins (you can restrict later if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Google Sheets Auth ----------------
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]

try:
    # ✅ Load service account JSON from Render env variable
    service_account_info = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"])
    creds = ServiceAccountCredentials.from_json_keyfile_dict(service_account_info, scope)
    client = gspread.authorize(creds)
    logger.info("✅ Google Sheets authentication successful")
except Exception as e:
    logger.error(f"❌ Failed to authenticate with Google Sheets: {e}")
    raise

# ---------------- Sentiment Analyzers ----------------
vader_analyzer = SentimentIntensityAnalyzer()

def analyze_sentiment(text: str):
    """Analyze sentiment using VADER + TextBlob"""
    if not text or not isinstance(text, str):
        return {"vader": 0.0, "textblob": 0.0}

    # Vader score
    vader_score = vader_analyzer.polarity_scores(text)["compound"]

    # TextBlob polarity
    blob_score = TextBlob(text).sentiment.polarity

    return {"vader": vader_score, "textblob": blob_score}

# ---------------- Routes ----------------
@app.get("/")
def root():
    return {"status": "ok", "message": "🚀 FastAPI is running on Render!"}

@app.get("/analyze")
def analyze(text: str):
    """Run sentiment analysis on input text"""
    try:
        result = analyze_sentiment(text)
        return {
            "text": text,
            "sentiment": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {e}")
        raise HTTPException(status_code=500, detail="Sentiment analysis failed")

@app.get("/sheet-data")
def sheet_data(sheet_name: str):
    """Fetch all rows from a given Google Sheet"""
    try:
        sheet = client.open(sheet_name).sheet1
        data = sheet.get_all_records()
        df = pd.DataFrame(data)
        return {"rows": len(df), "data": df.to_dict(orient="records")}
    except Exception as e:
        logger.error(f"Error reading Google Sheet: {e}")
        raise HTTPException(status_code=500, detail="Failed to read sheet")

# ---------------- Render Entry Point ----------------
# Render will run using: gunicorn -k uvicorn.workers.UvicornWorker -w 4 main_new:app

