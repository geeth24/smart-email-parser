from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from . import crud, schemas, models
from .database import get_db
from .gmail import create_oauth_flow, get_user_info
from google.oauth2.credentials import Credentials
import os
from datetime import datetime, timedelta
from typing import Dict, Optional
import json

router = APIRouter(prefix="/auth", tags=["auth"])

# OAuth2 client ID and secret from Google Cloud Console
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
FRONTEND_REDIRECT_URL = os.getenv("FRONTEND_REDIRECT_URL", "http://localhost:3000/auth/callback")


@router.get("/login")
async def login():
    """
    Redirect the user to Google's OAuth2 login page.
    """
    flow = create_oauth_flow()
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent"  # Force to show consent screen to get refresh_token
    )
    
    # Return the authorization URL to the frontend
    return {"auth_url": authorization_url}


@router.get("/callback")
async def callback(request: Request, db: Session = Depends(get_db)):
    """
    Handle the OAuth2 callback from Google.
    """
    # Get the authorization code from the request
    code = request.query_params.get("code")
    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code not provided"
        )
    
    # Exchange the authorization code for credentials
    flow = create_oauth_flow()
    flow.fetch_token(code=code)
    
    # Get credentials from the flow
    credentials = flow.credentials
    
    # Get user info from Google
    user_info = get_user_info(credentials)
    email = user_info.get("email")
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not get user email from Google"
        )
    
    # Check if user exists in database
    db_user = crud.get_user_by_email(db, email)
    
    # If user doesn't exist, create a new one
    if not db_user:
        user_create = schemas.UserCreate(email=email)
        db_user = crud.create_user(db, user_create)
    
    # Update user tokens
    token_expiry = datetime.now() + timedelta(seconds=credentials.expiry.timestamp() - datetime.now().timestamp())
    token_info = schemas.TokenInfo(
        access_token=credentials.token,
        refresh_token=credentials.refresh_token,
        token_expiry=token_expiry
    )
    crud.update_user_tokens(db, db_user.id, token_info)
    
    # Create a redirect URL to the frontend with user ID
    redirect_url = f"{FRONTEND_REDIRECT_URL}?user_id={db_user.id}"
    
    return RedirectResponse(url=redirect_url)


@router.get("/user/{user_id}")
async def get_user_status(user_id: int, db: Session = Depends(get_db)):
    """
    Get user information and authentication status.
    """
    user = crud.get_user(db, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if token is expired
    token_expired = user.is_token_expired()
    
    return {
        "id": user.id,
        "email": user.email,
        "is_authenticated": not token_expired
    }


@router.post("/logout/{user_id}")
async def logout(user_id: int, db: Session = Depends(get_db)):
    """
    Log the user out by invalidating their tokens.
    """
    user = crud.get_user(db, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Clear tokens
    token_info = schemas.TokenInfo(
        access_token="",
        refresh_token="",
        token_expiry=datetime.now() - timedelta(days=1)  # Set to expired
    )
    crud.update_user_tokens(db, user_id, token_info)
    
    return {"message": "Logged out successfully"} 