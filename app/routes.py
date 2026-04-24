from fastapi import APIRouter
from datetime import datetime
from dateutil import parser as date_parser
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from database import (
    get_all_recharges, add_recharge, update_recharge, delete_recharge,
    get_all_usage_logs, add_usage_log, update_usage_log, delete_usage_log
)

router = APIRouter()


# --- Recharges ---
@router.get("/api/recharges")
def list_recharges():
    return get_all_recharges()


@router.post("/api/recharges")
def create_recharge(data: dict):
    return add_recharge(
        data["datetime"], data["units_added"], data["amount_spent"], data.get("notes", "")
    )


@router.put("/api/recharges/{id}")
def edit_recharge(id: int, data: dict):
    update_recharge(id, data["datetime"], data["units_added"], data["amount_spent"], data.get("notes", ""))
    return {"ok": True}


@router.delete("/api/recharges/{id}")
def remove_recharge(id: int):
    delete_recharge(id)
    return {"ok": True}


# --- Usage Logs ---
@router.get("/api/usage")
def list_usage():
    return get_all_usage_logs()


@router.post("/api/usage")
def create_usage_log(data: dict):
    return add_usage_log(
        data["datetime"], data["units_remaining"], data.get("notes", "")
    )


@router.put("/api/usage/{id}")
def edit_usage_log(id: int, data: dict):
    update_usage_log(id, data["datetime"], data["units_remaining"], data.get("notes", ""))
    return {"ok": True}


@router.delete("/api/usage/{id}")
def remove_usage_log(id: int):
    delete_usage_log(id)
    return {"ok": True}


# --- Analytics ---
@router.get("/api/stats")
def get_stats():
    recharges = get_all_recharges()
    usage_logs = get_all_usage_logs()

    if not recharges or not usage_logs:
        return {
            "total_units_purchased": 0,
            "total_units_consumed": 0,
            "total_spent": 0,
            "days_tracked": 0,
            "daily_avg": 0,
            "units_remaining": 0,
            "days_until_empty": None,
            "cost_per_unit": 0
        }

    # Total purchased
    total_purchased = sum(r["units_added"] for r in recharges)
    total_spent = sum(r["amount_spent"] for r in recharges)

    # Sort usage logs by datetime to get first and last
    usage_sorted = sorted(usage_logs, key=lambda x: x["datetime"])
    first_reading = usage_sorted[0]
    last_reading = usage_sorted[-1]

    # Build chronological events from recharges + usage logs
    events = []
    for r in recharges:
        events.append({"datetime": r["datetime"], "type": "recharge", "units": r["units_added"], "amount": r["amount_spent"]})
    for u in usage_logs:
        events.append({"datetime": u["datetime"], "type": "usage", "units": u["units_remaining"]})

    events.sort(key=lambda x: x["datetime"])

    # Calculate consumption by tracking running balance
    running_balance = 0
    total_consumed = 0
    for e in events:
        if e["type"] == "recharge":
            running_balance += e["units"]
        else:  # usage log
            if running_balance > 0:
                consumed = running_balance - e["units"]
                if consumed > 0:
                    total_consumed += consumed
            running_balance = e["units"]

    # Time tracked
    first_dt = date_parser.parse(first_reading["datetime"])
    last_dt = date_parser.parse(last_reading["datetime"])
    days_tracked = (last_dt.date() - first_dt.date()).days + 1
    hours_tracked = (last_dt - first_dt).total_seconds() / 3600

    # Daily average
    daily_avg = total_consumed / days_tracked if days_tracked > 0 else 0
    hourly_avg = total_consumed / hours_tracked if hours_tracked > 0 else 0

    # Days until empty
    last_units = last_reading["units_remaining"]
    days_until_empty = None
    if daily_avg > 0 and last_units > 0:
        days_until_empty = round(last_units / daily_avg)

    # Cost per unit
    cost_per_unit = (total_spent / total_purchased) if total_purchased > 0 else 0

    return {
        "total_units_purchased": round(total_purchased, 2),
        "total_units_consumed": round(total_consumed, 2),
        "total_spent": round(total_spent, 2),
        "days_tracked": days_tracked,
        "daily_avg": round(daily_avg, 2),
        "hourly_avg": round(hourly_avg, 3),
        "units_remaining": last_units,
        "days_until_empty": days_until_empty,
        "cost_per_unit": round(cost_per_unit, 2),
        "last_updated": last_reading["datetime"]
    }


