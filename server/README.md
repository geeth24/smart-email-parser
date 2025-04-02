# Smart Email Parser Backend

This is the backend for the Smart Email Parser application, which analyzes and extracts insights from your important emails.

## Features

- Gmail OAuth2 integration to fetch starred/important emails
- NLP pipeline for summarization, entity extraction, and keyword identification
- RESTful API with FastAPI
- Database storage with SQLAlchemy

## Tech Stack

- **API Framework**: FastAPI
- **Authentication**: Google OAuth2
- **NLP Processing**: spaCy, NLTK, sumy, scikit-learn
- **Database**: SQLite (local development) / PostgreSQL (production)
- **ORM**: SQLAlchemy with Alembic migrations

## Setup

### Prerequisites

- Python 3.10+
- Google Cloud Platform account with Gmail API enabled
- OAuth2 client credentials

### Environment Setup

1. Clone the repository
2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Download required NLP models:
   ```
   python -m spacy download en_core_web_sm
   python -m nltk.downloader punkt stopwords
   ```
5. Create a `.env` file from the template:
   ```
   cp .env.example .env
   ```
6. Update the `.env` file with your Google OAuth credentials

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Gmail API
4. Create OAuth2 credentials (Web application type)
5. Add your redirect URI (e.g., `http://localhost:8000/auth/callback`)
6. Copy the client ID and client secret to your `.env` file

## Running the Application

### Development

```
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

### Using Docker

```
docker build -t smart-email-backend .
docker run -p 8000:8000 -e PORT=8000 smart-email-backend
```

## API Documentation

FastAPI automatically generates API documentation. After starting the server, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Key Endpoints

- `GET /auth/login` - Redirect to Google login
- `GET /auth/callback` - OAuth callback from Google
- `GET /auth/user/{user_id}` - Get user info
- `POST /emails/fetch/{user_id}` - Fetch and process new starred emails
- `GET /emails/{user_id}` - List processed emails
- `GET /emails/{user_id}/{email_id}` - Get detailed email info
- `GET /entities/{user_id}` - Get all unique entities
- `GET /keywords/{user_id}` - Get all unique keywords

## Database Migrations

The project uses Alembic for database migrations:

```
# Generate a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head 