#!/usr/bin/env python3
"""
ingest_mumbai_crime.py — Load Mumbai NCRB 2023 crime data into Firestore `crime_data`.

Creates two tiers of documents:

  ZONE DOCS (5):  mumbai_south, mumbai_western_suburbs, etc.
    → For future granular Mumbai API. Has city:"mumbai" + zone fields.

  DISTRICT DOCS (2):  mumbai_city, mumbai_suburban
    → For immediate crime.js backend compatibility.
    → Google Maps reverse-geocode returns "Mumbai City" or "Mumbai Suburban"
      as administrative_area_level_2, which crime.js slugifies and queries directly.

Source: NCRB "Crime in India 2023", Mumbai City IPC total ~37,000.
Zone breakdown is proportional approximation (no ward-level public data).

Usage:
  python ingest_mumbai_crime.py --dry-run
  python ingest_mumbai_crime.py --cred ../firebase-adminsdk.json
"""

import argparse
import sys

# ── Base values from NCRB 2023 ────────────────────────────────────────────
# Total IPC crimes: ~37,000  |  Population: 12,442,373  |  Rate: 297.4/lakh
BASE_RATE = 297.4  # crimes per 100,000 population

# ── Zone-level data ───────────────────────────────────────────────────────
# rate_factor applied to BASE_RATE per user specification.
# Populations sum to 12,442,373. Crimes sum to ~37,000.

MUMBAI_ZONES = [
    {
        "doc_id":      "mumbai_south",
        "district":    "South Mumbai",
        "zone":        "south_mumbai",
        "population":  1_500_000,
        "rate_factor": 0.70,   # Lower crime density, high policing (Colaba, Fort, Malabar Hill)
        "localities":  "Colaba, Fort, CST, Marine Lines, Malabar Hill, Cuffe Parade, Worli",
    },
    {
        "doc_id":      "mumbai_western_suburbs",
        "district":    "Mumbai Western Suburbs",
        "zone":        "western_suburbs",
        "population":  3_500_000,
        "rate_factor": 0.85,   # Bandra, Andheri, Juhu — mixed residential/commercial
        "localities":  "Bandra, Khar, Santacruz, Vile Parle, Andheri, Juhu, Versova, Goregaon W",
    },
    {
        "doc_id":      "mumbai_eastern_suburbs",
        "district":    "Mumbai Eastern Suburbs",
        "zone":        "eastern_suburbs",
        "population":  2_500_000,
        "rate_factor": 1.10,   # Higher density industrial corridors
        "localities":  "Ghatkopar, Kurla, Chembur, Mankhurd, Vikhroli, Bhandup",
    },
    {
        "doc_id":      "mumbai_northern_suburbs",
        "district":    "Mumbai Northern Suburbs",
        "zone":        "northern_suburbs",
        "population":  3_200_000,
        "rate_factor": 0.95,   # Borivali/Malad — suburban residential
        "localities":  "Goregaon, Malad, Kandivali, Borivali, Dahisar",
    },
    {
        "doc_id":      "mumbai_dharavi_govandi",
        "district":    "Dharavi / Govandi / Mankhurd",
        "zone":        "dharavi_govandi",
        "population":  1_742_373,
        "rate_factor": 1.40,   # High-density informal settlements
        "localities":  "Dharavi, Govandi, Mankhurd, Trombay, Shivaji Nagar",
    },
]

# ── District aggregate docs (crime.js compatibility) ──────────────────────
# Google Maps returns "Mumbai City" for island city, "Mumbai Suburban" for suburbs.
# These weighted averages let the existing backend work without code changes.
#
# Mumbai City  = South Mumbai + Dharavi/Govandi  (Google returns this for Colaba, Dadar, etc.)
# Mumbai Suburban = Western + Eastern + Northern  (Google returns this for Bandra, Andheri, etc.)

MUMBAI_DISTRICTS = [
    {
        "doc_id":     "mumbai_city",
        "district":   "Mumbai City",
        "zone":       None,
        # South (pop 1.5M) + Dharavi/Govandi (pop 1.742M) weighted average
        "population": 3_242_373,
        "total_crimes_override": None,  # computed in compute_scores from population + weighted rate
        "_rate_factor_override": (0.70 * 1_500_000 + 1.40 * 1_742_373) / (1_500_000 + 1_742_373),
    },
    {
        "doc_id":     "mumbai_suburban",
        "district":   "Mumbai Suburban",
        "zone":       None,
        # Western + Eastern + Northern weighted average
        "population": 9_200_000,
        "total_crimes_override": None,
        "_rate_factor_override": (0.85 * 3_500_000 + 1.10 * 2_500_000 + 0.95 * 3_200_000) / (3_500_000 + 2_500_000 + 3_200_000),
    },
]


