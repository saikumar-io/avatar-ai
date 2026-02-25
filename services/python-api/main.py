from flask import Flask, request, jsonify, send_file, render_template
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import requests
import json
import base64
from io import BytesIO
from dotenv import load_dotenv
import logging
from groq import Groq
import re
from pdf2image import convert_from_bytes
# --- TESSERACT OCR IMPORTS & CONFIGURATION (Free Local Solution) ---
import pytesseract
from PIL import Image
import math

# Load environment variables
load_dotenv()
lang = "en-IN" 

# Logging configuration (set early so configuration warnings are visible)
logging.basicConfig(level=logging.INFO)

# --- TESSERACT PATH CONFIG (WINDOWS-FRIENDLY) ---
# Prefer an environment variable so you don't have to edit code:
#   TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe
TESSERACT_PATH = os.getenv("TESSERACT_PATH", r"C:\Program Files\Tesseract-OCR\tesseract.exe")
if os.name == "nt":
    if os.path.exists(TESSERACT_PATH):
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
        logging.info(f"Using Tesseract at: {TESSERACT_PATH}")
    else:
        logging.warning(
            "Tesseract not found at default path. "
            "Set TESSERACT_PATH env var to your Tesseract executable or add it to PATH."
        )

# Flask app setup
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

LOAN_PRODUCTS = {
    "home": [
        {"type": "Home Loan Saver", "interest": 7.9, "years": 15, "processing_fee": 1.2},
        {"type": "Home Loan Standard", "interest": 8.2, "years": 20, "processing_fee": 1.0},
        {"type": "Home Loan Flexi", "interest": 8.7, "years": 25, "processing_fee": 0.8},
        {"type": "Home Loan Premium Plus", "interest": 9.2, "years": 30, "processing_fee": 0.6},
        {"type": "Home Loan Long Secure", "interest": 9.6, "years": 35, "processing_fee": 0.5},
    ],

    "car": [
        {"type": "Car Loan Basic", "interest": 8.8, "years": 4, "processing_fee": 1.3},
        {"type": "Car Loan Standard", "interest": 9.5, "years": 5, "processing_fee": 1.2},
        {"type": "Car Loan Elite", "interest": 10.8, "years": 7, "processing_fee": 1.0},
        {"type": "Car Loan Premium Drive", "interest": 12.2, "years": 8, "processing_fee": 0.8},
    ],

    "personal": [
        {"type": "Personal Loan Quick", "interest": 11.5, "years": 2, "processing_fee": 2.0},
        {"type": "Personal Loan Smart", "interest": 13.0, "years": 3, "processing_fee": 1.8},
        {"type": "Personal Loan Instant Plus", "interest": 15.5, "years": 4, "processing_fee": 1.5},
        {"type": "Personal Loan Ultra Flex", "interest": 17.8, "years": 5, "processing_fee": 1.2},
    ],

    "education": [
        {"type": "Education Loan National", "interest": 7.2, "years": 8, "processing_fee": 0.6},
        {"type": "Education Loan Scholar Plus", "interest": 7.8, "years": 10, "processing_fee": 0.5},
        {"type": "Education Loan Global", "interest": 8.5, "years": 12, "processing_fee": 0.7},
    ],

    "business": [
        {"type": "SME Starter Loan", "interest": 11.2, "years": 5, "processing_fee": 1.8},
        {"type": "SME Growth Loan", "interest": 12.5, "years": 7, "processing_fee": 1.5},
        {"type": "Enterprise Expansion Loan", "interest": 14.8, "years": 10, "processing_fee": 1.2},
        {"type": "Corporate Strategic Loan", "interest": 16.5, "years": 12, "processing_fee": 1.0},
    ]
}

# Upload folder for audio files
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024 
SARVAM_API_KEY = os.getenv('SARVAM_API_KEY')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

# Log missing API keys instead of crashing the whole app.
if not SARVAM_API_KEY:
    logging.warning("SARVAM_API_KEY is missing. Translation and speech features will return errors until it is set.")
