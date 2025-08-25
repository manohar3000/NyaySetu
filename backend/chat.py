import os
import google.generativeai as genai
from google.adk.sessions import DatabaseSessionService
from google.adk.runners import Runner
from backend.core_agent.agent import root_agent
from google.genai.types import Content, Part

# Set the Google API key for the ADK agent
GOOGLE_API_KEY = ""
os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
genai.configure(api_key=GOOGLE_API_KEY)
async def chat_with_law_agent(user_message, session_id=None):
    app_name = "my_agent_app"
    user_id = "user123"
    db_url = "sqlite:///./my_agent_data.db"

    session_service = DatabaseSessionService(db_url=db_url)

    # Get or create session properly with keywords
    if session_id is not None:
        session = await session_service.get_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id
        )
        if session is None:
            session = await session_service.create_session(
                app_name=app_name,
                user_id=user_id
            )
    else:
        session = await session_service.create_session(
            app_name=app_name,
            user_id=user_id
        )

    runner = Runner(
        agent=root_agent,
        app_name=app_name,
        session_service=session_service
    )

    user_content = Content(role='user', parts=[Part(text=user_message)])
    final_response = None

    async for event in runner.run_async(
        user_id=user_id,
        session_id=session.id,
        new_message=user_content
    ):
        if event.is_final_response():
            parts = getattr(event.content, "parts", [])
            if parts and hasattr(parts[0], "text") and parts[0].text:
                # Get the raw response text
                response_text = parts[0].text.strip()
                
                try:
                    # Format the response with markdown
                    # 1. Add newlines after headings and lists
                    response_text = response_text.replace('\n\n', '\n')
                    
                    # 2. Format lists with proper markdown
                    lines = response_text.split('\n')
                    formatted_lines = []
                    in_list = False
                    
                    for line in lines:
                        # Format bullet points
                        if line.strip().startswith(('•', '-', '*')):
                            if not in_list:
                                formatted_lines.append('')
                                in_list = True
                            line = f"- {line.lstrip('•-* ')}"
                        # Format numbered lists
                        elif line.strip() and line.strip()[0].isdigit() and '. ' in line:
                            if not in_list:
                                formatted_lines.append('')
                                in_list = True
                        else:
                            if in_list and line.strip():
                                formatted_lines.append('')
                            in_list = False
                        
                        # Add the line
                        formatted_lines.append(line)
                    
                    # Join the lines back together
                    formatted_text = '\n'.join(formatted_lines)
                    
                    # Add section headers
                    sections = {
                        'Section': '##',
                        'Article': '###',
                        'Clause': '####',
                        'Example': '#### Example',
                        'Note': '> **Note:**',
                        'Important': '> **Important:**',
                        'Warning': '> **Warning:**',
                    }
                    
                    for keyword, replacement in sections.items():
                        if keyword + ' ' in formatted_text:
                            formatted_text = formatted_text.replace(
                                f"{keyword} ", 
                                f"\n\n{replacement} "
                            )
                    
                    # Ensure proper spacing around headings
                    formatted_text = formatted_text.replace('\n#', '\n\n#')
                    
                    final_response = formatted_text.strip()
                except Exception as e:
                    print(f"Error formatting response: {e}")
                    final_response = response_text

    return final_response
