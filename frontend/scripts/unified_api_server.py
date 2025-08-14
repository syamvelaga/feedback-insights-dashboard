from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import pandas as pd
import io
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import re
from datetime import datetime
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize VADER analyzer
vader_analyzer = SentimentIntensityAnalyzer()

def clean_text(text):
    """Clean and preprocess text for sentiment analysis"""
    if pd.isna(text) or text == "":
        return ""
    
    # Convert to string and clean
    text = str(text).strip()
    text = re.sub(r'\s+', ' ', text)  # Replace multiple spaces with single space
    text = re.sub(r'[^\w\s.,!?-]', '', text)  # Remove special characters except basic punctuation
    
    return text

def analyze_sentiment(text):
    """Perform comprehensive sentiment analysis using multiple methods"""
    if not text or text.strip() == "":
        return {
            'sentiment': 'neutral',
            'confidence': 0.0,
            'textblob_score': 0.0,
            'vader_score': 0.0,
            'combined_score': 0.0
        }
    
    cleaned_text = clean_text(text)
    
    # TextBlob analysis
    blob = TextBlob(cleaned_text)
    textblob_score = blob.sentiment.polarity
    
    # VADER analysis
    vader_scores = vader_analyzer.polarity_scores(cleaned_text)
    vader_compound = vader_scores['compound']
    
    # Combined score (weighted average)
    combined_score = (textblob_score * 0.4) + (vader_compound * 0.6)
    
    # Determine sentiment and confidence
    if combined_score >= 0.1:
        sentiment = 'positive'
        confidence = min(abs(combined_score), 1.0)
    elif combined_score <= -0.1:
        sentiment = 'negative'
        confidence = min(abs(combined_score), 1.0)
    else:
        sentiment = 'neutral'
        confidence = 1.0 - abs(combined_score)
    
    return {
        'sentiment': sentiment,
        'confidence': confidence,
        'textblob_score': textblob_score,
        'vader_score': vader_compound,
        'combined_score': combined_score
    }

def is_negative_feedback(text, rating=None):
    """Determine if feedback should be flagged as negative"""
    if not text:
        return False
    
    # Check rating first
    if rating is not None:
        try:
            rating_num = float(rating)
            if rating_num <= 2:
                return True
        except (ValueError, TypeError):
            pass
    
    # Analyze sentiment
    sentiment_result = analyze_sentiment(text)
    
    # Flag as negative if:
    # 1. Sentiment is negative with high confidence
    # 2. Combined score is very negative
    return (sentiment_result['sentiment'] == 'negative' and 
            sentiment_result['confidence'] > 0.6) or \
           sentiment_result['combined_score'] < -0.3

def process_sheets_data(url):
    """Fetch and process Google Sheets data"""
    try:
        # Fetch data from Google Sheets API
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        if not isinstance(data, list) or len(data) == 0:
            raise ValueError("Invalid data format or empty dataset")
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        return process_dataframe(df)
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching Google Sheets data: {str(e)}")
        raise Exception(f"Failed to fetch data from Google Sheets: {str(e)}")
    except Exception as e:
        logger.error(f"Error processing Google Sheets data: {str(e)}")
        raise Exception(f"Failed to process data: {str(e)}")

def process_csv_data(csv_content):
    """Process CSV data"""
    try:
        # Read CSV content
        df = pd.read_csv(io.StringIO(csv_content))
        
        if df.empty:
            raise ValueError("CSV file is empty")
        
        return process_dataframe(df)
        
    except Exception as e:
        logger.error(f"Error processing CSV data: {str(e)}")
        raise Exception(f"Failed to process CSV data: {str(e)}")

