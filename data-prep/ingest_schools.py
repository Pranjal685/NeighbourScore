#!/usr/bin/env python3
"""
ingest_schools.py — Load CBSE school data into Firestore `schools` collection.

Since the Kaggle CBSE dataset lacks lat/lng columns, this script uses a
pincode-to-coordinate lookup table for Pune-area pincodes.

Usage:
  python ingest_schools.py --csv cbse_schools.csv --dry-run
  python ingest_schools.py --csv cbse_schools.csv --cred ../firebase-adminsdk.json
"""

import argparse
import sys
import json

try:
    import pandas as pd
except ImportError:
    print("ERROR: pandas not installed. Run: pip install pandas")
    sys.exit(1)

try:
    import geohash2
except ImportError:
    print("ERROR: geohash2 not installed. Run: pip install geohash2")
    sys.exit(1)


# ── Pune area pincode → (lat, lng) lookup ────────────────────────────────
# Covers major Pune pincodes with approximate center coordinates.
PUNE_PINCODE_COORDS = {
    "411001": (18.5196, 73.8553),   # Pune GPO / Shivajinagar
    "411002": (18.5089, 73.8614),   # Budhwar Peth
    "411003": (18.5262, 73.8732),   # Yerwada
    "411004": (18.5362, 73.8377),   # Deccan Gymkhana
    "411005": (18.5074, 73.8275),   # Sadashiv Peth
    "411006": (18.5424, 73.8903),   # Pune Cantonment
    "411007": (18.5632, 73.8084),   # Aundh
    "411009": (18.5680, 73.9128),   # Lohegaon
    "411011": (18.5362, 73.8800),   # Koregaon Park
    "411012": (18.4959, 73.8700),   # Bibwewadi
    "411013": (18.4639, 73.8684),   # Dhankawadi
    "411014": (18.4975, 73.8125),   # Kothrud
    "411015": (18.5000, 73.8040),   # Paud Road
    "411016": (18.4820, 73.8490),   # Parvati
    "411017": (18.5520, 73.7790),   # Pashan
    "411018": (18.6265, 73.8070),   # Pimpri
    "411019": (18.6135, 73.8010),   # Chinchwad
    "411020": (18.4968, 73.9371),   # Hadapsar
    "411021": (18.4647, 73.8310),   # Sinhagad Road
    "411023": (18.4900, 73.8400),   # Karve Road
    "411024": (18.4650, 73.9400),   # NIBM
    "411025": (18.4547, 73.8800),   # Katraj
    "411026": (18.4780, 73.8050),   # Warje
    "411027": (18.5800, 73.8180),   # Baner
    "411028": (18.5400, 73.8200),   # Model Colony
    "411029": (18.5635, 73.9103),   # Kharadi
    "411030": (18.4820, 73.8560),   # Sahakarnagar
    "411032": (18.5780, 73.9200),   # Viman Nagar
    "411033": (18.5116, 73.8305),   # Erandwane
    "411035": (18.5510, 73.7920),   # Baner Road
    "411036": (18.5680, 73.8380),   # Wakdewadi
    "411037": (18.4587, 73.8070),   # Ambegaon
    "411038": (18.5100, 73.8180),   # Law College Road
    "411039": (18.6350, 73.8350),   # Bhosari
    "411040": (18.5620, 73.7700),   # Balewadi
    "411041": (18.5420, 73.7330),   # Hinjewadi
    "411042": (18.5750, 73.8860),   # Kalyani Nagar
    "411043": (18.5960, 73.7380),   # Hinjewadi Phase
    "411044": (18.6020, 73.7610),   # Wakad
    "411045": (18.5930, 73.8180),   # Aundh Baner Link
    "411046": (18.4470, 73.8510),   # Narhe
    "411047": (18.5500, 73.8450),   # Shivajinagar
    "411048": (18.4780, 73.8930),   # Kondhwa
    "411051": (18.4730, 73.8230),   # Hingne
    "411052": (18.6100, 73.7700),   # Pimple Saudagar
    "411057": (18.6060, 73.7540),   # Wakad Ext
    "411058": (18.4800, 73.8300),   # SB Road area
    "411060": (18.5670, 73.7680),   # Baner Hills
    "411061": (18.5570, 73.7380),   # Mahalunge
    "411062": (18.6520, 73.8210),   # Chikhali
    "411068": (18.5670, 73.9250),   # EON IT Park
    "412101": (18.1580, 74.5860),   # Baramati
    "412105": (18.1500, 74.6000),   # Baramati area
    "412108": (18.6850, 73.8200),   # Dehu
    "412110": (18.6450, 73.7600),   # Tathawade
    "412114": (18.7000, 73.6000),   # Mawal
    "412115": (18.7500, 73.6500),   # Talegaon
    "412202": (18.4300, 73.9900),   # Saswad area
    "412205": (18.5000, 74.0500),   # Haveli
    "412207": (18.3500, 73.9500),   # Bhor area
    "412209": (18.6000, 73.6000),   # Mulshi
    "413102": (18.1700, 74.6100),   # Indapur
    "413130": (18.4000, 74.5500),   # Daund
    "410401": (18.7600, 73.4100),   # Lonavala
    "410403": (18.7200, 73.3700),   # Khandala
    "410502": (18.7500, 73.5500),   # near Talegaon
    "410503": (19.0000, 73.7500),   # Manchar
    "410506": (18.6500, 73.5500),   # Mawal area
}


