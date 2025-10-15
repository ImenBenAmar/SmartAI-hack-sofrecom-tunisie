"""
Utility functions for language detection and translation.
"""
import os
import hashlib
from modules.llm_client import call_llm_api, MODEL_FOR_TRANSLATION

TRANSLATION_CACHE_DIR = "translation_cache"

def detect_language(text: str, model_name: str = MODEL_FOR_TRANSLATION) -> tuple[str, bool]:
    """
    Detect if text is in French or English.
    Returns: (language_name, is_french)
    """
    sample = text[:500]
    lang_detection_prompt = f"""
Analyze the following text and determine if it is primarily in French or English.
Answer ONLY with 'French' or 'English', nothing else.

Text: "{sample}"
"""
    
    try:
        detected = call_llm_api(lang_detection_prompt, model_name=model_name, max_tokens=10)
        if detected:
            detected_lower = detected.lower().strip()
            if 'french' in detected_lower or 'français' in detected_lower:
                return "French", True
            elif 'english' in detected_lower or 'anglais' in detected_lower:
                return "English", False
            return "English", False
        return "English", False
    except Exception as e:
        print(f"Warning: Language detection failed: {e}")
        return "Unknown", False

def translate_text_to_english(text: str, model_name: str = MODEL_FOR_TRANSLATION) -> str:
    """
    Translate text from French to English.
    Uses caching to avoid re-translating the same text.
    """
    hasher = hashlib.sha1()
    hasher.update(text.encode('utf-8'))
    text_hash = hasher.hexdigest()
    
    cache_filename = f"translation_{text_hash}.txt"
    cache_filepath = os.path.join(TRANSLATION_CACHE_DIR, cache_filename)
    
    if os.path.exists(cache_filepath):
        print(f"INFO: Translation found in cache: {cache_filename}")
        with open(cache_filepath, 'r', encoding='utf-8') as f:
            return f.read()
    
    print(f"INFO: Translating text (not in cache)")
    translation_prompt = f"""
Your task is to translate French text to professional English.

CRITICAL INSTRUCTIONS:
- Respond ONLY with the translated English text
- Do NOT add explanations, introductions, or concluding remarks
- Preserve the original meaning, tone, and formatting (line breaks, punctuation)
- Keep @mentions, URLs, and special formatting intact

Translate the following text:
---
{text}
---
"""
    
    max_tokens = len(text.split()) * 2 + 100
    try:
        translated = call_llm_api(translation_prompt, model_name=model_name, max_tokens=max_tokens)
        if translated:
            result = translated.strip()
            os.makedirs(TRANSLATION_CACHE_DIR, exist_ok=True)
            with open(cache_filepath, 'w', encoding='utf-8') as f:
                f.write(result)
            return result
        return text
    except Exception as e:
        print(f"Warning: Translation failed: {e}")
        return text