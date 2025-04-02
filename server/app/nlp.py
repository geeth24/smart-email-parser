import spacy
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
from nltk.sentiment import SentimentIntensityAnalyzer
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lex_rank import LexRankSummarizer
from sumy.summarizers.lsa import LsaSummarizer
from sklearn.feature_extraction.text import TfidfVectorizer
import re
import string
from typing import List, Dict, Tuple, Optional, Any
import html
from datetime import datetime, date, timedelta
import dateutil.parser
from . import schemas


# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('vader_lexicon')

# Initialize sentiment analyzer
sid = SentimentIntensityAnalyzer()

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # If the model isn't installed, we'll issue a warning
    # but the application should still be able to start
    print("Warning: spaCy model 'en_core_web_sm' not found. NLP features will not work.")
    print("Run 'python -m spacy download en_core_web_sm' to install it.")
    nlp = None


def clean_html(text: str) -> str:
    """
    Clean HTML from text and remove quoted replies.
    """
    # Decode HTML entities
    text = html.unescape(text)
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Remove quoted replies (lines starting with >)
    lines = text.split('\n')
    cleaned_lines = [line for line in lines if not line.strip().startswith('>')]
    
    # Remove email signatures (look for common patterns)
    # This is a simple approach and might need refinement
    sig_patterns = [
        r'--\s*$',  # -- at the end of a line
        r'Best regards',
        r'Regards,',
        r'Sincerely,',
        r'Thank you,',
        r'Thanks,',
        r'Sent from my iPhone',
        r'Get Outlook for',
    ]
    
    sig_idx = len(cleaned_lines)
    for pattern in sig_patterns:
        for i, line in enumerate(cleaned_lines):
            if re.search(pattern, line):
                sig_idx = min(sig_idx, i)
                break
    
    if sig_idx < len(cleaned_lines):
        cleaned_lines = cleaned_lines[:sig_idx]
    
    # Join lines back together
    text = '\n'.join(cleaned_lines)
    
    # Remove excess whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def summarize_text(text: str, sentences: int = 3) -> str:
    """
    Summarize text using multiple techniques for more robust and intelligent extraction.
    Uses a combination of NLP techniques to produce better summaries for various content types.
    """
    if not text or len(text.strip()) < 10:
        return ""
    
    # Step 1: Clean and preprocess the text
    # Remove excessive whitespace and normalize
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Step 2: Detect content type for specialized handling
    is_structured = False
    content_type = "general"
    
    # Check if content is structured (receipt, order, etc.)
    order_patterns = [
        r'order\s+number', r'subtotal', r'total', r'paid with', 
        r'items', r'\$\d+\.\d+', r'receipt', r'invoice', r'confirmation'
    ]
    if any(re.search(pattern, text.lower()) for pattern in order_patterns):
        content_type = "receipt"
        is_structured = True
    
    # Check if content is a list or bullet points
    list_patterns = [r'^\s*[\*\-•]\s+', r'^\s*\d+\.\s+', r'^\s*[a-z]\)\s+']
    if any(re.search(pattern, text, re.MULTILINE) for pattern in list_patterns):
        content_type = "list"
        is_structured = True
    
    # Step 3: Apply specialized handling for structured content
    if content_type == "receipt":
        return summarize_receipt(text)
    elif content_type == "list":
        return summarize_list(text, sentences)
    
    # Step 4: For general text, apply multiple summarization techniques and combine results
    
    # Get sentences
    sentences_list = nltk.sent_tokenize(text)
    if len(sentences_list) <= sentences:
        return text  # Return the full text if it's already short
    
    # Apply multiple summarization methods and combine them
    
    # Method 1: LexRank summarization (good for factual content)
    parser = PlaintextParser.from_string(text, Tokenizer("english"))
    lexrank_summarizer = LexRankSummarizer()
    lexrank_summary = lexrank_summarizer(parser.document, sentences)
    lexrank_result = set([str(s) for s in lexrank_summary])
    
    # Method 2: LSA summarization (good for finding underlying concepts)
    lsa_summarizer = LsaSummarizer()
    lsa_summary = lsa_summarizer(parser.document, sentences)
    lsa_result = set([str(s) for s in lsa_summary])
    
    # Method 3: Word frequency-based summarization
    freq_summary = summarize_by_word_importance(text, sentences)
    freq_result = set(freq_summary)
    
    # Combine results with priority given to sentences that appear in multiple methods
    combined_results = []
    
    # Add sentences that appear in all three methods
    for sentence in sentences_list:
        if (sentence in lexrank_result and 
            sentence in lsa_result and 
            sentence in freq_result):
            combined_results.append(sentence)
    
    # Add sentences that appear in at least two methods
    if len(combined_results) < sentences:
        for sentence in sentences_list:
            overlap_count = sum([
                sentence in lexrank_result,
                sentence in lsa_result,
                sentence in freq_result
            ])
            if overlap_count >= 2 and sentence not in combined_results:
                combined_results.append(sentence)
                if len(combined_results) >= sentences:
                    break
    
    # Add remaining sentences from prioritized methods until we reach target length
    remaining_methods = [lexrank_result, freq_result, lsa_result]
    while len(combined_results) < sentences and any(remaining_methods):
        for method in remaining_methods:
            for sentence in method:
                if sentence not in combined_results:
                    combined_results.append(sentence)
                    break
            if len(combined_results) >= sentences:
                break
        remaining_methods = [m for m in remaining_methods if m]
    
    # Sort sentences by their original order in the text
    sentence_indices = {s: i for i, s in enumerate(sentences_list)}
    combined_results.sort(key=lambda s: sentence_indices.get(s, 999))
    
    # If we still don't have enough sentences, add from the beginning
    if len(combined_results) < sentences:
        for s in sentences_list:
            if s not in combined_results:
                combined_results.append(s)
                if len(combined_results) >= sentences:
                    break
    
    return " ".join(combined_results[:sentences])


