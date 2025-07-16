from flask import Flask, request, jsonify
from flask_cors import CORS
from google.adk.sessions import DatabaseSessionService
from google.adk.runners import Runner
from core_agent.agent import root_agent
from google.genai.types import Content, Part
from dotenv import load_dotenv

load_dotenv()

async def chat_with_law_agent(user_message):
    app_name = "my_agent_app"
    user_id = "user123"

    # Initialize the session service with a database URL
    db_url = "sqlite:///./my_agent_data.db"
    session_service = DatabaseSessionService(db_url=db_url)
    session = await session_service.create_session(
            app_name=app_name,
            user_id=user_id
        )
    
    runner = Runner(
            agent=root_agent,
            app_name=app_name,
            session_service=session_service
        )

    user_message = Content(role='user', parts=[Part(text=user_message)])

    async for event in runner.run_async(
                            user_id=user_id, 
                            session_id=session.id, 
                            new_message=user_message
                        ):
        if event.is_final_response():
            if (
                event.content
                and event.content.parts
                and hasattr(event.content.parts[0], "text")
                and event.content.parts[0].text
            ):
                final_response = event.content.parts[0].text.strip()

    return final_response
                        
app = Flask(__name__)
CORS(app)

@app.route('/chat', methods=['POST'])
async def chat():
    data = request.json
    user_message = data.get('message', '')
    
    response = await chat_with_law_agent(user_message)
    
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(debug=True) 