if not GROQ_API_KEY:
    logging.warning("GROQ_API_KEY is missing. Chat and document explanation features will return errors until it is set.")

# Initialize Groq client only if API key is present
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
conversation_sessions = {}
TRANSLATE_API_URL = "https://api.sarvam.ai/translate"
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'm4a', 'webm'}

# NOTE: Google Cloud Vision client initialization code REMOVED.

def allowed_file(filename):
    """Check if the uploaded file has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def home():
    """ Serve the frontend HTML file """
    return render_template("index.html")


@app.route('/set-language', methods=['POST'])
def set_language():
    """Set the default language for the application."""
    global lang
    data = request.json
    new_lang = data.get("language_code", "").strip()

    if not new_lang:
        return jsonify({"error": "Language code is required"}), 400

    print(f"Language set to: {new_lang}")
    lang = new_lang
    return jsonify({"message": f"Language changed to {lang}"}), 200

def calculate_emi(principal, annual_rate, tenure_years):
    monthly_rate = annual_rate / 12 / 100
    months = tenure_years * 12

    if monthly_rate == 0:
        emi = principal / months
    else:
        emi = (principal * monthly_rate * (1 + monthly_rate) ** months) / \
              ((1 + monthly_rate) ** months - 1)

    total_payment = emi * months
    total_interest = total_payment - principal

    return {
        "emi": round(emi, 2),
        "total_interest": round(total_interest, 2),
        "total_payment": round(total_payment, 2)
    }

def extract_amount(text):
    text = text.lower()

    number_match = re.search(r'(\d+(?:\.\d+)?)', text)
    if not number_match:
        return None

    amount = float(number_match.group(1))

    if "lakh" in text:
        amount *= 100000
    elif "thousand" in text:
        amount *= 1000
    elif "crore" in text:
        amount *= 10000000

    return amount

@app.route('/chat', methods=['POST'])
def chat():
    try:
        if client is None:
            return jsonify({"error": "GROQ_API_KEY missing"}), 500

        data = request.json
        user_message = data.get("message", "").strip()
        session_id = data.get("session_id", "default")
        language_code = data.get("language_code", "en-IN")

        if not user_message:
            return jsonify({"error": "User message is required"}), 400

        loan_type = None
        loan_analysis = None
        principal = None
        loan_options = []
        recommended = None
        comparison_plan = None
        loan_summary_block = ""

        if "home" in user_message.lower():
            loan_type = "home"
        elif "car" in user_message.lower():
            loan_type = "car"
        elif "personal" in user_message.lower():
            loan_type = "personal"
        # Map language codes to readable names
        language_map = {
            "en-IN": "English",
            "hi-IN": "Hindi",
            "te-IN": "Telugu",
            "ta-IN": "Tamil",
            "kn-IN": "Kannada"
        }

        selected_language = language_map.get(language_code, "English")

        # Create session if new
        if session_id not in conversation_sessions:
            conversation_sessions[session_id] = {
                "messages": []
            }

        session = conversation_sessions[session_id]
        # Always reset system prompt cleanly
        system_prompt = f"""
You are a professional financial assistant specializing in loan advisory and eligibility screening.

{loan_summary_block if loan_type and principal else ""}

Instructions:

1. If user details (Name, Age, Annual Income) are missing, ask for them.
2. If provided, determine eligibility:
   - Age <21 or >65 → Not Eligible
   - Income insufficient → Low Eligibility
   - Otherwise → Eligible

3. If loan options are provided above:
   - Explain the recommended plan ONLY.
   - Do NOT invent new plans.
   - Do NOT contradict the recommendation.
   - Justify why the recommended plan is financially balanced.

4. Keep explanation concise and structured.
5. Respond completely in {selected_language}.

