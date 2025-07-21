from fastapi import APIRouter, Request, File, UploadFile
from fastapi.responses import Response, JSONResponse
from twilio.twiml.voice_response import VoiceResponse, Gather
from twilio.rest import Client
from gemini_chain import GeminiChain
from utils import detect_human_request
import os
from tts import synthesize_speech
import time
from collections import defaultdict
from config import load_config

# In-memory conversation history: {session_id: [(timestamp, role, message), ...]}
conversation_history = defaultdict(list)

router = APIRouter()

config = load_config()
print("Config loaded:", config)
NGROK_BASE_URL = config.get("NGROK_BASE_URL") or "https://b6f547fcb.ngrok-free.app"  # Fallback to current URL
print("Using NGROK_BASE_URL:", NGROK_BASE_URL)

# --- Call Trigger Endpoint ---
@router.post("/make_call")
def make_call():
    # Load Twilio credentials from env
    account_sid = 
    auth_token = 
    from_number = "+17867861066"  # Your Twilio number
    to_number = "+916351478230"      # Your real phone number

    client = Client(account_sid, auth_token)

    call = client.calls.create(
        to=to_number,
        from_=from_number,
        url=f"{NGROK_BASE_URL}/ivr/initiate_call"  # Publicly accessible URL
    )

    return {"status": "initiated", "call_sid": call.sid}


# --- Initiate Call with IVR Instructions ---
@router.post("/initiate_call")
def initiate_call():
    resp = VoiceResponse()
    gather = Gather(
        input="dtmf",
        num_digits=1,
        action=f"{NGROK_BASE_URL}/ivr/language_select",
        method="POST",
        timeout=5
    )
    gather.say("Welcome to Lexa. Dial 1 for English, 2 for Hindi.")
    resp.append(gather)
    resp.say("No input received. Goodbye!")
    return Response(content=str(resp), media_type="application/xml")

@router.post("/language_select")
def language_select(request: Request = None):
    import asyncio
    async def _inner():
        form = await request.form()
        digits = form.get("Digits", "1")
        language = "en-IN"
        if digits == "2":
            language = "hi-IN"
        resp = VoiceResponse()
        gather = Gather(
            input="speech",
            action=f"{NGROK_BASE_URL}/ivr/process_input?language={language}",
            method="POST",
            language=language,
            timeout=5
        )
        if language == "hi-IN":
            gather.say("कृपया अपना प्रश्न पूछें।", language="hi-IN")
        else:
            gather.say("Please ask your question after the beep.", language="en-IN")
        resp.append(gather)
        resp.say("No input received. Goodbye!", language=language)
        return Response(content=str(resp), media_type="application/xml")
    return asyncio.run(_inner())

