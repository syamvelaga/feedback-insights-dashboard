import requests
import json
import sys
from datetime import datetime
from typing import List, Dict, Any
import re

def clean_text(text: str) -> str:
    """Clean and normalize text data"""
    if not text or text.strip().lower() in ['no', 'n/a', 'na', 'none', '']:
        return ""
    return text.strip()

def analyze_sentiment_basic(text: str) -> Dict[str, Any]:
    """Basic sentiment analysis to flag negative comments"""
    if not text:
        return {"sentiment": "neutral", "confidence": 0.0, "is_negative": False}
    
    text_lower = text.lower()
    
    # Negative indicators
    negative_words = [
        'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'dislike',
        'boring', 'confusing', 'difficult', 'hard', 'poor', 'weak', 'slow',
        'unclear', 'unhelpful', 'useless', 'waste', 'disappointed', 'frustrated',
        'annoying', 'irritating', 'not good', 'not helpful', 'not clear',
        'too fast', 'too slow', 'too difficult', 'too easy', 'not enough',
        'lacking', 'missing', 'incomplete', 'wrong', 'incorrect', 'mistake'
    ]
    
    # Positive indicators
    positive_words = [
        'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
        'helpful', 'clear', 'easy', 'interesting', 'engaging', 'informative',
        'useful', 'valuable', 'perfect', 'love', 'like', 'enjoy', 'appreciate',
        'thank', 'thanks', 'well explained', 'well done', 'impressive'
    ]
    
    negative_count = sum(1 for word in negative_words if word in text_lower)
    positive_count = sum(1 for word in positive_words if word in text_lower)
    
    # Determine sentiment
    if negative_count > positive_count:
        sentiment = "negative"
        confidence = min(0.9, 0.5 + (negative_count * 0.1))
        is_negative = True
    elif positive_count > negative_count:
        sentiment = "positive"
        confidence = min(0.9, 0.5 + (positive_count * 0.1))
        is_negative = False
    else:
        sentiment = "neutral"
        confidence = 0.5
        is_negative = False
    
    return {
        "sentiment": sentiment,
        "confidence": confidence,
        "is_negative": is_negative,
        "negative_indicators": negative_count,
        "positive_indicators": positive_count
    }

def process_feedback_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    """Process a single feedback entry"""
    # Extract and clean data
    timestamp = entry.get("Timestamp", "")
    email = entry.get("Email Address", "")
    student_name = clean_text(entry.get("Student Name", ""))
    session_feeling = clean_text(entry.get("How do you feel about the session", ""))
    instructor = clean_text(entry.get("Select the Instructor", ""))
    rating = entry.get("How do you rate Session", 0)
    additional_comments = clean_text(entry.get("Anything you want to convey", ""))
    
    # Analyze sentiment for text fields
    feeling_analysis = analyze_sentiment_basic(session_feeling)
    comments_analysis = analyze_sentiment_basic(additional_comments)
    
    # Determine overall sentiment
    overall_negative = feeling_analysis["is_negative"] or comments_analysis["is_negative"]
    overall_sentiment = "negative" if overall_negative else (
        "positive" if feeling_analysis["sentiment"] == "positive" or comments_analysis["sentiment"] == "positive"
        else "neutral"
    )
    
    # Flag entry if negative
    is_flagged = overall_negative or rating < 3
    
    return {
        "id": f"{email}_{timestamp}",
        "timestamp": timestamp,
        "student_name": student_name,
        "email": email,
        "instructor": instructor,
        "rating": rating,
        "session_feeling": session_feeling,
        "additional_comments": additional_comments,
        "sentiment_analysis": {
            "overall_sentiment": overall_sentiment,
            "is_flagged": is_flagged,
            "feeling_sentiment": feeling_analysis,
            "comments_sentiment": comments_analysis
        },
        "processed_at": datetime.now().isoformat()
    }

