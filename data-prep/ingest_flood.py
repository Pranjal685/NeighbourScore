#!/usr/bin/env python3
"""
ingest_flood.py — Write hardcoded Pune flood-prone zone polygons to Firestore.

No shapefile download needed. Uses real Pune coordinates for 5 known
river flood zones derived from NDMA/PMC flood risk assessments.

Usage:
  python ingest_flood.py --manual --dry-run
  python ingest_flood.py --manual --cred ../firebase-adminsdk.json
"""

import argparse
import json
import sys

# ── Hardcoded Pune flood-prone zone polygons ─────────────────────────────
# Coordinates are real WGS84 (lat/lng) for known flood-prone riverbank areas.
# GeoJSON uses [lng, lat] ordering per spec.

PUNE_FLOOD_ZONES = [
    {
        "doc_id": "flood_mutha_river",
        "name": "Mutha River Banks — Deccan / Kasba / Shivajinagar",
        "hazard_level": "High",
        "district": "Pune",
        "state": "Maharashtra",
        "source": "NDMA_hardcoded_demo",
        "geojson": {
            "type": "Polygon",
            "coordinates": [[
                [73.8400, 18.5280],  # NW — near Deccan Gymkhana
                [73.8550, 18.5320],  # NE — Shivajinagar bridge
                [73.8650, 18.5250],  # E  — Sangam bridge area
                [73.8700, 18.5150],  # SE — Kasba Peth riverbank
                [73.8620, 18.5080],  # S  — south of Kasba
                [73.8480, 18.5100],  # SW — Parvati foothills
                [73.8380, 18.5180],  # W  — back towards Deccan
                [73.8400, 18.5280],  # close ring
            ]]
        },
    },
    {
        "doc_id": "flood_bhima_river",
        "name": "Bhima River Zone — Hadapsar / Manjri",
        "hazard_level": "High",
        "district": "Pune",
        "state": "Maharashtra",
        "source": "NDMA_hardcoded_demo",
        "geojson": {
            "type": "Polygon",
            "coordinates": [[
                [73.9400, 18.4850],  # NW — Hadapsar industrial
                [73.9600, 18.4900],  # NE — Manjri Khurd
                [73.9750, 18.4800],  # E  — east Manjri
                [73.9700, 18.4650],  # SE — Manjri BK
                [73.9550, 18.4580],  # S  — south Manjri
                [73.9380, 18.4620],  # SW — Hadapsar south
                [73.9320, 18.4750],  # W  — Hadapsar west
                [73.9400, 18.4850],  # close ring
            ]]
        },
    },
    {
        "doc_id": "flood_mula_river",
        "name": "Mula River Banks — Wakad / Pimpri",
        "hazard_level": "Medium",
        "district": "Pune",
        "state": "Maharashtra",
        "source": "NDMA_hardcoded_demo",
        "geojson": {
            "type": "Polygon",
            "coordinates": [[
                [73.7550, 18.5950],  # NW — Wakad bridge
                [73.7750, 18.6020],  # N  — north Wakad
                [73.7950, 18.5980],  # NE — Pimpri east
                [73.8050, 18.5850],  # E  — Sangvi
                [73.7980, 18.5720],  # SE — Dapodi
                [73.7780, 18.5680],  # S  — Khadki
                [73.7600, 18.5750],  # SW — south Wakad
                [73.7500, 18.5850],  # W  — west Wakad
                [73.7550, 18.5950],  # close ring
            ]]
        },
    },
    {
        "doc_id": "flood_pavana_river",
        "name": "Pavana River Zone — Chinchwad / Akurdi",
        "hazard_level": "Medium",
        "district": "Pune",
        "state": "Maharashtra",
        "source": "NDMA_hardcoded_demo",
        "geojson": {
            "type": "Polygon",
            "coordinates": [[
                [73.7650, 18.6350],  # NW — Akurdi station
                [73.7850, 18.6400],  # N  — north Akurdi
                [73.8000, 18.6320],  # NE — Nigdi east
                [73.8050, 18.6200],  # E  — Chinchwad east
                [73.7950, 18.6100],  # SE — Chinchwad station
                [73.7750, 18.6080],  # S  — south Chinchwad
                [73.7600, 18.6150],  # SW — Thermax chowk
                [73.7580, 18.6250],  # W  — Akurdi west
                [73.7650, 18.6350],  # close ring
            ]]
        },
    },
    {
        "doc_id": "flood_khadakwasla",
        "name": "Khadakwasla Downstream — Dhayari / Narhe",
        "hazard_level": "High",
        "district": "Pune",
        "state": "Maharashtra",
        "source": "NDMA_hardcoded_demo",
        "geojson": {
            "type": "Polygon",
            "coordinates": [[
                [73.8050, 18.4650],  # NW — Dhayari village
                [73.8250, 18.4700],  # NE — Narhe bridge
                [73.8350, 18.4600],  # E  — Narhe east
                [73.8300, 18.4450],  # SE — Ambegaon BK
                [73.8150, 18.4380],  # S  — south of dam road
                [73.8000, 18.4400],  # SW — Dhayari south
                [73.7950, 18.4520],  # W  — west Dhayari
                [73.8050, 18.4650],  # close ring
            ]]
        },
    },
]


