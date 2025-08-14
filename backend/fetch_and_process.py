import requests
import json
import sys
from datetime import datetime

def analyze_sentiment(text):
    """Simple sentiment analysis using keyword matching"""
    if not text or text.strip() == "":
        return {"sentiment": "neutral", "score": 0, "confidence": 0}
    
    text_lower = text.lower()
    
    # Negative keywords
    negative_words = [
        'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'boring', 
        'confusing', 'difficult', 'hard', 'poor', 'worst', 'useless', 'waste',
        'disappointed', 'frustrated', 'annoying', 'unclear', 'complicated'
    ]
    
    # Positive keywords
    positive_words = [
        'good', 'great', 'excellent', 'amazing', 'love', 'like', 'interesting',
        'clear', 'easy', 'helpful', 'useful', 'best', 'wonderful', 'fantastic',
        'satisfied', 'happy', 'engaging', 'informative', 'valuable'
    ]
    
    negative_count = sum(1 for word in negative_words if word in text_lower)
    positive_count = sum(1 for word in positive_words if word in text_lower)
    
    if negative_count > positive_count:
        sentiment = "negative"
        score = -min(negative_count / 3, 1)  # Cap at -1
    elif positive_count > negative_count:
        sentiment = "positive" 
        score = min(positive_count / 3, 1)   # Cap at 1
    else:
        sentiment = "neutral"
        score = 0
    
    confidence = min((abs(score) * 100), 95)  # Cap confidence at 95%
    
    return {
        "sentiment": sentiment,
        "score": round(score, 2),
        "confidence": round(confidence, 1)
    }

def process_sheets_data(url):
    """Fetch and process Google Sheets data"""
    try:
        # Fetch data from Google Sheets API
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        if not data:
            return {"error": "No data found in the sheet"}
        
        processed_entries = []
        instructor_stats = {}
        sentiment_summary = {"positive": 0, "negative": 0, "neutral": 0}
        flagged_entries = []
        
        for entry in data:
            # Extract relevant fields
            timestamp = entry.get("Timestamp", "")
            student_name = entry.get("Student Name", "Unknown")
            instructor = entry.get("Select the Instructor", "Unknown")
            session_feeling = entry.get("How do you feel about the session", "")
            rating = entry.get("How do you rate Session", 0)
            additional_comments = entry.get("Anything you want to convey", "")
            
            # Analyze sentiment for text fields
            feeling_analysis = analyze_sentiment(session_feeling)
            comments_analysis = analyze_sentiment(additional_comments)
            
            # Determine overall sentiment (prioritize comments if available)
            if additional_comments and additional_comments.strip() != "" and additional_comments.lower() != "no":
                overall_sentiment = comments_analysis
                primary_text = additional_comments
            else:
                overall_sentiment = feeling_analysis
                primary_text = session_feeling
            
            # Create processed entry
            processed_entry = {
                "id": len(processed_entries) + 1,
                "timestamp": timestamp,
                "student_name": student_name,
                "instructor": instructor,
                "rating": int(rating) if rating else 0,
                "session_feeling": session_feeling,
                "additional_comments": additional_comments,
                "sentiment_analysis": {
                    "overall": overall_sentiment,
                    "feeling": feeling_analysis,
                    "comments": comments_analysis,
                    "primary_text": primary_text
                },
                "is_flagged": overall_sentiment["sentiment"] == "negative" or int(rating) <= 2
            }
            
            processed_entries.append(processed_entry)
            
            # Update sentiment summary
            sentiment_summary[overall_sentiment["sentiment"]] += 1
            
            # Track instructor stats
            if instructor not in instructor_stats:
                instructor_stats[instructor] = {
                    "total_responses": 0,
                    "average_rating": 0,
                    "sentiment_breakdown": {"positive": 0, "negative": 0, "neutral": 0},
                    "total_rating": 0
                }
            
            instructor_stats[instructor]["total_responses"] += 1
            instructor_stats[instructor]["total_rating"] += int(rating) if rating else 0
            instructor_stats[instructor]["sentiment_breakdown"][overall_sentiment["sentiment"]] += 1
            
            # Flag negative entries
            if processed_entry["is_flagged"]:
                flagged_entries.append(processed_entry)
        
        # Calculate averages for instructors
        for instructor in instructor_stats:
            stats = instructor_stats[instructor]
            if stats["total_responses"] > 0:
                stats["average_rating"] = round(stats["total_rating"] / stats["total_responses"], 2)
        
        # Prepare final response
        result = {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "total_entries": len(processed_entries),
            "summary": {
                "sentiment_distribution": sentiment_summary,
                "average_rating": round(sum(entry["rating"] for entry in processed_entries) / len(processed_entries), 2) if processed_entries else 0,
                "total_flagged": len(flagged_entries),
                "instructors_count": len(instructor_stats)
            },
            "instructor_stats": instructor_stats,
            "flagged_entries": flagged_entries,
            "all_entries": processed_entries
        }
        
        return result
        
    except requests.RequestException as e:
        return {"error": f"Failed to fetch data: {str(e)}"}
    except json.JSONDecodeError as e:
        return {"error": f"Invalid JSON response: {str(e)}"}
    except Exception as e:
        return {"error": f"Processing error: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Please provide a Google Sheets URL as an argument"}))
        sys.exit(1)
    
    url = sys.argv[1]
    result = process_sheets_data(url)
    print(json.dumps(result, indent=2))