# --- Process User's Voice (via Twilio STT) ---
@router.post("/process_input")
async def process_input(request: Request):
    import urllib.parse
    form = await request.form()
    print("📝 Form received:", dict(form))

    audio_url = form.get("RecordingUrl")
    transcript = form.get("SpeechResult")
    session_id = form.get("CallSid", "unknown-session")
    # Get current time
    now = time.strftime("%Y-%m-%d %H:%M:%S")
    # Get language from query param or form
    language = request.url.query.split("language=")[-1] if "language=" in request.url.query else form.get("Language", "en-IN")

    

    resp = VoiceResponse()
    # Think-like delay message
    resp.say("Okay, give me a moment.", language="en-IN")

    # Response playback
    resp.play(audio_url)

    # Step 1: If transcript is already available (via speech input)
    if transcript:
        print("🗣️ Transcript received from Twilio:", transcript)

        # Add user message to history
        conversation_history[session_id].append((now, "user", transcript))

        if detect_human_request(transcript):
            resp.redirect("/fallback/human", method="POST")
            return Response(content=str(resp), media_type="application/xml")

        gemini = GeminiChain(session_id)
        gemini_result = gemini.ask(transcript, history=conversation_history[session_id])
        response_text = gemini_result["response"]

        # Add agent response to history
        conversation_history[session_id].append((now, "agent", response_text))

        # Convert to speech and play
        audio_url = synthesize_speech(response_text, lang=language)
        resp.play(audio_url)

        # Wait for next question (preserve language)
        gather = Gather(
            input="speech",
            action=f"{NGROK_BASE_URL}/ivr/process_input?language={language}",
            method="POST",
            language=language,
            timeout=5
        )
        if language == "hi-IN":
            gather.say("कृपया अपना प्रश्न पूछें।", language="hi-IN")
        else:
            gather.say("Please ask your question.", language="en-IN")
        resp.append(gather)
        if language == "hi-IN":
            resp.say("Lexa का उपयोग करने के लिए धन्यवाद। अलविदा!", language="hi-IN")
        else:
            resp.say("Thank you for using Lexa. Goodbye!", language="en-IN")
        return Response(content=str(resp), media_type="application/xml")

    # Step 2: If audio URL is available (fallback option)
    elif audio_url:
        print("🔗 Downloading audio from:", audio_url)
        import httpx
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                audio_response = await client.get(audio_url)
                files = {"file": ("audio.wav", audio_response.content, "audio/wav")}
                stt_response = await client.post("http://localhost:8000/ivr/transcribe", files=files)
                transcript_data = stt_response.json()
        except Exception as e:
            print("❌ STT processing failed:", e)
            if language == "hi-IN":
                resp.say("माफ़ कीजिए, कुछ गलत हो गया। कृपया पुनः प्रयास करें।", language="hi-IN")
            else:
                resp.say("Sorry, something went wrong. Please try again.", language="en-IN")
            return Response(content=str(resp), media_type="application/xml")

        transcript = transcript_data.get("transcript")
        language = transcript_data.get("language", language)

        if transcript:
            # Add user message to history
            conversation_history[session_id].append((now, "user", transcript))
            # Pass history to LLM
            history = conversation_history[session_id]
            gemini = GeminiChain(session_id)
            gemini_result = gemini.ask(transcript, history=history)
            response_text = gemini_result["response"]
            # Add agent response to history
            conversation_history[session_id].append((now, "agent", response_text))

        if not transcript:
            if language == "hi-IN":
                resp.say("माफ़ कीजिए, मैं समझ नहीं पाया। फिर से प्रयास करें।", language="hi-IN")
            else:
                resp.say("Sorry, I could not understand that. Let's try again.", language="en-IN")
            gather = Gather(
                input="speech",
                action=f"{NGROK_BASE_URL}/ivr/process_input?language={language}",
                method="POST",
                language=language,
                timeout=5
            )
            if language == "hi-IN":
                gather.say("कृपया अपना प्रश्न पूछें।", language="hi-IN")
            else:
                gather.say("Please ask your question.", language="en-IN")
            resp.append(gather)
            return Response(content=str(resp), media_type="application/xml")

        print("✅ Transcript from STT:", transcript)

        if detect_human_request(transcript):
            resp.redirect("/fallback/human", method="POST")
            return Response(content=str(resp), media_type="application/xml")

        gemini = GeminiChain(session_id)
        gemini_result = gemini.ask(transcript, history=conversation_history[session_id])
        response_text = gemini_result["response"]

        # Add agent response to history
        conversation_history[session_id].append((now, "agent", response_text))

        audio_url = synthesize_speech(response_text, lang=language)
        resp.play(audio_url)

        # Wait for follow-up (preserve language)
        gather = Gather(
            input="speech",
            action=f"{NGROK_BASE_URL}/ivr/process_input?language={language}",
            method="POST",
            language=language,
            timeout=5
        )
        if language == "hi-IN":
            gather.say("कृपया अपना प्रश्न पूछें।", language="hi-IN")
        else:
            gather.say("Please ask your question.", language="en-IN")
        resp.append(gather)
        if language == "hi-IN":
            resp.say("कॉल करने के लिए धन्यवाद। अलविदा!", language="hi-IN")
        else:
            resp.say("Thank you for calling. Goodbye!", language="en-IN")
        return Response(content=str(resp), media_type="application/xml")

    # Step 3: No input received
    else:
        print("❌ No transcript or audio received")
        gather = Gather(
            input="speech",
            action=f"{NGROK_BASE_URL}/ivr/process_input?language={language}",
            method="POST",
            language=language,
            timeout=6
        )
        if language == "hi-IN":
            gather.say("कृपया अपना कानूनी प्रश्न पूछें।", language="hi-IN")
        else:
            gather.say("Please ask your legal question after the beep.", language="en-IN")
        resp.append(gather)
        if language == "hi-IN":
            resp.say("हमें अभी भी कुछ नहीं मिला। अब कॉल समाप्त कर रहे हैं।", language="hi-IN")
        else:
            resp.say("We still did not get anything. Ending this call now.", language="en-IN")
        return Response(content=str(resp), media_type="application/xml")


# --- Optional: UI Test for Upload ---
@router.post("/test_upload")
async def test_upload(file: UploadFile = File(...)):
    import httpx
    audio_content = await file.read()
    files = {"file": (file.filename, audio_content, file.content_type)}
    async with httpx.AsyncClient() as client:
        stt_response = await client.post("http://localhost:8000/ivr/transcribe", files=files)
        try:
            transcript_data = stt_response.json()
        except Exception as e:
            print("Error parsing STT response:", e, stt_response.text)
            return JSONResponse({"error": "Failed to parse transcription response."}, status_code=500)

    if "transcript" not in transcript_data:
        return JSONResponse({"error": "Transcription failed or no speech detected."}, status_code=400)

    transcript = transcript_data["transcript"]
    language = transcript_data["language"]

    if detect_human_request(transcript):
        return JSONResponse({"ivr_response": "Transferring you to a human agent."})

    gemini = GeminiChain("test-session")
    gemini_result = gemini.ask(transcript)

    return JSONResponse({"ivr_response": gemini_result["response"]})
