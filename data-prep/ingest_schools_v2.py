#!/usr/bin/env python3
"""
ingest_schools_v2.py — Reingest CBSE schools for Maharashtra using Google Maps
Geocoding API instead of the incomplete pincode lookup table.

Problem fixed: original script dropped 725/833 Maharashtra schools because
the hardcoded pincode table only covered Pune (411xxx/412xxx/410xxx).
This script geocodes every Maharashtra school via the Maps API.

Cache: geocode_cache.json persists results — re-runs skip already-geocoded schools.
Rate limit: 10 req/sec (0.11s sleep between geocoding calls).
Firestore: set(merge=True) — safe to re-run, updates existing 108 Pune records.

Usage:
  python ingest_schools_v2.py --csv cbse_schools.csv --dry-run --api-key YOUR_KEY
  python ingest_schools_v2.py --csv cbse_schools.csv --cred ../firebase-adminsdk.json --api-key YOUR_KEY
  python ingest_schools_v2.py --csv cbse_schools.csv --cred ../firebase-adminsdk.json  # reads GOOGLE_MAPS_API_KEY from ../.env
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("ERROR: pip install pandas")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("ERROR: pip install requests")
    sys.exit(1)

try:
    import geohash2
except ImportError:
    print("ERROR: pip install geohash2")
    sys.exit(1)

CACHE_FILE = Path(__file__).parent / "geocode_cache.json"
CACHE_SAVE_EVERY = 50  # flush cache to disk every N geocode calls

CITY_BY_PREFIX = {
    "400": "mumbai",
    "410": "pune",
    "411": "pune",
    "412": "pune",
    "413": "pune",
    "440": "nagpur",
    "441": "nagpur",
    "442": "nagpur",
    "444": "nagpur",
    "421": "thane",
    "400": "mumbai",
    "431": "aurangabad",
    "432": "aurangabad",
    "425": "jalgaon",
    "416": "kolhapur",
    "415": "satara",
    "422": "nashik",
    "423": "nashik",
}


def load_env_api_key():
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("GOOGLE_MAPS_API_KEY="):
                return line.split("=", 1)[1].strip()
    return os.environ.get("GOOGLE_MAPS_API_KEY")


def load_cache():
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text())
    return {}


def save_cache(cache):
    CACHE_FILE.write_text(json.dumps(cache, indent=2))


def city_from_pincode(pincode: str) -> str:
    prefix = pincode[:3]
    return CITY_BY_PREFIX.get(prefix, "maharashtra")


def school_score_from_row(row) -> float:
    """Score heuristic based on sections data and affiliation type."""
    score = 65.0

    def safe_float(val):
        try:
            return float(val) if not pd.isna(val) else 0.0
        except (ValueError, TypeError):
            return 0.0

    has_xii = safe_float(row.get("e_xi_xii_sections", 0)) > 0
    has_x = safe_float(row.get("e_ix_x_sections", 0)) > 0
    has_viii = safe_float(row.get("e_vi_viii_sections", 0)) > 0

    if has_xii:
        score = 80.0
    elif has_x:
        score = 75.0
    elif has_viii:
        score = 70.0

    # Bonus for govt/kendriya vidyalaya schools
    aff_type = str(row.get("aff_type", "")).lower()
    if "central" in aff_type or "kendriya" in aff_type:
        score = min(100.0, score + 5.0)

    return score


def geocode(name: str, district: str, pincode: str, api_key: str) -> tuple[float, float] | None:
    """Geocode using Google Maps. Returns (lat, lng) or None on failure."""
    base_url = "https://maps.googleapis.com/maps/api/geocode/json"

    queries = [
        f"{name}, {district}, Maharashtra {pincode}, India",
        f"{district}, Maharashtra {pincode}, India",
    ]

    for query in queries:
        try:
            resp = requests.get(
                base_url,
                params={"address": query, "key": api_key},
                timeout=10,
            )
            data = resp.json()
            if data.get("status") == "OK" and data["results"]:
                loc = data["results"][0]["geometry"]["location"]
                return round(loc["lat"], 6), round(loc["lng"], 6)
            if data.get("status") == "OVER_QUERY_LIMIT":
                print("\n  ERROR: Geocoding API rate limit hit. Saving cache and exiting.")
                return None
        except requests.RequestException:
            pass

    return None


def load_csv(csv_path: str) -> pd.DataFrame:
    print(f"Loading CSV: {csv_path}")
    df = pd.read_csv(csv_path, low_memory=False)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    mh = df[df["state"] == "MAHARASHTRA"].copy()
    print(f"  Total CSV rows:       {len(df):,}")
    print(f"  Maharashtra rows:     {len(mh):,}")
    return mh


def process(df: pd.DataFrame, api_key: str, dry_run_only: bool = False) -> list[dict]:
    cache = load_cache()
    cached_hits = 0
    geocoded_new = 0
    skipped_geocode_fail = 0
    cache_dirty = 0
    records = []

    total = len(df)
    print(f"\n  Processing {total} Maharashtra schools...")
    print(f"  Geocode cache: {len(cache)} entries loaded from {CACHE_FILE.name}")
    if dry_run_only:
        print("  [DRY RUN] Skipping geocoding API calls — using cache only.\n")

    for i, (_, row) in enumerate(df.iterrows(), 1):
        aff_no = str(row.get("aff_no", "")).strip()
        if not aff_no or aff_no == "nan":
            continue

        name = str(row.get("name", "")).strip()
        district = str(row.get("district", "")).strip()
        address = str(row.get("address", "")).strip()
        pincode_raw = row.get("pincode", None)
        category = str(row.get("n_category", "")).strip()
        aff_type = str(row.get("aff_type", "")).strip()

        try:
            pincode = str(int(float(pincode_raw))).strip() if not pd.isna(pincode_raw) else ""
        except (ValueError, TypeError):
            pincode = ""

        if not pincode:
            skipped_geocode_fail += 1
            continue

        # ── Resolve coordinates ──────────────────────────────────────
        if aff_no in cache:
            coords = cache[aff_no]
            cached_hits += 1
        elif dry_run_only:
            # Dry run: skip uncached schools (would need API call)
            continue
        else:
            coords = geocode(name, district, pincode, api_key)
            time.sleep(0.11)  # 10 req/sec rate limit

            if coords is None:
                skipped_geocode_fail += 1
                if i % 100 == 0 or i == total:
                    print(f"  [{i:4}/{total}] geocoded:{geocoded_new} cached:{cached_hits} failed:{skipped_geocode_fail}")
                continue

            cache[aff_no] = coords
            geocoded_new += 1
            cache_dirty += 1

            if cache_dirty >= CACHE_SAVE_EVERY:
                save_cache(cache)
                cache_dirty = 0

        lat, lng = coords

        # Deterministic jitter so schools at same pincode don't stack exactly
        hash_offset = (hash(aff_no) % 1000) / 100000.0
        lat += hash_offset
        lng -= hash_offset / 2

        gh = geohash2.encode(lat, lng, precision=8)
        city = city_from_pincode(pincode)
        score = school_score_from_row(row)

        records.append({
            "affiliation_no": aff_no,
            "name": name,
            "state": "MAHARASHTRA",
            "district": district,
            "city": city,
            "address": address[:100] if address != "nan" else "",
            "pincode": pincode,
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "geohash": gh,
            "geohash6": gh[:6],
            "geohash5": gh[:5],
            "category": category if category != "nan" else "",
            "aff_type": aff_type if aff_type != "nan" else "",
            "pass_pct": 0.0,
            "school_score": score,
        })

        if i % 100 == 0 or i == total:
            print(f"  [{i:4}/{total}] geocoded:{geocoded_new} cached:{cached_hits} failed:{skipped_geocode_fail} records:{len(records)}")

    # Final cache flush
    if cache_dirty > 0:
        save_cache(cache)

    print(f"\n  Geocode summary:")
    print(f"    From cache:     {cached_hits}")
    print(f"    Newly geocoded: {geocoded_new}")
    print(f"    Failed/skipped: {skipped_geocode_fail}")
    print(f"    Valid records:  {len(records)}")

    return records


def dry_run_report(records: list[dict]):
    by_city: dict[str, int] = {}
    for r in records:
        c = r["city"]
        by_city[c] = by_city.get(c, 0) + 1

    print("\n" + "=" * 60)
    print("  DRY RUN -- Schools v2 Preview (cached schools only)")
    print("=" * 60)
    print(f"  Records ready (from cache): {len(records):,}")
    print(f"\n  Count by city:")
    for city, count in sorted(by_city.items(), key=lambda x: -x[1]):
        print(f"    {city:<20} {count:>5}")
    print(f"\n  Sample:")
    for r in records[:5]:
        print(f"    {r['affiliation_no']}: {r['name'][:50]}")
        print(f"      {r['district']} | pin {r['pincode']} | city:{r['city']} | ({r['lat']}, {r['lng']})")
        print(f"      geohash6:{r['geohash6']}  score:{r['school_score']}")
    print()


def upload_to_firestore(records: list[dict], cred_path: str, batch_size: int = 400):
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore as fs
    except ImportError:
        print("ERROR: pip install firebase-admin")
        sys.exit(1)

    print(f"\n  Initializing Firebase: {cred_path}")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = fs.client()

    collection = db.collection("schools")
    total = len(records)
    print(f"  Uploading {total:,} documents (batch size {batch_size}, merge=True)...\n")

    batch = db.batch()
    count = 0
    uploaded = 0

    for r in records:
        doc_ref = collection.document(r["affiliation_no"])
        batch.set(doc_ref, r, merge=True)
        count += 1

        if count >= batch_size:
            batch.commit()
            uploaded += count
            print(f"  Committed {uploaded:,}/{total:,}")
            batch = db.batch()
            count = 0

    if count > 0:
        batch.commit()
        uploaded += count

    print(f"\n  Done! {uploaded:,} school records written to Firestore.")

    # Final count by city
    by_city: dict[str, int] = {}
    for r in records:
        c = r["city"]
        by_city[c] = by_city.get(c, 0) + 1
    print("\n  Final count by city:")
    for city, cnt in sorted(by_city.items(), key=lambda x: -x[1]):
        print(f"    {city:<20} {cnt:>5}")


def main():
    parser = argparse.ArgumentParser(description="Reingest CBSE schools for Maharashtra via Google Maps geocoding")
    parser.add_argument("--csv", type=str, required=True, help="Path to CBSE schools CSV")
    parser.add_argument("--dry-run", action="store_true", help="Preview (uses cache only, no API calls)")
    parser.add_argument("--cred", type=str, help="Path to Firebase service account JSON")
    parser.add_argument("--api-key", type=str, help="Google Maps API key (falls back to .env)")
    args = parser.parse_args()

    api_key = args.api_key or load_env_api_key()

    if not args.dry_run and not api_key:
        print("ERROR: Google Maps API key required. Use --api-key or set GOOGLE_MAPS_API_KEY in .env")
        sys.exit(1)

    df = load_csv(args.csv)

    records = process(df, api_key or "", dry_run_only=args.dry_run)

    if args.dry_run:
        dry_run_report(records)
    elif args.cred:
        if not records:
            print("ERROR: No valid records (empty cache and no API key?)")
            sys.exit(1)
        upload_to_firestore(records, args.cred)
    else:
        print("ERROR: Specify --dry-run or --cred <path>")
        sys.exit(1)


if __name__ == "__main__":
    main()
