from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, DateTime, Table, Boolean, JSON, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

Base = declarative_base()

# Association tables
email_keyword = Table(
    'email_keyword',
    Base.metadata,
    Column('email_id', Integer, ForeignKey('emails.id')),
    Column('keyword_id', Integer, ForeignKey('keywords.id'))
)

email_entity = Table(
    'email_entity',
    Base.metadata,
    Column('email_id', Integer, ForeignKey('emails.id')),
    Column('entity_id', Integer, ForeignKey('entities.id'))
)

email_action_item = Table(
    'email_action_item',
    Base.metadata,
    Column('email_id', Integer, ForeignKey('emails.id')),
    Column('action_item_id', Integer, ForeignKey('action_items.id'))
)

email_contact = Table(
    'email_contact',
    Base.metadata,
    Column('email_id', Integer, ForeignKey('emails.id')),
    Column('contact_id', Integer, ForeignKey('contacts.id'))
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    access_token = Column(String)
    refresh_token = Column(String)
    token_expiry = Column(DateTime)
    
    emails = relationship("Email", back_populates="user")
    
    def is_token_expired(self):
        if not self.token_expiry:
            return True
        return self.token_expiry < datetime.datetime.now()


class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    gmail_id = Column(String, index=True)
    subject = Column(String)
    sender = Column(String)
    sender_email = Column(String)
    received_at = Column(DateTime)
    raw_content = Column(Text)
    clean_content = Column(Text)
    summary = Column(Text)
    is_important = Column(Boolean, default=False)
    is_starred = Column(Boolean, default=False)  # Track starred status from Gmail
    
    # New features
    category = Column(String)  # Meeting, Update, Sales, Personal, etc.
    sentiment = Column(String)  # Positive, Negative, Neutral, Urgent
    sentiment_score = Column(Float)  # -1.0 to 1.0 
    priority_score = Column(Float)  # 1-10 scale
    needs_followup = Column(Boolean, default=False)
    followup_date = Column(Date, nullable=True)
    
    user = relationship("User", back_populates="emails")
    keywords = relationship("Keyword", secondary=email_keyword, back_populates="emails")
    entities = relationship("Entity", secondary=email_entity, back_populates="emails")
    action_items = relationship("ActionItem", secondary=email_action_item, back_populates="emails")
    contacts = relationship("Contact", secondary=email_contact, back_populates="emails")


class Keyword(Base):
    __tablename__ = "keywords"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String, index=True)
    score = Column(Float)
    
    emails = relationship("Email", secondary=email_keyword, back_populates="keywords")


class Entity(Base):
    __tablename__ = "entities"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, index=True)
    type = Column(String)  # PERSON, ORG, GPE, DATE, etc.
    
    emails = relationship("Email", secondary=email_entity, back_populates="entities")


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String)
    deadline = Column(DateTime, nullable=True)
    completed = Column(Boolean, default=False)
    
    emails = relationship("Email", secondary=email_action_item, back_populates="action_items")


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)
    phone = Column(String, nullable=True)
    position = Column(String, nullable=True)
    company = Column(String, nullable=True)
    
    emails = relationship("Email", secondary=email_contact, back_populates="contacts") 