from sqlalchemy.orm import Session
from . import models, schemas
from typing import List, Optional
from datetime import datetime


# User operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user_tokens(db: Session, user_id: int, token_info: schemas.TokenInfo):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.access_token = token_info.access_token
        db_user.refresh_token = token_info.refresh_token
        db_user.token_expiry = token_info.token_expiry
        db.commit()
        db.refresh(db_user)
    return db_user


# Email operations
def get_emails(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Email).filter(
        models.Email.user_id == user_id
    ).order_by(models.Email.received_at.desc()).offset(skip).limit(limit).all()


def get_important_emails(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Email).filter(
        models.Email.user_id == user_id,
        models.Email.is_important == True
    ).order_by(models.Email.received_at.desc()).offset(skip).limit(limit).all()


def get_starred_emails(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Email).filter(
        models.Email.user_id == user_id,
        models.Email.is_starred == True
    ).order_by(models.Email.received_at.desc()).offset(skip).limit(limit).all()


def get_email(db: Session, email_id: int):
    return db.query(models.Email).filter(models.Email.id == email_id).first()


def get_email_by_gmail_id(db: Session, user_id: int, gmail_id: str):
    return db.query(models.Email).filter(
        models.Email.user_id == user_id,
        models.Email.gmail_id == gmail_id
    ).first()


def create_email(db: Session, email: schemas.EmailCreate, user_id: int):
    db_email = models.Email(
        user_id=user_id,
        gmail_id=email.gmail_id,
        subject=email.subject,
        sender=email.sender,
        sender_email=email.sender_email,
        received_at=email.received_at,
        raw_content=email.raw_content,
        clean_content=email.clean_content,
        summary=email.summary,
        is_important=email.is_important,
        is_starred=email.is_starred,
        category=email.category,
        sentiment=email.sentiment,
        sentiment_score=email.sentiment_score,
        priority_score=email.priority_score,
        needs_followup=email.needs_followup,
        followup_date=email.followup_date
    )
    db.add(db_email)
    db.commit()
    db.refresh(db_email)
    return db_email


def update_email_importance(db: Session, email_id: int, is_important: bool):
    """
    Update the importance flag of an email.
    """
    db_email = get_email(db, email_id)
    if db_email:
        db_email.is_important = is_important
        db.commit()
        db.refresh(db_email)
    return db_email


# Entity operations
def create_entity(db: Session, entity_data: schemas.EntityBase):
    db_entity = db.query(models.Entity).filter(
        models.Entity.text == entity_data.text,
        models.Entity.type == entity_data.type
    ).first()
    
    if not db_entity:
        db_entity = models.Entity(
            text=entity_data.text,
            type=entity_data.type
        )
        db.add(db_entity)
        db.commit()
        db.refresh(db_entity)
    
    return db_entity


def add_entity_to_email(db: Session, email_id: int, entity_id: int):
    email = get_email(db, email_id)
    entity = db.query(models.Entity).filter(models.Entity.id == entity_id).first()
    
    if email and entity and entity not in email.entities:
        email.entities.append(entity)
        db.commit()


# Keyword operations
def create_keyword(db: Session, keyword_data: schemas.KeywordBase):
    db_keyword = db.query(models.Keyword).filter(
        models.Keyword.word == keyword_data.word
    ).first()
    
    if not db_keyword:
        db_keyword = models.Keyword(
            word=keyword_data.word,
            score=keyword_data.score
        )
        db.add(db_keyword)
        db.commit()
        db.refresh(db_keyword)
    else:
        # Update the score if the keyword already exists
        db_keyword.score = keyword_data.score
        db.commit()
    
    return db_keyword


def add_keyword_to_email(db: Session, email_id: int, keyword_id: int):
    email = get_email(db, email_id)
    keyword = db.query(models.Keyword).filter(models.Keyword.id == keyword_id).first()
    
    if email and keyword and keyword not in email.keywords:
        email.keywords.append(keyword)
        db.commit()


# Action Item operations
def create_action_item(db: Session, action_item_data: schemas.ActionItemBase):
    db_action_item = models.ActionItem(
        text=action_item_data.text,
        deadline=action_item_data.deadline,
        completed=False
    )
    db.add(db_action_item)
    db.commit()
    db.refresh(db_action_item)
    return db_action_item


def add_action_item_to_email(db: Session, email_id: int, action_item_id: int):
    email = get_email(db, email_id)
    action_item = db.query(models.ActionItem).filter(models.ActionItem.id == action_item_id).first()
    
    if email and action_item and action_item not in email.action_items:
        email.action_items.append(action_item)
        db.commit()


def get_email_action_items(db: Session, email_id: int):
    email = get_email(db, email_id)
    if email:
        return email.action_items
    return []


def update_action_item_status(db: Session, action_item_id: int, completed: bool):
    db_action_item = db.query(models.ActionItem).filter(models.ActionItem.id == action_item_id).first()
    if db_action_item:
        db_action_item.completed = completed
        db.commit()
        db.refresh(db_action_item)
    return db_action_item


# Contact operations
def create_contact(db: Session, contact_data: schemas.ContactBase):
    # Check if contact already exists
    existing_contact = db.query(models.Contact).filter(
        models.Contact.email == contact_data.email
    ).first()
    
    if existing_contact:
        # Update contact info if needed
        if contact_data.name and contact_data.name != existing_contact.name:
            existing_contact.name = contact_data.name
            
        if contact_data.phone and contact_data.phone != existing_contact.phone:
            existing_contact.phone = contact_data.phone
            
        if contact_data.company and contact_data.company != existing_contact.company:
            existing_contact.company = contact_data.company
            
        if contact_data.position and contact_data.position != existing_contact.position:
            existing_contact.position = contact_data.position
            
        db.commit()
        db.refresh(existing_contact)
        return existing_contact
    
    # Create new contact
    db_contact = models.Contact(
        name=contact_data.name,
        email=contact_data.email,
        phone=contact_data.phone,
        position=contact_data.position,
        company=contact_data.company
    )
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact


def add_contact_to_email(db: Session, email_id: int, contact_id: int):
    email = get_email(db, email_id)
    contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    
    if email and contact and contact not in email.contacts:
        email.contacts.append(contact)
        db.commit()


def get_email_contacts(db: Session, email_id: int):
    email = get_email(db, email_id)
    if email:
        return email.contacts
    return []


def get_user_contacts(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """
    Get all contacts from a user's emails
    """
    # Get the user's emails
    emails = get_emails(db, user_id)
    
    # Get unique contacts from those emails
    contact_ids = set()
    contacts = []
    
    for email in emails:
        for contact in email.contacts:
            if contact.id not in contact_ids:
                contact_ids.add(contact.id)
                contacts.append(contact)
    
    # Sort by name and apply pagination
    sorted_contacts = sorted(contacts, key=lambda c: c.name)
    return sorted_contacts[skip:skip+limit] 