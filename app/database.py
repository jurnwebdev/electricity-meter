import sqlite3
from datetime import date, datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "meter.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS recharges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            datetime TEXT NOT NULL,
            units_added REAL NOT NULL,
            amount_spent REAL NOT NULL,
            notes TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS usage_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            datetime TEXT NOT NULL,
            units_remaining REAL NOT NULL,
            notes TEXT DEFAULT ''
        );
    """)
    conn.commit()
    conn.close()


# --- Recharge CRUD ---

def get_all_recharges():
    conn = get_db()
    rows = conn.execute("SELECT * FROM recharges ORDER BY datetime ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def add_recharge(datetime_str: str, units_added: float, amount_spent: float, notes: str = ""):
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO recharges (datetime, units_added, amount_spent, notes) VALUES (?, ?, ?, ?)",
        (datetime_str, units_added, amount_spent, notes)
    )
    conn.commit()
    recharge_id = cur.lastrowid
    conn.close()
    return recharge_id


def update_recharge(id: int, datetime_str: str, units_added: float, amount_spent: float, notes: str = ""):
    conn = get_db()
    conn.execute(
        "UPDATE recharges SET datetime=?, units_added=?, amount_spent=?, notes=? WHERE id=?",
        (datetime_str, units_added, amount_spent, notes, id)
    )
    conn.commit()
    conn.close()


def delete_recharge(id: int):
    conn = get_db()
    conn.execute("DELETE FROM recharges WHERE id=?", (id,))
    conn.commit()
    conn.close()


# --- Usage Log CRUD ---

def get_all_usage_logs():
    conn = get_db()
    rows = conn.execute("SELECT * FROM usage_logs ORDER BY datetime ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def add_usage_log(datetime_str: str, units_remaining: float, notes: str = ""):
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO usage_logs (datetime, units_remaining, notes) VALUES (?, ?, ?)",
        (datetime_str, units_remaining, notes)
    )
    conn.commit()
    log_id = cur.lastrowid
    conn.close()
    return log_id


def update_usage_log(id: int, datetime_str: str, units_remaining: float, notes: str = ""):
    conn = get_db()
    conn.execute(
        "UPDATE usage_logs SET datetime=?, units_remaining=?, notes=? WHERE id=?",
        (datetime_str, units_remaining, notes, id)
    )
    conn.commit()
    conn.close()


def delete_usage_log(id: int):
    conn = get_db()
    conn.execute("DELETE FROM usage_logs WHERE id=?", (id,))
    conn.commit()
    conn.close()