import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import bigquery
import os
from datetime import datetime

cred = credentials.Certificate(os.getenv("FIREBASE_CREDENTIALS"))
firebase_admin.initialize_app(cred)
db = firestore.client()
bq_client = bigquery.Client()

FIRESTORE_COLLECTION = "lexa_interactions"
BIGQUERY_TABLE = "analytics.lexa_metadata"

def log_interaction(data):
    # Firestore log
    db.collection(FIRESTORE_COLLECTION).add(data)
    # BigQuery log (anonymized)
    bq_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "session_id": data.get("session_id"),
        "topic": data.get("topic"),
        "confidence": data.get("confidence"),
        "language": data.get("language"),
    }
    errors = bq_client.insert_rows_json(BIGQUERY_TABLE, [bq_data])
    if errors:
        print(f"BigQuery errors: {errors}") 