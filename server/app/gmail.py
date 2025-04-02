from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from typing import List, Dict, Any, Optional
import base64
from email.mime.text import MIMEText
import os
from .database import get_db
from . import crud, models
from . import nlp
from datetime import datetime
import email
from email.header import decode_header
from bs4 import BeautifulSoup
from . import schemas


# Gmail API setup
GMAIL_API_SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
]

# OAuth2 client ID and secret from Google Cloud Console
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/callback")


def create_oauth_flow() -> Flow:
    """
    Create an OAuth2 flow instance to manage the OAuth 2.0 Authorization Grant Flow.
    """
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT_URI]
            }
        },
        scopes=GMAIL_API_SCOPES
    )
    flow.redirect_uri = REDIRECT_URI
    return flow


def build_gmail_service(credentials: Credentials) -> Any:
    """
    Build and return a Gmail API service object.
    """
    return build('gmail', 'v1', credentials=credentials)


def get_user_info(credentials: Credentials) -> Dict[str, str]:
    """
    Get user information from Google.
    """
    service = build('oauth2', 'v2', credentials=credentials)
    user_info = service.userinfo().get().execute()
    return user_info


def parse_email_message(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse a Gmail message into a structured format.
    """
    # Get the message payload
    payload = message['payload']
    headers = payload.get('headers', [])
    
    # Extract email metadata
    email_data = {
        'id': message['id'],
        'thread_id': message['threadId'],
        'subject': '',
        'from': '',
        'from_email': '',
        'date': '',
        'body': ''
    }
    
    # Extract headers
    for header in headers:
        name = header['name'].lower()
        value = header['value']
        
        if name == 'subject':
            email_data['subject'] = value
        elif name == 'from':
            email_data['from'] = value
            # Try to extract email address
            if '<' in value and '>' in value:
                email_data['from_email'] = value.split('<')[1].split('>')[0]
            else:
                email_data['from_email'] = value
        elif name == 'date':
            email_data['date'] = value
    
    # Parse the body
    parts = payload.get('parts', [])
    
    # If no parts, check if the body is in the payload
    if not parts and 'body' in payload and 'data' in payload['body']:
        data = payload['body']['data']
        decoded_data = base64.urlsafe_b64decode(data).decode('utf-8')
        email_data['body'] = decoded_data
    else:
        # Process each part
        for part in parts:
            if part.get('mimeType') == 'text/plain' and 'body' in part and 'data' in part['body']:
                data = part['body']['data']
                decoded_data = base64.urlsafe_b64decode(data).decode('utf-8')
                email_data['body'] = decoded_data
                break
            
            # If no text/plain, try text/html
            if part.get('mimeType') == 'text/html' and 'body' in part and 'data' in part['body']:
                data = part['body']['data']
                decoded_data = base64.urlsafe_b64decode(data).decode('utf-8')
                # Use BeautifulSoup to extract text from HTML
                soup = BeautifulSoup(decoded_data, 'html.parser')
                email_data['body'] = decoded_data  # Keep HTML for cleaning later
                break
                
            # Handle nested parts (multipart)
            if part.get('mimeType', '').startswith('multipart/') and 'parts' in part:
                for nested_part in part['parts']:
                    if nested_part.get('mimeType') == 'text/plain' and 'body' in nested_part and 'data' in nested_part['body']:
                        data = nested_part['body']['data']
                        decoded_data = base64.urlsafe_b64decode(data).decode('utf-8')
                        email_data['body'] = decoded_data
                        break
                    
                    if nested_part.get('mimeType') == 'text/html' and 'body' in nested_part and 'data' in nested_part['body']:
                        data = nested_part['body']['data']
                        decoded_data = base64.urlsafe_b64decode(data).decode('utf-8')
                        email_data['body'] = decoded_data
                        break
    
    # Try to parse date string to datetime object
    try:
        if email_data['date']:
            # Parse email date format
            parsed_date = email.utils.parsedate_to_datetime(email_data['date'])
            email_data['date'] = parsed_date
        else:
            # If no date, use current time
            email_data['date'] = datetime.now()
    except Exception as e:
        # If parsing fails, use current time
        print(f"Error parsing date: {e}")
        email_data['date'] = datetime.now()
    
    return email_data


def fetch_starred_emails(credentials: Credentials, max_results: int = 10) -> List[Dict[str, Any]]:
    """
    Fetch starred emails from Gmail.
    """
    service = build_gmail_service(credentials)
    
    # Get list of starred message IDs
    results = service.users().messages().list(
        userId='me',
        q='is:starred',
        maxResults=max_results
    ).execute()
    
    messages = results.get('messages', [])
    
    # Fetch each message
    email_data_list = []
    for message in messages:
        msg = service.users().messages().get(userId='me', id=message['id']).execute()
        email_data = parse_email_message(msg)
        email_data_list.append(email_data)
    
    return email_data_list


def fetch_all_emails(credentials: Credentials, max_results: int = 25) -> List[Dict[str, Any]]:
    """
    Fetch all recent emails from Gmail (not just starred ones).
    """
    service = build_gmail_service(credentials)
    
    # Get list of recent message IDs
    results = service.users().messages().list(
        userId='me',
        maxResults=max_results
    ).execute()
    
    messages = results.get('messages', [])
    
    # Fetch each message
    email_data_list = []
    for message in messages:
        msg = service.users().messages().get(userId='me', id=message['id']).execute()
        email_data = parse_email_message(msg)
        email_data_list.append(email_data)
    
    return email_data_list


def fetch_important_emails(credentials: Credentials, max_results: int = 10) -> List[Dict[str, Any]]:
    """
    Fetch emails marked as important in Gmail.
    """
    service = build_gmail_service(credentials)
    
    # Get list of important message IDs
    results = service.users().messages().list(
        userId='me',
        q='is:important',
        maxResults=max_results
    ).execute()
    
    messages = results.get('messages', [])
    
    # Fetch each message
    email_data_list = []
    for message in messages:
        msg = service.users().messages().get(userId='me', id=message['id']).execute()
        email_data = parse_email_message(msg)
        # Mark as important since it comes from Gmail's important flag
        email_data['is_important'] = True
        email_data_list.append(email_data)
    
    return email_data_list


def process_emails_for_user(user_id: int, db_session):
    """
    Fetch and process emails for a user.
    """
    # Get user from database
    user = crud.get_user(db_session, user_id)
    if not user or user.is_token_expired():
        return {"error": "User not found or token expired"}
    
    # Create credentials object
    credentials = Credentials(
        token=user.access_token,
        refresh_token=user.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        scopes=GMAIL_API_SCOPES
    )
    
    # Fetch all emails instead of just starred
    all_emails = fetch_all_emails(credentials)
    
    # Fetch important emails
    important_emails = fetch_important_emails(credentials)
    
    # Fetch starred emails
    starred_emails = fetch_starred_emails(credentials)
    
    # Create sets of IDs for quick lookup
    starred_ids = {email['id'] for email in starred_emails}
    important_ids = {email['id'] for email in important_emails}
    
    # Combine all emails but avoid duplicates
    processed_ids = set()
    combined_emails = []
    
    for email_data in all_emails:
        if email_data['id'] not in processed_ids:
            # Mark as starred or important if applicable
            email_data['is_starred'] = email_data['id'] in starred_ids
            email_data['is_important'] = email_data['id'] in important_ids or email_data.get('is_important', False)
            
            processed_ids.add(email_data['id'])
            combined_emails.append(email_data)
    
    # Add any starred or important emails that weren't in the all_emails list
    for email_list, is_field in [(starred_emails, 'is_starred'), (important_emails, 'is_important')]:
        for email_data in email_list:
            if email_data['id'] not in processed_ids:
                email_data[is_field] = True
                processed_ids.add(email_data['id'])
                combined_emails.append(email_data)
    
    processed_count = 0
    for email_data in combined_emails:
        # Check if email already exists in database
        existing_email = crud.get_email_by_gmail_id(db_session, user_id, email_data['id'])
        if existing_email:
            # Update importance and starred flags if needed
            needs_update = False
            update_fields = {}
            
            if 'is_important' in email_data and existing_email.is_important != email_data['is_important']:
                update_fields['is_important'] = email_data['is_important']
                needs_update = True
                
            if 'is_starred' in email_data and existing_email.is_starred != email_data['is_starred']:
                update_fields['is_starred'] = email_data['is_starred']
                needs_update = True
                
            if needs_update:
                for field, value in update_fields.items():
                    setattr(existing_email, field, value)
                db_session.commit()
                
            continue
        
        # Process email through NLP pipeline
        nlp_result = nlp.process_email_content(
            email_data['body'], 
            email_data['subject']
        )
        
        # Create email in database with importance and starred flags
        is_important = email_data.get('is_important', False) or nlp_result['is_important']
        is_starred = email_data.get('is_starred', False)
        
        email_create = schemas.EmailCreate(
            gmail_id=email_data['id'],
            subject=email_data['subject'],
            sender=email_data['from'],
            sender_email=email_data['from_email'],
            received_at=email_data['date'],
            raw_content=email_data['body'],
            clean_content=nlp_result['clean_content'],
            summary=nlp_result['summary'],
            is_important=is_important,
            is_starred=is_starred,
            category=nlp_result['category'],
            sentiment=nlp_result['sentiment'],
            sentiment_score=nlp_result['sentiment_score'],
            priority_score=nlp_result['priority_score'],
            needs_followup=nlp_result['needs_followup'],
            followup_date=nlp_result['followup_date']
        )
        
        db_email = crud.create_email(db_session, email_create, user_id)
        
        # Add entities to email
        for entity in nlp_result['entities']:
            db_entity = crud.create_entity(db_session, entity)
            crud.add_entity_to_email(db_session, db_email.id, db_entity.id)
        
        # Add keywords to email
        for keyword in nlp_result['keywords']:
            db_keyword = crud.create_keyword(db_session, keyword)
            crud.add_keyword_to_email(db_session, db_email.id, db_keyword.id)
            
        # Add action items to email
        for action_item in nlp_result['action_items']:
            db_action_item = crud.create_action_item(db_session, action_item)
            crud.add_action_item_to_email(db_session, db_email.id, db_action_item.id)
            
        # Add contacts to email
        for contact in nlp_result['contacts']:
            db_contact = crud.create_contact(db_session, contact)
            crud.add_contact_to_email(db_session, db_email.id, db_contact.id)
        
        processed_count += 1
    
    return {"message": f"Processed {processed_count} new emails"} 