Return ONLY valid JSON:
{{
  "full_text": "Structured response including eligibility and plan explanation.",
  "spoken_text": "Short spoken summary."
}}
"""

        # Replace or insert system message safely
        if len(session["messages"]) == 0 or session["messages"][0]["role"] != "system":
            session["messages"].insert(0, {"role": "system", "content": system_prompt})
        else:
            session["messages"][0]["content"] = system_prompt

        # Add user message
        session["messages"].append({
            "role": "user",
            "content": user_message
        })

        # 🔥 Keep conversation short to prevent token overflow
        if len(session["messages"]) > 8:
            session["messages"] = [session["messages"][0]] + session["messages"][-6:]


        # Call Groq
        response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=session["messages"],
    temperature=0.2,
    max_tokens=1200,
    response_format={"type": "json_object"}
)


        raw_content = response.choices[0].message.content.strip()

        # Try parsing JSON safely
        try:
            parsed = json.loads(raw_content)
            final_full = parsed.get("full_text", raw_content)
            final_spoken = parsed.get("spoken_text", final_full)
        except Exception:
            final_full = raw_content
            final_spoken = raw_content

        # Store assistant response in session
        session["messages"].append({
            "role": "assistant",
            "content": final_full
        })
        loan_analysis = None
        loan_options = []
        principal = extract_amount(user_message)

        if loan_type and principal:
            selected_products = LOAN_PRODUCTS.get(loan_type, [])

            for product in selected_products:
                rate = product["interest"]
                years = product["years"]

                result = calculate_emi(principal, rate, years)

                # --- Advanced Indicators (INSIDE LOOP) ---
                emi_ratio = result["emi"] / (principal / years / 12)
                affordability_score = max(0, min(100, int(100 - (emi_ratio * 8))))
                cash_flow_stability = min(100, int((years / 30) * 100))
                risk_flexibility = max(0, int(100 - rate * 2))

                composite_score = (
                    (affordability_score * 0.4) +
                    (cash_flow_stability * 0.3) +
                    (risk_flexibility * 0.3)
                )

                loan_options.append({
                    "type": product["type"],
                    "interest_rate": rate,
                    "years": years,
                    "emi": result["emi"],
                    "total_interest": result["total_interest"],
                    "total_payment": result["total_payment"],
                    "affordability_score": affordability_score,
                    "cash_flow_stability": cash_flow_stability,
                    "risk_flexibility": risk_flexibility,
                    "composite_score": round(composite_score, 2)
                })

                if loan_options:
                    sorted_plans = sorted(
                        loan_options,
                        key=lambda x: x["composite_score"],
                        reverse=True
                    )

                    recommended = sorted_plans[0]
                    comparison_plan = sorted_plans[1] if len(sorted_plans) > 1 else None

                    loan_analysis = {
                    "loan_products": loan_options,
                    "recommended_plan": recommended,
                    "comparison_plan": comparison_plan,
                    "loan_category": loan_type
                    }

                    loan_summary_block = f"""
Loan Category: {loan_type}

Available Loan Options:
{chr(10).join([f"- {p['type']} | {p['interest_rate']}% | {p['years']} yrs | EMI ₹{p['emi']}" for p in loan_options])}