def summarize_receipt(text: str) -> str:
    """
    Specialized function to summarize receipt/order content.
    """
    lines = text.split('\n')
    
    # Extract key information
    order_number = None
    total = None
    location = None
    items = []
    merchant = None
    date = None
    
    # Look for merchant name (usually at the beginning or near "receipt from")
    merchant_patterns = [
        r'receipt\s+from\s+([\w\s]+)',
        r'([\w\s]+)\s+receipt',
        r'thank\s+you\s+for\s+shopping\s+at\s+([\w\s]+)',
        r'([\w\s]+)\s+order\s+confirmation'
    ]
    
    for pattern in merchant_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            merchant = match.group(1).strip()
            break
    
    # Try to find the date
    date_patterns = [
        r'date:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{2,4}',
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            date = match.group(0)
            break
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Try to extract order number
        order_match = re.search(r'order\s+(?:number|#)?\s*:?\s*(\w+)', line, re.IGNORECASE)
        if order_match and not order_number:
            order_number = order_match.group(1)
            
        # Try to extract total
        total_match = re.search(r'total\s*:?\s*\$?(\d+\.\d+)', line, re.IGNORECASE)
        if total_match and not total:
            total = total_match.group(1)
            
        # Try to extract location/address
        location_match = re.search(r'(?:at|from)?\s*(.+?(?:\b[A-Z]{2}\s+\d{5}\b|Ave|St|Rd|Blvd))', line)
        if location_match and not location and 'http' not in line.lower():
            potential_location = location_match.group(1).strip()
            # Only use if it looks like an address (contains numbers or address keywords)
            if re.search(r'\d+|\bst\b|\bave\b|\bblvd\b|\broad\b', potential_location.lower()):
                location = potential_location
            
        # Try to extract items (lines with $ amounts but not containing subtotal/tax/total)
        item_match = re.search(r'(.*?)\s*\$?(\d+\.\d+)(?:\s|$)', line)
        if item_match and not any(x in line.lower() for x in ['subtotal', 'tax', 'total', 'donation', 'tip']):
            item_name = item_match.group(1).strip()
            # Skip if the item name is too short or seems like a code/number
            if len(item_name) > 2 and not re.match(r'^\d+$', item_name):
                # Look for quantity indicator (e.g., "2 x")
                qty_match = re.match(r'^(\d+)\s*(?:x|\*)\s*(.+)$', item_name)
                if qty_match:
                    qty = qty_match.group(1)
                    name = qty_match.group(2)
                    items.append(f"{qty}x {name}")
                else:
                    items.append(item_name)
    
    # Build a concise summary
    summary_parts = []
    
    if merchant:
        summary_parts.append(f"{merchant}")
        
    if order_number:
        summary_parts.append(f"Order #{order_number}")
    
    if date:
        summary_parts.append(f"on {date}")
        
    if items:
        if len(items) <= 3:
            summary_parts.append(f"Items: {', '.join(items)}")
        else:
            summary_parts.append(f"{len(items)} items")
            
    if total:
        summary_parts.append(f"Total: ${total}")
        
    if location:
        summary_parts.append(f"at {location}")
        
    # Form the summary
    if summary_parts:
        return " - ".join(summary_parts)
        
    # If structured detection failed, try to extract key information
    key_info = []
    
    # Look for important information with price patterns
    price_pattern = r'\$\d+\.\d+'
    for line in lines:
        if re.search(price_pattern, line) and "total" in line.lower():
            key_info.append(line.strip())
            break
    
    # Add any lines containing "Order" and a number
    for line in lines:
        if "order" in line.lower() and re.search(r'\d+', line):
            key_info.append(line.strip())
            break
    
    # If we found some key information, return it
    if key_info:
        return " - ".join(key_info)
    
    # Last resort: take first few non-empty lines
    return " ".join([line.strip() for line in lines[:5] if line.strip()])


def summarize_list(text: str, sentences: int) -> str:
    """
    Specialized function to summarize list-style content.
    """
    lines = text.split('\n')
    list_items = []
    
    # Look for bullet points or numbered list items
    for line in lines:
        line = line.strip()
        if re.match(r'^\s*[\*\-•]\s+', line) or re.match(r'^\s*\d+\.\s+', line) or re.match(r'^\s*[a-z]\)\s+', line):
            # Clean up the bullet point/number
            clean_item = re.sub(r'^\s*[\*\-•\d\.][a-z]\)\s+', '', line).strip()
            if clean_item:
                list_items.append(clean_item)
    
    # If we found list items
    if list_items:
        # Get the title/context (text before the list)
        title = ""
        for line in lines:
            if line.strip() and not any(item in line for item in list_items):
                title = line.strip()
                break
        
        # Create summary
        if len(list_items) <= sentences:
            if title:
                return f"{title}: {', '.join(list_items)}"
            return ', '.join(list_items)
        else:
            if title:
                return f"{title}: {', '.join(list_items[:sentences-1])} and {len(list_items) - (sentences-1)} more items"
            return f"{', '.join(list_items[:sentences-1])} and {len(list_items) - (sentences-1)} more items"
    
    # If not a clear list, fall back to general summarization
    return summarize_by_word_importance(text, sentences)


def summarize_by_word_importance(text: str, num_sentences: int) -> List[str]:
    """
    Summarize text based on word frequency/importance.
    """
    # Tokenize the text
    sentences = nltk.sent_tokenize(text)
    
    # If text is already short, return it as is
    if len(sentences) <= num_sentences:
        return sentences
    
    # Get all words and their frequencies
    words = nltk.word_tokenize(text.lower())
    stop_words = set(stopwords.words('english'))
    words = [word for word in words if word.isalnum() and word not in stop_words]
    word_freq = {}
    
    for word in words:
        if word in word_freq:
            word_freq[word] += 1
        else:
            word_freq[word] = 1
    
    # Calculate sentence scores based on word frequencies
    sentence_scores = {}
    for i, sentence in enumerate(sentences):
        sentence_words = nltk.word_tokenize(sentence.lower())
        sentence_words = [word for word in sentence_words if word.isalnum() and word not in stop_words]
        
        # Consider sentence position (first and last sentences often important)
        position_weight = 1.0
        if i == 0 or i == len(sentences) - 1:
            position_weight = 1.5
        
        # Consider sentence length (not too short, not too long)
        length_weight = 1.0
        words_count = len(sentence_words)
        if words_count < 3:
            length_weight = 0.5
        elif words_count > 25:
            length_weight = 0.7
        
        # Calculate score based on word frequency
        score = 0
        for word in sentence_words:
            if word in word_freq:
                score += word_freq[word]
        
        # Normalize by sentence length and apply weights
        if len(sentence_words) > 0:
            score = (score / len(sentence_words)) * position_weight * length_weight
            
        sentence_scores[sentence] = score
    
    # Sort sentences by score and select top n
    sorted_sentences = sorted(sentence_scores.items(), key=lambda x: x[1], reverse=True)
    top_sentences = [s[0] for s in sorted_sentences[:num_sentences]]
    
    # Sort by original order in text
    sentence_indices = {s: i for i, s in enumerate(sentences)}
    top_sentences.sort(key=lambda s: sentence_indices.get(s, 999))
    
    return top_sentences


def extract_entities(text: str) -> List[schemas.EntityBase]:
    """
    Extract named entities from text using spaCy.
    """
    if not nlp or not text:
        return []
    
    doc = nlp(text)
    
    entities = []
    for ent in doc.ents:
        # Filter out entities with unwanted labels if needed
        if ent.label_ in ["PERSON", "ORG", "GPE", "DATE", "TIME", "MONEY", "PRODUCT", "LOC"]:
            entities.append(
                schemas.EntityBase(
                    text=ent.text,
                    type=ent.label_
                )
            )
    
    return entities


def extract_keywords(text: str, top_n: int = 10) -> List[schemas.KeywordBase]:
    """
    Extract keywords using TF-IDF.
    """
    if not text:
        return []
    
    # Tokenize and preprocess
    stop_words = set(stopwords.words('english'))
    
    # Remove punctuation and lowercase
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    
    # Tokenize
    tokens = word_tokenize(text)
    
    # Remove stopwords
    filtered_tokens = [word for word in tokens if word not in stop_words and len(word) > 2]
    
    # If text is too short, return empty list
    if len(filtered_tokens) < 5:
        return []
    
    # Create a document for TF-IDF
    document = [' '.join(filtered_tokens)]
    
    # Create and fit TF-IDF vectorizer
    vectorizer = TfidfVectorizer(max_features=top_n)
    tfidf_matrix = vectorizer.fit_transform(document)
    
    # Get feature names and their scores
    feature_names = vectorizer.get_feature_names_out()
    dense = tfidf_matrix.todense()
    scores = dense[0].tolist()[0]
    
    # Create a list of (word, score) tuples sorted by score
    word_scores = [(word, score) for word, score in zip(feature_names, scores)]
    word_scores.sort(key=lambda x: x[1], reverse=True)
    
    # Return top keywords as KeywordBase objects
    keywords = []
    for word, score in word_scores[:top_n]:
        if score > 0:  # Only include words with positive scores
            keywords.append(
                schemas.KeywordBase(
                    word=word,
                    score=float(score)
                )
            )
    
    return keywords


def detect_importance(subject: str, content: str, entities: List[schemas.EntityBase], keywords: List[schemas.KeywordBase]) -> bool:
    """
    Detect if an email is important based on several heuristics.
    Returns True if the email is deemed important, False otherwise.
    """
    importance_score = 0
    
    # Check for urgent words in subject
    urgent_words = ["urgent", "important", "critical", "deadline", "asap", "attention", "immediately", "required", "action"]
    subject_lower = subject.lower()
    
    for word in urgent_words:
        if word in subject_lower:
            importance_score += 2
    
    # Check for urgent expressions in content
    urgent_phrases = [
        "as soon as possible", 
        "urgent matter", 
        "immediate attention", 
        "please respond", 
        "need your input",
        "action required",
        "deadline",
        "by tomorrow",
        "high priority"
    ]
    
    content_lower = content.lower()
    for phrase in urgent_phrases:
        if phrase in content_lower:
            importance_score += 1
    
    # Check for important people in entities
    important_entity_types = ["PERSON", "ORG"]
    for entity in entities:
        if entity.type in important_entity_types:
            importance_score += 0.5
    
    # Check for important keywords
    if keywords:
        # Use the top 3 keywords
        top_keywords = sorted(keywords, key=lambda k: k.score, reverse=True)[:3]
        for keyword in top_keywords:
            importance_score += keyword.score * 0.5
    
    # Return True if importance score is above threshold
    return importance_score > 3


def categorize_email(subject: str, content: str, entities: List[schemas.EntityBase], keywords: List[schemas.KeywordBase]) -> str:
    """
    Categorize the email based on its content.
    Returns one of: Meeting, Sales, Update, Personal, Finance, Technical, Promotional, or Other
    """
    # Define category keywords
    categories = {
        "Meeting": ["meeting", "appointment", "schedule", "calendar", "discussion", "call", "zoom", "teams", "meet", "conference"],
        "Sales": ["sales", "deal", "offer", "discount", "purchase", "buy", "price", "demo", "product", "subscription", "trial"],
        "Update": ["update", "status", "progress", "report", "news", "change", "release", "announcement", "newsletter"],
        "Personal": ["friend", "family", "personal", "vacation", "holiday", "birthday", "congratulations", "invitation"],
        "Finance": ["invoice", "payment", "bill", "receipt", "financial", "transaction", "expense", "budget", "tax", "money"],
        "Technical": ["bug", "error", "issue", "technical", "support", "fix", "code", "development", "feature", "server", "api", "deploy"],
        "Promotional": ["promotional", "marketing", "newsletter", "offer", "free", "discount", "limited", "exclusive", "promotion"]
    }
    
    combined_text = f"{subject} {content}".lower()
    
    # Count category matches
    scores = {}
    for category, words in categories.items():
        score = 0
        for word in words:
            if re.search(r'\b' + word + r'\b', combined_text):
                score += 1
        scores[category] = score
    
    # Add entity-based clues
    meeting_entities = ["DATE", "TIME"]
    for entity in entities:
        if entity.type in meeting_entities:
            scores["Meeting"] += 0.5
    
    # Check for highest score
    max_score = 0
    selected_category = "Other"
    
    for category, score in scores.items():
        if score > max_score:
            max_score = score
            selected_category = category
    
    # If score too low, return Other
    if max_score < 2:
        return "Other"
    
    return selected_category


def analyze_sentiment(text: str) -> Tuple[str, float]:
    """
    Analyze the sentiment of the text.
    Returns tuple of (sentiment_label, sentiment_score)
    where sentiment_label is one of: Positive, Negative, Neutral, Urgent
    and sentiment_score is between -1.0 and 1.0
    """
    if not text:
        return "Neutral", 0.0
    
    # Get sentiment scores from VADER
    scores = sid.polarity_scores(text)
    compound_score = scores['compound']
    
    # Check for urgency signals
    urgency_terms = ["urgent", "asap", "immediately", "deadline", "critical", "emergency"]
    text_lower = text.lower()
    
    for term in urgency_terms:
        if re.search(r'\b' + term + r'\b', text_lower):
            return "Urgent", compound_score
    
    # Determine sentiment label based on compound score
    if compound_score >= 0.05:
        return "Positive", compound_score
    elif compound_score <= -0.05:
        return "Negative", compound_score
    else:
        return "Neutral", compound_score


def extract_action_items(text: str) -> List[schemas.ActionItemBase]:
    """
    Extract action items (tasks, to-dos) from the email text.
    Returns a list of ActionItemBase objects.
    """
    if not text or not nlp:
        return []
    
    action_items = []
    sentences = sent_tokenize(text)
    
    # Action verbs that often indicate tasks
    action_verbs = [
        "please", "would you", "could you", "can you", "need you to", "should", "must", 
        "review", "update", "create", "send", "share", "prepare", "complete", "follow up",
        "call", "email", "submit", "provide", "check", "confirm", "schedule", "organize"
    ]
    
    # Date patterns to identify deadlines
    date_patterns = [
        r'by\s(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)',
        r'by\s(january|february|march|april|may|june|july|august|september|october|november|december)\s\d{1,2}',
        r'by\s\d{1,2}/\d{1,2}(/\d{2,4})?',
        r'by\send\sof\s(day|week|month)',
        r'by\s(next|this)\s(week|month|monday|tuesday|wednesday|thursday|friday)'
    ]
    
    for sentence in sentences:
        sentence_lower = sentence.lower()
        
        # Check for action verbs
        if any(verb in sentence_lower for verb in action_verbs):
            # Extract potential deadline
            deadline = None
            for pattern in date_patterns:
                match = re.search(pattern, sentence_lower)
                if match:
                    # Try to parse the deadline text
                    try:
                        deadline_text = match.group(0).replace('by ', '')
                        # Handle relative dates
                        today = datetime.now()
                        
                        if 'tomorrow' in deadline_text:
                            deadline = today + timedelta(days=1)
                        elif 'today' in deadline_text:
                            deadline = today
                        elif 'next week' in deadline_text:
                            deadline = today + timedelta(days=7)
                        elif 'end of day' in deadline_text:
                            deadline = today.replace(hour=17, minute=0, second=0)
                        elif 'end of week' in deadline_text:
                            # Find next Friday
                            days_until_friday = (4 - today.weekday()) % 7
                            deadline = today + timedelta(days=days_until_friday)
                        else:
                            # Try to parse as explicit date
                            deadline = dateutil.parser.parse(deadline_text)
                    except:
                        # If parsing fails, just leave deadline as None
                        pass
            
            # Create action item
            action_items.append(
                schemas.ActionItemBase(
                    text=sentence.strip(),
                    deadline=deadline
                )
            )
    
    return action_items


def detect_followup_need(text: str, subject: str) -> Tuple[bool, Optional[date]]:
    """
    Detect if email needs follow-up and suggest a date.
    Returns tuple of (needs_followup, followup_date)
    """
    combined_text = f"{subject} {text}".lower()
    
    # Follow-up phrases
    followup_phrases = [
        "follow up", "followup", "follow-up", "get back to", "let me know", 
        "waiting for your response", "waiting for your reply",
        "looking forward to hearing", "would appreciate your response",
        "please respond", "hope to hear", "let's discuss", "will you be able to"
    ]
    
    # Check if any follow-up phrases exist
    needs_followup = any(phrase in combined_text for phrase in followup_phrases)
    
    # Determine follow-up date
    followup_date = None
    if needs_followup:
        # Default follow-up is 2 business days in the future
        today = date.today()
        followup_date = today + timedelta(days=2)
        
        # If it's Friday, follow up on Monday
        if followup_date.weekday() >= 5:  # Saturday or Sunday
            followup_date = followup_date + timedelta(days=7 - followup_date.weekday())
    
    return needs_followup, followup_date


def extract_contact_info(text: str) -> List[schemas.ContactBase]:
    """
    Extract contact information from email text, especially from signatures.
    Returns a list of ContactBase objects.
    """
    if not text or not nlp:
        return []
    
    contacts = []
    
    # Email pattern
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    # Phone pattern
    phone_pattern = r'\b(\+\d{1,3}\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}\b'
    # Name pattern (simplified)
    name_pattern = r'([A-Z][a-z]+ [A-Z][a-z]+)'
    
    # Find emails
    emails = re.findall(email_pattern, text)
    
    # For each email found
    for email in emails:
        # Skip if it's in an HTML tag or URL
        if '<' in email or '/' in email:
            continue
            
        # Extract name
        name = None
        # Look for name pattern near email
        email_idx = text.find(email)
        
        if email_idx > 0:
            # Check text before email for name
            before_text = text[max(0, email_idx - 100):email_idx]
            name_matches = re.findall(name_pattern, before_text)
            if name_matches:
                name = name_matches[-1]  # Take the closest name before email
        
        if not name and email_idx >= 0:
            # Check text after email for name
            after_text = text[email_idx:min(len(text), email_idx + 100)]
            name_matches = re.findall(name_pattern, after_text)
            if name_matches:
                name = name_matches[0]  # Take the closest name after email
        
        # If we can't find a name, use the first part of the email
        if not name:
            name_part = email.split('@')[0].replace('.', ' ').title()
            name = name_part
        
        # Find phone
        phone = None
        contact_area = text[max(0, email_idx - 200):min(len(text), email_idx + 200)]
        phone_matches = re.findall(phone_pattern, contact_area)
        if phone_matches:
            # Take the first phone match
            if isinstance(phone_matches[0], tuple):
                phone = ''.join([p for p in phone_matches[0] if p])
            else:
                phone = phone_matches[0]
        
        # Extract company/organization
        company = None
        # Check for organization entities near the email
        if nlp:
            doc = nlp(contact_area)
            for ent in doc.ents:
                if ent.label_ == "ORG":
                    company = ent.text
                    break
        
        # Create contact
        contacts.append(
            schemas.ContactBase(
                name=name,
                email=email,
                phone=phone,
                company=company,
                position=None  # We don't extract position yet
            )
        )
    
    return contacts


def calculate_priority_score(
    subject: str, 
    content: str, 
    is_important: bool,
    sentiment: str,
    sentiment_score: float,
    needs_followup: bool,
    entities: List[schemas.EntityBase]
) -> float:
    """
    Calculate a priority score from 1-10 for the email.
    """
    base_score = 5.0  # Default middle score
    
    # Importance factor
    if is_important:
        base_score += 2.0
    
    # Sentiment factor
    if sentiment == "Urgent":
        base_score += 1.5
    elif sentiment == "Negative":
        base_score += 1.0
    elif sentiment == "Positive":
        base_score -= 0.5
    
    # Subject urgency
    urgent_terms = ["urgent", "asap", "immediately", "deadline", "critical", "emergency"]
    subject_lower = subject.lower()
    for term in urgent_terms:
        if term in subject_lower:
            base_score += 0.5
            break
    
    # Important people
    person_count = sum(1 for e in entities if e.type == "PERSON")
    if person_count > 2:
        base_score += 0.5
    
    # Organization count
    org_count = sum(1 for e in entities if e.type == "ORG")
    if org_count > 0:
        base_score += 0.3
    
    # Followup needed
    if needs_followup:
        base_score += 0.7
    
    # Ensure score is between 1-10
    return max(1.0, min(10.0, base_score))


def process_email_content(raw_content: str, subject: str = "") -> Dict[str, Any]:
    """
    Process email content through the full NLP pipeline with all AI features.
    Returns a dictionary with all processed data.
    """
    # Clean HTML and remove quoted replies
    clean_content = clean_html(raw_content)
    
    # Generate summary
    summary = summarize_text(clean_content)
    
    # Extract entities
    entities = extract_entities(clean_content)
    
    # Extract keywords
    keywords = extract_keywords(clean_content)
    
    # Detect importance
    is_important = detect_importance(subject, clean_content, entities, keywords)
    
    # Categorize email
    category = categorize_email(subject, clean_content, entities, keywords)
    
    # Analyze sentiment
    sentiment, sentiment_score = analyze_sentiment(clean_content)
    
    # Extract action items
    action_items = extract_action_items(clean_content)
    
    # Detect follow-up needs
    needs_followup, followup_date = detect_followup_need(clean_content, subject)
    
    # Extract contact information
    contacts = extract_contact_info(clean_content)
    
    # Calculate priority score
    priority_score = calculate_priority_score(
        subject, 
        clean_content, 
        is_important,
        sentiment,
        sentiment_score,
        needs_followup,
        entities
    )
    
    # Return all processed data
    return {
        "clean_content": clean_content,
        "summary": summary,
        "entities": entities,
        "keywords": keywords,
        "is_important": is_important,
        "category": category,
        "sentiment": sentiment,
        "sentiment_score": sentiment_score,
        "action_items": action_items,
        "needs_followup": needs_followup,
        "followup_date": followup_date,
        "contacts": contacts,
        "priority_score": priority_score
    } 