def process_dataframe(df):
    """Process DataFrame and perform sentiment analysis"""
    try:
        # Standardize column names (handle different possible column names)
        column_mapping = {
            'Timestamp': ['timestamp', 'date', 'time'],
            'Email Address': ['email', 'email_address', 'student_email'],
            'Student Name': ['student_name', 'name', 'student'],
            'How do you feel about the session': ['session_feedback', 'feedback', 'session_feeling', 'how_do_you_feel'],
            'Select the Instructor': ['instructor', 'teacher', 'instructor_name'],
            'How do you rate Session': ['rating', 'session_rating', 'score'],
            'Anything you want to convey': ['additional_comments', 'comments', 'convey', 'additional_feedback']
        }
        
        # Find matching columns
        standardized_columns = {}
        for standard_name, possible_names in column_mapping.items():
            for col in df.columns:
                if col == standard_name or col.lower().replace(' ', '_') in [name.lower() for name in possible_names]:
                    standardized_columns[standard_name] = col
                    break
        
        # Process each row
        processed_data = []
        flagged_entries = []
        
        for index, row in df.iterrows():
            try:
                # Extract data with fallbacks
                timestamp = row.get(standardized_columns.get('Timestamp', ''), '')
                email = row.get(standardized_columns.get('Email Address', ''), '')
                student_name = row.get(standardized_columns.get('Student Name', ''), '')
                session_feedback = row.get(standardized_columns.get('How do you feel about the session', ''), '')
                instructor = row.get(standardized_columns.get('Select the Instructor', ''), '')
                rating = row.get(standardized_columns.get('How do you rate Session', ''), 0)
                additional_comments = row.get(standardized_columns.get('Anything you want to convey', ''), '')
                
                # Combine feedback texts for analysis
                combined_feedback = f"{session_feedback} {additional_comments}".strip()
                
                # Perform sentiment analysis
                sentiment_result = analyze_sentiment(combined_feedback)
                
                # Check if should be flagged
                is_flagged = is_negative_feedback(combined_feedback, rating)
                
                # Create processed entry
                processed_entry = {
                    'timestamp': timestamp,
                    'email': email,
                    'student_name': student_name,
                    'session_feedback': session_feedback,
                    'instructor': instructor,
                    'rating': float(rating) if rating and str(rating).replace('.', '').isdigit() else 0,
                    'additional_comments': additional_comments,
                    'sentiment': sentiment_result['sentiment'],
                    'confidence': sentiment_result['confidence'],
                    'sentiment_score': sentiment_result['combined_score'],
                    'is_flagged': is_flagged
                }
                
                processed_data.append(processed_entry)
                
                # Add to flagged entries if negative
                if is_flagged:
                    flagged_entries.append({
                        'student_name': student_name,
                        'instructor': instructor,
                        'feedback': combined_feedback,
                        'rating': processed_entry['rating'],
                        'sentiment': sentiment_result['sentiment'],
                        'confidence': sentiment_result['confidence'],
                        'timestamp': timestamp
                    })
                    
            except Exception as e:
                logger.warning(f"Error processing row {index}: {str(e)}")
                continue
        
        # Calculate summary statistics
        total_responses = len(processed_data)
        if total_responses == 0:
            raise ValueError("No valid data found to process")
        
        sentiment_counts = {'positive': 0, 'negative': 0, 'neutral': 0}
        total_rating = 0
        valid_ratings = 0
        
        for entry in processed_data:
            sentiment_counts[entry['sentiment']] += 1
            if entry['rating'] > 0:
                total_rating += entry['rating']
                valid_ratings += 1
        
        average_rating = total_rating / valid_ratings if valid_ratings > 0 else 0
        
        # Calculate instructor statistics
        instructor_stats = {}
        for entry in processed_data:
            instructor = entry['instructor']
            if instructor not in instructor_stats:
                instructor_stats[instructor] = {
                    'total_responses': 0,
                    'total_rating': 0,
                    'valid_ratings': 0,
                    'negative_count': 0,
                    'sentiment_scores': []
                }
            
            stats = instructor_stats[instructor]
            stats['total_responses'] += 1
            
            if entry['rating'] > 0:
                stats['total_rating'] += entry['rating']
                stats['valid_ratings'] += 1
            
            if entry['sentiment'] == 'negative':
                stats['negative_count'] += 1
            
            stats['sentiment_scores'].append(entry['sentiment_score'])
        
        # Format instructor statistics
        formatted_instructor_stats = []
        for instructor, stats in instructor_stats.items():
            avg_rating = stats['total_rating'] / stats['valid_ratings'] if stats['valid_ratings'] > 0 else 0
            avg_sentiment = sum(stats['sentiment_scores']) / len(stats['sentiment_scores']) if stats['sentiment_scores'] else 0
            
            formatted_instructor_stats.append({
                'instructor': instructor,
                'total_responses': stats['total_responses'],
                'average_rating': round(avg_rating, 2),
                'negative_count': stats['negative_count'],
                'sentiment_score': round(avg_sentiment, 3)
            })
        
        # Sort instructor stats by negative count (descending) then by average rating (ascending)
        formatted_instructor_stats.sort(key=lambda x: (-x['negative_count'], x['average_rating']))
        
        return {
            'summary': {
                'total_responses': total_responses,
                'negative_count': sentiment_counts['negative'],
                'positive_count': sentiment_counts['positive'],
                'neutral_count': sentiment_counts['neutral'],
                'average_rating': round(average_rating, 2)
            },
            'instructor_stats': formatted_instructor_stats,
            'flagged_entries': sorted(flagged_entries, key=lambda x: x['confidence'], reverse=True),
            'all_data': processed_data
        }
        
    except Exception as e:
        logger.error(f"Error in process_dataframe: {str(e)}")
        raise Exception(f"Failed to process data: {str(e)}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/process-sheets', methods=['POST'])
def process_sheets():
    """Process Google Sheets data"""
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'URL is required'}), 400
        
        url = data['url'].strip()
        if not url:
            return jsonify({'error': 'URL cannot be empty'}), 400
        
        # Validate URL format
        if not (url.startswith('http://') or url.startswith('https://')):
            return jsonify({'error': 'Invalid URL format'}), 400
        
        logger.info(f"Processing Google Sheets URL: {url}")
        
        result = process_sheets_data(url)
        
        logger.info(f"Successfully processed {result['summary']['total_responses']} responses")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in process_sheets: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/process-csv', methods=['POST'])
def process_csv():
    """Process CSV data"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.lower().endswith('.csv'):
            return jsonify({'error': 'File must be a CSV'}), 400
        
        # Read file content
        csv_content = file.read().decode('utf-8')
        
        if not csv_content.strip():
            return jsonify({'error': 'CSV file is empty'}), 400
        
        logger.info(f"Processing CSV file: {file.filename}")
        
        result = process_csv_data(csv_content)
        
        logger.info(f"Successfully processed {result['summary']['total_responses']} responses from CSV")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in process_csv: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