def load_and_process_csv(csv_path):
    """Load CBSE schools CSV, geocode via pincode lookup, and prepare documents."""
    print(f"Loading CSV: {csv_path}")
    df = pd.read_csv(csv_path, low_memory=False)
    print(f"  Raw rows: {len(df):,}")

    # Normalise column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    # ── Column mapping ───────────────────────────────────────────────
    col_map = {}
    for candidate in ["aff_no", "affiliation_no", "affno"]:
        if candidate in df.columns:
            col_map["affiliation_no"] = candidate
            break
    for candidate in ["name", "school_name", "school"]:
        if candidate in df.columns:
            col_map["name"] = candidate
            break
    for candidate in ["state", "state_name"]:
        if candidate in df.columns:
            col_map["state"] = candidate
            break
    for candidate in ["district", "district_name"]:
        if candidate in df.columns:
            col_map["district"] = candidate
            break
    for candidate in ["pincode", "pin_code", "pin"]:
        if candidate in df.columns:
            col_map["pincode"] = candidate
            break
    for candidate in ["address"]:
        if candidate in df.columns:
            col_map["address"] = candidate
            break
    for candidate in ["n_category", "category", "aff_type"]:
        if candidate in df.columns:
            col_map["category"] = candidate
            break

    print(f"  Mapped columns: {col_map}")

    required = ["affiliation_no", "name", "state"]
    missing = [r for r in required if r not in col_map]
    if missing:
        print(f"ERROR: Missing columns: {missing}")
        sys.exit(1)

    # ── Process records ──────────────────────────────────────────────
    records = []
    skipped_no_pin = 0
    skipped_no_coords = 0

    for _, row in df.iterrows():
        # Get pincode and look up coordinates
        pin_raw = row.get(col_map.get("pincode", ""), None)
        if pd.isna(pin_raw):
            skipped_no_pin += 1
            continue

        try:
            pincode = str(int(float(pin_raw))).strip()
        except (ValueError, TypeError):
            skipped_no_pin += 1
            continue
        coords = PUNE_PINCODE_COORDS.get(pincode, None)

        if coords is None:
            skipped_no_coords += 1
            continue

        lat, lng = coords

        # Add small random offset per school to avoid exact overlaps
        # Use affiliation number as a deterministic seed
        aff_no = str(row.get(col_map["affiliation_no"], "")).strip()
        hash_offset = (hash(aff_no) % 1000) / 100000.0  # ~0.00001 to 0.01 degree
        lat += hash_offset
        lng -= hash_offset / 2

        gh = geohash2.encode(lat, lng, precision=8)

        name = str(row.get(col_map["name"], "")).strip()
        state = str(row.get(col_map.get("state", ""), "")).strip()
        district = str(row.get(col_map.get("district", ""), "")).strip()
        address = str(row.get(col_map.get("address", ""), "")).strip()
        category = str(row.get(col_map.get("category", ""), "")).strip()

        # School score heuristic
        school_score = 70.0
        cat_lower = category.lower() if category != "nan" else ""
        if "sr. secondary" in cat_lower or "senior secondary" in cat_lower:
            school_score = 80.0
        elif "secondary" in cat_lower:
            school_score = 75.0

        record = {
            "affiliation_no": aff_no,
            "name": name,
            "state": state,
            "district": district,
            "city": address[:50] if address != "nan" else "",
            "pincode": pincode,
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "geohash": gh,
            "geohash6": gh[:6],
            "geohash5": gh[:5],
            "category": category if category != "nan" else "",
            "pass_pct": 0.0,
            "school_score": school_score,
        }
        records.append(record)

    print(f"\n  Valid records (with coords): {len(records):,}")
    print(f"  Skipped (no pincode): {skipped_no_pin:,}")
    print(f"  Skipped (pincode not in lookup): {skipped_no_coords:,}")

    return records


