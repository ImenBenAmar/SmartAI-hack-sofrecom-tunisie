import os
import json
from dotenv import load_dotenv
from openai import OpenAI, APIError

# Charger le .env
dotenv_path = os.path.join(os.path.dirname(__file__), '../config/.env')
load_dotenv(dotenv_path)

# Vérifie que les clés sont bien chargées
print("NVIDIA_API_KEY_LLAMA3_8B:", os.getenv("NVIDIA_API_KEY_LLAMA3_8B"))
print("NVIDIA_API_KEY_LLAMA3_70B:", os.getenv("NVIDIA_API_KEY_LLAMA3_70B"))

clients = {}

# 1. Client NVIDIA (Llama 3 8B Instruct)
api_key_8b = os.getenv("NVIDIA_API_KEY_LLAMA3_8B")
MODEL_FOR_TRANSLATION = "meta/llama3-8b-instruct"
if api_key_8b:
    clients[MODEL_FOR_TRANSLATION] = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key_8b
    )
    print(f"INFO: Client NVIDIA initialisé pour '{MODEL_FOR_TRANSLATION}'.")
else:
    print(f"AVERTISSEMENT: Clé API non trouvée pour Llama 3 8B (variable: NVIDIA_API_KEY_LLAMA3_8B).")

# 2. Client NVIDIA (Llama 3 70B Instruct)
MODEL_FOR_SEMANTICS = "meta/llama3-8b-instruct"
api_key_semantics = os.getenv("NVIDIA_API_KEY_LLAMA3_8B")
clients[MODEL_FOR_SEMANTICS] = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=api_key_semantics
)
# 3. Client Local (Llama 3)
local_base_url = os.getenv("LOCAL_LLAMA_API_BASE_URL")
LOCAL_LLAMA_MODEL_NAME = os.getenv("LOCAL_LLAMA_MODEL_NAME")
if local_base_url and LOCAL_LLAMA_MODEL_NAME:
    clients[LOCAL_LLAMA_MODEL_NAME] = OpenAI(
        base_url=local_base_url,
        api_key="ollama"
    )
    print(f"INFO: Client LOCAL initialisé pour '{LOCAL_LLAMA_MODEL_NAME}'.")

# --- FONCTION D'APPEL PRINCIPALE ---
def call_llm_api(prompt: str, model_name: str, temperature: float = 0.2, max_tokens: int = 1024):
    client = clients.get(model_name)
    if not client:
        error_message = f"Erreur: Aucun client configuré pour le modèle '{model_name}'. Vérifiez .env."
        print(error_message)
        return None
    try:
        completion = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            top_p=0.7,
            max_tokens=max_tokens,
            stream=False
        )
        return completion.choices[0].message.content
    except APIError as e:
        print(f"Erreur API OpenAI avec le modèle '{model_name}': {e}")
        return None
    except Exception as e:
        print(f"Une erreur est survenue avec le modèle '{model_name}': {e}")
        return None

# --- FONCTION UTILITAIRE ---
def extract_json_from_response(response_text: str):
    if not response_text:
        return {"error": "Aucune réponse textuelle à analyser."}
    try:
        start_brace = response_text.find('{')
        start_bracket = response_text.find('[')
        if start_brace == -1 and start_bracket == -1:
            raise ValueError("Aucun JSON")
        json_start = start_brace if start_brace != -1 else start_bracket
        if start_brace != -1 and start_bracket != -1:
            json_start = min(start_brace, start_bracket)
        end_brace = response_text.rfind('}')
        end_bracket = response_text.rfind(']')
        json_end = max(end_brace, end_bracket) + 1
        json_str = response_text[json_start:json_end]
        return json.loads(json_str)
    except Exception as e:
        print(f"Erreur parsing JSON: {e}")
        return {"error": "Impossible de parser le JSON", "raw_output": response_text}
