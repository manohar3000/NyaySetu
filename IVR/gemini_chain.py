import os
import google.generativeai as genai
from dotenv import load_dotenv
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from langchain.schema import HumanMessage, AIMessage
from typing import List, Dict, Any, Union
from utils import extract_topic, estimate_confidence

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = "AIzaSyBS6o-SfwpPDXoayAdnlZ0fOWbvSxdgx6c"
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set")

genai.configure(api_key=GEMINI_API_KEY)

PROMPT_TEMPLATE = PromptTemplate(
    input_variables=["chat_history", "question"],
template = (
    "You are Lexa, a professional and concise AI voice agent trained in Indian law.\n"
    "Only respond to legal queries related to Indian law, rights, or legal processes.\n"
    "\n"
    "Here is the conversation so far:\n"
    "{chat_history}\n"
    "User just said: \"{question}\"\n"
    "\n"
    "Your behavior:\n"
    "- If this is the user's first legal query, give a short, helpful response.\n"
    "- If more details are needed, ask a **single follow-up question** to get clarification.\n"
    "- Do NOT ask “Would you like to ask anything else?” right after a follow-up question.\n"
    "- ONLY ask “Would you like to ask anything else?” **if the user seems done**, or says 'no', 'that's all', or is silent after a few seconds.\n"
    "- Keep every response **short, clear, and conversational**, like a voice assistant.\n"
    "- If the question is unrelated to law, say:\n"
)
)

class GeminiChain:
    def __init__(self, session_id: str):
        self.memory = []  # Store conversation history as a list of messages
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        self.session_id = session_id
        self.temperature = 0.2

    def ask(self, question: str) -> str:
        """Process a question and return the response."""
        try:
            # Prepare the chat history with system message
            messages = [{"role": "user", "parts": [question]}]
            
            # Get response from Gemini
            response = self.model.generate_content(
                messages,
                generation_config={
                    "temperature": self.temperature,
                }
            )
            
            # Get the response text
            response_text = response.text
            
            # Update memory
            self.memory.append({"role": "user", "parts": [question]})
            self.memory.append({"role": "model", "parts": [response_text]})
            
            topic = extract_topic(response_text)
            confidence = estimate_confidence(response_text)
            clarification_needed = "clarify" in response_text.lower() or confidence < 0.5
            
            return {
                "response": response_text,
                "topic": topic,
                "confidence": confidence,
                "clarification_needed": clarification_needed,
                "memory": self.memory
            }
            
        except Exception as e:
            print(f"Error in GeminiChain: {str(e)}")
            return "I'm sorry, I encountered an error processing your request."
        else:
            response_text = str(response)

        topic = extract_topic(response_text)
        confidence = estimate_confidence(response_text)
        clarification_needed = "clarify" in response_text.lower() or confidence < 0.5
        return {
            "response": response_text,
            "topic": topic,
            "confidence": confidence,
            "clarification_needed": clarification_needed,
            "memory": self.memory.buffer
        }
