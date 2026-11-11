import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

db_url = os.getenv("DATABASE_URL")
print("--- .ENV DIAGNOSTIC ---")
if not db_url:
    print("❌ DATABASE_URL is NOT being detected or file is missing!")
else:
    # Mask password when printing for security
    masked_url = db_url.split("://")[0] + "://***@" + db_url.split("@")[1] if "@" in db_url else "Invalid format"
    print(f"✅ DATABASE_URL loaded successfully: {masked_url}")

print("\n--- TESTING RAW DATABASE CONNECTION ---")
try:
    conn = psycopg2.connect(db_url, connect_timeout=5)
    print("SUCCESS! Connected to Supabase database successfully.")
    conn.close()
except Exception as e:
    print(f"❌ Connection failed with error:\n{e}")