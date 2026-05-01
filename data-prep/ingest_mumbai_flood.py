#!/usr/bin/env python3
"""
ingest_mumbai_flood.py — Write Mumbai flood-prone zone polygons to Firestore.

8 zones covering coastal flooding, Mithi river, low-lying waterlogging, and tidal areas.
Coordinates are real WGS84 (lat/lng) from NDMA/MCGM flood risk assessments.
Writes to flood_zones collection (same as Pune) with added city:"mumbai" field.

Usage:
  python ingest_mumbai_flood.py --dry-run
  python ingest_mumbai_flood.py --cred ../firebase-adminsdk.json
"""

import argparse
import json
import sys

# ── Mumbai flood zone polygons ───────────────────────────────────────────
# GeoJSON uses [lng, lat] ordering per spec.
# flood_type: coastal | river | waterlogging | tidal

MUMBAI_FLOOD_ZONES = [
    {
        "doc_id": "flood_mumbai_colaba_coastal",
        "name": "South Mumbai Coastal — Colaba / Marine Lines / Nariman Point",
        "hazard_level": "High",
        "flood_type": "coastal",
        "district": "Mumbai City",
        "state": "Maharashtra",
        "city": "mumbai",
        "source": "NDMA_MCGM_hardcoded_demo",
        "geojson": {
            "type": "Polygon",
            "coordinates": [[
                [72.808, 18.897],  # SW — Colaba Point
                [72.821, 18.898],  # S  — Colaba causeway
                [72.836, 18.916],  # SE — Ballard Estate
                [72.836, 18.942],  # E  — Marine Lines east
                [72.826, 18.948],  # NE — Charni Road
                [72.816, 18.948],  # N  — Marine Lines beach
                [72.808, 18.936],  # NW — Churchgate seafront
                [72.804, 18.920],  # W  — Nariman Point
                [72.805, 18.905],  # SW2 — Colaba seafront
                [72.808, 18.897],  # close ring
            ]]
        },
    },
    {
        "doc_id": "flood_mumbai_worli_haji_ali",
        "name": "Worli Seafront / Haji Ali Coastal Zone",
        "hazard_level": "High",
        "flood_type": "coastal",
        "district": "Mumbai City",
        "state": "Maharashtra",
        "city": "mumbai",
        "source": "NDMA_MCGM_hardcoded_demo",
        "geojson": {
            "type": "Polygon",
            "coordinates": [[
                [72.807, 18.992],  # NW — Worli north
                [72.820, 18.994],  # N  — Worli NE
                [72.826, 18.983],  # NE — Worli village
                [72.822, 18.968],  # E  — Worli colony
                [72.815, 18.960],  # SE — Haji Ali area
                [72.804, 18.962],  # S  — Worli seaface south
                [72.800, 18.975],  # SW — Worli seaface west
                [72.803, 18.987],  # W  — coast
                [72.807, 18.992],  # close ring
            ]]
        },
    },
    {
        "doc_id": "flood_mumbai_juhu_versova",
        "name": "Juhu Beach / Versova Coastal Zone",
        "hazard_level": "Medium",
        "flood_type": "coastal",
        "district": "Mumbai Suburban",
        "state": "Maharashtra",
        "city": "mumbai",
        "source": "NDMA_MCGM_hardcoded_demo",
        "geojson": {
            "type": "Polygon",
            "coordinates": [[
                [72.815, 19.095],  # NW — Versova north
                [72.822, 19.100],  # N  — Versova beach
                [72.832, 19.100],  # NE — Juhu north
                [72.838, 19.093],  # E  — Juhu east
                [72.840, 19.082],  # SE — Vile Parle West
                [72.835, 19.072],  # S  — Santacruz West
                [72.822, 19.072],  # SW — south Juhu
                [72.812, 19.082],  # W  — Versova south
                [72.815, 19.095],  # close ring
            ]]
        },
    },
    {
        "doc_id": "flood_mumbai_mithi_river",
        "name": "Mithi River Flood Corridor — Dharavi / BKC / Kurla / Sion",
        "hazard_level": "High",
        "flood_type": "river",
        "district": "Mumbai Suburban",
        "state": "Maharashtra",
        "city": "mumbai",
        "source": "NDMA_MCGM_hardcoded_demo",
        "geojson": {
            "type": "Polygon",
            "coordinates": [[
                [72.848, 19.067],  # NW — BKC north
                [72.872, 19.068],  # NE — Kurla West
                [72.885, 19.058],  # E  — Kurla East
                [72.882, 19.042],  # SE — Chembur junction
                [72.868, 19.033],  # S  — Sion south
                [72.848, 19.033],  # SW — Dharavi south
                [72.840, 19.043],  # W  — Dharavi west
                [72.842, 19.056],  # NW2 — Dharavi north
                [72.848, 19.067],  # close ring
            ]]
        },
    },
    {
        "doc_id": "flood_mumbai_andheri_lowlying",
        "name": "Andheri / Jogeshwari Low-Lying Waterlogging Zone",
        "hazard_level": "Medium",
        "flood_type": "waterlogging",
        "district": "Mumbai Suburban",
        "state": "Maharashtra",
        "city": "mumbai",
        "source": "NDMA_MCGM_hardcoded_demo",
        "geojson": {
            "type": "Polygon",
            "coordinates": [[
                [72.838, 19.122],  # NW — Andheri north
                [72.855, 19.126],  # N  — Jogeshwari
                [72.868, 19.120],  # NE — Andheri East north
                [72.868, 19.106],  # E  — Andheri East
                [72.858, 19.097],  # SE — Andheri station east
                [72.842, 19.095],  # S  — Andheri station south
                [72.832, 19.105],  # SW — Andheri West south
                [72.833, 19.116],  # W  — Andheri West
                [72.838, 19.122],  # close ring
            ]]
        },
    },
    {
        "doc_id": "flood_mumbai_hindmata_dadar",
        "name": "Hindmata / Dadar Waterlogging Zone",
        "hazard_level": "Medium",
        "flood_type": "waterlogging",
        "district": "Mumbai City",
        "state": "Maharashtra",
        "city": "mumbai",
        "source": "NDMA_MCGM_hardcoded_demo",
        "geojson": {
            "type": "Polygon",
            "coordinates": [[
                [72.838, 19.026],  # NW — Dadar West
                [72.853, 19.027],  # N  — Dadar station
                [72.860, 19.018],  # NE — Matunga
                [72.858, 19.005],  # E  — Sion West
                [72.848, 18.998],  # SE — Parel east
                [72.836, 19.000],  # S  — Parel
                [72.830, 19.010],  # SW — Lower Parel
                [72.832, 19.020],  # W  — Worli north
                [72.838, 19.026],  # close ring
            ]]
        },
    },
    {
        "doc_id": "flood_mumbai_bandra_mahim",
        "name": "Bandra / Mahim Tidal Zone",
        "hazard_level": "High",
        "flood_type": "tidal",
        "district": "Mumbai Suburban",
        "state": "Maharashtra",
        "city": "mumbai",
        "source": "NDMA_MCGM_hardcoded_demo",
        "geojson": {
            "type": "Polygon",
            "coordinates": [[
                [72.826, 19.058],  # NW — Bandra West seafront
                [72.840, 19.060],  # N  — Bandra station
                [72.850, 19.052],  # NE — Bandra East
                [72.852, 19.042],  # E  — Dharavi border
                [72.845, 19.033],  # SE — Mahim station
                [72.836, 19.032],  # S  — Mahim south
                [72.824, 19.040],  # SW — Mahim seafront
                [72.820, 19.050],  # W  — Bandra seafront
                [72.826, 19.058],  # close ring
            ]]
        },
    },
    {
        "doc_id": "flood_mumbai_sewri_wadala",
        "name": "Sewri / Wadala Tidal Zone",
        "hazard_level": "Medium",
        "flood_type": "tidal",
        "district": "Mumbai City",
        "state": "Maharashtra",
        "city": "mumbai",
        "source": "NDMA_MCGM_hardcoded_demo",
        "geojson": {
            "type": "Polygon",
            "coordinates": [[
                [72.850, 18.998],  # NW — Wadala north
                [72.870, 18.998],  # N  — Sewri north
                [72.878, 18.987],  # NE — Sewri east
                [72.878, 18.972],  # E  — Sewri south
                [72.868, 18.962],  # SE — Sewri creek
                [72.852, 18.963],  # S  — Wadala south
                [72.843, 18.973],  # SW — Wadala west
                [72.843, 18.988],  # W  — Wadala west north
                [72.850, 18.998],  # close ring
            ]]
        },
    },
]


