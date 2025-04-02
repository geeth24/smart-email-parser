"""
Migration script to add AI features columns to the emails table and create new tables
"""

from sqlalchemy import create_engine, MetaData, Table, Column, Boolean, text, String, Float, Date
import os
import sys

# Add parent directory to path to import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SQLALCHEMY_DATABASE_URL

def run_migration():
    # Create engine
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # Get metadata
    metadata = MetaData()
    metadata.reflect(bind=engine)
    
    # Get emails table
    emails = Table('emails', metadata, autoload=True, autoload_with=engine)
    
    # Define new columns
    new_columns = [
        ("category", "VARCHAR"),
        ("sentiment", "VARCHAR"),
        ("sentiment_score", "FLOAT"),
        ("priority_score", "FLOAT"),
        ("needs_followup", "BOOLEAN DEFAULT FALSE"),
        ("followup_date", "DATE")
    ]
    
    with engine.connect() as conn:
        # Add new columns to emails table
        for column_name, column_type in new_columns:
            if column_name not in emails.columns:
                conn.execute(text(f'ALTER TABLE emails ADD COLUMN {column_name} {column_type}'))
                print(f"Added {column_name} column to emails table")
        
        # Create action_items table if it doesn't exist
        if 'action_items' not in metadata.tables:
            conn.execute(text('''
                CREATE TABLE action_items (
                    id INTEGER PRIMARY KEY,
                    text VARCHAR NOT NULL,
                    deadline DATETIME,
                    completed BOOLEAN DEFAULT FALSE
                )
            '''))
            print("Created action_items table")
        
        # Create email_action_item association table
        if 'email_action_item' not in metadata.tables:
            conn.execute(text('''
                CREATE TABLE email_action_item (
                    email_id INTEGER,
                    action_item_id INTEGER,
                    PRIMARY KEY (email_id, action_item_id),
                    FOREIGN KEY (email_id) REFERENCES emails (id),
                    FOREIGN KEY (action_item_id) REFERENCES action_items (id)
                )
            '''))
            print("Created email_action_item table")
        
        # Create contacts table
        if 'contacts' not in metadata.tables:
            conn.execute(text('''
                CREATE TABLE contacts (
                    id INTEGER PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    email VARCHAR NOT NULL,
                    phone VARCHAR,
                    position VARCHAR,
                    company VARCHAR
                )
            '''))
            print("Created contacts table")
        
        # Create email_contact association table
        if 'email_contact' not in metadata.tables:
            conn.execute(text('''
                CREATE TABLE email_contact (
                    email_id INTEGER,
                    contact_id INTEGER,
                    PRIMARY KEY (email_id, contact_id),
                    FOREIGN KEY (email_id) REFERENCES emails (id),
                    FOREIGN KEY (contact_id) REFERENCES contacts (id)
                )
            '''))
            print("Created email_contact table")
            
        conn.commit()
        print("Migration completed successfully.")

if __name__ == "__main__":
    run_migration() 