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
import json
import os
import hashlib

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize VADER analyzer
vader_analyzer = SentimentIntensityAnalyzer()

# Checkpoint directory for incremental processing
CHECKPOINT_DIR = "checkpoints"
if not os.path.exists(CHECKPOINT_DIR):
    os.makedirs(CHECKPOINT_DIR)

def get_checkpoint_filename(url):
    """Generate unique checkpoint filename for a URL"""
    url_hash = hashlib.md5(url.encode()).hexdigest()
    return os.path.join(CHECKPOINT_DIR, f"checkpoint_{url_hash}.json")

def load_checkpoint(url):
    """Load existing checkpoint data"""
    checkpoint_file = get_checkpoint_filename(url)
    if os.path.exists(checkpoint_file):
        try:
            with open(checkpoint_file, 'r', encoding='utf-8') as f:
                checkpoint = json.load(f)
                logger.info(f"Loaded checkpoint with {len(checkpoint.get('processed_data', []))} existing records")
                return checkpoint
        except Exception as e:
            logger.warning(f"Error loading checkpoint: {str(e)}")
    return None

def save_checkpoint(url, data):
    """Save checkpoint data"""
    checkpoint_file = get_checkpoint_filename(url)
    try:
        with open(checkpoint_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.info(f"Checkpoint saved: {checkpoint_file}")
    except Exception as e:
        logger.error(f"Error saving checkpoint: {str(e)}")

def get_last_processed_timestamp(checkpoint):
    """Get the latest timestamp from processed data"""
    if not checkpoint or 'processed_data' not in checkpoint:
        return None
    
    timestamps = []
    for entry in checkpoint['processed_data']:
        if entry.get('timestamp'):
            try:
                # Try to parse timestamp
                if isinstance(entry['timestamp'], str):
                    # Handle different timestamp formats
                    for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%d']:
                        try:
                            ts = datetime.strptime(entry['timestamp'], fmt)
                            timestamps.append(ts)
                            break
                        except ValueError:
                            continue
            except Exception:
                continue
    
    return max(timestamps) if timestamps else None

def is_new_data(timestamp, last_processed):
    """Check if data is newer than last processed"""
    if not last_processed:
        return True
    
    try:
        if isinstance(timestamp, str):
            # Try to parse timestamp
            for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%d']:
                try:
                    ts = datetime.strptime(timestamp, fmt)
                    return ts > last_processed
                except ValueError:
                    continue
        return True
    except Exception:
        return True

def merge_data(existing_data, new_data):
    """Merge existing and new data, avoiding duplicates"""
    if not existing_data:
        return new_data
    
    # Create a set of existing record identifiers
    existing_keys = set()
    for entry in existing_data:
        # Create unique key based on timestamp + student + instructor
        key = f"{entry.get('timestamp', '')}_{entry.get('student_name', '')}_{entry.get('instructor', '')}"
        existing_keys.add(key)
    
    # Add only new records
    merged_data = existing_data.copy()
    for entry in new_data:
        key = f"{entry.get('timestamp', '')}_{entry.get('student_name', '')}_{entry.get('instructor', '')}"
        if key not in existing_keys:
            merged_data.append(entry)
            existing_keys.add(key)
    
    logger.info(f"Merged data: {len(existing_data)} existing + {len(new_data)} new = {len(merged_data)} total")
    return merged_data

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

def process_dataframe_incremental(df, url):
    try:
        checkpoint = load_checkpoint(url)
        last_processed = get_last_processed_timestamp(checkpoint) if checkpoint else None

        # ✅ Expanded mapping (Annamacharya + CDU + VGU)
        column_mapping = {
            'Timestamp': ['timestamp', 'date', 'time'],
            'Email Address': ['email', 'email_address', 'student_email', 'Email Address'],
            'Student Name': ['student_name', 'name', 'student', 'Student Name','Student Name'],
            'How do you feel about the session': [
                'session_feedback', 'feedback', 'session_feeling', 'how_do_you_feel',
                'How do you feel about the session', 'How do you feel about the session?'
            ],
            'Select the Instructor': [
                'instructor', 'teacher', 'instructor_name',
                'Select the Instructor', 'Select the instructor'
            ],
            'How do you rate Session': [
                'rating', 'session_rating', 'score','How do you rate the session',
                'How do you rate Session', 'How do you rate the session', 'How do you rate the session?', 'How do you rate Session?'
            ],
            'Anything you want to convey': [
                'additional_comments', 'comments', 'convey', 'additional_feedback',
                'Anything you want to convey', 'Anything you want to convey?',''
            ]
        }

        # match columns
        standardized_columns = {}
        for standard_name, possible_names in column_mapping.items():
            for col in df.columns:
                if col == standard_name or col.strip().lower() in [name.strip().lower() for name in possible_names]:
                    standardized_columns[standard_name] = col
                    break

        new_processed_data = []
        new_flagged_entries = []

        for index, row in df.iterrows():
            try:
                timestamp = row.get(standardized_columns.get('Timestamp', ''), '')
                email = row.get(standardized_columns.get('Email Address', ''), '')
                student_name = row.get(standardized_columns.get('Student Name', ''), '')
                feedback_text = row.get(standardized_columns.get('How do you feel about the session', ''), '')
                instructor = row.get(standardized_columns.get('Select the Instructor', ''), '')
                rating = row.get(standardized_columns.get('How do you rate Session', ''), 0)
                additional_comments = row.get(standardized_columns.get('Anything you want to convey', ''), '')

                if not is_new_data(timestamp, last_processed):
                    continue

                analysis_text = str(feedback_text).strip()
                sentiment_result = analyze_sentiment(analysis_text)
                is_flagged = is_negative_feedback(analysis_text, rating)

                processed_entry = {
                    'timestamp': timestamp,
                    'email': email,
                    'student_name': student_name,
                    'session_feedback': feedback_text,
                    'instructor': instructor,
                    'rating': float(rating) if rating and str(rating).replace('.', '').isdigit() else 0,
                    'additional_comments': additional_comments,
                    'sentiment': sentiment_result['sentiment'],
                    'confidence': sentiment_result['confidence'],
                    'sentiment_score': sentiment_result['combined_score'],
                    'is_flagged': is_flagged
                }
                new_processed_data.append(processed_entry)

                if is_flagged:
                    new_flagged_entries.append({
                        'student_name': student_name,
                        'instructor': instructor,
                        'feedback': feedback_text,
                        'rating': processed_entry['rating'],
                        'sentiment': sentiment_result['sentiment'],
                        'confidence': sentiment_result['confidence'],
                        'timestamp': timestamp
                    })

            except Exception as e:
                logger.warning(f"Error processing row {index}: {str(e)}")
                continue

        existing_data = checkpoint.get('processed_data', []) if checkpoint else []
        all_processed_data = merge_data(existing_data, new_processed_data)

        existing_flagged = checkpoint.get('flagged_entries', []) if checkpoint else []
        all_flagged_entries = merge_data(existing_flagged, new_flagged_entries)

        total_responses = len(all_processed_data)
        if total_responses == 0:
            raise ValueError("No valid data found to process")

        sentiment_counts = {'positive': 0, 'negative': 0, 'neutral': 0}
        total_rating = 0
        valid_ratings = 0

        for entry in all_processed_data:
            sentiment_counts[entry['sentiment']] += 1
            if entry['rating'] > 0:
                total_rating += entry['rating']
                valid_ratings += 1

        average_rating = total_rating / valid_ratings if valid_ratings > 0 else 0

        instructor_stats = {}
        for entry in all_processed_data:
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

        formatted_instructor_stats.sort(key=lambda x: (-x['negative_count'], x['average_rating']))

        result = {
            'summary': {
                'total_responses': total_responses,
                'negative_count': sentiment_counts['negative'],
                'positive_count': sentiment_counts['positive'],
                'neutral_count': sentiment_counts['neutral'],
                'average_rating': round(average_rating, 2)
            },
            'instructor_stats': formatted_instructor_stats,
            'flagged_entries': sorted(all_flagged_entries, key=lambda x: x['confidence'], reverse=True),
            'all_data': all_processed_data,
            'processing_info': {
                'new_records_processed': len(new_processed_data),
                'total_records': total_responses,
                'last_update': datetime.now().isoformat(),
                'incremental': True
            }
        }
        save_checkpoint(url, result)
        return result
    except Exception as e:
        logger.error(f"Error in process_dataframe_incremental: {str(e)}")
        raise Exception(f"Failed to process data: {str(e)}")





def process_sheets_data(url):
    """Fetch and process Google Sheets data with incremental processing"""
    try:
        # Fetch data from Google Sheets API
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        if not isinstance(data, list) or len(data) == 0:
            raise ValueError("Invalid data format or empty dataset")
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Use incremental processing
        return process_dataframe_incremental(df, url)
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching Google Sheets data: {str(e)}")
        raise Exception(f"Failed to fetch data from Google Sheets: {str(e)}")
    except Exception as e:
        logger.error(f"Error processing Google Sheets data: {str(e)}")
        raise Exception(f"Failed to process data: {str(e)}")

def process_csv_data(csv_content):
    """Process CSV data (no incremental processing for CSV)"""
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
    try:
        # ✅ same expanded mapping here too
        column_mapping = {
            'Timestamp': ['timestamp', 'date', 'time'],
            'Email Address': ['email', 'email_address', 'student_email', 'Email Address'],
            'Student Name': ['student_name', 'name', 'student', 'Student Name'],
            'How do you feel about the session': [
                'session_feedback', 'feedback', 'session_feeling', 'how_do_you_feel',
                'How do you feel about the session', 'How do you feel about the session?'
            ],
            'Select the Instructor': [
                'instructor', 'teacher', 'instructor_name',
                'Select the Instructor', 'Select the instructor'
            ],
            'How do you rate Session': [
                'rating', 'session_rating', 'score',
                'How do you rate Session', 'How do you rate the session', 'How do you rate the session?'
            ],
            'Anything you want to convey': [
                'additional_comments', 'comments', 'convey', 'additional_feedback',
                'Anything you want to convey', 'Anything you want to convey?'
            ]
        }

        standardized_columns = {}
        for standard_name, possible_names in column_mapping.items():
            for col in df.columns:
                if col == standard_name or col.strip().lower() in [name.strip().lower() for name in possible_names]:
                    standardized_columns[standard_name] = col
                    break

        processed_data = []
        flagged_entries = []

        for index, row in df.iterrows():
            try:
                timestamp = row.get(standardized_columns.get('Timestamp', ''), '')
                email = row.get(standardized_columns.get('Email Address', ''), '')
                student_name = row.get(standardized_columns.get('Student Name', ''), '')
                feedback_text = row.get(standardized_columns.get('How do you feel about the session', ''), '')
                instructor = row.get(standardized_columns.get('Select the Instructor', ''), '')
                rating = row.get(standardized_columns.get('How do you rate Session', ''), 0)
                additional_comments = row.get(standardized_columns.get('Anything you want to convey', ''), '')

                analysis_text = str(feedback_text).strip()
                sentiment_result = analyze_sentiment(analysis_text)
                is_flagged = is_negative_feedback(analysis_text, rating)

                processed_entry = {
                    'timestamp': timestamp,
                    'email': email,
                    'student_name': student_name,
                    'session_feedback': feedback_text,
                    'instructor': instructor,
                    'rating': float(rating) if rating and str(rating).replace('.', '').isdigit() else 0,
                    'additional_comments': additional_comments,
                    'sentiment': sentiment_result['sentiment'],
                    'confidence': sentiment_result['confidence'],
                    'sentiment_score': sentiment_result['combined_score'],
                    'is_flagged': is_flagged
                }
                processed_data.append(processed_entry)

                if is_flagged:
                    flagged_entries.append({
                        'student_name': student_name,
                        'instructor': instructor,
                        'feedback': feedback_text,
                        'rating': processed_entry['rating'],
                        'sentiment': sentiment_result['sentiment'],
                        'confidence': sentiment_result['confidence'],
                        'timestamp': timestamp
                    })
            except Exception as e:
                logger.warning(f"Error processing row {index}: {str(e)}")
                continue

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

        formatted_instructor_stats = []
        for instructor, stats in instructor_stats.items():
            avg_rating = stats['total_rating'] / stats['valid_ratings'] if stats['valid_ratings'] > 0 else 0
            avg_sentiment = sum(stats['sentiment_scores']) / len(stats['sentiment_scores']) if stats['sentiment_scores'] else 0

            formatted_instructor_stats.append({
                'instructor': instructor,
                'total_responses': stats['total_responses'],
                'average_rating': round(avg_rating, 2),
                'negative_count': stats['negative_count'],  # ✅ added here
                'sentiment_score': round(avg_sentiment, 3)
            })

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
    """Process Google Sheets data with incremental processing"""
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
        
        logger.info(f"Successfully processed {result['processing_info']['new_records_processed']} new records from {result['summary']['total_responses']} total responses")
        
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

@app.route('/process-multiple-sheets', methods=['POST'])
def process_multiple_sheets():
    """Process multiple Google Sheets with separate incremental processing"""
    try:
        data = request.get_json()
        
        if not data or 'urls' not in data or not isinstance(data['urls'], list):
            return jsonify({'error': 'URLs list is required'}), 400
        
        urls = [url.strip() for url in data['urls'] if url.strip()]
        if not urls:
            return jsonify({'error': 'At least one valid URL is required'}), 400
        
        # Validate all URLs
        for url in urls:
            if not (url.startswith('http://') or url.startswith('https://')):
                return jsonify({'error': f'Invalid URL format: {url}'}), 400
        
        logger.info(f"Processing {len(urls)} Google Sheets URLs")
        
        results = {}
        total_new_records = 0
        total_records = 0
        
        for url in urls:
            try:
                logger.info(f"Processing sheet: {url}")
                result = process_sheets_data(url)
                
                # Extract sheet identifier from URL
                sheet_id = extract_sheet_id(url)
                results[sheet_id] = {
                    'url': url,
                    'status': 'success',
                    'data': result,
                    'processing_info': {
                        'new_records_processed': result['processing_info']['new_records_processed'],
                        'total_records': result['summary']['total_responses'],
                        'last_update': result['processing_info']['last_update']
                    }
                }
                
                total_new_records += result['processing_info']['new_records_processed']
                total_records += result['summary']['total_responses']
                
            except Exception as e:
                logger.error(f"Error processing sheet {url}: {str(e)}")
                sheet_id = extract_sheet_id(url)
                results[sheet_id] = {
                    'url': url,
                    'status': 'error',
                    'error': str(e)
                }
        
        # Overall summary
        summary = {
            'total_sheets': len(urls),
            'successful_sheets': len([r for r in results.values() if r['status'] == 'success']),
            'failed_sheets': len([r for r in results.values() if r['status'] == 'error']),
            'total_new_records_processed': total_new_records,
            'total_records': total_records,
            'processing_time': datetime.now().isoformat()
        }
        
        return jsonify({
            'summary': summary,
            'sheets': results
        })
        
    except Exception as e:
        logger.error(f"Error in process_multiple_sheets: {str(e)}")
        return jsonify({'error': str(e)}), 500

def extract_sheet_id(url):
    """Extract a meaningful identifier from Google Sheets URL"""
    try:
        # Try to extract sheet ID from Google Sheets URL
        if '/spreadsheets/d/' in url:
            # Format: https://docs.google.com/spreadsheets/d/{sheet_id}/edit
            parts = url.split('/spreadsheets/d/')
            if len(parts) > 1:
                sheet_id = parts[1].split('/')[0]
                return f"sheet_{sheet_id[:8]}"  # Use first 8 characters
        
        # Fallback: use URL hash
        url_hash = hashlib.md5(url.encode()).hexdigest()
        return f"sheet_{url_hash[:8]}"
        
    except Exception:
        # Final fallback
        url_hash = hashlib.md5(url.encode()).hexdigest()
        return f"sheet_{url_hash[:8]}"

@app.route('/list-checkpoints', methods=['GET'])
def list_checkpoints():
    """List all available checkpoints"""
    try:
        checkpoints = []
        
        if os.path.exists(CHECKPOINT_DIR):
            for filename in os.listdir(CHECKPOINT_DIR):
                if filename.startswith('checkpoint_') and filename.endswith('.json'):
                    checkpoint_file = os.path.join(CHECKPOINT_DIR, filename)
                    try:
                        with open(checkpoint_file, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                            
                        # Extract URL from checkpoint data if available
                        url = data.get('url', 'Unknown URL')
                        sheet_id = extract_sheet_id(url)
                        
                        checkpoints.append({
                            'sheet_id': sheet_id,
                            'filename': filename,
                            'url': url,
                            'total_records': data.get('summary', {}).get('total_responses', 0),
                            'last_update': data.get('processing_info', {}).get('last_update', 'Unknown'),
                            'file_size': os.path.getsize(checkpoint_file),
                            'created': datetime.fromtimestamp(os.path.getctime(checkpoint_file)).isoformat()
                        })
                    except Exception as e:
                        logger.warning(f"Error reading checkpoint {filename}: {str(e)}")
                        checkpoints.append({
                            'sheet_id': filename.replace('.json', ''),
                            'filename': filename,
                            'url': 'Error reading file',
                            'total_records': 0,
                            'last_update': 'Error',
                            'file_size': 0,
                            'created': 'Unknown'
                        })
        
        return jsonify({
            'total_checkpoints': len(checkpoints),
            'checkpoints': checkpoints
        })
        
    except Exception as e:
        logger.error(f"Error listing checkpoints: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/clear-all-checkpoints', methods=['POST'])
def clear_all_checkpoints():
    """Clear all checkpoint data"""
    try:
        cleared_count = 0
        
        if os.path.exists(CHECKPOINT_DIR):
            for filename in os.listdir(CHECKPOINT_DIR):
                if filename.startswith('checkpoint_') and filename.endswith('.json'):
                    checkpoint_file = os.path.join(CHECKPOINT_DIR, filename)
                    try:
                        os.remove(checkpoint_file)
                        cleared_count += 1
                        logger.info(f"Cleared checkpoint: {filename}")
                    except Exception as e:
                        logger.warning(f"Error clearing checkpoint {filename}: {str(e)}")
        
        return jsonify({
            'message': f'Successfully cleared {cleared_count} checkpoints',
            'cleared_count': cleared_count
        })
        
    except Exception as e:
        logger.error(f"Error clearing all checkpoints: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/get-checkpoint-info', methods=['POST'])
def get_checkpoint_info():
    """Get detailed information about a specific checkpoint"""
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'URL is required'}), 400
        
        url = data['url'].strip()
        checkpoint_file = get_checkpoint_filename(url)
        
        if not os.path.exists(checkpoint_file):
            return jsonify({'error': 'No checkpoint found for this URL'})
        
        try:
            with open(checkpoint_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Get file stats
            file_stats = os.stat(checkpoint_file)
            
            return jsonify({
                'url': url,
                'filename': os.path.basename(checkpoint_file),
                'file_size': file_stats.st_size,
                'created': datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                'modified': datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                'data_summary': {
                    'total_records': data.get('summary', {}).get('total_responses', 0),
                    'sentiment_breakdown': {
                        'positive': data.get('summary', {}).get('positive_count', 0),
                        'neutral': data.get('summary', {}).get('neutral_count', 0),
                        'negative': data.get('summary', {}).get('negative_count', 0)
                    },
                    'average_rating': data.get('summary', {}).get('average_rating', 0),
                    'instructors_count': len(data.get('instructor_stats', [])),
                    'flagged_entries': len(data.get('flagged_entries', []))
                },
                'processing_info': data.get('processing_info', {})
            })
            
        except Exception as e:
            logger.error(f"Error reading checkpoint file: {str(e)}")
            return jsonify({'error': f'Error reading checkpoint file: {str(e)}'}), 500
        
    except Exception as e:
        logger.error(f"Error getting checkpoint info: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/clear-checkpoint', methods=['POST'])
def clear_checkpoint():
    """Clear checkpoint data for a specific URL"""
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'URL is required'}), 400
        
        url = data['url'].strip()
        checkpoint_file = get_checkpoint_filename(url)
        
        if os.path.exists(checkpoint_file):
            os.remove(checkpoint_file)
            logger.info(f"Checkpoint cleared for URL: {url}")
            return jsonify({'message': 'Checkpoint cleared successfully'})
        else:
            return jsonify({'message': 'No checkpoint found for this URL'})
        
    except Exception as e:
        logger.error(f"Error clearing checkpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
