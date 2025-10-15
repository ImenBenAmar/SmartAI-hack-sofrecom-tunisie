import os
import tempfile
import shutil
from datetime import datetime
from typing import Dict, Optional, Tuple
import pytesseract
from docx import Document
import cv2
import numpy as np
from pdf2image import convert_from_path
import hashlib

# ---------------- CONFIG ----------------
TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
TESSDATA_PREFIX = r"C:\Program Files\Tesseract-OCR"
POPLER_PATH = r"C:\Popler\Library\bin"

pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
os.environ["TESSDATA_PREFIX"] = TESSDATA_PREFIX

MIN_W, MIN_H = 100, 50
MAX_W, MAX_H = 1000, 1000

SUPPORTED_MIME_TYPES = {
    ".pdf": "pdf",
    ".docx": "word",
    ".txt": "text",
    ".png": "image",
    ".jpg": "image",
    ".jpeg": "image",
    ".pptx": "powerpoint",
    ".bat": "batch",
}

# ---------------- UTILITAIRES ----------------
def extract_metadata(file_path: str) -> Optional[Dict]:
    try:
        stats = os.stat(file_path)
        ext = os.path.splitext(file_path)[1].lower()
        mime_type = SUPPORTED_MIME_TYPES.get(ext, None)
        return {
            "filename": os.path.basename(file_path),
            "size_kb": round(stats.st_size / 1024, 2),
            "mime_type": mime_type,
            "extension": ext,
            "created_date": datetime.fromtimestamp(stats.st_ctime).isoformat(),
            "modified_date": datetime.fromtimestamp(stats.st_mtime).isoformat(),
        }
    except Exception as e:
        print(f"❌ Metadata extraction failed: {e}")
        return None

def preprocess_image_for_ocr(img: np.ndarray) -> np.ndarray:
    if img is None:
        raise ValueError("Cannot process empty image")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
    gray = cv2.medianBlur(gray, 3)
    return gray

def split_vertical_blocks(img: np.ndarray, x: int, y: int, w: int, h: int):
    roi = img[y:y+h, x:x+w]
    gray = cv2.cvtColor(roi, cv2.COLOR_RGB2GRAY)
    _, thresh = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY_INV)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (30, 30))
    dilated = cv2.dilate(thresh, kernel, iterations=1)
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    blocks = []
    for cnt in contours:
        sx, sy, sw, sh = cv2.boundingRect(cnt)
        if sw >= MIN_W and sh >= MIN_H:
            blocks.append((x+sx, y+sy, sw, sh))
    return sorted(blocks, key=lambda b: (b[1], b[0]))

# ---------------- OCR PDF avancé ----------------
def pdf_to_text_blocks(pdf_path: str) -> str:
    temp_dir = tempfile.mkdtemp(prefix="pdf_blocks_")
    final_dir = tempfile.mkdtemp(prefix="pdf_blocks_final_")
    try:
        pages = convert_from_path(pdf_path, poppler_path=POPLER_PATH)
        for idx_page, page in enumerate(pages):
            img = np.array(page)
            gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
            _, thresh = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY_INV)
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (50, 50))
            dilated = cv2.dilate(thresh, kernel, iterations=1)
            contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for i, cnt in enumerate(contours):
                x, y, w, h = cv2.boundingRect(cnt)
                if w >= MIN_W and h >= MIN_H:
                    roi = img[y:y+h, x:x+w]
                    cv2.imwrite(os.path.join(temp_dir, f"page{idx_page+1}_bloc{i+1}.png"), cv2.cvtColor(roi, cv2.COLOR_RGB2BGR))

        # Split blocks trop grands et éviter duplicata
        seen_hashes = set()
        for file_name in sorted(os.listdir(temp_dir)):
            file_path = os.path.join(temp_dir, file_name)
            img = cv2.imread(file_path)
            if img is None:
                continue
            h_img, w_img = img.shape[:2]
            blocks_to_save = []
            if w_img > MAX_W or h_img > MAX_H:
                sub_blocks = split_vertical_blocks(img, 0, 0, w_img, h_img)
                for x, y, w, h in sub_blocks:
                    blocks_to_save.append(img[y:y+h, x:x+w])
            else:
                blocks_to_save.append(img)
            for idx, block in enumerate(blocks_to_save):
                block_hash = hashlib.md5(cv2.imencode('.png', block)[1].tobytes()).hexdigest()
                if block_hash not in seen_hashes:
                    seen_hashes.add(block_hash)
                    cv2.imwrite(os.path.join(final_dir, f"{os.path.splitext(file_name)[0]}_{idx+1}.png"), block)

        # OCR final
        texts = []
        for f in sorted(os.listdir(final_dir)):
            img = cv2.imread(os.path.join(final_dir, f))
            if img is None:
                continue
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            try:
                text = pytesseract.image_to_string(gray, lang='fra+eng', config='--oem 3 --psm 6')
                if text.strip():
                    texts.append(text.strip())
            except pytesseract.TesseractError as e:
                print(f"❌ OCR failed for {f}: {e}")

        return "\n\n".join(texts) if texts else "[No text extracted]"
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
        shutil.rmtree(final_dir, ignore_errors=True)

# ---------------- Traitement fichier général ----------------
def process_file(file_path: str) -> Tuple[Optional[Dict], str]:
    meta = extract_metadata(file_path)
    if meta is None or meta["mime_type"] is None:
        return None, ""
    ext = meta["extension"]
    try:
        if ext == ".pdf":
            text = pdf_to_text_blocks(file_path)
        elif ext in (".png", ".jpg", ".jpeg"):
            img = cv2.imread(file_path)
            gray = preprocess_image_for_ocr(img)
            text = pytesseract.image_to_string(gray, lang='fra+eng', config='--oem 3 --psm 6')
        elif ext == ".docx":
            doc = Document(file_path)
            text = "\n".join([p.text for p in doc.paragraphs])
        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
        else:
            text = f"[Type {ext} not supported for OCR/text extraction]"
    except Exception as e:
        print(f"❌ Failed to process {file_path}: {e}")
        text = "[Processing failed]"
    return meta, text

# ---------------- Traitement depuis bytes (upload API) ----------------
def process_file_bytes(file_bytes: bytes, filename: str, save_output: bool = False) -> Tuple[Optional[Dict], Optional[str], str]:
    temp_dir = tempfile.mkdtemp()
    temp_file_path = os.path.join(temp_dir, filename)
    output_path = None
    try:
        with open(temp_file_path, "wb") as f:
            f.write(file_bytes)
        meta, text = process_file(temp_file_path)
        if save_output:
            output_path = os.path.join(temp_dir, f"{filename}_output.txt")
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(text)
        return meta, output_path, text
    finally:
        if not save_output:
            shutil.rmtree(temp_dir, ignore_errors=True)

def get_supported_extensions() -> list:
    return list(SUPPORTED_MIME_TYPES.keys())

def is_supported_file(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in SUPPORTED_MIME_TYPES
