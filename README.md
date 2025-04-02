# Smart Email Parser

A modern web application that uses AI and NLP to analyze your emails, providing summaries, entity recognition, and highlighting important messages.

## Features

- **Email Summaries**: Automatically generates concise summaries of email content
- **Entity Recognition**: Identifies people, organizations, locations, and dates mentioned in emails
- **Keyword Extraction**: Extracts important topics and terms for quick scanning
- **Action Item Detection**: Identifies tasks and to-dos embedded in email content
- **Important Email Detection**: Highlights urgent emails using Gmail flags and AI analysis
- **Follow-up Detection**: Identifies emails that need follow-up with suggested dates
- **Sentiment Analysis**: Analyzes tone and sentiment in emails
- **Contact Information Extraction**: Pulls out contact details from email content

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework for API development
- **SQLAlchemy**: SQL toolkit and ORM for database operations
- **spaCy & NLTK**: Natural language processing libraries for text analysis
- **sumy**: Text summarization library

### Frontend
- **Next.js**: React framework for building the web interface
- **React**: UI component library
- **shadcn/ui**: Component library for clean interface design
- **Lucide**: Icon library for consistent visual elements

## How It Works

The application connects to your Gmail account (with your permission) and processes your emails using natural language processing to:

1. Clean HTML and remove quoted replies
2. Generate concise summaries based on content type (general text, receipts, lists)
3. Extract named entities (people, organizations, locations)
4. Identify action items and follow-up needs
5. Analyze sentiment and priority
6. Extract contact information and keywords

## Setup and Installation

### Backend

1. Create a Python virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Download required NLP models:
   ```
   python -m spacy download en_core_web_sm
   python -m nltk.downloader punkt stopwords vader_lexicon
   ```

4. Configure environment variables in `.env`:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

5. Run migrations:
   ```
   cd server
   python -m migrations.add_is_important
   ```

6. Start the FastAPI server:
   ```
   uvicorn app.main:app --reload
   ```

### Frontend

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies with pnpm:
   ```
   pnpm install
   ```

3. Configure environment in `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```
   pnpm dev
   ```

5. Open your browser and go to http://localhost:3000

## Main Features in Detail

### Email Organization
The app provides several views for your emails:
- **All Emails**: Complete inbox view
- **Starred Emails**: Emails you've starred in Gmail
- **Important Emails**: Emails flagged as important (by Gmail or AI)
- **Follow-up Emails**: Emails that need follow-up actions

### Action Items
The app automatically detects tasks mentioned in your emails and presents them in a dedicated section where you can:
- View pending tasks extracted from emails
- Mark items as completed
- Track items with deadlines

### Email Analysis
For each email, the app provides:
- A concise summary of the content
- Extracted entities (people, organizations, locations, dates)
- Sentiment analysis (positive, negative, neutral)
- Priority score based on multiple factors
- Keywords and key topics
- Related contact information 