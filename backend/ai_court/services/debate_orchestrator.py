from typing import List, Dict, Any
from fastapi import HTTPException
from llama_index.core.prompts import PromptTemplate
import google.generativeai as genai
from dotenv import load_dotenv

from backend.ai_court.core.llm import gemini_model
from backend.ai_court.core.query_engine import qna_query_engine, case_query_engine
from backend.ai_court.models.api_models import DebateInput, DebateTurnResponse, CaseDetails, CaseStatus, CaseStartResponse, PracticeConfig
from backend.ai_court.services.case_manager import case_manager

# Load environment variables at the very beginning
load_dotenv()

async def start_new_case(case_details: CaseDetails, practice_config: Dict) -> CaseStartResponse:
    """
    Start a new case with proper setup and judge opening.
    """
    if gemini_model is None:
        raise HTTPException(status_code=500, detail="Gemini model not initialized.")
    
    try:
        # Create the case
        case_id = case_manager.create_case(case_details)
        
        # Create practice config object
        practice_config_obj = PracticeConfig(**practice_config)
        
        # Create session
        session_id = case_manager.create_session(case_id, practice_config_obj)
        
        # Generate judge opening statement
        judge_opening_prompt = PromptTemplate(
            """
            You are an AI Judge presiding over a new legal case. You need to provide a formal opening statement for the court.
            
            CASE DETAILS:
            - Case Title: {case_title}
            - Case Type: {case_type}
            - Specific Issue: {specific_issue}
            - Plaintiff: {plaintiff}
            - Defendant: {defendant}
            - User Role: {user_role}
            - Case Summary: {case_summary}
            - Key Arguments: {key_arguments}
            
            PRACTICE CONFIGURATION:
            - Difficulty Level: {difficulty_level}
            - Judge Strictness: {judge_strictness}
            - Opponent Experience: {opponent_experience}
            - Opponent Style: {opponent_style}
            
            Provide a formal court opening that:
            1. Acknowledges the appearance of both parties
            2. Summarizes the case briefly and professionally
            3. Sets the proper courtroom tone and expectations
            4. Mentions the key legal issues to be addressed
            5. Provides clear procedural guidance
            
            Use formal judicial language and maintain authority. Keep it concise but comprehensive.
            
            Choose from these opening styles (pick one randomly):
            - "All rise. Court is now in session for [Case Title]. Counsel, you may proceed."
            - "Good morning, Counsel. We are here today to examine [Case Title]. Prosecution may present the facts."
            - "Let us proceed with today's matter. [Case Title] is now before this Court. Counsel, your arguments, please."
            - "Court is now in session. [Case Title] is called. Both parties are present and represented. Let us begin."
            
            Your opening statement:
            """
        )
        
        judge_opening_str = judge_opening_prompt.format(
            case_title=case_details.caseTitle,
            case_type=case_details.caseType.value,
            specific_issue=case_details.specificIssue,
            plaintiff=case_details.plaintiff,
            defendant=case_details.defendant,
            user_role=case_details.userRole,
            case_summary=case_details.caseSummary,
            key_arguments=", ".join(case_details.keyArguments) if case_details.keyArguments else "Not specified",
            difficulty_level=practice_config.get('difficultyLevel', 'Standard'),
            judge_strictness=practice_config.get('judgeStrictness', 'Moderate'),
            opponent_experience=practice_config.get('opponentExperience', 'Standard'),
            opponent_style=practice_config.get('opponentStyle', 'Professional')
        )
        
        judge_opening_obj = await gemini_model.generate_content_async(
            judge_opening_str,
            generation_config=genai.types.GenerationConfig(
                temperature=0.3,
                max_output_tokens=800,
                top_p=0.7
            )
        )
        judge_opening = judge_opening_obj.text.strip()
        
        return CaseStartResponse(
            session_id=session_id,
            case_id=case_id,
            judge_opening=judge_opening,
            case_status=CaseStatus.ACTIVE
        )
        
    except Exception as e:
        print(f"Error starting new case: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred while starting the case: {str(e)}")

