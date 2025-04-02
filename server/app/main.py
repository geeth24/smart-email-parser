from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
from . import models, schemas, crud, gmail
from .database import engine, get_db
from .auth import router as auth_router
from typing import List, Optional
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Email Parser API",
    description="API for summarizing and extracting insights from your important emails",
    version="0.1.0"
)

origins = [
    "http://localhost:3000",
    "https://smart-email-parser.geeth.app",
]
# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include auth routes
app.include_router(auth_router)


@app.get("/")
async def root():
    return {"message": "Smart Email Parser API"}


@app.post("/emails/fetch/{user_id}", response_model=dict)
async def fetch_emails(
    user_id: int, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Fetch and process new emails for a user.
    """
    # Check if user exists
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if token is valid
    if user.is_token_expired():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token expired. Please log in again."
        )
    
    # Process emails in the background
    background_tasks.add_task(gmail.process_emails_for_user, user_id, db)
    
    return {"message": "Email fetching started in the background"}


@app.get("/emails/starred/{user_id}", response_model=List[schemas.EmailSummary])
async def get_starred_emails(
    user_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get starred emails for a user.
    """
    # Check if user exists
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Use the CRUD function to get starred emails
    emails = crud.get_starred_emails(db, user_id, skip, limit)
    
    return emails


@app.get("/emails/important/{user_id}", response_model=List[schemas.EmailSummary])
async def get_important_emails(
    user_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get emails marked as important for a user.
    """
    # Check if user exists
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    emails = crud.get_important_emails(db, user_id, skip, limit)
    
    return emails


@app.get("/emails/category/{user_id}/{category}", response_model=List[schemas.EmailSummary])
async def get_emails_by_category(
    user_id: int,
    category: str,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get emails filtered by category.
    """
    # Check if user exists
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Query emails by category
    emails = db.query(models.Email).filter(
        models.Email.user_id == user_id,
        models.Email.category == category
    ).order_by(models.Email.received_at.desc()).offset(skip).limit(limit).all()
    
    return emails


@app.get("/emails/sentiment/{user_id}/{sentiment}", response_model=List[schemas.EmailSummary])
async def get_emails_by_sentiment(
    user_id: int,
    sentiment: str,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get emails filtered by sentiment.
    """
    # Check if user exists
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Query emails by sentiment
    emails = db.query(models.Email).filter(
        models.Email.user_id == user_id,
        models.Email.sentiment == sentiment
    ).order_by(models.Email.received_at.desc()).offset(skip).limit(limit).all()
    
    return emails


@app.get("/email-detail/{user_id}/{email_id}", response_model=schemas.EmailDetail)
async def get_email_detail(
    user_id: int,
    email_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific email.
    """
    # Check if user exists
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get email
    email = crud.get_email(db, email_id)
    if not email or email.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    return email


@app.get("/emails/{user_id}", response_model=List[schemas.EmailSummary])
async def get_emails(
    user_id: int, 
    skip: int = 0, 
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get a list of processed emails for a user.
    """
    # Check if user exists
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    emails = crud.get_emails(db, user_id, skip, limit)
    return emails


@app.get("/emails-followup", response_model=List[schemas.EmailSummary])
async def get_followup_emails(
    user_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get emails that need follow-up.
    """
    # Check if user exists
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Query emails needing follow-up
    emails = db.query(models.Email).filter(
        models.Email.user_id == user_id,
        models.Email.needs_followup == True
    ).order_by(models.Email.followup_date).offset(skip).limit(limit).all()
    
    return emails


@app.get("/entities/{user_id}", response_model=List[schemas.Entity])
async def get_entities(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a list of all unique entities found in the user's emails.
    """
    # Check if user exists
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get all emails for this user
    emails = crud.get_emails(db, user_id, skip=0, limit=1000)
    
    # Collect all unique entities
    entities = set()
    for email in emails:
        for entity in email.entities:
            entities.add(entity)
    
    return list(entities)


@app.get("/keywords/{user_id}", response_model=List[schemas.Keyword])
async def get_keywords(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a list of all unique keywords found in the user's emails.
    """
    # Check if user exists
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get all emails for this user
    emails = crud.get_emails(db, user_id, skip=0, limit=1000)
    
    # Collect all unique keywords
    keywords = {}
    for email in emails:
        for keyword in email.keywords:
            if keyword.word in keywords:
                # Update score to the higher one
                if keyword.score > keywords[keyword.word].score:
                    keywords[keyword.word] = keyword
            else:
                keywords[keyword.word] = keyword
    
    return list(keywords.values())


@app.get("/user-action-items", response_model=List[schemas.ActionItem])
async def get_user_action_items(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    completed: Optional[bool] = False,
    db: Session = Depends(get_db)
):
    """
    Get all action items from a user's emails.
    """
    # Check if user exists
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get the user's emails
    emails = crud.get_emails(db, user_id)
    
    # Get unique action items from those emails
    action_item_ids = set()
    action_items = []
    
    for email in emails:
        for action_item in email.action_items:
            if action_item.id not in action_item_ids and action_item.completed == completed:
                action_item_ids.add(action_item.id)
                action_items.append(action_item)
    
    # Sort by deadline (if available) and apply pagination
    sorted_items = sorted(
        action_items, 
        key=lambda item: item.deadline if item.deadline else datetime.max
    )
    
    return sorted_items[skip:skip+limit]


@app.patch("/action-items/{action_item_id}", response_model=schemas.ActionItem)
async def update_action_item(
    action_item_id: int,
    completed: bool,
    db: Session = Depends(get_db)
):
    """
    Update the completion status of an action item.
    """
    action_item = crud.update_action_item_status(db, action_item_id, completed)
    if not action_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action item not found"
        )
    
    return action_item


@app.get("/contacts/{user_id}", response_model=List[schemas.Contact])
async def get_user_contacts(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all contacts extracted from a user's emails.
    """
    # Check if user exists
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    contacts = crud.get_user_contacts(db, user_id, skip, limit)
    return contacts


@app.get("/email-statistics/{user_id}")
async def get_email_statistics(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get statistics about a user's emails.
    """
    # Check if user exists
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get all emails for the user
    emails = crud.get_emails(db, user_id)
    
    # Calculate statistics
    total_emails = len(emails)
    categories = {}
    sentiments = {}
    priority_distribution = {
        "low": 0,  # 1-3
        "medium": 0,  # 4-7
        "high": 0  # 8-10
    }
    followup_needed = 0
    
    for email in emails:
        # Count by category
        if email.category:
            categories[email.category] = categories.get(email.category, 0) + 1
        
        # Count by sentiment
        if email.sentiment:
            sentiments[email.sentiment] = sentiments.get(email.sentiment, 0) + 1
        
        # Count by priority
        if email.priority_score:
            if email.priority_score <= 3:
                priority_distribution["low"] += 1
            elif email.priority_score <= 7:
                priority_distribution["medium"] += 1
            else:
                priority_distribution["high"] += 1
        
        # Count followups
        if email.needs_followup:
            followup_needed += 1
    
    return {
        "total_emails": total_emails,
        "categories": categories,
        "sentiments": sentiments,
        "priority_distribution": priority_distribution,
        "followup_needed": followup_needed
    } 