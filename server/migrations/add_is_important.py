"""
Migration script to add is_important column to the emails table
"""

from sqlalchemy import create_engine, MetaData, Table, Column, Boolean, text
from sqlalchemy.ext.declarative import declarative_base
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
    
    # Check if column already exists
    if 'is_important' not in emails.columns:
        # Add column
        column = Column('is_important', Boolean, default=False)
        column_name = column.compile(dialect=engine.dialect)
        column_type = column.type.compile(engine.dialect)
        
        # Use the new API - get a connection and execute
        with engine.connect() as conn:
            conn.execute(text(f'ALTER TABLE emails ADD COLUMN is_important BOOLEAN DEFAULT FALSE'))
            conn.commit()
        
        print("Added is_important column to emails table")
    else:
        print("is_important column already exists")

if __name__ == "__main__":
    run_migration() 