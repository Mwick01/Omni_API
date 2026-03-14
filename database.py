import sqlite3
from datetime import datetime

DB_PATH = "database.db"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS notices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            url TEXT UNIQUE,
            file_path TEXT,
            downloaded_at TEXT,
            sent_to_whatsapp INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()


def insert_notice(title, url, file_path):
    """Insert a new notice. Returns True if new, False if duplicate."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        c.execute("""
            INSERT INTO notices (title, url, file_path, downloaded_at, sent_to_whatsapp)
            VALUES (?, ?, ?, ?, 0)
        """, (title, url, file_path, datetime.now().isoformat()))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False  # Already exists
    finally:
        conn.close()


def get_unsent_notices():
    """Get all notices not yet sent to WhatsApp."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM notices WHERE sent_to_whatsapp = 0")
    rows = c.fetchall()
    conn.close()
    return rows


def mark_as_sent(notice_id):
    """Mark a notice as sent."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE notices SET sent_to_whatsapp = 1 WHERE id = ?", (notice_id,))
    conn.commit()
    conn.close()


def get_all_notices():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM notices ORDER BY downloaded_at DESC")
    rows = c.fetchall()
    conn.close()
    return rows
