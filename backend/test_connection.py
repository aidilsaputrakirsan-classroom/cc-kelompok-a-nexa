# backend/test_connection.py
from database import engine
from sqlalchemy import text, inspect

with engine.connect() as conn:
    # Get database name
    result = conn.execute(text("SELECT current_database()"))
    db_name = result.fetchone()[0]
    print(f"✅ Connected to database: {db_name}")
    
    # List all tables
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"\n📋 Tables in database: {tables}")
    
    # List columns in users table
    if 'users' in tables:
        columns = inspector.get_columns('users')
        print(f"\n👥 Columns in 'users' table:")
        for col in columns:
            print(f"   - {col['name']}: {col['type']}")