def dry_run(records):
    """Preview what would be uploaded."""
    state_counts = {}
    for r in records:
        s = r["state"]
        state_counts[s] = state_counts.get(s, 0) + 1

    print("\n" + "=" * 62)
    print("  DRY RUN -- Schools Data Preview")
    print("=" * 62)
    print(f"  Collection: schools")
    print(f"  Total Documents: {len(records):,}")
    print("-" * 62)

    print("\n  Records by State:")
    for state, count in sorted(state_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"    {state:<30} {count:>6,}")

    # Sample records
    print(f"\n  Sample records:")
    for r in records[:5]:
        print(f"    {r['affiliation_no']}: {r['name'][:50]}")
        print(f"      {r['district']} | pin {r['pincode']} | ({r['lat']}, {r['lng']})")
        print(f"      geohash6: {r['geohash6']} | score: {r['school_score']}")
        print()

    print(f"  OK: Dry run complete. {len(records):,} documents ready.")
    print("  Run without --dry-run and with --cred to upload.\n")


def upload_to_firestore(records, cred_path, batch_size=500):
    """Upload school records to Firestore in batches."""
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        print("ERROR: firebase-admin not installed.")
        sys.exit(1)

    try:
        from tqdm import tqdm
    except ImportError:
        tqdm = lambda x, **kw: x

    print(f"\n  Initializing Firebase: {cred_path}")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()

    collection = db.collection("schools")
    print(f"  Uploading {len(records):,} documents to 'schools'...")
    print(f"  Batch size: {batch_size}\n")

    batch = db.batch()
    count = 0
    total = 0

    for r in tqdm(records, desc="Uploading schools", unit="doc"):
        doc_id = str(r["affiliation_no"])
        if not doc_id or doc_id == "nan":
            doc_id = f"school_{count}"

        doc_ref = collection.document(doc_id)
        batch.set(doc_ref, r)
        count += 1

        if count >= batch_size:
            batch.commit()
            total += count
            batch = db.batch()
            count = 0

    if count > 0:
        batch.commit()
        total += count

    print(f"\n  Done! {total:,} school records uploaded to Firestore.")


def main():
    parser = argparse.ArgumentParser(description="Ingest CBSE school data into Firestore")
    parser.add_argument("--csv", type=str, required=True, help="Path to CBSE schools CSV")
    parser.add_argument("--dry-run", action="store_true", help="Preview without uploading")
    parser.add_argument("--cred", type=str, help="Path to Firebase service account JSON")
    args = parser.parse_args()

    records = load_and_process_csv(args.csv)

    if not records:
        print("ERROR: No valid records found.")
        sys.exit(1)

    if args.dry_run:
        dry_run(records)
    elif args.cred:
        upload_to_firestore(records, args.cred)
    else:
        print("ERROR: Specify --dry-run or --cred <path>")
        sys.exit(1)


if __name__ == "__main__":
    main()
