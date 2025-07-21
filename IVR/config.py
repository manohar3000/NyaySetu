from dotenv import load_dotenv
load_dotenv()
import os

def load_config():
    return {
        "GOOGLE_CLOUD_PROJECT": os.getenv("GOOGLE_CLOUD_PROJECT"),
        "GOOGLE_APPLICATION_CREDENTIALS": os.getenv("GOOGLE_APPLICATION_CREDENTIALS"),
        "ELEVENLABS_API_KEY": os.getenv("ELEVENLABS_API_KEY"),
        "FIREBASE_CREDENTIALS": os.getenv("FIREBASE_CREDENTIALS"),
        "BIGQUERY_PROJECT": os.getenv("BIGQUERY_PROJECT"),
        "TWILIO_ACCOUNT_SID": os.getenv("TWILIO_ACCOUNT_SID"),
        "TWILIO_AUTH_TOKEN": os.getenv("TWILIO_AUTH_TOKEN"),
        # Add more as needed
        "NGROK_BASE_URL": os.getenv("NGROK_BASE_URL"),
    }


print(load_config())