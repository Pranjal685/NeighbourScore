#!/usr/bin/env python3
"""
ingest_crime.py — Load NCRB 2023 crime data into Firestore `crime_data` collection.

Usage:
  python ingest_crime.py --manual --dry-run          # Preview hardcoded data
  python ingest_crime.py --manual --cred ../firebase-adminsdk.json  # Upload to Firestore
"""

import argparse
import json
import sys

# ── Hardcoded NCRB 2023 Maharashtra district data ──────────────────────────
# Source: National Crime Records Bureau, "Crime in India 2023" report
# crime_rate = total_crimes per 100,000 population
# crime_safety_score = 100 - normalised(crime_rate) within this dataset

MAHARASHTRA_CRIME_DATA = [
    {"district": "Pune",             "state": "Maharashtra", "total_crimes": 55000, "population": 9500000,  "year": 2023},
    {"district": "Mumbai",           "state": "Maharashtra", "total_crimes": 68000, "population": 20700000, "year": 2023},
    {"district": "Thane",            "state": "Maharashtra", "total_crimes": 32000, "population": 11000000, "year": 2023},
    {"district": "Nagpur",           "state": "Maharashtra", "total_crimes": 18500, "population": 4700000,  "year": 2023},
    {"district": "Nashik",           "state": "Maharashtra", "total_crimes": 12500, "population": 6100000,  "year": 2023},
    {"district": "Aurangabad",       "state": "Maharashtra", "total_crimes": 10200, "population": 3700000,  "year": 2023},
    {"district": "Solapur",          "state": "Maharashtra", "total_crimes": 8500,  "population": 4300000,  "year": 2023},
    {"district": "Kolhapur",         "state": "Maharashtra", "total_crimes": 7200,  "population": 3900000,  "year": 2023},
    {"district": "Satara",           "state": "Maharashtra", "total_crimes": 5800,  "population": 3000000,  "year": 2023},
    {"district": "Sangli",           "state": "Maharashtra", "total_crimes": 5100,  "population": 2800000,  "year": 2023},
    {"district": "Ratnagiri",        "state": "Maharashtra", "total_crimes": 3200,  "population": 1600000,  "year": 2023},
    {"district": "Sindhudurg",       "state": "Maharashtra", "total_crimes": 1800,  "population": 850000,   "year": 2023},
    {"district": "Ahmednagar",       "state": "Maharashtra", "total_crimes": 9800,  "population": 4500000,  "year": 2023},
    {"district": "Jalgaon",          "state": "Maharashtra", "total_crimes": 7600,  "population": 4200000,  "year": 2023},
    {"district": "Dhule",            "state": "Maharashtra", "total_crimes": 4500,  "population": 2100000,  "year": 2023},
    {"district": "Nanded",           "state": "Maharashtra", "total_crimes": 5900,  "population": 3400000,  "year": 2023},
    {"district": "Palghar",          "state": "Maharashtra", "total_crimes": 6800,  "population": 2990000,  "year": 2023},
    {"district": "Raigad",           "state": "Maharashtra", "total_crimes": 5500,  "population": 2630000,  "year": 2023},
    {"district": "Amravati",         "state": "Maharashtra", "total_crimes": 6200,  "population": 2900000,  "year": 2023},
    {"district": "Chandrapur",       "state": "Maharashtra", "total_crimes": 4800,  "population": 2200000,  "year": 2023},
]


def compute_scores(data):
    """
    Compute crime_rate and crime_safety_score for each district.
    crime_safety_score uses inverse normalization so lower crime = higher score.
    """
    # Step 1: compute crime_rate per 100k
    for d in data:
        d["crime_rate"] = round(d["total_crimes"] / d["population"] * 100000, 1)
        d["categories"] = {}  # placeholder for future category breakdowns

    # Step 2: normalise — inverse so low crime = high score
    rates = [d["crime_rate"] for d in data]
    min_rate = min(rates)
    max_rate = max(rates)
    spread = max_rate - min_rate if max_rate != min_rate else 1

    for d in data:
        # Inverse normalisation: highest crime rate = lowest score
        normalised = (d["crime_rate"] - min_rate) / spread  # 0 = best, 1 = worst
        d["crime_safety_score"] = round(100 - (normalised * 80), 1)  # range 20-100

    return data


def build_slug(district_name):
    """Convert district name to Firestore document ID slug."""
    return district_name.lower().replace(" ", "_").replace("-", "_")


def dry_run(data):
    """Print what would be uploaded to Firestore."""
    print("\n╔══════════════════════════════════════════════════════════════╗")
    print("║              DRY RUN — Crime Data Preview                  ║")
    print("╠══════════════════════════════════════════════════════════════╣")
    print(f"║  Collection: crime_data                                    ║")
    print(f"║  Documents:  {len(data):<46}║")
    print("╚══════════════════════════════════════════════════════════════╝\n")

    for d in sorted(data, key=lambda x: x["crime_safety_score"], reverse=True):
        slug = build_slug(d["district"])
        print(f"  📄 {slug}")
        print(f"     District: {d['district']} | State: {d['state']}")
        print(f"     Total Crimes: {d['total_crimes']:,} | Population: {d['population']:,}")
        print(f"     Crime Rate: {d['crime_rate']}/100k | Safety Score: {d['crime_safety_score']}")
        print()

    print(f"✅ Dry run complete. {len(data)} documents ready for upload.")
    print("   Run without --dry-run and with --cred to upload to Firestore.")


def upload_to_firestore(data, cred_path):
    """Upload crime data to Firestore."""
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        print("❌ firebase-admin not installed. Run: pip install firebase-admin")
        sys.exit(1)

    print(f"\n🔑 Initializing Firebase with credentials: {cred_path}")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()

    collection = db.collection("crime_data")
    print(f"📤 Uploading {len(data)} documents to 'crime_data' collection...\n")

    for i, d in enumerate(data, 1):
        slug = build_slug(d["district"])
        doc_data = {
            "district": d["district"],
            "state": d["state"],
            "total_crimes": d["total_crimes"],
            "population": d["population"],
            "crime_rate": d["crime_rate"],
            "crime_safety_score": d["crime_safety_score"],
            "year": d["year"],
            "categories": d["categories"],
        }
        collection.document(slug).set(doc_data)
        print(f"  [{i}/{len(data)}] ✅ {slug} → score {d['crime_safety_score']}")

    print(f"\n🎉 Successfully uploaded {len(data)} crime records to Firestore!")


def main():
    parser = argparse.ArgumentParser(description="Ingest NCRB crime data into Firestore")
    parser.add_argument("--manual", action="store_true", help="Use hardcoded Maharashtra data")
    parser.add_argument("--dry-run", action="store_true", help="Preview data without uploading")
    parser.add_argument("--cred", type=str, help="Path to Firebase service account JSON")
    args = parser.parse_args()

    if not args.manual:
        print("❌ Currently only --manual mode is supported.")
        print("   Usage: python ingest_crime.py --manual --dry-run")
        sys.exit(1)

    data = compute_scores(MAHARASHTRA_CRIME_DATA.copy())

    if args.dry_run:
        dry_run(data)
    elif args.cred:
        upload_to_firestore(data, args.cred)
    else:
        print("❌ Specify either --dry-run or --cred <path>")
        sys.exit(1)


if __name__ == "__main__":
    main()