def generate_summary_stats(processed_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate summary statistics"""
    total_responses = len(processed_data)
    if total_responses == 0:
        return {}
    
    # Count sentiments
    positive_count = sum(1 for entry in processed_data if entry["sentiment_analysis"]["overall_sentiment"] == "positive")
    negative_count = sum(1 for entry in processed_data if entry["sentiment_analysis"]["overall_sentiment"] == "negative")
    neutral_count = total_responses - positive_count - negative_count
    flagged_count = sum(1 for entry in processed_data if entry["sentiment_analysis"]["is_flagged"])
    
    # Rating statistics
    ratings = [entry["rating"] for entry in processed_data if entry["rating"] > 0]
    avg_rating = sum(ratings) / len(ratings) if ratings else 0
    
    # Instructor breakdown
    instructor_stats = {}
    for entry in processed_data:
        instructor = entry["instructor"]
        if instructor not in instructor_stats:
            instructor_stats[instructor] = {
                "total_responses": 0,
                "positive": 0,
                "negative": 0,
                "neutral": 0,
                "flagged": 0,
                "ratings": [],
                "avg_rating": 0
            }
        
        stats = instructor_stats[instructor]
        stats["total_responses"] += 1
        stats[entry["sentiment_analysis"]["overall_sentiment"]] += 1
        if entry["sentiment_analysis"]["is_flagged"]:
            stats["flagged"] += 1
        if entry["rating"] > 0:
            stats["ratings"].append(entry["rating"])
    
    # Calculate averages for instructors
    for instructor, stats in instructor_stats.items():
        if stats["ratings"]:
            stats["avg_rating"] = sum(stats["ratings"]) / len(stats["ratings"])
    
    return {
        "total_responses": total_responses,
        "sentiment_distribution": {
            "positive": positive_count,
            "negative": negative_count,
            "neutral": neutral_count,
            "flagged": flagged_count
        },
        "sentiment_percentages": {
            "positive": round((positive_count / total_responses) * 100, 1),
            "negative": round((negative_count / total_responses) * 100, 1),
            "neutral": round((neutral_count / total_responses) * 100, 1),
            "flagged": round((flagged_count / total_responses) * 100, 1)
        },
        "rating_stats": {
            "average": round(avg_rating, 2),
            "total_rated": len(ratings),
            "distribution": {str(i): ratings.count(i) for i in range(1, 6)}
        },
        "instructor_breakdown": instructor_stats,
        "generated_at": datetime.now().isoformat()
    }

def fetch_and_process_sheets_data(url: str) -> Dict[str, Any]:
    """Main function to fetch and process Google Sheets data"""
    try:
        print(f"Fetching data from: {url}")
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        # Parse JSON data
        raw_data = response.json()
        print(f"Successfully fetched {len(raw_data)} entries")
        
        # Process each entry
        processed_entries = []
        flagged_entries = []
        
        for entry in raw_data:
            processed_entry = process_feedback_entry(entry)
            processed_entries.append(processed_entry)
            
            # Collect flagged entries
            if processed_entry["sentiment_analysis"]["is_flagged"]:
                flagged_entries.append(processed_entry)
        
        # Generate summary statistics
        summary_stats = generate_summary_stats(processed_entries)
        
        # Prepare final output
        result = {
            "status": "success",
            "metadata": {
                "source_url": url,
                "total_entries": len(processed_entries),
                "flagged_entries": len(flagged_entries),
                "processed_at": datetime.now().isoformat()
            },
            "summary_statistics": summary_stats,
            "processed_data": processed_entries,
            "flagged_entries": flagged_entries,
            "data_structure": {
                "description": "Processed Google Sheets feedback data with sentiment analysis",
                "fields": {
                    "processed_data": "All feedback entries with sentiment analysis",
                    "flagged_entries": "Entries with negative sentiment or low ratings",
                    "summary_statistics": "Aggregated statistics and breakdowns"
                }
            }
        }
        
        return result
        
    except requests.exceptions.RequestException as e:
        return {
            "status": "error",
            "error_type": "network_error",
            "message": f"Failed to fetch data: {str(e)}",
            "processed_at": datetime.now().isoformat()
        }
    except json.JSONDecodeError as e:
        return {
            "status": "error",
            "error_type": "json_error",
            "message": f"Failed to parse JSON data: {str(e)}",
            "processed_at": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "error_type": "processing_error",
            "message": f"Error processing data: {str(e)}",
            "processed_at": datetime.now().isoformat()
        }

def main():
    """Main execution function"""
    if len(sys.argv) != 2:
        print("Usage: python process_sheets_data.py <google_sheets_url>")
        print("\nExample:")
        print("python process_sheets_data.py 'https://script.googleusercontent.com/macros/echo?user_content_key=...'")
        sys.exit(1)
    
    url = sys.argv[1]
    
    # Process the data
    result = fetch_and_process_sheets_data(url)
    
    # Output results
    if result["status"] == "success":
        print("\n" + "="*50)
        print("DATA PROCESSING COMPLETED SUCCESSFULLY")
        print("="*50)
        
        metadata = result["metadata"]
        stats = result["summary_statistics"]
        
        print(f"Total Entries Processed: {metadata['total_entries']}")
        print(f"Flagged Entries: {metadata['flagged_entries']}")
        print(f"Average Rating: {stats['rating_stats']['average']}")
        print(f"Sentiment Distribution:")
        print(f"  - Positive: {stats['sentiment_percentages']['positive']}%")
        print(f"  - Negative: {stats['sentiment_percentages']['negative']}%")
        print(f"  - Neutral: {stats['sentiment_percentages']['neutral']}%")
        print(f"  - Flagged: {stats['sentiment_percentages']['flagged']}%")
        
        print(f"\nInstructor Breakdown:")
        for instructor, data in stats['instructor_breakdown'].items():
            print(f"  {instructor}: {data['total_responses']} responses, Avg Rating: {data['avg_rating']:.1f}")
        
        if result["flagged_entries"]:
            print(f"\n⚠️  FLAGGED ENTRIES ({len(result['flagged_entries'])}):")
            for entry in result["flagged_entries"][:5]:  # Show first 5
                print(f"  - {entry['student_name']} ({entry['instructor']}): {entry['session_feeling']}")
        
        print(f"\n📊 Complete processed data available in JSON format")
        print("="*50)
        
        # Output JSON for frontend consumption
        print("\n" + json.dumps(result, indent=2, ensure_ascii=False))
        
    else:
        print(f"\n❌ ERROR: {result['message']}")
        print(json.dumps(result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
