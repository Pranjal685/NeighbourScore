#!/usr/bin/env python3
"""
verify_mumbai_schools.py — Check CBSE schools coverage for Mumbai in Firestore.

Queries the schools collection for Maharashtra records to confirm existing
CBSE data covers Mumbai before starting Mumbai city expansion.

Usage:
  python verify_mumbai_schools.py --dry-run           # Test connection only
  python verify_mumbai_schools.py --cred ../firebase-adminsdk.json
  python verify_mumbai_schools.py --cred ../firebase-adminsdk.json --sample 10
"""

import argparse
import sys


MUMBAI_PINCODES_PREFIX = ("400",)  # all Mumbai pincodes start with 400xxx

MUMBAI_KEYWORDS = [
    "mumbai", "bombay", "andheri", "bandra", "borivali", "dadar",
    "goregaon", "kandivali", "kurla", "malad", "thane",
]


def dry_run():
    print("\n" + "=" * 62)
    print("  DRY RUN — Mumbai Schools Verification")
    print("=" * 62)
    print("\n  Would query Firestore: schools collection")
    print("  Filter: state == 'Maharashtra'")
    print("  Post-filter: city/address contains Mumbai keywords or pincode starts with '400'")
    print("\n  Provide --cred to run the actual query.\n")


def verify(cred_path, sample_count):
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        print("ERROR: firebase-admin not installed. Run: pip install firebase-admin")
        sys.exit(1)

    print(f"\n  Initializing Firebase: {cred_path}")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()

    print("  Querying schools collection for Maharashtra...")
    snap = db.collection("schools").where("state", "==", "Maharashtra").get()

    total_maharashtra = len(snap)
    print(f"\n  Maharashtra schools total: {total_maharashtra:,}")

    if total_maharashtra == 0:
        print("\n  WARNING: No Maharashtra schools found.")
        print("  Schools may be stored with different state name (e.g. 'MAHARASHTRA').")
        print("  Try re-running with --state 'MAHARASHTRA' or check raw data.")
        return

    # Identify Mumbai schools by pincode or city/address keywords
    mumbai_schools = []
    for doc in snap:
        d = doc.to_dict()
        city_str = str(d.get("city", "")).lower()
        pincode = str(d.get("pincode", ""))
        address = str(d.get("address", "")).lower()
        name = str(d.get("name", "")).lower()

        is_mumbai = (
            pincode.startswith(MUMBAI_PINCODES_PREFIX)
            or any(kw in city_str for kw in MUMBAI_KEYWORDS)
            or any(kw in address for kw in MUMBAI_KEYWORDS)
        )

        if is_mumbai:
            mumbai_schools.append(d)

    print(f"  Mumbai-area schools:      {len(mumbai_schools):,}")
    coverage_pct = (len(mumbai_schools) / total_maharashtra * 100) if total_maharashtra > 0 else 0
    print(f"  Coverage (% of MH):       {coverage_pct:.1f}%")

    if len(mumbai_schools) == 0:
        print("\n  WARNING: 0 Mumbai schools found in the dataset.")
        print("  CBSE data may be Pune-area only (pincodes 411xxx).")
        print("  Mumbai data ingestion (schools) may be required.")
    else:
        print(f"\n  OK: Mumbai CBSE school data exists ({len(mumbai_schools):,} schools).")
        print("  No additional school ingestion needed for Mumbai expansion.")

    # Sample output
    if sample_count > 0 and mumbai_schools:
        print(f"\n  Sample ({min(sample_count, len(mumbai_schools))} of {len(mumbai_schools)}):")
        print("  " + "-" * 60)
        for s in mumbai_schools[:sample_count]:
            name = s.get("name", "N/A")[:45]
            pin = s.get("pincode", "?")
            lat = s.get("lat", "?")
            lng = s.get("lng", "?")
            score = s.get("school_score", "?")
            print(f"  {name:<45}")
            print(f"    pin:{pin}  lat:{lat}  lng:{lng}  score:{score}")

    print()


def main():
    parser = argparse.ArgumentParser(description="Verify Mumbai CBSE schools coverage in Firestore")
    parser.add_argument("--dry-run", action="store_true", help="Show query plan without connecting")
    parser.add_argument("--cred", type=str, help="Path to Firebase service account JSON")
    parser.add_argument("--sample", type=int, default=5, help="Number of sample records to print (default: 5)")
    args = parser.parse_args()

    if args.dry_run:
        dry_run()
    elif args.cred:
        verify(args.cred, args.sample)
    else:
        print("ERROR: Specify either --dry-run or --cred <path>")
        sys.exit(1)


if __name__ == "__main__":
    main()
