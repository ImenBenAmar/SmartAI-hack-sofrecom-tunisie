"""
Classification and Theme Detection Module
Handles document clustering, theme detection, and thematic description generation
"""

import os
import re
import shutil
import time
from typing import List, Dict, Tuple
import requests
import numpy as np
from sklearn.cluster import KMeans
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate

# Default configuration
DEFAULT_PERSIST_DIR = "chroma_db_classification"
DEFAULT_CHUNK_SIZE = 600
DEFAULT_CHUNK_OVERLAP = 100
DEFAULT_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
DEFAULT_NUM_THEMES = 5


def clean_text(text: str) -> str:
    """Clean and normalize text by removing extra whitespace."""
    return re.sub(r'\s+', ' ', text).strip()


def initialize_vectorstore_for_classification(
    text: str,
    persist_dir: str = DEFAULT_PERSIST_DIR,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
    force_recreate: bool = False
) -> Tuple[any, List[str], any]:
    """
    Initialize vectorstore for classification.
    
    Args:
        text: Text content to vectorize
        persist_dir: Directory to persist the vectorstore
        chunk_size: Size of text chunks
        chunk_overlap: Overlap between chunks
        force_recreate: If True, recreate the vectorstore even if it exists
        
    Returns:
        Tuple of (vectordb, chunks, embeddings_function)
    """
    # Initialize embeddings with explicit model kwargs to avoid tensor issues
    embeddings = HuggingFaceEmbeddings(
        model_name=DEFAULT_EMBEDDING_MODEL,
        model_kwargs={'device': 'cpu'},
        encode_kwargs={'normalize_embeddings': True}
    )
    
    # Clean the text
    cleaned_text = clean_text(text)
    text_length = len(cleaned_text)
    
    # Adjust chunk size for very short texts
    # For texts shorter than default chunk size, use smaller chunks to get more granularity
    if text_length < chunk_size:
        # Use 1/3 of text length or minimum 50 characters
        adjusted_chunk_size = max(50, text_length // 3)
        adjusted_chunk_overlap = max(10, adjusted_chunk_size // 5)
        print(f"📏 Short text detected ({text_length} chars). Adjusting chunk size: {adjusted_chunk_size} (overlap: {adjusted_chunk_overlap})")
    else:
        adjusted_chunk_size = chunk_size
        adjusted_chunk_overlap = chunk_overlap
    
    # Split into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=adjusted_chunk_size,
        chunk_overlap=adjusted_chunk_overlap
    )
    chunks = text_splitter.split_text(cleaned_text)
    print(f"📄 Created {len(chunks)} text chunks for classification")
    
    # Check if vectorstore exists
    if os.path.exists(persist_dir) and not force_recreate:
        print("🔄 Loading existing Chroma vectorstore for classification...")
        vectordb = Chroma(
            persist_directory=persist_dir,
            embedding_function=embeddings
        )
    else:
        print("🛠 Creating new Chroma vectorstore for classification...")
        if os.path.exists(persist_dir):
            shutil.rmtree(persist_dir)
        
        vectordb = Chroma.from_texts(
            texts=chunks,
            embedding=embeddings,
            persist_directory=persist_dir
        )
    
    print("✅ Chroma vectorstore ready for classification")
    return vectordb, chunks, embeddings


def detect_themes(
    vectordb: any,
    chunks: List[str],
    embeddings_function: any,
    num_themes: int = DEFAULT_NUM_THEMES
) -> Dict[int, str]:
    """
    Detect themes using K-means clustering on chunk embeddings.
    
    Args:
        vectordb: Chroma vectorstore
        chunks: List of text chunks
        embeddings_function: Embeddings function
        num_themes: Number of themes to detect
        
    Returns:
        Dictionary mapping theme IDs to representative chunks
    """
    # Adjust num_themes if we have fewer chunks than requested themes
    actual_num_themes = min(num_themes, len(chunks))
    
    if actual_num_themes < num_themes:
        print(f"⚠️ Warning: Only {len(chunks)} chunks available. Reducing themes from {num_themes} to {actual_num_themes}")
    
    print(f"🔍 Detecting {actual_num_themes} themes using K-means clustering...")
    
    # Extract embeddings for all chunks
    embeddings = np.array([
        embeddings_function.embed_query(chunk) for chunk in chunks
    ])
    
    # Apply K-means clustering
    kmeans = KMeans(n_clusters=actual_num_themes, random_state=42)
    labels = kmeans.fit_predict(embeddings)
    
    # Find representative chunks for each cluster
    theme_chunks = {}
    for i in range(actual_num_themes):
        cluster_indices = np.where(labels == i)[0]
        
        if len(cluster_indices) > 0:
            # Choose the chunk closest to the cluster centroid
            cluster_embeddings = embeddings[cluster_indices]
            centroid = kmeans.cluster_centers_[i]
            distances = np.linalg.norm(cluster_embeddings - centroid, axis=1)
            representative_idx = cluster_indices[np.argmin(distances)]
            theme_chunks[i] = chunks[representative_idx]
    
    print(f"✅ Detected {len(theme_chunks)} themes")
    return theme_chunks


def call_mistral_api(
    prompt_text: str,
    api_endpoint: str,
    api_key: str,
    model: str = "mistral-small",
    max_tokens: int = 100,
    temperature: float = 0.1,
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
            raise ValueError(f"Unexpected response from Mistral API: {data}")
            
    except requests.exceptions.HTTPError as e:
        if resp.status_code == 401:
            raise RuntimeError("Authentication error: Invalid API key")
        elif resp.status_code == 404:
            raise RuntimeError(f"Model '{model}' not found or not available")
        raise RuntimeError(f"HTTP error calling Mistral API: {str(e)}")
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Network error calling Mistral API: {str(e)}")


def generate_theme_descriptions(
    theme_chunks: Dict[int, str],
    api_endpoint: str,
    api_key: str,
    model: str = "mistral-small"
) -> List[Tuple[int, str, str]]:
    """
    Generate thematic descriptions using LLM.
    
    Args:
        theme_chunks: Dictionary of theme IDs to representative chunks
        api_endpoint: Mistral API endpoint
        api_key: Mistral API key
        model: Model name to use
        
    Returns:
        List of tuples (theme_id, description, representative_chunk)
    """
    prompt_template = """
Tu es un expert en analyse de texte.
À partir du texte suivant, identifie la thématique principale (3 mots maximum) pour tout le fichier.

--- TEXTE ---
{text}

--- THÉMATIQUE ---
"""
    
    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["text"]
    )
    
    themes = []
    for theme_id, chunk in theme_chunks.items():
        input_prompt = prompt.format(text=chunk)
        start = time.time()
        
        try:
            description = call_mistral_api(
                input_prompt,
                api_endpoint=api_endpoint,
                api_key=api_key,
                model=model,
                max_tokens=50,
                temperature=0.1
            )
            print(f"🔎 Theme {theme_id + 1} generated in {time.time() - start:.2f}s")
            themes.append((theme_id + 1, description, chunk))
        except Exception as e:
            print(f"❌ Failed to generate description for theme {theme_id + 1}: {e}")
            themes.append((theme_id + 1, f"[Error: {str(e)}]", chunk))
    
    return themes


def classify_document(
    text_content: str,
    api_endpoint: str,
    api_key: str,
    model: str = "mistral-small",
    num_themes: int = DEFAULT_NUM_THEMES,
    persist_dir: str = DEFAULT_PERSIST_DIR,
    force_recreate: bool = False
) -> dict:
    """
    Classify a document into thematic categories.
    
    Args:
        text_content: The text content to classify
        api_endpoint: Mistral API endpoint
        api_key: Mistral API key
        model: Model name to use
        num_themes: Number of themes to detect
        persist_dir: Directory to persist vectorstore
        force_recreate: Force recreate vectorstore
        
    Returns:
        Dictionary with themes and metadata
    """
    start_time = time.time()
    
    # Initialize vectorstore
    vectordb, chunks, embeddings_function = initialize_vectorstore_for_classification(
        text_content,
        persist_dir=persist_dir,
        force_recreate=force_recreate
    )
    
    # Detect themes
    theme_chunks = detect_themes(
        vectordb,
        chunks,
        embeddings_function,
        num_themes=num_themes
    )
    
    # Generate descriptions
    print("📝 Generating theme descriptions...")
    themes = generate_theme_descriptions(
        theme_chunks,
        api_endpoint=api_endpoint,
        api_key=api_key,
        model=model
    )
    
    processing_time = time.time() - start_time
    print(f"✅ Classification completed in {processing_time:.2f}s")
    
    # Format results
    theme_list = []
    for theme_id, description, chunk in themes:
        theme_list.append({
            "theme_id": theme_id,
            "description": description,
            "representative_text": chunk[:200] + "..." if len(chunk) > 200 else chunk
        })
    
    return {
        "themes": theme_list,
        "total_themes": len(theme_list),
        "total_chunks": len(chunks),
        "processing_time_seconds": round(processing_time, 2)
    }


def get_theme_distribution(
    text_content: str,
    num_themes: int = DEFAULT_NUM_THEMES,
    persist_dir: str = DEFAULT_PERSIST_DIR
) -> dict:
    """
    Get the distribution of chunks across themes without LLM descriptions.
    
    Args:
        text_content: The text content to analyze
        num_themes: Number of themes to detect
        persist_dir: Directory to persist vectorstore
        
    Returns:
        Dictionary with theme distribution statistics
    """
    # Initialize vectorstore
    vectordb, chunks, embeddings_function = initialize_vectorstore_for_classification(
        text_content,
        persist_dir=persist_dir,
        force_recreate=False
    )
    
    # Adjust num_themes if we have fewer chunks
    actual_num_themes = min(num_themes, len(chunks))
    
    # Extract embeddings
    embeddings = np.array([
        embeddings_function.embed_query(chunk) for chunk in chunks
    ])
    
    # Apply K-means
    kmeans = KMeans(n_clusters=actual_num_themes, random_state=42)
    labels = kmeans.fit_predict(embeddings)
    
    # Calculate distribution
    unique, counts = np.unique(labels, return_counts=True)
    distribution = dict(zip(unique.tolist(), counts.tolist()))
    
    return {
        "total_chunks": len(chunks),
        "requested_themes": num_themes,
        "actual_themes": actual_num_themes,
        "distribution": distribution,
        "theme_percentages": {
            theme_id: round((count / len(chunks)) * 100, 2)
            for theme_id, count in distribution.items()
        }
    }
