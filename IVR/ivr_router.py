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
NGROK_BASE_URL = config.get("NGROK_BASE_URL") or "https://72cfe06833ea.ngrok-free.app"  # Fallback to current URL
print("Using NGROK_BASE_URL:", NGROK_BASE_URL)

# --- Answer Incoming Call ---
@router.post("/answer")
async def answer_call():
    """Handle incoming call and set up recording."""
    resp = VoiceResponse()
    
    # Greet the caller
    resp.say("Welcome to Nyaya Setu Legal Assistant. ", 
             language="en-IN")
    
    # Start recording
    record = resp.record(
        action="/ivr/process_input?language=en-IN",
        method="POST",
        max_length=10,  # 10 seconds max recording
        finish_on_key="#"
    )
    
    # If no recording was made
    resp.say("We didn't receive your message. Please try again.", language="en-IN")
    
    return Response(content=str(resp), media_type="application/xml")

# --- Call Trigger Endpoint ---
@router.post("/make_call")
def make_call():
    # Load Twilio credentials from env
    account_sid =os.getenv("TWILIO_ACCOUNT_SID")
    auth_token =os.getenv("TWILIO_AUTH_TOKEN")
    from_number = "+18575786786"  # Your Twilio number
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
            gather.say("Please ask your question .", language="en-IN")
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

    # Step 1: First check if we have a direct transcript from Twilio
    if transcript:
        print("✅ Using Twilio's speech-to-text result:", transcript)
        # Add to conversation history
        conversation_history[session_id].append((now, "user", transcript, language))
        
        # Get response from Gemini
        gemini = GeminiChain(session_id)
        gemini_response = gemini.ask(transcript)
        
        # Add AI response to history
        conversation_history[session_id].append((now, "assistant", gemini_response["response"], language))
        
        # Prepare TwiML response
        response = VoiceResponse()
        response.say(gemini_response["response"], language=language)
        
        # Ask if user needs more help
        gather = Gather(
            input='speech',
            action=f"/ivr/process_input?language={language}",
            method="POST",
            language=language,
            speech_timeout="auto"
        )
        gather.say("Do you have any other legal questions?", language=language)
        response.append(gather)
        
        return Response(content=str(response), media_type="application/xml")
        
    # If no direct transcript, try Deepgram with the recording
    elif audio_url:
        print("🔍 Using Deepgram as primary STT")
        print("🔗 Downloading audio from:", audio_url)
        import httpx
        try:
            # Download the audio from Twilio
            async with httpx.AsyncClient(timeout=10.0) as client:
                audio_response = await client.get(audio_url)
                files = {"file": ("audio.wav", audio_response.content, "audio/wav")}
                
                # Get transcript from Deepgram
                stt_response = await client.post(
                    "http://localhost:8000/ivr/transcribe",
                    files=files,
                    timeout=10.0
                )
                stt_response.raise_for_status()
                transcript_data = stt_response.json()
                
                # Update transcript and language from Deepgram
                transcript = transcript_data.get("transcript", "")
                detected_language = transcript_data.get("language", language)
                
                # If Deepgram failed but we have a transcript from Twilio, use that
                if not transcript and 'SpeechResult' in form:
                    transcript = form['SpeechResult']
                    print("⚠️ Using Twilio transcript as fallback:", transcript)
                
                # Process the transcript if available
                if transcript:
                    # Add user message to history
                    conversation_history[session_id].append((now, "user", transcript))
                    
                    # Check for human request
                    if detect_human_request(transcript):
                        resp.redirect("/fallback/human", method="POST")
                        return Response(content=str(resp), media_type="application/xml")
                    
                    # Get response from Gemini
                    gemini = GeminiChain(session_id)
                    gemini_result = gemini.ask(transcript, history=conversation_history[session_id])
                    response_text = gemini_result["response"]
                    
                    # Add agent response to history
                    conversation_history[session_id].append((now, "agent", response_text))
                    
                    # Convert response to speech
                    audio_url = synthesize_speech(response_text, lang=detected_language)
                    resp.play(audio_url)
                    
                    # Only show the initial prompt if this is the first message in the conversation
                    if len(conversation_history[session_id]) <= 2:  # First interaction (user message + AI response)
                        gather = Gather(
                            input="speech",
                            action=f"{NGROK_BASE_URL}/ivr/process_input?language={detected_language}",
                            method="POST",
                            language=detected_language,
                            timeout=5
                        )
                        
                        if detected_language == "hi-IN":
                            gather.say("कृपया अपना प्रश्न पूछें।", language="hi-IN")
                        else:
                            gather.say("Please ask your question.", language="en-IN")
                            
                        resp.append(gather)
                    else:
                        # For follow-up questions, just end with the response
                        resp.say("Lexa का उपयोग करने के लिए धन्यवाद। अलविदा!", language="hi-IN") if detected_language == "hi-IN" else resp.say("Thank you for using Lexa. Goodbye!", language="en-IN")
                    return Response(content=str(resp), media_type="application/xml")
                
        except Exception as e:
            print("❌ Deepgram STT processing failed:", e)
            # Fall through to Twilio STT if available
            if 'SpeechResult' in form and form['SpeechResult']:
                transcript = form['SpeechResult']
                print("🔄 Falling back to Twilio transcript:", transcript)
            else:
                # No fallback available, return error
                if language == "hi-IN":
                    resp.say("माफ़ कीजिए, कुछ गलत हो गया। कृपया पुनः प्रयास करें।", language="hi-IN")
                else:
                    resp.say("Sorry, something went wrong. Please try again.", language="en-IN")
                return Response(content=str(resp), media_type="application/xml")

    # Step 2: Fallback to Twilio STT if no audio URL is available
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

        # If we have a valid transcript
        print("✅ Transcript from STT:", transcript)

        # Add user message to history
        conversation_history[session_id].append((now, "user", transcript))

        if detect_human_request(transcript):
            resp.redirect("/fallback/human", method="POST")
            return Response(content=str(resp), media_type="application/xml")

        gemini = GeminiChain(session_id)
        gemini_result = gemini.ask(transcript, history=conversation_history[session_id])
        response_text = gemini_result["response"]
        print("🤖 Gemini Response:", response_text)

        # Add agent response to history
        conversation_history[session_id].append((now, "agent", response_text))

        audio_url = synthesize_speech(response_text, lang=language)
        resp.play(audio_url)

        # Only show the initial prompt if this is the first message in the conversation
        if len(conversation_history[session_id]) <= 2:  # First interaction (user message + AI response)
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
        
        # Add closing message
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
