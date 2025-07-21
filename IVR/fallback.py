from fastapi import APIRouter, Request, Form
from fastapi.responses import Response
from twilio.twiml.voice_response import VoiceResponse

router = APIRouter()

@router.post("/human")
def human_fallback():
    resp = VoiceResponse()
    # Warm transfer to live lawyer (replace with actual number)
    resp.say("Transferring you to a live lawyer.")
    resp.dial("+916206709549")
    return Response(content=str(resp), media_type="application/xml")

@router.post("/voicemail")
def voicemail():
    resp = VoiceResponse()
    resp.say("Please leave your message after the beep. We will call you back soon.")
    resp.record(maxLength=120, action="/ivr/thank_you")
    return Response(content=str(resp), media_type="application/xml") 