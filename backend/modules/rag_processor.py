"""
RAG (Retrieval-Augmented Generation) Processing Module
Handles document vectorization, similarity search, and question answering
"""

import os
import re
import shutil
import time
from typing import Optional, Tuple, List
import requests
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate

# Default configuration
DEFAULT_PERSIST_DIR = "chroma_db_api"
DEFAULT_CHUNK_SIZE = 700
DEFAULT_CHUNK_OVERLAP = 300
DEFAULT_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


def clean_text(text: str) -> str:
    """Clean and normalize text by removing extra whitespace."""
    return re.sub(r'\s+', ' ', text).strip()


def initialize_vectorstore(
    text: str,
    persist_dir: str = DEFAULT_PERSIST_DIR,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
    force_recreate: bool = False
) -> Tuple[any, List[str]]:
    """
    Initialize or load a Chroma vectorstore from text.
    
    Args:
        text: Text content to vectorize
        persist_dir: Directory to persist the vectorstore
        chunk_size: Size of text chunks
        chunk_overlap: Overlap between chunks
        force_recreate: If True, recreate the vectorstore even if it exists
        
    Returns:
        Tuple of (vectordb, chunks)
    """
    # Initialize embeddings with explicit model kwargs to avoid tensor issues
    embeddings = HuggingFaceEmbeddings(
        model_name=DEFAULT_EMBEDDING_MODEL,
        model_kwargs={'device': 'cpu'},
        encode_kwargs={'normalize_embeddings': True}
    )
    
    # Clean the text
    cleaned_text = clean_text(text)
    
    # Split into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    chunks = text_splitter.split_text(cleaned_text)
    print(f"📄 Created {len(chunks)} text chunks")
    
    # Check if vectorstore exists
    if os.path.exists(persist_dir) and not force_recreate:
        print("🔄 Loading existing Chroma vectorstore...")
        vectordb = Chroma(
            persist_directory=persist_dir,
            embedding_function=embeddings
        )
    else:
        print("🛠 Creating new Chroma vectorstore...")
        if os.path.exists(persist_dir):
            shutil.rmtree(persist_dir)
        
        vectordb = Chroma.from_texts(
            texts=chunks,
            embedding=embeddings,
            persist_directory=persist_dir
        )
    
    print("✅ Chroma vectorstore ready")
    return vectordb, chunks


def call_mistral_api(
    prompt_text: str,
    api_endpoint: str,
    api_key: str,
    model: str = "mistral-small",
    max_tokens: int = 300,
    temperature: float = 0.3,
    timeout: int = 60
) -> str:
    """
    Call Mistral API for text generation.
    
    Args:
        prompt_text: The prompt to send
        api_endpoint: API endpoint URL
        api_key: API key for authentication
        model: Model name to use
        max_tokens: Maximum tokens to generate
        temperature: Sampling temperature
        timeout: Request timeout in seconds
        
    Returns:
        Generated text response
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt_text}
        ],
        "max_tokens": max_tokens,
        "temperature": temperature
    }
    
    try:
        resp = requests.post(
            f"{api_endpoint}/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=timeout
        )
        resp.raise_for_status()
        data = resp.json()
        
        if "choices" in data and len(data["choices"]) > 0:
            return data["choices"][0]["message"]["content"].strip()
        else:
            raise ValueError("Unexpected response from Mistral API")
            
    except requests.exceptions.HTTPError as e:
        if resp.status_code == 401:
            raise RuntimeError("Authentication error: Invalid API key")
        elif resp.status_code == 404:
            raise RuntimeError(f"Model '{model}' not found or not available")
        raise RuntimeError(f"HTTP error calling Mistral API: {str(e)}")
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Network error calling Mistral API: {str(e)}")


def answer_question(
    question: str,
    text_content: str,
    api_endpoint: str,
    api_key: str,
    model: str = "mistral-small",
    persist_dir: str = DEFAULT_PERSIST_DIR,
    top_k: int = 3,
    force_recreate: bool = False,
    apply_correction: bool = True
) -> dict:
    """
    Answer a question using RAG (Retrieval-Augmented Generation).
    
    Args:
        question: The question to answer
        text_content: The text content to search
        api_endpoint: Mistral API endpoint
        api_key: Mistral API key
        model: Model name to use
        persist_dir: Directory to persist vectorstore
        top_k: Number of similar chunks to retrieve
        force_recreate: Force recreate vectorstore
        apply_correction: Apply correction step to the answer
        
    Returns:
        Dictionary with answer, context, and metadata
    """
    start_time = time.time()
    
    # Initialize vectorstore
    vectordb, chunks = initialize_vectorstore(
        text_content,
        persist_dir=persist_dir,
        force_recreate=force_recreate
    )
    
    # Retrieve relevant chunks
    print(f"🔍 Searching for relevant context (top {top_k})...")
    top_chunks = vectordb.similarity_search(question, k=top_k)
    context_for_llm = " ".join(c.page_content for c in top_chunks)
    
    # Create QA prompt
    qa_prompt_template = """