async def continue_case(session_id: str, human_input: str) -> DebateTurnResponse:
    """
    Continue an existing case session.
    """
    # Get the session
    session = case_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get the case details
    case = case_manager.get_case(session.caseId)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Create debate input with session context
    debate_input = DebateInput(
        human_input=human_input,
        debate_history=session.debateHistory,
        practice_config=session.practiceConfig,
        session_id=session_id
    )
    
    # Conduct the debate turn
    response = await conduct_debate_turn(debate_input)
    
    # Update session history
    updated_history = session.debateHistory + [
        {"role": "user", "content": human_input}
    ]
    if response.ai_lawyer_response:
        updated_history.append({"role": "assistant", "content": response.ai_lawyer_response})
    if response.judge_intervention != "NO_JUDGE_INTERVENTION":
        updated_history.append({"role": "judge", "content": response.judge_intervention})
    
    case_manager.update_session_history(session_id, updated_history)
    
    # Add session info to response
    response.session_id = session_id
    response.case_status = case.status
    
    return response

async def conduct_debate_turn(input: DebateInput) -> DebateTurnResponse:
    """
    Orchestrates a single turn of the legal debate, involving AI Lawyer and AI Judge.
    """
    if gemini_model is None:
        raise HTTPException(status_code=500, detail="Gemini model not initialized.")

    try:
        # --- 1. Retrieval (with fallback) ---
        qna_retrieval_result = {"sources": []}
        case_retrieval_result = {"sources": []}
        
        try:
            qna_retrieval_result = await qna_query_engine.aquery(query=input.human_input)
        except Exception as e:
            print(f"QNA retrieval failed: {e}")
            
        try:
            case_retrieval_result = await case_query_engine.aquery(query=input.human_input)
        except Exception as e:
            print(f"Case retrieval failed: {e}")
        
        # --- Helper for formatting retrieved documents for LLM prompts ---
        def format_llm_context(retrieved_sources: List[Dict], include_sources_detail: bool = False) -> str:
            formatted_texts = []
            for i, doc in enumerate(retrieved_sources):
                text = doc['text']
                metadata = doc['metadata']
                source_info_parts = []
                if include_sources_detail:
                    if metadata.get('case_name'): source_info_parts.append(f"Case: {metadata['case_name']}")
                    if metadata.get('court'): source_info_parts.append(f"Court: {metadata['court']}")
                    if metadata.get('judgement_date'): source_info_parts.append(f"Date: {metadata['judgement_date']}")
                    if metadata.get('legal_principles'): source_info_parts.append(f"Principles: {'; '.join(metadata['legal_principles'])}")
                    if metadata.get('citations'): source_info_parts.append(f"Citations: {'; '.join(metadata['citations'])}")
                    if metadata.get('tags') and isinstance(metadata['tags'], list):
                        source_info_parts.append(f"Tags: {'; '.join(metadata['tags'])}")
                    if metadata.get('source_file'): source_info_parts.append(f"File: {metadata['source_file']}")
                    if metadata.get('page_label'): source_info_parts.append(f"Page: {metadata['page_label']}")
                    
                    formatted_texts.append(f"--- Document {i+1} (Score: {doc['score']:.2f}) ---\nContent: {text}\n[Source Details: {'; '.join(source_info_parts) or 'No specific metadata'}]")
                else:
                    formatted_texts.append(f"--- Document {i+1} (Score: {doc['score']:.2f}) ---\nContent: {text}")
            return "\n\n".join(formatted_texts)

        qna_context_for_lawyer = format_llm_context(qna_retrieval_result.get('sources', []), include_sources_detail=False)
        if not qna_retrieval_result.get('sources'):
            qna_context_for_lawyer = "No specific legal precedents or case law found for this query. Rely on general legal principles and your expertise."
        case_context_for_judge = format_llm_context(case_retrieval_result.get('sources', []), include_sources_detail=True)
        if not case_retrieval_result.get('sources'):
            case_context_for_judge = "No specific case law or precedents found for judicial reference. Proceed based on general legal principles."
        
        # Debug logging for RAG usage
        print(f"=== RAG DEBUG INFO ===")
        print(f"QNA sources retrieved: {len(qna_retrieval_result.get('sources', []))}")
        print(f"Case law sources retrieved: {len(case_retrieval_result.get('sources', []))}")
        if qna_retrieval_result.get('sources'):
            print(f"QNA context length: {len(qna_context_for_lawyer)} characters")
        if case_retrieval_result.get('sources'):
            print(f"Case context length: {len(case_context_for_judge)} characters")
        print(f"=======================")

        # --- 2. Role-Aware Turn Logic ---
        # Determine who the human is addressing and who should respond
        
        # Check if human is addressing the judge
        judge_address_indicators = [
            'your honour', 'your honor', 'judge', 'court', 'your lordship', 
            'your worship', 'may it please the court', 'if it please the court'
        ]
        is_addressing_judge = any(indicator in input.human_input.lower() for indicator in judge_address_indicators)
        
        # Check if human is addressing the opposition lawyer
        opposition_address_indicators = [
            'counsel', 'opposition', 'defense', 'defence', 'prosecution', 
            'my learned friend', 'learned counsel', 'opposing counsel'
        ]
        is_addressing_opposition = any(indicator in input.human_input.lower() for indicator in opposition_address_indicators)
        
        # Check if this is a general statement that requires opposition response
        requires_opposition_response = any(indicator in input.human_input.lower() for indicator in [
            'case', 'plaintiff', 'defendant', 'prove', 'allegations', 'claims', 
            'matter', 'proceedings', 'will prove', 'allege', 'demonstrate',
            'discrimination', 'retaliation', 'violation', 'breach', 'damages',
            'evidence', 'witness', 'testimony', 'argument'
        ])
        
        # Check if this is a procedural request (should go to judge)
        procedural_requests = [
            'objection', 'sustain', 'overrule', 'strike', 'withdraw', 'rephrase',
            'clarification', 'recess', 'adjourn', 'continue', 'proceed', 'may i approach',
            'permission to', 'request for', 'ruling', 'decision', 'order'
        ]
        is_procedural_request = any(request in input.human_input.lower() for request in procedural_requests)
        
        # Check if this is evidence submission (requires judge oversight)
        evidence_submission_indicators = [
            'submit', 'introduce', 'exhibit', 'evidence', 'document', 'file', 'attached',
            'present', 'offer', 'produce', 'tender', 'mark as exhibit', 'admit into evidence'
        ]
        is_evidence_submission = any(indicator in input.human_input.lower() for indicator in evidence_submission_indicators)
        
        # Check if this is a document attachment without proper introduction
        document_attachment_indicators = [
            'attached', 'uploaded', 'upload', 'file', 'document', 'pdf', 'doc', 'txt'
        ]
        is_document_attachment = any(indicator in input.human_input.lower() for indicator in document_attachment_indicators)
        
        # Check if document is properly introduced with purpose
        proper_document_introduction = (
            is_evidence_submission and 
            any(purpose in input.human_input.lower() for purpose in [
                'as evidence', 'supporting', 'showing', 'demonstrating', 'proving',
                'establishing', 'corroborating', 'confirming', 'verifying'
            ])
        )
        
        # Determine who should respond based on courtroom procedure
        if is_addressing_judge or is_procedural_request:
            # Judge should respond, AI Lawyer should NOT respond
            ai_lawyer_should_respond = False
            judge_should_respond = True
        elif is_evidence_submission or (is_document_attachment and not proper_document_introduction):
            # Evidence submission requires judge oversight first
            ai_lawyer_should_respond = False
            judge_should_respond = True
        elif is_addressing_opposition or requires_opposition_response:
            # AI Lawyer should respond, Judge should NOT respond unless there's an error
            ai_lawyer_should_respond = True
            judge_should_respond = False
        else:
            # Default: AI Lawyer responds to general statements
            ai_lawyer_should_respond = True
            judge_should_respond = False
        
        # Check if this is a simple greeting (both can respond appropriately)
        simple_greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening']
        is_greeting = input.human_input.lower().strip() in simple_greetings
        
        if is_greeting:
            if is_addressing_judge:
                ai_lawyer_should_respond = False
                judge_should_respond = True
            else:
                ai_lawyer_should_respond = True
                judge_should_respond = False

        # Check if this appears to be the start of a case presentation
        case_start_indicators = [
            'represent', 'case', 'plaintiff', 'defendant', 'your honor', 'court', 
            'prove', 'allegations', 'claims', 'matter', 'proceedings'
        ]
        is_case_start = any(indicator in input.human_input.lower() for indicator in case_start_indicators)
        
        # Check if this is a very short debate history (likely just starting)
        is_debate_beginning = len(input.debate_history) <= 2
        
        # Special case: If this is clearly the start of a case presentation, trigger judge opening
        should_judge_open = is_case_start and is_debate_beginning
        
        # Check if judge is being directly addressed
        judge_address_indicators = ['your honor', 'judge', 'court', 'your lordship', 'your worship']
        is_judge_addressed = any(indicator in input.human_input.lower() for indicator in judge_address_indicators)
        
        # Check if this is a direct greeting to the judge
        judge_greeting_indicators = ['hello judge', 'hi judge', 'good morning judge', 'good afternoon judge']
        is_judge_greeting = any(greeting in input.human_input.lower() for greeting in judge_greeting_indicators)
        
        # Add missing variables for judge prompt
        is_case_presentation = requires_opposition_response
        is_direct_to_judge = is_addressing_judge
        
        # Build AI Lawyer prompt based on practice configuration
        AI_LAWYER_PROMPT = PromptTemplate(
            """
            You are an AI Opposition Lawyer representing the defendant in a legal case. You must respond naturally and professionally to the human lawyer's arguments.

            CASE CONTEXT:
            - Case Type: {case_type}
            - Specific Issue: {specific_issue}
            - Case Summary: {case_summary}
            - Your Role: Opposition/Defense Counsel
            - User Role: {user_role}

            OPPONENT PROFILE:
            - Experience Level: {opponent_experience}
            - Argument Style: {opponent_style}
            - Strengths: {opponent_strengths}
            - Difficulty Level: {difficulty_level}

            📚 RELEVANT LEGAL CONTEXT (from case law and precedents):
            {qna_context}

            RESPONSE GUIDELINES:
            1. **Legal Accuracy**: Use precise legal terminology and correct burden of proof standards
            2. **Evidence Analysis**: When challenging evidence, explain specific grounds (timing, consistency, corroboration)
            3. **Section 498A Specific**: For 498A cases, acknowledge the burden lies on prosecution but note contextual factors
            4. **Professional Tone**: Maintain respectful but firm opposition
            5. **Strategic Focus**: Target weaknesses in opponent's arguments and evidence
            6. **RAG Integration**: Reference relevant legal principles, precedents, and case law from the provided context when applicable

            LEGAL STANDARDS BY CASE TYPE:
            - **Criminal Cases (498A)**: "The burden lies on the prosecution to demonstrate that the alleged acts amount to cruelty as defined under Section 498A IPC. Courts consider context, continuity, and credibility of allegations."
            - **Civil Cases**: "The plaintiff must establish their case on a preponderance of evidence, demonstrating clear and convincing proof."
            - **Employment Cases**: "The burden shifts based on the nature of the claim - discrimination cases require prima facie evidence before burden shifts to employer."

            EVIDENCE CHALLENGE TEMPLATES:
            - Medical Reports: "The medical reports lack contemporaneous complaints and show inconsistencies in timing. Without corroborative injuries or immediate reporting, their probative value is limited."
            - Witness Credibility: "The witness testimony shows material contradictions and lacks independent corroboration."
            - Documentary Evidence: "The documents presented lack proper authentication and chain of custody."

            RESPOND TO: {human_input}

            Your response (be concise, legal, and strategic):
            """
        )

        # Add practice configuration context if available
        practice_context = ""
        if hasattr(input, 'practice_config') and input.practice_config:
            # Handle both dict and Pydantic model formats
            if hasattr(input.practice_config, 'dict'):
                config = input.practice_config.dict()
            elif isinstance(input.practice_config, dict):
                config = input.practice_config
            else:
                config = {}
            
            practice_context = f"""
            
            PRACTICE SESSION CONTEXT:
            - Case Type: {config.get('caseType', 'General')}
            - Specific Issue: {config.get('specificIssue', 'Not specified')}
            - Your Experience Level: {config.get('opponentExperience', 'Standard')}
            - Your Argument Style: {config.get('opponentStyle', 'Professional')}
            - Your Strengths: {config.get('opponentStrengths', 'General legal knowledge')}
            - Difficulty Level: {config.get('difficultyLevel', 'Standard')}
            - Time Pressure: {config.get('timePressure', 'None')}
            
            Adapt your responses accordingly:
            - Experience Level: {config.get('opponentExperience', 'Standard')} - Adjust complexity and sophistication
            - Argument Style: {config.get('opponentStyle', 'Professional')} - Match this style in your responses
            - Difficulty: {config.get('difficultyLevel', 'Standard')} - Adjust challenge level appropriately
            """

        # Check if this is a simple greeting
        simple_greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening']
        is_greeting = input.human_input.lower().strip() in simple_greetings
        
        # Check if this appears to be the start of a case presentation
        case_start_indicators = [
            'represent', 'case', 'plaintiff', 'defendant', 'your honor', 'court', 
            'prove', 'allegations', 'claims', 'matter', 'proceedings'
        ]
        is_case_start = any(indicator in input.human_input.lower() for indicator in case_start_indicators)
        
        # Check if this is a very short debate history (likely just starting)
        is_debate_beginning = len(input.debate_history) <= 2
        
        # Special case: If this is clearly the start of a case presentation, trigger judge opening
        should_judge_open = is_case_start and is_debate_beginning
        
        # Check if judge is being directly addressed
        judge_address_indicators = ['your honor', 'judge', 'court', 'your lordship', 'your worship']
        is_judge_addressed = any(indicator in input.human_input.lower() for indicator in judge_address_indicators)
        
        # Check if this is a direct greeting to the judge
        judge_greeting_indicators = ['hello judge', 'hi judge', 'good morning judge', 'good afternoon judge']
        is_judge_greeting = any(greeting in input.human_input.lower() for greeting in judge_greeting_indicators)
        
        # Generate AI Lawyer response only if needed
        ai_lawyer_response = ""
        ai_lawyer_prompt_str = ""  # Initialize the variable
        
        if ai_lawyer_should_respond:
            if is_greeting:
                ai_lawyer_prompt_template = PromptTemplate(
                    """
                    You are an AI Lawyer acting as opposition counsel. The human lawyer has just greeted you.
                    
                    Respond naturally and professionally to their greeting. Be brief and friendly, but maintain your role as opposition counsel.
                    Don't dive into legal arguments yet - just acknowledge their greeting and perhaps ask what case or matter they'd like to discuss.
                    
                    📚 RELEVANT LEGAL CONTEXT (if any):
                    {qna_context}
                    
                    Human Lawyer's greeting: "{human_input}"
                    
                    Your response:
                    """
                )
                ai_lawyer_prompt_str = ai_lawyer_prompt_template.format(
                    qna_context=qna_context_for_lawyer,
                    human_input=input.human_input
                )
            else:
                # Handle practice_config whether it's a dict or Pydantic model
                practice_config_dict = {}
                if hasattr(input, 'practice_config') and input.practice_config:
                    if hasattr(input.practice_config, 'dict'):
                        practice_config_dict = input.practice_config.dict()
                    elif isinstance(input.practice_config, dict):
                        practice_config_dict = input.practice_config
                
                # Get case details from input if available
                case_details = None
                if hasattr(input, 'case_details') and input.case_details:
                    case_details = input.case_details
                
                ai_lawyer_prompt_str = AI_LAWYER_PROMPT.format(
                    case_type=case_details.caseType.value if case_details else 'General',
                    specific_issue=case_details.specificIssue if case_details else 'Not specified',
                    case_summary=case_details.caseSummary if case_details else 'Not specified',
                    user_role=case_details.userRole if case_details else 'Not specified',
                    opponent_experience=practice_config_dict.get('opponentExperience', 'Standard'),
                    opponent_style=practice_config_dict.get('opponentStyle', 'Professional'),
                    opponent_strengths=practice_config_dict.get('opponentStrengths', 'General legal knowledge'),
                    difficulty_level=practice_config_dict.get('difficultyLevel', 'Standard'),
                    qna_context=qna_context_for_lawyer,
                    human_input=input.human_input
                )
            
            ai_lawyer_response_obj = await gemini_model.generate_content_async(
                ai_lawyer_prompt_str,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=1024,
                    top_p=0.8,
                )
            )
            
            if ai_lawyer_should_respond:
                try:
                    ai_lawyer_response = ai_lawyer_response_obj.text.strip()
                    print(f"=== AI LAWYER DEBUG ===")
                    print(f"Prompt: {ai_lawyer_prompt_str[:200]}...")
                    print(f"Response: {ai_lawyer_response}")
                    print(f"Response length: {len(ai_lawyer_response)}")
                    print(f"=======================")
                except Exception as e:
                    print(f"Error getting AI lawyer response: {e}")
                    ai_lawyer_response = "NO_LAWYER_RESPONSE"
            else:
                ai_lawyer_response = "NO_LAWYER_RESPONSE"
                print(f"=== AI LAWYER DEBUG ===")
                print(f"AI lawyer should NOT respond")
                print(f"=======================")

        # --- 3. AI Judge's Evaluation & Intervention Decision ---
        judge_prompt_base = """
            You are an impartial and authoritative AI Judge overseeing a legal debate between a Human Lawyer and an AI Lawyer.
            Your role is to ensure legal accuracy, procedural fairness, and maintain courtroom decorum.

            INTERVENTION GUIDELINES:
            You should intervene in the following situations:
            1. **Direct Address**: When either party directly addresses you ("Your Honor", "Judge", "Court")
            2. **Procedural Requests**: Objections, motions, requests for clarification, recess, etc.
            3. **Legal Errors**: Significant misstatements of law, incorrect citations, or factual errors
            4. **Procedural Issues**: Improper courtroom conduct, irrelevant arguments, or procedural violations
            5. **Clarification Needed**: When a critical legal principle needs clarification for the debate to proceed
            6. **Ruling Requests**: When either party explicitly requests a ruling or decision
            7. **Debate Direction**: When the debate needs judicial guidance to stay on track
            8. **Opening/Closing**: Provide brief opening remarks when the case begins, and closing remarks when appropriate
            9. **Direct Greetings**: When someone specifically greets you (e.g., "hello judge")
            10. **Evidence Submission**: When documents or evidence are submitted for admission
            11. **Case Introduction**: When a new case is being presented, provide a formal court opening

            EVIDENCE SUBMISSION PROCEDURE:
            When a document or evidence is submitted:
            1. **Proper Introduction**: If the document is properly introduced with purpose (e.g., "We submit this CCTV footage as evidence supporting our claim"), acknowledge receipt and ask for opposition response
            2. **Improper Introduction**: If a document is attached without proper introduction, guide the lawyer on proper procedure
            3. **Admissibility**: Always ask for opposition objections before admitting evidence
            4. **Documentation**: Maintain proper exhibit numbering and documentation

            INTERVENTION STYLE:
            - Be authoritative but fair
            - Use judicial language: "The Court observes...", "Counsel, please...", "It is ordered that..."
            - Keep interventions concise and focused
            - Cite relevant legal authority when applicable
            - Maintain impartiality between both parties
            - When directly addressed, acknowledge the address appropriately
            - For case introductions, be formal and set the proper courtroom tone
            - For evidence submission, ensure proper procedure is followed

            FORMATTING GUIDELINES:
            - Use **bold text** for judicial orders, rulings, and important legal principles
            - Use *italic text* for emphasis on key judicial points
            - Use `monospace` for specific legal citations and case references
            - Structure your responses with clear judicial authority
            - Use formal, authoritative language befitting a judge

            IMPORTANT: If you decide NOT to intervene, respond with exactly: "NO_JUDGE_INTERVENTION" (this will be filtered out and not shown to users)
            
            If you DO intervene, provide a clear, authoritative judicial statement that addresses the specific situation.
        """

        # Add judge strictness context if available
        judge_context = ""
        if hasattr(input, 'practice_config') and input.practice_config:
            config = input.practice_config
            judge_context = f"""
            
            JUDGE CONFIGURATION:
            - Strictness Level: {config.judgeStrictness or 'Moderate'}
            - Case Type: {config.caseType or 'General'}
            - Difficulty Level: {config.difficultyLevel or 'Standard'}
            
            Adjust your intervention frequency based on strictness:
            - Lenient: Intervene only for major legal errors
            - Moderate: Intervene for significant errors and missing context
            - Strict: Intervene for any legal inaccuracies
            - Very Strict: Intervene frequently to maintain legal precision
            """

        judge_prompt_template = PromptTemplate(
            judge_prompt_base + judge_context + """
            
            ---
            CURRENT DEBATE CONTEXT:
            🧑 Human Lawyer's Statement: "{human_input}"
            🤖 AI Lawyer's Reply: "{ai_lawyer_response}"

            📚 Relevant Case Law Context (for judicial reference):
            {case_context}

            📖 Debate History (for context):
            {debate_history_str}

            ---
            DEBATE STATUS:
            - Is this a greeting? {is_greeting}
            - Is this the start of a case presentation? {is_case_start}
            - Is this a case presentation? {is_case_presentation}
            - Is this the beginning of the debate? {is_debate_beginning}
            - Should judge provide opening remarks? {should_judge_open}
            - Is judge being directly addressed? {is_judge_addressed}
            - Is this a direct greeting to judge? {is_judge_greeting}
            - Is this a procedural request? {is_procedural_request}
            - Is this direct to judge? {is_direct_to_judge}
            - Did AI lawyer respond? {ai_lawyer_responded}
            - Number of previous exchanges: {debate_count}
            - Is this evidence submission? {is_evidence_submission}
            - Is this document attachment? {is_document_attachment}
            - Is document properly introduced? {proper_document_introduction}

            ---
            ANALYSIS REQUIRED:
            1. Is this the beginning of a new case/debate? (If yes, provide opening remarks)
            2. Is the judge being directly addressed or greeted? (If yes, acknowledge appropriately)
            3. Is this a procedural request that requires immediate judicial response?
            4. Are there any legal errors or procedural issues that require intervention?
            5. Does either party need clarification on legal principles?
            6. Is a ruling or decision being requested?
            7. Does the debate need judicial direction to proceed properly?
            8. Is evidence being submitted? If yes:
               - Is it properly introduced with purpose? (If yes, acknowledge and ask for opposition)
               - Is it improperly introduced? (If yes, guide on proper procedure)
               - Does it need admissibility ruling?

            SPECIAL INSTRUCTIONS:
            - If the judge is directly addressed ("Your Honor", "Judge", etc.), ALWAYS respond appropriately
            - If someone says "hello judge" or similar, acknowledge the greeting
            - If this is a procedural request (objection, motion, etc.), respond immediately
            - If evidence is submitted without proper introduction, guide the lawyer on proper procedure
            - If evidence is properly introduced, acknowledge receipt and ask for opposition objections
            - Always maintain judicial authority and impartiality
            - For document attachments without explanation, provide guidance on proper evidence introduction

            EVIDENCE SUBMISSION EXAMPLES:
            - **Proper**: "Your Honor, I submit this CCTV footage as Exhibit A, supporting our claim of assault at 10:15 PM"
            - **Improper**: "Attached: 1.pdf" (no explanation of purpose or relevance)
            - **Response to Proper**: "Exhibit A received. Opposition counsel, any objections to the admission of this evidence?"
            - **Response to Improper**: "Counsel, please properly introduce this document with its purpose and relevance to the case."

            Based on your analysis, decide whether to intervene or remain silent.
            If intervening, provide a clear, authoritative judicial statement that addresses the specific situation.
            If not intervening, respond with exactly: "NO_JUDGE_INTERVENTION" (this will be filtered out)
            """
        )

        debate_history_str = "\n".join([f"{entry['role'].capitalize()}: {entry['content']}" for entry in input.debate_history])
        
        judge_prompt_str = judge_prompt_template.format(
            human_input=input.human_input,
            ai_lawyer_response=ai_lawyer_response,
            case_context=case_context_for_judge,
            debate_history_str=debate_history_str,
            is_greeting=is_greeting,
            is_case_start=is_case_start,
            is_case_presentation=is_case_presentation,
            is_debate_beginning=is_debate_beginning,
            should_judge_open=should_judge_open,
            is_judge_addressed=is_judge_addressed,
            is_judge_greeting=is_judge_greeting,
            is_procedural_request=is_procedural_request,
            is_direct_to_judge=is_direct_to_judge,
            ai_lawyer_responded=ai_lawyer_should_respond,
            debate_count=len(input.debate_history),
            is_evidence_submission=is_evidence_submission,
            is_document_attachment=is_document_attachment,
            proper_document_introduction=proper_document_introduction
        )

        judge_intervention_obj = await gemini_model.generate_content_async(
            judge_prompt_str,
            generation_config=genai.types.GenerationConfig(
                temperature=0.3,
                max_output_tokens=512,
                top_p=0.7
            )
        )
        judge_intervention = judge_intervention_obj.text.strip()
        
        # Debug logging
        print(f"=== JUDGE DEBUG INFO ===")
        print(f"Human input: {input.human_input}")
        print(f"Is greeting: {is_greeting}")
        print(f"Is case start: {is_case_start}")
        print(f"Is case presentation: {is_case_presentation}")
        print(f"Is judge addressed: {is_judge_addressed}")
        print(f"Is judge greeting: {is_judge_greeting}")
        print(f"Is procedural request: {is_procedural_request}")
        print(f"Is direct to judge: {is_direct_to_judge}")
        print(f"AI lawyer should respond: {ai_lawyer_should_respond}")
        print(f"AI lawyer response: {ai_lawyer_response}")
        print(f"Judge intervention: {judge_intervention}")
        print(f"========================")

        # --- Extract and compile metadata for response ---
        extracted_metadata = {
            "qna_principles": list(set([p for doc in qna_retrieval_result.get('sources', []) for p in doc.get('metadata', {}).get('legal_principles', [])])),
            "qna_citations": list(set([c for doc in qna_retrieval_result.get('sources', []) for c in doc.get('metadata', {}).get('citations', [])])),
            "case_principles": list(set([p for doc in case_retrieval_result.get('sources', []) for p in doc.get('metadata', {}).get('legal_principles', [])])),
            "case_citations": list(set([c for doc in case_retrieval_result.get('sources', []) for c in doc.get('metadata', {}).get('citations', [])])),
            "case_tags": list(set([tag for doc in case_retrieval_result.get('sources', []) for tag in doc.get('metadata', {}).get('tags', []) if isinstance(doc.get('metadata', {}).get('tags'), list)]))
        }

        # Filter out the "NO_JUDGE_INTERVENTION" response - don't show it to users
        if judge_intervention == "NO_JUDGE_INTERVENTION":
            judge_intervention = None
        
        return DebateTurnResponse(
            ai_lawyer_response=ai_lawyer_response if ai_lawyer_response != "NO_LAWYER_RESPONSE" else None,
            judge_intervention=judge_intervention,
            sources={
                "qna_sources": qna_retrieval_result.get('sources', []),
                "case_sources": case_retrieval_result.get('sources', [])
            },
            metadata=extracted_metadata
        )
    except Exception as e:
        print(f"Error in debate_turn orchestrator: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred during the debate turn: {str(e)}")
