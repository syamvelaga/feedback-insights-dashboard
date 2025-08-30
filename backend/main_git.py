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
app = FastAPI(title="Feedback Insights API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 👈 restrict later if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Checkpoint System ----------------
CHECKPOINT_DIR = "checkpoints"
os.makedirs(CHECKPOINT_DIR, exist_ok=True)

def get_checkpoint_filename(sheet_id: str) -> str:
    return os.path.join(CHECKPOINT_DIR, f"checkpoint_{sheet_id}.json")

def load_checkpoint(sheet_id: str):
    """Load cached data from JSON file"""
    try:
        file_path = get_checkpoint_filename(sheet_id)
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                logger.info(f"Loaded checkpoint for sheet {sheet_id}")
                return data
    except Exception as e:
        logger.error(f"Error loading checkpoint for {sheet_id}: {str(e)}")
    return None

def save_checkpoint(sheet_id: str, data: dict):
    """Save processed data to JSON cache"""
    try:
        file_path = get_checkpoint_filename(sheet_id)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.info(f"Saved checkpoint for sheet {sheet_id}")
    except Exception as e:
        logger.error(f"Error saving checkpoint for {sheet_id}: {str(e)}")

def is_checkpoint_valid(sheet_id: str, max_age_hours: int = 24) -> bool:
    """Check if checkpoint is still valid (not too old)"""
    try:
        file_path = get_checkpoint_filename(sheet_id)
        if os.path.exists(file_path):
            file_time = os.path.getmtime(file_path)
            current_time = datetime.now().timestamp()
            age_hours = (current_time - file_time) / 3600
            return age_hours < max_age_hours
    except Exception as e:
        logger.error(f"Error checking checkpoint validity for {sheet_id}: {str(e)}")
    return False

# ---------------- Auth Setup ----------------
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
service_account_info = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"])
creds = ServiceAccountCredentials.from_json_keyfile_dict(service_account_info, scope)
client = gspread.authorize(creds)
# creds = ServiceAccountCredentials.from_json_keyfile_name("service_account.json", scope)
# client = gspread.authorize(creds)

# ---------------- Sentiment Helpers ----------------
analyzer = SentimentIntensityAnalyzer()

def analyze_sentiment(text: str):
    if not text or not str(text).strip():
        return {"sentiment": "neutral", "confidence": 0.0, "combined_score": 0.0}

    vs = analyzer.polarity_scores(text)
    tb_polarity = TextBlob(text).sentiment.polarity

    combined_score = (vs["compound"] + tb_polarity) / 2
    if combined_score >= 0.05:
        sentiment = "positive"
    elif combined_score <= -0.05:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    confidence = abs(combined_score)
    return {"sentiment": sentiment, "confidence": confidence, "combined_score": combined_score}

def is_negative_feedback(text, rating):
    return (analyze_sentiment(str(text))["sentiment"] == "negative") or (float(rating) < 3)

# ---------------- Data Processing ----------------
def process_dataframe(df, sheet_id: str = None):
    # ✅ Standard column mapping
    column_mapping = {
        "Timestamp": ["timestamp", "date", "time"],
        "Email Address": ["email", "email_address", "student_email"],
        "Student Name": ["student_name", "name", "student"],
        "How do you feel about the session": [
            "session_feedback", "feedback", "session_feeling",
            "how_do_you_feel", "How do you feel about the session?","How do you  feel about the session"
        ],
        "Select the Instructor": ["instructor", "teacher", "instructor_name", "Select the instructor"],
        "How do you rate Session": [
            "rating", "session_rating", "score",
            "How do you rate the session", "How do you rate the session?", "How do you rate Session?", "How do you rate the session"
        ],
        "Anything you want to convey": [
            "additional_comments", "comments", "convey", "additional_feedback",
            "Anything you want to convey?","Anything you want to convey"
        ],
    }

    # ✅ Clean empty cols like "", "_2"
    df = df.loc[:, ~df.columns.str.match(r"^Unnamed|^$|^_")]

    standardized_columns = {}
    for standard_name, possible_names in column_mapping.items():
        for col in df.columns:
            if col == standard_name or col.strip().lower() in [x.strip().lower() for x in possible_names]:
                standardized_columns[standard_name] = col
                break

    processed_data, flagged_entries = [], []

    for _, row in df.iterrows():
        try:
            timestamp = row.get(standardized_columns.get("Timestamp", ""), "")
            email = row.get(standardized_columns.get("Email Address", ""), "")
            student_name = row.get(standardized_columns.get("Student Name", ""), "")
            feedback_text = row.get(standardized_columns.get("How do you feel about the session", ""), "")
            instructor = row.get(standardized_columns.get("Select the Instructor", ""), "")
            rating = row.get(standardized_columns.get("How do you rate Session", ""), 0)
            additional_comments = row.get(standardized_columns.get("Anything you want to convey", ""), "")

            analysis_text = str(feedback_text).strip()
            sentiment_result = analyze_sentiment(analysis_text)
            is_flagged = is_negative_feedback(analysis_text, rating)

            processed_entry = {
                "timestamp": timestamp,
                "email": email,
                "student_name": student_name,
                "session_feedback": feedback_text,
                "instructor": instructor,
                "rating": float(rating) if str(rating).replace(".", "").isdigit() else 0,
                "additional_comments": additional_comments,
                "sentiment": sentiment_result["sentiment"],
                "confidence": sentiment_result["confidence"],
                "sentiment_score": sentiment_result["combined_score"],
                "is_flagged": is_flagged,
            }
            processed_data.append(processed_entry)

            if is_flagged:
                flagged_entries.append({
                    "student_name": student_name,
                    "instructor": instructor,
                    "feedback": feedback_text,
                    "rating": processed_entry["rating"],
                    "sentiment": sentiment_result["sentiment"],
                    "confidence": sentiment_result["confidence"],
                    "timestamp": timestamp,
                })
        except Exception as e:
            logger.warning(f"Error processing row: {str(e)}")
            continue

    # ✅ Summary stats
    total_responses = len(processed_data)
    sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
    total_rating, valid_ratings = 0, 0

    for entry in processed_data:
        sentiment_counts[entry["sentiment"]] += 1
        if entry["rating"] > 0:
            total_rating += entry["rating"]
            valid_ratings += 1

    average_rating = total_rating / valid_ratings if valid_ratings > 0 else 0

    # ✅ Instructor stats
    instructor_stats = {}
    for entry in processed_data:
        instructor = entry["instructor"]
        if instructor not in instructor_stats:
            instructor_stats[instructor] = {"total_responses": 0, "total_rating": 0, "valid_ratings": 0,
                                            "negative_count": 0, "sentiment_scores": []}
        stats = instructor_stats[instructor]
        stats["total_responses"] += 1
        if entry["rating"] > 0:
            stats["total_rating"] += entry["rating"]
            stats["valid_ratings"] += 1
        if entry["sentiment"] == "negative":
            stats["negative_count"] += 1
        stats["sentiment_scores"].append(entry["sentiment_score"])

    formatted_instructor_stats = []
    for instructor, stats in instructor_stats.items():
        avg_rating = stats["total_rating"] / stats["valid_ratings"] if stats["valid_ratings"] > 0 else 0
        avg_sentiment = sum(stats["sentiment_scores"]) / len(stats["sentiment_scores"]) if stats["sentiment_scores"] else 0
        formatted_instructor_stats.append({
            "instructor": instructor,
            "total_responses": stats["total_responses"],
            "average_rating": round(avg_rating, 2),
            "negative_count": stats["negative_count"],
            "sentiment_score": round(avg_sentiment, 3),
        })

    formatted_instructor_stats.sort(key=lambda x: (-x["negative_count"], x["average_rating"]))

    # ✅ Final Response with checkpoint info
    result = {
        "summary": {
            "total_responses": total_responses,
            "negative_count": sentiment_counts["negative"],
            "positive_count": sentiment_counts["positive"],
            "neutral_count": sentiment_counts["neutral"],
            "average_rating": round(average_rating, 2),
        },
        "instructor_stats": formatted_instructor_stats,
        "flagged_entries": sorted(flagged_entries, key=lambda x: x["confidence"], reverse=True),
        "all_data": processed_data,
        "processing_info": {
            "sheet_id": sheet_id,
            "processed_at": datetime.now().isoformat(),
            "cache_status": "fresh"
        }
    }

    # Save to checkpoint if sheet_id is provided
    if sheet_id:
        save_checkpoint(sheet_id, result)

    return result

# ---------------- API Endpoint ----------------
@app.get("/feedback/{sheet_id}")
def process_sheet(sheet_id: str, force_refresh: bool = False):
    try:
        # Check if we have a valid cached version
        if not force_refresh and is_checkpoint_valid(sheet_id):
            cached_data = load_checkpoint(sheet_id)
            if cached_data:
                cached_data["processing_info"]["cache_status"] = "cached"
                logger.info(f"Returning cached data for sheet {sheet_id}")
                return cached_data

        # Process fresh data from Google Sheets
        logger.info(f"Processing fresh data for sheet {sheet_id}")
        sheet = client.open_by_key(sheet_id)
        worksheet = sheet.sheet1

        # Get raw values including headers
        raw_data = worksheet.get_all_values()
        if not raw_data or len(raw_data) < 2:
            raise HTTPException(status_code=404, detail="Sheet is empty or has no data")

        # Fix duplicate or empty headers
        headers = raw_data[0]
        clean_headers = []
        used = {}
        for h in headers:
            h_clean = h.strip() if h.strip() else "Column"
            if h_clean in used:
                used[h_clean] += 1
                h_clean = f"{h_clean}_{used[h_clean]}"
            else:
                used[h_clean] = 0
            clean_headers.append(h_clean)

        # Convert to DataFrame
        df = pd.DataFrame(raw_data[1:], columns=clean_headers)

        result = process_dataframe(df, sheet_id)
        return result

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process sheet: {str(e)}")

# ---------------- Checkpoint Management Endpoints ----------------
@app.get("/checkpoints")
def list_checkpoints():
    """List all available checkpoints"""
    try:
        checkpoints = []
        for filename in os.listdir(CHECKPOINT_DIR):
            if filename.endswith(".json"):
                file_path = os.path.join(CHECKPOINT_DIR, filename)
                file_stats = os.stat(file_path)
                checkpoints.append({
                    "filename": filename,
                    "sheet_id": filename.replace("checkpoint_", "").replace(".json", ""),
                    "size_bytes": file_stats.st_size,
                    "created": datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                    "modified": datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                    "is_valid": is_checkpoint_valid(filename.replace("checkpoint_", "").replace(".json", ""))
                })
        return {"checkpoints": checkpoints}
    except Exception as e:
        logger.error(f"Error listing checkpoints: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list checkpoints")

@app.get("/checkpoint/{sheet_id}")
def get_checkpoint(sheet_id: str):
    """Get cached data for a specific sheet"""
    try:
        cached_data = load_checkpoint(sheet_id)
        if cached_data:
            return cached_data
        else:
            raise HTTPException(status_code=404, detail="Checkpoint not found")
    except Exception as e:
        logger.error(f"Error getting checkpoint for {sheet_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get checkpoint")

@app.delete("/checkpoint/{sheet_id}")
def delete_checkpoint(sheet_id: str):
    """Delete cached data for a specific sheet"""
    try:
        file_path = get_checkpoint_filename(sheet_id)
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Deleted checkpoint for sheet {sheet_id}")
            return {"message": f"Checkpoint for {sheet_id} deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Checkpoint not found")
    except Exception as e:
        logger.error(f"Error deleting checkpoint for {sheet_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete checkpoint")

@app.delete("/checkpoints")
def clear_all_checkpoints():
    """Clear all cached data"""
    try:
        count = 0
        for filename in os.listdir(CHECKPOINT_DIR):
            if filename.endswith(".json"):
                file_path = os.path.join(CHECKPOINT_DIR, filename)
                os.remove(file_path)
                count += 1
        logger.info(f"Cleared {count} checkpoints")
        return {"message": f"Cleared {count} checkpoints successfully"}
    except Exception as e:
        logger.error(f"Error clearing checkpoints: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to clear checkpoints")

# ---------------- Health Check ----------------
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "checkpoints_dir": CHECKPOINT_DIR,
        "checkpoints_count": len([f for f in os.listdir(CHECKPOINT_DIR) if f.endswith(".json")])
    }

# ---------------- Server Startup ----------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000, reload=True)

