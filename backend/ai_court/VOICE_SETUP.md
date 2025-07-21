# Voice Setup Guide

## Overview
The LegalAI Court application now supports voice functionality with different voices for the judge and lawyer roles.

## Features
- **Text-to-Speech**: AI responses are converted to speech with different voices
- **Speech-to-Text**: Voice input for hands-free argument presentation
- **Role-based Voices**: Different voices for judge, lawyer, and welcome messages

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Environment Variables
Create a `.env` file in the `app` directory with:

```env
# ElevenLabs API Key for voice synthesis
# Get your API key from: https://elevenlabs.io/
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Google API Key for Gemini
GOOGLE_API_KEY=your_google_api_key_here

# Qdrant Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_api_key_here
```

### 3. ElevenLabs Setup
1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Get your API key from the dashboard
3. Add it to your `.env` file

### 4. Voice Configuration
The system uses different voices for different roles:

- **Judge**: Antoni (deep, authoritative voice)
- **Lawyer**: Rachel (professional, articulate voice)
- **Welcome**: Antoni (formal introduction voice)

### 5. Fallback System
If ElevenLabs is not available, the system falls back to gTTS (Google Text-to-Speech).

## Usage

### Voice Input
1. Click the "Voice Input" button in the chat interface
2. Speak your legal argument
3. The system will transcribe your speech and add it to the input field

### Voice Output
- AI lawyer and judge responses automatically include voice synthesis
- Click "Play Voice" to hear the response
- Click "Regenerate Voice" to create a new audio version

### Supported Audio Formats
- **Input**: MP3, WAV, M4A, OGG, FLAC
- **Output**: MP3

## Troubleshooting

### Voice Not Working
1. Check your ElevenLabs API key
2. Ensure microphone permissions are granted
3. Check browser console for errors

### Audio Files Not Playing
1. Check if audio files are generated in `app/static/audio/`
2. Verify static file serving is working
3. Check browser audio permissions

### Speech Recognition Issues
1. Ensure clear speech and good microphone quality
2. Check if faster-whisper model is loaded
3. Verify audio file format is supported

## API Endpoints

### Text-to-Speech
```
POST /api/synthesize_speech
{
    "text": "Your text here",
    "role": "judge|lawyer|welcome",
    "language": "en"
}
```

### Speech-to-Text
```
POST /api/transcribe_audio
file: audio_file
```

### Voice-Enabled Debate
```
POST /api/debate_turn_with_voice
{
    "human_input": "Your argument",
    "debate_history": [...]
}
```

## File Structure
```
app/
├── services/
│   ├── voice_service.py          # Text-to-speech service
│   └── speech_recognition.py     # Speech-to-text service
├── static/
│   └── audio/                    # Generated audio files
└── api/
    └── endpoints.py              # Voice API endpoints
``` 