from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict
from datetime import datetime, date


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    pass


class TokenInfo(BaseModel):
    access_token: str
    refresh_token: str
    token_expiry: datetime


class User(UserBase):
    id: int
    is_token_expired: bool

    class Config:
        orm_mode = True


class EntityBase(BaseModel):
    text: str
    type: str


class Entity(EntityBase):
    id: int

    class Config:
        orm_mode = True


class KeywordBase(BaseModel):
    word: str
    score: float


class Keyword(KeywordBase):
    id: int

    class Config:
        orm_mode = True


class ActionItemBase(BaseModel):
    text: str
    deadline: Optional[datetime] = None


class ActionItem(ActionItemBase):
    id: int
    completed: bool = False

    class Config:
        orm_mode = True


class ContactBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    position: Optional[str] = None
    company: Optional[str] = None


class Contact(ContactBase):
    id: int

    class Config:
        orm_mode = True


class EmailBase(BaseModel):
    gmail_id: str
    subject: str
    sender: str
    sender_email: EmailStr
    received_at: datetime


class EmailCreate(EmailBase):
    raw_content: str
    clean_content: str
    summary: str
    is_important: Optional[bool] = False
    is_starred: Optional[bool] = False
    category: Optional[str] = None
    sentiment: Optional[str] = None
    sentiment_score: Optional[float] = None
    priority_score: Optional[float] = None
    needs_followup: Optional[bool] = False
    followup_date: Optional[date] = None


class EmailSummary(EmailBase):
    id: int
    summary: str
    is_important: bool
    is_starred: Optional[bool] = False
    category: Optional[str] = None
    sentiment: Optional[str] = None
    priority_score: Optional[float] = None
    needs_followup: Optional[bool] = False

    class Config:
        orm_mode = True


class EmailDetail(EmailSummary):
    clean_content: str
    sentiment_score: Optional[float] = None
    followup_date: Optional[date] = None
    keywords: List[Keyword]
    entities: List[Entity]
    action_items: List[ActionItem] = []
    contacts: List[Contact] = []

    class Config:
        orm_mode = True 