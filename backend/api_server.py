import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import re
from datetime import datetime
from collections import Counter

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

def analyze_sentiment(text):
    """Simple sentiment analysis using keyword matching"""
    if not text or not isinstance(text, str):
        return {"sentiment": "neutral", "score": 0, "confidence": 0.5}
    
    text_lower = text.lower()
    
    # Negative keywords with weights
    negative_words = {
        'bad': -2, 'terrible': -3, 'awful': -3, 'horrible': -3, 'hate': -2,
        'boring': -2, 'confusing': -2, 'difficult': -1, 'hard': -1, 'poor': -2,
        'worst': -3, 'useless': -3, 'waste': -2, 'disappointed': -2, 'frustrated': -2,
        'unclear': -1, 'complicated': -1, 'slow': -1, 'not good': -2, 'not helpful': -2
    }
    
    # Positive keywords with weights
    positive_words = {
        'good': 2, 'great': 3, 'excellent': 3, 'amazing': 3, 'love': 2,
        'interesting': 2, 'helpful': 2, 'clear': 2, 'easy': 1, 'best': 3,
        'useful': 2, 'perfect': 3, 'satisfied': 2, 'happy': 2, 'enjoyed': 2,
        'informative': 2, 'engaging': 2, 'well': 1, 'nice': 1, 'awesome': 3
    }
    
    score = 0
    word_count = 0
    
    # Check for negative words
    for word, weight in negative_words.items():
        if word in text_lower:
            score += weight
            word_count += 1
    
    # Check for positive words
    for word, weight in positive_words.items():
        if word in text_lower:
            score += weight
            word_count += 1
    
    # Normalize score
    if word_count > 0:
        normalized_score = max(-1, min(1, score / word_count))
    else:
        normalized_score = 0
    
    # Determine sentiment
    if normalized_score > 0.1:
        sentiment = "positive"
    elif normalized_score < -0.1:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    
    confidence = min(0.9, 0.5 + abs(normalized_score) * 0.4)
    
    return {
        "sentiment": sentiment,
        "score": round(normalized_score, 3),
        "confidence": round(confidence, 3)
    }

def extract_keywords(text, sentiment):
    """Extract relevant keywords from text"""
    if not text or not isinstance(text, str):
        return []
    
    # Remove common words
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'}
    
    # Extract words (simple tokenization)
    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
    keywords = [word for word in words if len(word) > 2 and word not in stop_words]
    
    # Get most common keywords
    word_counts = Counter(keywords)
    return [word for word, count in word_counts.most_common(5)]

@app.route('/api/process-sheets', methods=['POST'])
def process_sheets():
    try:
        data = request.get_json()
        sheets_url = data.get('url')
        
        if not sheets_url:
            return jsonify({"error": "URL is required"}), 400
        
        # Fetch data from Google Sheets
        response = requests.get(sheets_url)
        response.raise_for_status()
        
        sheets_data = response.json()
        
        if not isinstance(sheets_data, list):
            return jsonify({"error": "Invalid data format from Google Sheets"}), 400
        
        # Process each entry
        processed_data = []
        negative_entries = []
        instructor_stats = {}
        sentiment_distribution = {"positive": 0, "negative": 0, "neutral": 0}
        
        for entry in sheets_data:
            # Extract relevant fields
            feedback_text = entry.get("How do you feel about the session", "")
            additional_comments = entry.get("Anything you want to convey", "")
            instructor = entry.get("Select the Instructor", "Unknown")
            rating = entry.get("How do you rate Session", 0)
            student_name = entry.get("Student Name", "Anonymous")
            timestamp = entry.get("Timestamp", "")
            
            # Combine feedback texts for analysis
            combined_text = f"{feedback_text} {additional_comments}".strip()
            
            # Analyze sentiment
            sentiment_result = analyze_sentiment(combined_text)
            keywords = extract_keywords(combined_text, sentiment_result["sentiment"])
            
            # Create processed entry
            processed_entry = {
                "id": len(processed_data) + 1,
                "student_name": student_name,
                "instructor": instructor,
                "rating": rating,
                "feedback_text": feedback_text,
                "additional_comments": additional_comments,
                "combined_text": combined_text,
                "sentiment": sentiment_result["sentiment"],
                "sentiment_score": sentiment_result["score"],
                "confidence": sentiment_result["confidence"],
                "keywords": keywords,
                "timestamp": timestamp,
                "is_flagged": sentiment_result["sentiment"] == "negative" or rating < 3
            }
            
            processed_data.append(processed_entry)
            
            # Track negative entries
            if processed_entry["is_flagged"]:
                negative_entries.append(processed_entry)
            
            # Update sentiment distribution
            sentiment_distribution[sentiment_result["sentiment"]] += 1
            
            # Update instructor stats
            if instructor not in instructor_stats:
                instructor_stats[instructor] = {
                    "total_feedback": 0,
                    "average_rating": 0,
                    "positive_count": 0,
                    "negative_count": 0,
                    "neutral_count": 0,
                    "total_rating": 0
                }
            
            stats = instructor_stats[instructor]
            stats["total_feedback"] += 1
            stats["total_rating"] += rating
            stats["average_rating"] = round(stats["total_rating"] / stats["total_feedback"], 2)
            stats[f"{sentiment_result['sentiment']}_count"] += 1
        
        # Calculate percentages for sentiment distribution
        total_entries = len(processed_data)
        sentiment_percentages = {
            sentiment: round((count / total_entries) * 100, 1) if total_entries > 0 else 0
            for sentiment, count in sentiment_distribution.items()
        }
        
        # Prepare response
        response_data = {
            "success": True,
            "total_entries": total_entries,
            "processed_data": processed_data,
            "negative_entries": negative_entries,
            "flagged_count": len(negative_entries),
            "sentiment_distribution": sentiment_distribution,
            "sentiment_percentages": sentiment_percentages,
            "instructor_stats": instructor_stats,
            "summary": {
                "total_feedback": total_entries,
                "flagged_feedback": len(negative_entries),
                "instructors_count": len(instructor_stats),
                "average_overall_rating": round(sum(entry["rating"] for entry in processed_data) / total_entries, 2) if total_entries > 0 else 0
            }
        }
        
        return jsonify(response_data)
        
    except requests.RequestException as e:
        return jsonify({"error": f"Failed to fetch data from Google Sheets: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Processing error: {str(e)}"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Sentiment Analysis API is running"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
