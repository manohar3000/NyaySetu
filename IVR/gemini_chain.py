from langchain_google_vertexai import ChatVertexAI
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from utils import extract_topic, estimate_confidence

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
    "  \"I'm here to help only with Indian legal questions. Could you ask something related to law?\""
)

)
class GeminiChain:
    def __init__(self, session_id: str):
        self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        self.llm = ChatVertexAI(model_name="gemini-2.0-flash", temperature=0.2)
        self.chain = ConversationChain(
            llm=self.llm,
            memory=self.memory,
            prompt=PROMPT_TEMPLATE,
            input_key="question"  # ✅ Tell the chain to expect 'question'
        )
        self.session_id = session_id

    def ask(self, question: str, history=None):
        # Format history for the prompt
        chat_history = ""
        if history:
            for ts, role, msg in history:
                chat_history += f"[{ts}] {role.capitalize()}: {msg}\n"
        else:
            chat_history = ""
        response = self.chain.invoke({"question": question, "chat_history": chat_history})
        # Ensure response is a string for downstream functions
        if isinstance(response, dict):
            response_text = response.get("response") or response.get("text") or str(response)
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