@router.get("/api/history")
def get_history():
    recharges = get_all_recharges()
    usage_logs = get_all_usage_logs()

    history = []
    for r in recharges:
        history.append({
            "datetime": r["datetime"],
            "type": "recharge",
            "units": r["units_added"],
            "amount": r["amount_spent"],
            "notes": r["notes"],
            "id": r["id"]
        })
    for u in usage_logs:
        history.append({
            "datetime": u["datetime"],
            "type": "usage",
            "units": u["units_remaining"],
            "notes": u["notes"],
            "id": u["id"]
        })

    history.sort(key=lambda x: x["datetime"], reverse=True)
    return history


# --- Reports ---
@router.get("/api/report/daily")
def get_daily_report():
    """Daily usage breakdown"""
    usage_logs = get_all_usage_logs()
    recharges = get_all_recharges()

    if not usage_logs:
        return []

    # Group usage logs by date
    daily_data = {}
    for u in usage_logs:
        dt = date_parser.parse(u["datetime"])
        date_key = dt.date().isoformat()
        if date_key not in daily_data:
            daily_data[date_key] = {"date": date_key, "entries": [], "min_units": None, "max_units": None}

        daily_data[date_key]["entries"].append(u)
        units = u["units_remaining"]
        if daily_data[date_key]["min_units"] is None or units < daily_data[date_key]["min_units"]:
            daily_data[date_key]["min_units"] = units
        if daily_data[date_key]["max_units"] is None or units > daily_data[date_key]["max_units"]:
            daily_data[date_key]["max_units"] = units

    # Calculate daily consumption
    sorted_days = sorted(daily_data.keys())
    result = []
    for i, date_key in enumerate(sorted_days):
        day_info = daily_data[date_key]
        entries = sorted(day_info["entries"], key=lambda x: x["datetime"])

        # Consumption = units at start of day - units at end of day
        # We need to look at previous day's last reading
        if i > 0:
            prev_date = sorted_days[i - 1]
            prev_day_entries = daily_data[prev_date]["entries"]
            prev_day_last = max(prev_day_entries, key=lambda x: x["datetime"])
            start_units = prev_day_last["units_remaining"]
            end_units = entries[-1]["units_remaining"]
            consumed = max(0, start_units - end_units)
        else:
            # First day - consumption from first recharge to first reading
            consumed = 0  # Can't determine without knowing units at recharge

        result.append({
            "date": date_key,
            "entries_count": len(entries),
            "first_reading": entries[0]["units_remaining"],
            "last_reading": entries[-1]["units_remaining"],
            "consumed": round(consumed, 2)
        })

    return result


@router.get("/api/report/hourly")
def get_hourly_report():
    """Hourly usage breakdown for a specific date"""
    usage_logs = get_all_usage_logs()

    if not usage_logs:
        return []

    # Group by date and hour
    hourly_data = {}
    for u in usage_logs:
        dt = date_parser.parse(u["datetime"])
        key = dt.strftime("%Y-%m-%d %H:00")
        if key not in hourly_data:
            hourly_data[key] = {"datetime": key, "readings": [], "units": []}
        hourly_data[key]["readings"].append(u)
        hourly_data[key]["units"].append(u["units_remaining"])

    # Calculate hourly consumption
    sorted_hours = sorted(hourly_data.keys())
    result = []
    for i, key in enumerate(sorted_hours):
        info = hourly_data[key]
        readings = sorted(info["readings"], key=lambda x: x["datetime"])

        if i > 0:
            prev_key = sorted_hours[i - 1]
            prev_readings = sorted(hourly_data[prev_key]["readings"], key=lambda x: x["datetime"])
            prev_units = prev_readings[-1]["units_remaining"]
            curr_units = readings[-1]["units_remaining"]
            consumed = max(0, prev_units - curr_units)
        else:
            consumed = 0

        result.append({
            "datetime": key,
            "readings_count": len(readings),
            "units": info["units"],
            "consumed": round(consumed, 2)
        })

    return result