Tu es un assistant intelligent.
Lis le texte suivant et réponds uniquement à la question.
Corrige les fautes visibles et donne une réponse claire en 1 à 2 phrases maximum.

--- CONTEXTE ---
{context}

--- QUESTION ---
{question}

--- RÉPONSE ---
"""
    
    qa_prompt = PromptTemplate(
        template=qa_prompt_template,
        input_variables=["context", "question"]
    )
    
    # Generate answer
    print("🧠 Generating answer...")
    input_prompt = qa_prompt.format(context=context_for_llm, question=question)
    raw_answer = call_mistral_api(
        input_prompt,
        api_endpoint=api_endpoint,
        api_key=api_key,
        model=model,
        max_tokens=300,
        temperature=0.3
    )
    
    generation_time = time.time() - start_time
    print(f"✅ Answer generated in {generation_time:.2f}s")
    
    # Apply correction if requested
    final_answer = raw_answer
    if apply_correction:
        correction_template = """
Réécris la réponse suivante en français correct et fluide, sans changer le sens :
"{answer}"
"""
        correction_prompt = PromptTemplate(
            input_variables=["answer"],
            template=correction_template
        )
        correction_input = correction_prompt.format(answer=raw_answer)
        
        try:
            final_answer = call_mistral_api(
                correction_input,
                api_endpoint=api_endpoint,
                api_key=api_key,
                model=model,
                max_tokens=60,
                temperature=0.3
            )
            print("✅ Answer corrected")
        except Exception as e:
            print(f"⚠️ Correction failed, using raw answer: {e}")
            final_answer = raw_answer
    
    return {
        "question": question,
        "answer": final_answer,
        "raw_answer": raw_answer if apply_correction else None,
        "context_chunks": [c.page_content for c in top_chunks],
        "total_chunks": len(chunks),
        "generation_time_seconds": round(generation_time, 2)
    }


def batch_answer_questions(
    questions: List[str],
    text_content: str,
    api_endpoint: str,
    api_key: str,
    model: str = "mistral-small",
    persist_dir: str = DEFAULT_PERSIST_DIR,
    top_k: int = 3
) -> List[dict]:
    """
    Answer multiple questions using the same vectorstore.
    
    Args:
        questions: List of questions to answer
        text_content: The text content to search
        api_endpoint: Mistral API endpoint
        api_key: Mistral API key
        model: Model name to use
        persist_dir: Directory to persist vectorstore
        top_k: Number of similar chunks to retrieve
        
    Returns:
        List of answer dictionaries
    """
    # Initialize vectorstore once
    vectordb, chunks = initialize_vectorstore(
        text_content,
        persist_dir=persist_dir,
        force_recreate=False
    )
    
    results = []
    for idx, question in enumerate(questions):
        print(f"\n--- Question {idx + 1}/{len(questions)} ---")
        try:
            result = answer_question(
                question=question,
                text_content=text_content,
                api_endpoint=api_endpoint,
                api_key=api_key,
                model=model,
                persist_dir=persist_dir,
                top_k=top_k,
                force_recreate=False  # Don't recreate for batch processing
            )
            results.append(result)
        except Exception as e:
            print(f"❌ Failed to answer question: {e}")
            results.append({
                "question": question,
                "answer": None,
                "error": str(e)
            })
    
    return results