def compute_scores(data):
    """
    Compute crime_rate and crime_safety_score for all docs.
    Uses same inverse-normalisation formula as ingest_crime.py (Pune).
    Score range: 20–100 (lower crime = higher score).
    """
    for d in data:
        factor = d.get("rate_factor", d.get("_rate_factor_override", 1.0))
        d["crime_rate"] = round(BASE_RATE * factor, 1)
        d["total_crimes"] = round(d["crime_rate"] * d["population"] / 100_000)
        d["categories"] = {}

    rates = [d["crime_rate"] for d in data]
    min_rate = min(rates)
    max_rate = max(rates)
    spread = max_rate - min_rate if max_rate != min_rate else 1

    for d in data:
        normalised = (d["crime_rate"] - min_rate) / spread
        d["crime_safety_score"] = round(100 - (normalised * 80), 1)

    return data


def build_all_docs():
    """Merge zone docs + district docs, compute scores across all."""
    all_docs = []

    for z in MUMBAI_ZONES:
        all_docs.append({
            "doc_id":    z["doc_id"],
            "district":  z["district"],
            "zone":      z["zone"],
            "population": z["population"],
            "rate_factor": z["rate_factor"],
            "localities": z.get("localities", ""),
        })

    for d in MUMBAI_DISTRICTS:
        all_docs.append({
            "doc_id":    d["doc_id"],
            "district":  d["district"],
            "zone":      d["zone"],
            "population": d["population"],
            "_rate_factor_override": d["_rate_factor_override"],
        })

    return compute_scores(all_docs)


def dry_run(docs):
    zones = [d for d in docs if d["zone"] is not None]
    districts = [d for d in docs if d["zone"] is None]

    print("\n" + "=" * 68)
    print("  DRY RUN -- Mumbai Crime Data Preview")
    print("=" * 68)
    print(f"  Collection: crime_data")
    print(f"  Zone docs:     {len(zones)}")
    print(f"  District docs: {len(districts)}")
    print("-" * 68)

    print("\n  ZONE DOCS (granular — future use):")
    print(f"  {'Slug':<30} {'Pop':>10} {'Rate/lakh':>10} {'Score':>6}")
    print("  " + "-" * 60)
    for d in sorted(zones, key=lambda x: x["crime_safety_score"], reverse=True):
        print(f"  {d['doc_id']:<30} {d['population']:>10,} {d['crime_rate']:>10.1f} {d['crime_safety_score']:>6.1f}")

    print("\n  DISTRICT DOCS (crime.js compatible):")
    print(f"  {'Slug':<20} {'Pop':>12} {'Crimes':>8} {'Rate/lakh':>10} {'Score':>6}")
    print("  " + "-" * 60)
    for d in sorted(districts, key=lambda x: x["crime_safety_score"], reverse=True):
        print(f"  {d['doc_id']:<20} {d['population']:>12,} {d['total_crimes']:>8,} {d['crime_rate']:>10.1f} {d['crime_safety_score']:>6.1f}")

    total_zone_crimes = sum(d["total_crimes"] for d in zones)
    print(f"\n  Zone total crimes: {total_zone_crimes:,} (target: ~37,000)")
    print(f"\n  OK: Dry run complete. {len(docs)} documents ready.")
    print("  Run without --dry-run and with --cred to upload.\n")


def upload_to_firestore(docs, cred_path):
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

    collection = db.collection("crime_data")
    print(f"  Uploading {len(docs)} documents to 'crime_data' collection...\n")

    for i, d in enumerate(docs, 1):
        doc_data = {
            "district":          d["district"],
            "state":             "Maharashtra",
            "city":              "mumbai",
            "zone":              d["zone"],
            "total_crimes":      d["total_crimes"],
            "population":        d["population"],
            "crime_rate":        d["crime_rate"],
            "crime_safety_score": d["crime_safety_score"],
            "year":              2023,
            "categories":        d["categories"],
        }
        collection.document(d["doc_id"]).set(doc_data)
        tier = "zone" if d["zone"] else "district"
        print(f"  [{i}/{len(docs)}] OK: {d['doc_id']} [{tier}] score {d['crime_safety_score']}")

    print(f"\n  Done! {len(docs)} Mumbai crime records uploaded to Firestore.")


def main():
    parser = argparse.ArgumentParser(description="Ingest Mumbai NCRB crime data into Firestore")
    parser.add_argument("--dry-run", action="store_true", help="Preview data without uploading")
    parser.add_argument("--cred", type=str, help="Path to Firebase service account JSON")
    args = parser.parse_args()

    docs = build_all_docs()

    if args.dry_run:
        dry_run(docs)
    elif args.cred:
        upload_to_firestore(docs, args.cred)
    else:
        print("ERROR: Specify either --dry-run or --cred <path>")
        sys.exit(1)


if __name__ == "__main__":
    main()
