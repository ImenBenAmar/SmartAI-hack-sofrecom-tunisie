"""
Utility functions for email processing (summarization, task detection, auto-reply, semantic analysis).
"""
from modules.llm_client import call_llm_api, extract_json_from_response, MODEL_FOR_SEMANTICS

def summarize_email(text: str, model_name: str = MODEL_FOR_SEMANTICS) -> dict | None:
    """
    Generate a concise summary and extract key points from an email.
    Returns structured data with summary and key points.
    """
    prompt = f"""
Act as an expert email summarizer. Read the following email and create a concise summary along with key points.

IMPORTANT: The input text is in English. The output JSON must also be fully in English.

Strictly adhere to this JSON structure:
{{
  "summary": "A 1-2 sentence concise summary of the entire email.",
  "key_points": ["List of 3-5 key points or action items from the email"]
}}

Rules:
- The summary should be brief but capture the main purpose of the email
- Key points should be specific and actionable where applicable
- Return empty list [] if no key points are found
- Only return the JSON object, all in English, no explanations

Email text to summarize:
---
{text}
---
"""
    
    try:
        response = call_llm_api(prompt, model_name=model_name, max_tokens=1024)
        if not response:
            return None
        result = extract_json_from_response(response)
        if not result:
            return None
        return result
    except Exception as e:
        print(f"Warning: Email summarization failed: {e}")
        return None

def detect_tasks(text: str, model_name: str = MODEL_FOR_SEMANTICS) -> dict | None:
    """
    Detect and extract actionable tasks from an email.
    Returns structured data with tasks, assignees, deadlines, and priorities.
    """
    prompt = f"""
Act as an expert task analyzer. Read the following email and extract all actionable tasks, action items, or requests.

IMPORTANT: The input text is in English. The output JSON must also be fully in English.

Strictly adhere to this JSON structure:
{{
  "tasks": [
    {{
      "task_description": "Clear description of what needs to be done",
      "assignee": "Name of person assigned (or 'you', 'team', 'everyone', or null if not specified)",
      "deadline": "Deadline or due date if mentioned (or null if not specified)",
      "priority": "High, Medium, or Low based on urgency and importance"
    }}
  ]
}}

Rules for task detection:
- Identify explicit action items (e.g., "please review", "submit by", "schedule a meeting")
- Identify implicit tasks (e.g., "we need to finalize", "looking forward to your feedback")
- Extract assignee from context (e.g., "Sarah - please review" → assignee: "Sarah")
- Extract deadline from phrases like "by Friday", "end of day", "next week", "ASAP"
- Determine priority based on:
  * High: Urgent deadlines, critical actions, words like "urgent", "ASAP", "immediately"
  * Medium: Regular tasks with specific deadlines
  * Low: Optional tasks, no specific deadline, FYI items
- Return empty list [] if no tasks are found
- Only return the JSON object, all in English, no explanations

Email text to analyze:
---
{text}
---
"""
    
    try:
        response = call_llm_api(prompt, model_name=model_name, max_tokens=2048)
        if not response:
            return None
        result = extract_json_from_response(response)
        if not result:
            return None
        return result
    except Exception as e:
        print(f"Warning: Task detection failed: {e}")
        return None

def generate_auto_reply(text: str, model_name: str = MODEL_FOR_SEMANTICS) -> dict | None:
    """
    Generate an intelligent, context-aware reply to an email.
    Returns structured data with the reply text and tone.
    """
    prompt = f"""
Act as an expert professional email writer. Read the following email and generate an appropriate reply.

IMPORTANT: The input text is in English. The output JSON must also be fully in English.

Analyze the email to understand:
- The main request or purpose
- The sender's tone and formality level
- Any questions that need answering
- Any deadlines or urgency

Generate a professional, polite, and contextually appropriate reply.

Strictly adhere to this JSON structure:
{{
  "reply": "The complete email reply text, including greeting, body, and closing",
  "tone": "Professional, Casual, or Formal - based on the original email's tone"
}}

Guidelines for the reply:
- Match the formality level of the original email
- Address all questions or requests mentioned
- Be concise but complete
- Use appropriate greetings and closings
- If the email asks for a meeting, suggest times or confirm availability
- If the email requests information, provide a helpful response or indicate you'll follow up
- If the email is informational, acknowledge receipt appropriately
- Maintain a professional and courteous tone
- Keep the reply clear and actionable

Email to reply to:
---
{text}
---
"""
    
    try:
        response = call_llm_api(prompt, model_name=model_name, max_tokens=2048)
        if not response:
            print("ERROR: LLM returned empty response for auto-reply")
            return None
        
        result = extract_json_from_response(response)
        if not result or "error" in result:
            print("WARNING: Failed to extract JSON from LLM response for auto-reply")
            raw_output = result.get('raw_output', '') if result else response
            if raw_output and len(raw_output.strip()) > 0:
                print("INFO: Using raw LLM output as reply")
                return {
                    "reply": raw_output.strip(),
                    "tone": "Professional"
                }
            return None
        
        if "reply" not in result:
            print(f"ERROR: 'reply' field missing from parsed JSON")
            return None
        
        return result
    except Exception as e:
        print(f"ERROR: Auto-reply generation failed: {e}")
        return None

def analyze_email_semantics(text: str, model_name: str = MODEL_FOR_SEMANTICS) -> dict | None:
    """
    Analyze email semantics to extract key information.
    Returns structured data about the email's content, sentiment, urgency, etc.
    """
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    possible_sender = lines[-1] if lines else ""

    prompt = f"""
Act as an expert in professional communication analysis. Analyze the following email and extract key information into a JSON object.

IMPORTANT: The input text is in English. The output JSON must also be fully in English.

Rules for participants:
- Include all people explicitly mentioned in the email body.
- Do NOT include the sender (usually the last line: '{possible_sender}').
- If no other names are mentioned, include 'you' as the participant by default.

Strictly adhere to this JSON structure:
{{
  "main_subject": "The main subject in a few words.",
  "short_summary": "A one-sentence summary.",
  "email_type": "Classify as: 'Action Request', 'Information', 'Meeting Planning', 'Reply', 'Report', 'Social','Event','Other'.",
  "participants": ["List of all names of people mentioned, or 'you' if none."],
  "sentiment": "Overall sentiment: 'Positive', 'Negative', or 'Neutral'.",
  "urgency": {{
    "is_urgent": true_or_false,
    "justification": "Brief explanation of why it is urgent or not."
  }}
}}

Rules:
- Return empty lists [] only if absolutely no participant or information is found.
- Only return the JSON object, all in English, no explanations.

Email text to analyze:
---
{text}
---
"""
    
    try:
        response = call_llm_api(prompt, model_name=model_name, max_tokens=2048)
        if not response:
            return None
        result = extract_json_from_response(response)
        if not result:
            return None
        return result
    except Exception as e:
        print(f"Warning: Semantic analysis failed: {e}")
        return None