Recommended Plan (Based on composite financial score):
- {recommended['type']}
- Interest Rate: {recommended['interest_rate']}%
- Tenure: {recommended['years']} years
- Monthly EMI: ₹{recommended['emi']}
- Total Interest: ₹{recommended['total_interest']}
"""

        show_apply_button = False

        user_lower = user_message.lower()
        apply_keywords = [
            "apply",
            "application",
            "fill form",
            "fill application",
            "start application",
            "apply loan",
            "loan application"
        ]

        if any(keyword in user_lower for keyword in apply_keywords):
            show_apply_button = True
        elif loan_analysis and recommended:
            show_apply_button = True
        return jsonify({
            "full_text": final_full,
            "spoken_text": final_spoken,
            "analysis": loan_analysis,
            "session_id": session_id,
            "show_apply_button": show_apply_button
        })

    except Exception as e:
        print("🔥 FULL ERROR:", str(e))
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500


def perform_translation(input_text, source_lang, target_lang, speaker_gender, mode, output_script, numerals_format):
    """Perform translation request to Sarvam AI API (Helper for /translate)"""
    try:
        if not SARVAM_API_KEY:
            return jsonify({
                "error": "SARVAM_API_KEY is not configured on the server. "
                         "Please set it in a .env file or environment variable before using translation."
            }), 500

        payload = {
            "input": input_text,
            "source_language_code": source_lang,
            "target_language_code": target_lang,
            "speaker_gender": speaker_gender,
            "mode": mode,
            "model": "mayura:v1",
            "enable_preprocessing": False,
            "output_script": output_script,
            "numerals_format": numerals_format
        }

        headers = {
            "Content-Type": "application/json",
            "api-subscription-key": SARVAM_API_KEY
        }

        response = requests.post(TRANSLATE_API_URL, json=payload, headers=headers)
        response_data = response.json()
        
        if "translated_text" in response_data:
            return jsonify({
                "translated_text": response_data["translated_text"],
                "request_id": response_data.get("request_id", "unknown"),
                "source_language_code": response_data.get("source_language_code", "unknown")
            })

        if request.path != '/translate':
            return {
                "error": response_data.get("error", {}).get("message", "Translation failed"),
                "request_id": response_data.get("error", {}).get("request_id", "unknown"),
                "details": response_data
            }
            
        return jsonify({
            "error": response_data.get("error", {}).get("message", "Translation failed"),
            "request_id": response_data.get("error", {}).get("request_id", "unknown"),
            "details": response_data
        }), 500

    except requests.exceptions.RequestException as e:
        if request.path != '/translate':
            return {"error": "API request failed", "details": str(e)}
            
        return jsonify({"error": "API request failed", "details": str(e)}), 500


def translate_long_text(input_text, source_lang, target_lang, speaker_gender, mode, output_script, numerals_format):
    """Handle translation of texts longer than 1000 characters by splitting into chunks (Helper for /translate)"""
    sentences = re.split(r'(?<=[.!?])\s+', input_text)
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        if len(current_chunk) + len(sentence) < 950:
            current_chunk += sentence + " "
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + " "
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    translated_chunks = []
    is_api_call = request.path == '/translate'

    for chunk in chunks:
        response = perform_translation(
            chunk, 
            source_lang, 
            target_lang, 
            speaker_gender, 
            mode, 
            output_script, 
            numerals_format
        )
        
        if is_api_call:
            response_data = response.get_json()
            if "translated_text" in response_data:
                translated_chunks.append(response_data["translated_text"])
            else:
                return response
        else:
            if "translated_text" in response:
                translated_chunks.append(response["translated_text"])
            else:
                return response
    
    full_translation = " ".join(translated_chunks)
    
    result_dict = {
        "translated_text": full_translation,
        "chunked_translation": True,
        "chunks_count": len(chunks)
    }
    
    if is_api_call:
        return jsonify(result_dict)
    
    return result_dict


@app.route('/translate', methods=['POST'])
def translate_text():
    """API to translate text using Sarvam AI."""
    try:
        if not SARVAM_API_KEY:
            return jsonify({
                "error": "SARVAM_API_KEY is not configured on the server. "
                         "Please set it in a .env file or environment variable before using translation."
            }), 500

        data = request.json
        input_text = data.get("input")
        source_lang = data.get("source_language_code", "").strip()
        target_lang = data.get("target_language_code", "").strip()
        speaker_gender = data.get("speaker_gender", "Female")
        mode = data.get("mode", "formal")
        output_script = data.get("output_script", "fully-native")
        numerals_format = data.get("numerals_format", "international")

        if not input_text or not input_text.strip():
            return jsonify({"error": "Input text is required"}), 400

        if len(input_text) > 1000:
            return translate_long_text(input_text, source_lang, target_lang, speaker_gender, mode, output_script, numerals_format)
        
        return perform_translation(input_text, source_lang, target_lang, speaker_gender, mode, output_script, numerals_format)

    except Exception as e:
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


# --- REPLACED FUNCTION: Now uses Tesseract (Local, Free) ---
# --- Corrected and Simplified perform_ocr Function ---

def perform_ocr(file_bytes, file_type):
    """Perform OCR using Tesseract, handling PDF to image conversion via Poppler."""
    raw_text = ""
    
    # We only check the file_type (MIME type from request). NO document_file.filename check.
    if 'pdf' in file_type.lower():
        try:
            # NOTE: If Poppler is not in the system PATH, you can specify an explicit poppler_path
            # The path below is a fallback example. Prefer setting the POPPLER_PATH environment variable
            # to point to your Poppler 'bin' folder (e.g. C:\tools\poppler-xx\Library\bin).
            poppler_path_default = r'C:\Users\jainj\Downloads\Release-25.07.0-0\poppler-25.07.0\Library\bin'

            # Allow overriding via environment variables so users don't need to edit source.
            poppler_path_env = os.getenv('POPPLER_PATH') or os.getenv('POPPLER_BIN')
            poppler_path_win = poppler_path_env or poppler_path_default

            # If the configured path exists, pass it explicitly. Otherwise rely on Poppler being available in PATH.
            if os.name == 'nt' and os.path.isdir(poppler_path_win):
                images = convert_from_bytes(file_bytes, poppler_path=poppler_path_win)
            else:
                # Try without explicit path; convert_from_bytes will try to use PATH
                images = convert_from_bytes(file_bytes)
            
            for image in images:
                # Process each page (image) with Tesseract
                raw_text += pytesseract.image_to_string(image, lang='eng', config='--psm 3') + "\n\n"
        
        except Exception as e:
            # Re-raise the error to include details about the Poppler path failure
            raise Exception(f"PDF Handling Error: Poppler/PDF2Image failed. Ensure Poppler is installed and poppler_path is set in perform_ocr. Details: {e}")
            
    else: # Process as a standard image (PNG, JPEG)
        try:
            image = Image.open(BytesIO(file_bytes))
            raw_text = pytesseract.image_to_string(image, lang='eng', config='--psm 6')
        
        except Exception as e:
            raise Exception(f"Image Reading Error: Pillow/Tesseract failed. Details: {e}")

    if not raw_text.strip():
        raise Exception("OCR failed to extract any text from the document.")
        
    return raw_text


# NEW: Document Reader Endpoint
@app.route('/read-document', methods=['POST'])
def read_document():
    """Handle document upload, OCR, LLM simplification, and translation/TTS setup."""
    
    # NOTE: Check for vision_client initialization REMOVED.
    
    if 'document' not in request.files:
        return jsonify({'error': 'No document file uploaded'}), 400

    document_file = request.files['document']
    target_lang = request.form.get('language_code', 'en-IN')

    if document_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if client is None:
        return jsonify({
            "error": "GROQ_API_KEY is not configured on the server. "
                     "Please set it in a .env file or environment variable before using document reader."
        }), 500

    # Read file content into memory
    file_bytes = document_file.read()
    
    try:
        # --- 1. Perform OCR to extract text (using Tesseract) ---
        # document_file.content_type provides the MIME type (e.g., 'application/pdf')
        raw_text = perform_ocr(file_bytes, document_file.content_type) 
        
        if not raw_text.strip():
            return jsonify({'error': 'Could not extract text from the document. Please ensure the image/PDF is clear.'}), 400

        # --- 2. LLM Simplification (Groq) ---
        system_prompt_llm = f"""You are an expert financial explainer for first-time loan applicants, working in 'Explain Like I'm 18 Mode'. Your task is to analyze the following loan document text.
        
        **Your output MUST be formatted using standard Markdown syntax (e.g., ## for headings, * for lists, ** for bolding) to ensure clarity.**
        
        ## 💰 Summary of Key Loan Terms
        1. Summarize the **Key Terms** (Interest Rate, Tenure, EMI, Prepayment Penalty) in a bulleted list, using simple analogies.
        
        ## ⚠️ Risks and Commitments Explained
        2. Provide a **simple explanation** of the main risks and commitments in the document.
        
        3. Convert all financial jargon into plain-language and relatable examples.
        
        4. The final response must be in English for the next translation step.
        
        Document Text:
        ---
        {raw_text[:4000]}
        ---
        """

        chat_completion = client.chat.completions.create(
            messages=[{"role": "system", "content": system_prompt_llm}],
            model="llama-3.3-70b-versatile"
        )

        english_explanation = chat_completion.choices[0].message.content
        
        if not english_explanation.strip():
            raise Exception("LLM failed to generate an explanation.")

        # --- 3. Translate to Target Vernacular Language (Sarvam AI) ---
        vernacular_explanation = english_explanation
        if target_lang != "en-IN":
            translation_result = translate_long_text(
                english_explanation,
                source_lang="en-IN",
                target_lang=target_lang,
                speaker_gender="Female",
                mode="formal",
                output_script="fully-native",
                numerals_format="international"
            )
            
            if "translated_text" in translation_result:
                vernacular_explanation = translation_result["translated_text"]
            else:
                logging.warning(f"Translation failed for document explanation, using English. Details: {translation_result.get('error')}")


        # --- 4. Return the result ---
        return jsonify({
            "raw_text": raw_text,
            "english_explanation": english_explanation,
            "vernacular_explanation": vernacular_explanation
        })

    except Exception as e:
        logging.error(f"Error in document reader: {str(e)}")
        return jsonify({"error": f"Failed to process document: {str(e)}"}), 500


@app.route('/speech-to-text', methods=['POST'])
def speech_to_text():
    """Convert Speech to Text using Sarvam AI"""

    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file uploaded'}), 400

    if not SARVAM_API_KEY:
        return jsonify({
            "error": "SARVAM_API_KEY not configured"
        }), 500

    audio_file = request.files['audio']

    if audio_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Save temporarily
    filename = secure_filename(audio_file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    try:
        audio_file.save(file_path)

        if os.stat(file_path).st_size == 0:
            os.remove(file_path)
            return jsonify({'error': 'Uploaded file is empty'}), 400

        current_lang = request.form.get("language_code", "en-IN")

        print("🔊 STT Language:", current_lang)

        with open(file_path, 'rb') as f:
            files = {
                'file': (filename, f, 'audio/wav')
            }

            data = {
                'model': 'saarika:v2.5',
                'language_code': current_lang
            }

            headers = {
                'api-subscription-key': SARVAM_API_KEY
            }

            response = requests.post(
                'https://api.sarvam.ai/speech-to-text',
                headers=headers,
                data=data,
                files=files
            )

            # 🔥 SHOW REAL ERROR IF 400
            if response.status_code != 200:
                print("❌ Sarvam Error:", response.text)
                return jsonify({
                    "error": "Sarvam STT failed",
                    "details": response.text
                }), 500

            result = response.json()
            print("✅ STT Response:", result)

        transcription = result.get('transcript')

        if not transcription:
            return jsonify({'error': 'No transcript in response'}), 500

        return jsonify({
            "transcription": transcription,
            "language_code": current_lang
        })

    except Exception as e:
        print("❌ Unexpected STT error:", str(e))
        return jsonify({'error': 'Internal server error'}), 500

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)




@app.route('/text-to-speech', methods=['POST'])
def text_to_speech():
    """Convert Text to Speech using Sarvam AI."""
    try:
        if not SARVAM_API_KEY:
            return jsonify({
                "error": "SARVAM_API_KEY is not configured on the server. "
                         "Please set it in a .env file or environment variable before using text-to-speech."
            }), 500

        data = request.json
        text_list = data.get("inputs", [])
        if not text_list or not isinstance(text_list, list) or not text_list[0].strip():
            return jsonify({"error": "Text is required"}), 400

        text = text_list[0]
        
        currLang = data.get("target_language_code")
        # Ensure 'lang' global variable is the source if not specified in the request
        source_lang = data.get("source_language_code", lang)

        # --- UPDATED CONFIGURATION FOR VALID SARVAM SPEAKERS/MODELS ---
        # NOTE: For model 'bulbul:v2' the allowed speakers (per Sarvam docs)
        # are: 'anushka', 'abhilash', 'manisha', 'vidya', 'arya', 'karun', 'hitesh'.
        # To avoid validation errors, we only use this set below.
        LANGUAGE_CONFIG = {
            'en-IN': {"model": "bulbul:v2", "chunk_size": 500, "silence_bytes": 2000, "speaker": "anushka"},
            'hi-IN': {"model": "bulbul:v2", "chunk_size": 300, "silence_bytes": 3000, "speaker": "abhilash"},
            'ta-IN': {"model": "bulbul:v2", "chunk_size": 300, "silence_bytes": 3000, "speaker": "vidya"},
            'te-IN': {"model": "bulbul:v2", "chunk_size": 300, "silence_bytes": 3000, "speaker": "karun"},
            'kn-IN': {"model": "bulbul:v2", "chunk_size": 300, "silence_bytes": 3000, "speaker": "hitesh"},
            'ml-IN': {"model": "bulbul:v2", "chunk_size": 300, "silence_bytes": 3000, "speaker": "arya"},
            'mr-IN': {"model": "bulbul:v2", "chunk_size": 300, "silence_bytes": 3000, "speaker": "manisha"},
            'bn-IN': {"model": "bulbul:v2", "chunk_size": 300, "silence_bytes": 3000, "speaker": "anushka"},
            'gu-IN': {"model": "bulbul:v2", "chunk_size": 300, "silence_bytes": 3000, "speaker": "karun"},
            'pa-IN': {"model": "bulbul:v2", "chunk_size": 300, "silence_bytes": 3000, "speaker": "hitesh"}
        }

        config = LANGUAGE_CONFIG.get(currLang, LANGUAGE_CONFIG['en-IN'])
        model = config["model"]
        chunk_size = config["chunk_size"]
        silence_bytes = config["silence_bytes"]
        speaker = config["speaker"]

        # 1. Translate text if source and target languages differ
        if source_lang != currLang:
            translate_payload = {
                "input": text,
                "source_language_code": source_lang,
                "target_language_code": currLang,
                "speaker_gender": "Female",
                "mode": "formal",
                "model": "bulbul:v1"
            }
            translate_headers = {
                "Content-Type": "application/json",
                "api-subscription-key": SARVAM_API_KEY
            }
            try:
                translate_response = requests.post(TRANSLATE_API_URL, json=translate_payload, headers=translate_headers)
                if translate_response.status_code == 200:
                    translate_result = translate_response.json()
                    text = translate_result.get("translated_text", text)
                else:
                    logging.warning(f"Translation failed for TTS with status {translate_response.status_code}")
            except Exception as e:
                logging.error(f"Translation error in TTS: {str(e)}")
                # Continue with original text if translation fails

        # 2. Process text in chunks for TTS
        audio_data_combined = BytesIO()
        silence_chunk = b"\x00" * silence_bytes
        text_chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]

        for chunk in text_chunks:
            if not chunk.strip():
                continue

            request_body = {
                "inputs": [chunk],
                "target_language_code": currLang,
                "speaker": speaker,
                "pitch": 0,
                "pace": 1.0,
                "loudness": 1.0,
                "speech_sample_rate": 22050,
                "enable_preprocessing": True,
                "model": model
            }
            if currLang == "en-IN":
                request_body["eng_interpolation_wt"] = 123

            headers = {
                "api-subscription-key": SARVAM_API_KEY,
                "Content-Type": "application/json"
            }

            response = requests.post("https://api.sarvam.ai/text-to-speech", headers=headers, json=request_body)
            if response.status_code != 200:
                logging.error(f"TTS API error for chunk: {response.text}")
                continue

            result = response.json()
            if "audios" in result and result["audios"]:
                audio_data_combined.write(base64.b64decode(result["audios"][0]))
                audio_data_combined.write(silence_chunk)

        if audio_data_combined.getbuffer().nbytes <= silence_bytes:
            return jsonify({"error": "Failed to generate audio"}), 500

        audio_data_combined.seek(0)
        return send_file(audio_data_combined, mimetype="audio/mpeg")

    except requests.exceptions.RequestException as e:
        logging.error(f"TTS API request failed: {str(e)}")
        return jsonify({"error": "API request failed", "details": str(e)}), 500

    except Exception as e:
        logging.error(f"Unexpected error in TTS: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)