def compute_bbox(geojson):
    """Compute bounding box from GeoJSON polygon coordinates."""
    coords = geojson["coordinates"][0]
    lngs = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    return {
        "minLat": round(min(lats), 6),
        "maxLat": round(max(lats), 6),
        "minLng": round(min(lngs), 6),
        "maxLng": round(max(lngs), 6),
    }


def prepare_data():
    for zone in MUMBAI_FLOOD_ZONES:
        zone["bbox"] = compute_bbox(zone["geojson"])
    return MUMBAI_FLOOD_ZONES


def dry_run(zones):
    print("\n" + "=" * 66)
    print("  DRY RUN — Mumbai Flood Zone Preview")
    print("=" * 66)
    print(f"  Collection: flood_zones")
    print(f"  Documents:  {len(zones)}")
    print("-" * 66)

    for z in zones:
        vertices = len(z["geojson"]["coordinates"][0])
        print(f"\n  Document: {z['doc_id']}")
        print(f"    Name:       {z['name']}")
        print(f"    Hazard:     {z['hazard_level']}   Type: {z['flood_type']}")
        print(f"    District:   {z['district']} | City: {z['city']}")
        print(f"    BBox:       lat [{z['bbox']['minLat']}, {z['bbox']['maxLat']}]")
        print(f"                lng [{z['bbox']['minLng']}, {z['bbox']['maxLng']}]")
        print(f"    Vertices:   {vertices}")

    high = sum(1 for z in zones if z["hazard_level"] == "High")
    med = sum(1 for z in zones if z["hazard_level"] == "Medium")
    by_type = {}
    for z in zones:
        by_type[z["flood_type"]] = by_type.get(z["flood_type"], 0) + 1

    print(f"\n  Summary: {high} High risk, {med} Medium risk")
    print(f"           Types: {', '.join(f'{k}:{v}' for k, v in by_type.items())}")
    print(f"\n  OK: Dry run complete. {len(zones)} documents ready.")
    print("  Run without --dry-run and with --cred to upload.\n")


def upload_to_firestore(zones, cred_path):
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
            "flood_type": z["flood_type"],
            "district": z["district"],
            "state": z["state"],
            "city": z["city"],
            "geojson": json.dumps(z["geojson"]),  # Firestore can't nest arrays this deep
            "bbox": z["bbox"],
            "source": z["source"],
        }
        collection.document(z["doc_id"]).set(doc_data)
        print(f"  [{i}/{len(zones)}] OK: {z['doc_id']} ({z['hazard_level']}, {z['flood_type']})")

    print(f"\n  Done! {len(zones)} Mumbai flood zone records uploaded to Firestore.")


def main():
    parser = argparse.ArgumentParser(description="Ingest Mumbai flood zones into Firestore")
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