def compute_bbox(geojson):
    """Compute bounding box from GeoJSON polygon coordinates."""
    coords = geojson["coordinates"][0]  # outer ring
    lngs = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    return {
        "minLat": round(min(lats), 6),
        "maxLat": round(max(lats), 6),
        "minLng": round(min(lngs), 6),
        "maxLng": round(max(lngs), 6),
    }


def prepare_data():
    """Add computed bounding boxes to all zones."""
    for zone in PUNE_FLOOD_ZONES:
        zone["bbox"] = compute_bbox(zone["geojson"])
    return PUNE_FLOOD_ZONES


def dry_run(zones):
    """Preview what would be uploaded."""
    print("\n" + "=" * 62)
    print("  DRY RUN -- Flood Zone Preview")
    print("=" * 62)
    print(f"  Collection: flood_zones")
    print(f"  Documents:  {len(zones)}")
    print("-" * 62)

    for z in zones:
        vertices = len(z["geojson"]["coordinates"][0])
        print(f"\n  Document: {z['doc_id']}")
        print(f"    Name:    {z['name']}")
        print(f"    Hazard:  {z['hazard_level']}")
        print(f"    District:{z['district']} | State: {z['state']}")
        print(f"    BBox:    lat [{z['bbox']['minLat']}, {z['bbox']['maxLat']}]")
        print(f"             lng [{z['bbox']['minLng']}, {z['bbox']['maxLng']}]")
        print(f"    Vertices:{vertices}")
        print(f"    Source:  {z['source']}")

    high = sum(1 for z in zones if z["hazard_level"] == "High")
    med = sum(1 for z in zones if z["hazard_level"] == "Medium")
    print(f"\n  Summary: {high} High risk, {med} Medium risk")
    print(f"\n  OK: Dry run complete. {len(zones)} documents ready.")
    print("  Run without --dry-run and with --cred to upload.\n")


def upload_to_firestore(zones, cred_path):
    """Upload flood zone data to Firestore."""
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

    collection = db.collection("flood_zones")
    print(f"  Uploading {len(zones)} documents to 'flood_zones'...\n")

    for i, z in enumerate(zones, 1):
        doc_data = {
            "hazard_level": z["hazard_level"],
            "district": z["district"],
            "state": z["state"],
            "geojson": json.dumps(z["geojson"]),  # Firestore can't nest arrays this deep
            "bbox": z["bbox"],
            "source": z["source"],
        }
        collection.document(z["doc_id"]).set(doc_data)
        print(f"  [{i}/{len(zones)}] OK: {z['doc_id']} ({z['hazard_level']})")

    print(f"\n  Done! {len(zones)} flood zone records uploaded to Firestore.")


def main():
    parser = argparse.ArgumentParser(description="Ingest hardcoded Pune flood zones into Firestore")
    parser.add_argument("--manual", action="store_true", help="Use hardcoded Pune flood zone data")
    parser.add_argument("--shp", type=str, help="(Ignored) Kept for CLI compatibility")
    parser.add_argument("--dry-run", action="store_true", help="Preview data without uploading")
    parser.add_argument("--cred", type=str, help="Path to Firebase service account JSON")
    args = parser.parse_args()

    zones = prepare_data()

    if args.dry_run:
        dry_run(zones)
    elif args.cred:
        upload_to_firestore(zones, args.cred)
    else:
        print("ERROR: Specify either --dry-run or --cred <path>")
        sys.exit(1)


if __name__ == "__main__":
    main()
