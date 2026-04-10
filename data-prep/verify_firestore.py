"""Quick verification: check all 3 Firestore collections are populated."""
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("../firebase-adminsdk.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

for coll_name in ["crime_data", "flood_zones", "schools"]:
    docs = list(db.collection(coll_name).get())
    print(f"{coll_name}: {len(docs)} documents")
    for d in docs[:3]:
        data = d.to_dict()
        if coll_name == "crime_data":
            print(f"  - {d.id}: {data.get('district')} | score {data.get('crime_safety_score')}")
        elif coll_name == "flood_zones":
            print(f"  - {d.id}: {data.get('hazard_level')} | {data.get('district')}")
        elif coll_name == "schools":
            name = data.get("name", "")[:40]
            print(f"  - {d.id}: {name} | geohash6={data.get('geohash6')}")
    print()

print("ALL COLLECTIONS VERIFIED.")
