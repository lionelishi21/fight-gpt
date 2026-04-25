import os
import json
import time
from typing import Optional, Dict, Any
from dotenv import load_dotenv
load_dotenv()

# --- FastAPI Imports ---
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# --- Database Import ---
from pymongo import MongoClient

# --- Video Download Import ---
import yt_dlp

# --- Google Generative AI Import ---
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    print("⚠️  google-generativeai not installed. Gemini support disabled.")

# --------------------------------------------------------------------------
# 1. INITIALIZE MODELS, CONSTANTS, AND DATABASE
# --------------------------------------------------------------------------
# IMPORTANT: Replace this with your actual MongoDB connection string
MONGO_URI = "mongodb+srv://lionelishmael_db_user:uRBhj6kDHWm2c21j@cluster0.rjgiyva.mongodb.net/fightgpt_database?retryWrites=true&w=majority&appName=Cluster0"

# Configure MongoDB client with TLS settings for Docker compatibility
# Make MongoDB optional to handle connection issues gracefully
import certifi
try:
    client = MongoClient(
        MONGO_URI,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000  # Fail fast if can't connect
    )
    # Test the connection
    client.admin.command('ping')
    db = client['fight_gpt_db']
    analysis_cache = db['analysis_cache']
    print("✅ MongoDB connected successfully!")
except Exception as e:
    print(f"⚠️  MongoDB connection failed: {e}")
    print("📝 Running without database caching - all analyses will be fresh")
    client = None
    db = None
    analysis_cache = None

# Gemini API Configuration (Required for video analysis)
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY') or os.getenv('GEMINI_API_KEY')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')

if not GOOGLE_API_KEY:
    print("⚠️  GOOGLE_API_KEY or GEMINI_API_KEY not set. Video analysis will fail.")
    USE_GEMINI = False
else:
    USE_GEMINI = GENAI_AVAILABLE
    if USE_GEMINI:
        try:
            genai.configure(api_key=GOOGLE_API_KEY)
            print(f"✅ Gemini API configured successfully (model: {GEMINI_MODEL})")
        except Exception as e:
            print(f"⚠️  Gemini configuration error: {e}. Video analysis disabled.")
            USE_GEMINI = False

# Load Pro Coach prompt
PRO_COACH_PROMPT = ""
try:
    with open('coach_system_prompt.txt', 'r') as f:
        PRO_COACH_PROMPT = f.read()
except FileNotFoundError:
    print("⚠️  coach_system_prompt.txt not found. Using default prompt.")
    PRO_COACH_PROMPT = """You are "Sensei GPT," an elite Fighting Game Coach with 20 years of experience in the FGC. Your goal is to compress the learning curve for players by providing professional, actionable, and encouraging feedback.

Watch the provided gameplay video carefully. Identify the key "Tipping Points" where the game was won or lost.

Analyze for:
- Neutral Game: Was the player too aggressive or too passive?
- Missed Punishes: Specific moments where opponent used "negative on block" moves and player failed to counter-attack
- Bad Habits: Mashing on wake-up, jumping too much
- The "Pro Move": Highlight one excellent moment

Return ONLY valid JSON matching this schema:
{
  "game_title": "string",
  "p1_character": "string",
  "p2_character": "string",
  "match_winner": "p1 | p2",
  "timeline": [
    {
      "timestamp": "MM:SS",
      "event_type": "punish_missed | bad_habit | pro_move | neutral_loss",
      "description": "Short explanation",
      "coach_advice": "Specific tip to fix it"
    }
  ],
  "top_3_tips": ["string", "string", "string"],
  "daily_mission": {
    "title": "string",
    "drill_steps": ["step 1", "step 2"],
    "goal": "string"
  }
}"""

# --------------------------------------------------------------------------
# 2. HELPER FUNCTIONS
# --------------------------------------------------------------------------

def download_video(youtube_url: str, output_path: str = 'videos') -> str:
    """Download video from YouTube with multiple fallback strategies to bypass bot detection."""
    if not os.path.exists(output_path):
        os.makedirs(output_path)
    
    # Check for cookies file (ultimate workaround for bot detection)
    cookies_file = os.getenv('YOUTUBE_COOKIES_FILE', None)
    
    # Strategy 1: Try with browser-like headers and user agent
    strategies = [
        {
            'format': 'best[ext=mp4]/best',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'referer': 'https://www.youtube.com/',
            'extractor_args': {
                'youtube': {
                    'player_client': ['android'],
                    'player_skip': ['webpage'],
                }
            },
        },
        {
            'format': 'best[ext=mp4]/best',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'referer': 'https://www.youtube.com/embed/',
            'extractor_args': {
                'youtube': {
                    'player_client': ['ios', 'android'],
                }
            },
        },
        {
            'format': 'best[ext=mp4]/best',
            'user_agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
            'referer': 'https://www.youtube.com/',
            'extractor_args': {
                'youtube': {
                    'player_client': ['ios', 'web'],
                }
            },
        },
        {
            'format': 'worst[ext=mp4]/best',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'referer': 'https://www.youtube.com/',
        },
        {
            'format': 'best',
            'user_agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        }
    ]
    
    last_error = None
    for i, strategy in enumerate(strategies, 1):
        try:
            print(f"🔄 Attempt {i}/{len(strategies)}: Trying download strategy...")
            ydl_opts = {
                'format': strategy['format'],
                'outtmpl': os.path.join(output_path, '%(id)s.%(ext)s'),
                'quiet': False,
                'no_warnings': False,
                'http_headers': {
                    'User-Agent': strategy.get('user_agent', 'Mozilla/5.0'),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-us,en;q=0.5',
                },
                'age_limit': None,
                'retries': 10,
                'fragment_retries': 10,
                'extractor_args': strategy.get('extractor_args', {}),
            }
            
            # Add cookies if available
            if cookies_file and os.path.exists(cookies_file):
                ydl_opts['cookiefile'] = cookies_file
                print(f"   🍪 Using cookies for authentication...")
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info_dict = ydl.extract_info(youtube_url, download=True)
                video_path = ydl.prepare_filename(info_dict)
                print(f"✅ Successfully downloaded: {video_path}")
                return video_path
        except Exception as e:
            last_error = e
            print(f"⚠️  Strategy {i} failed: {str(e)[:200]}")
            continue
    
    raise Exception(f"All download strategies failed. Last error: {last_error}")

def upload_video_to_gemini(video_path: str, timeout: int = 300) -> Any:
    """
    Upload video file to Gemini File API and wait for ACTIVE state.
    Returns the file object when ready.
    """
    if not USE_GEMINI:
        raise Exception("Gemini API not configured. Set GOOGLE_API_KEY or GEMINI_API_KEY.")
    
    print(f"📤 Uploading video to Gemini File API: {video_path}")
    
    # Upload file
    uploaded_file = genai.upload_file(path=video_path)
    print(f"   File uploaded: {uploaded_file.name}, state: {uploaded_file.state}")
    
    # Poll until ACTIVE
    start_time = time.time()
    while uploaded_file.state == 'PROCESSING':
        if time.time() - start_time > timeout:
            raise Exception(f"File upload timeout after {timeout} seconds")
        
        print(f"   Waiting for file to process... (current state: {uploaded_file.state})")
        time.sleep(2)
        uploaded_file = genai.get_file(uploaded_file.name)
    
    if uploaded_file.state == 'FAILED':
        raise Exception(f"File upload failed: {uploaded_file.name}")
    
    if uploaded_file.state != 'ACTIVE':
        raise Exception(f"Unexpected file state: {uploaded_file.state}")
    
    print(f"✅ File is ACTIVE and ready: {uploaded_file.name}")
    return uploaded_file

def analyze_video_with_gemini(video_file: Any, game_context_text: Optional[str] = None) -> Dict[str, Any]:
    """
    Analyze video using Gemini's native video understanding with Pro Coach prompt.
    Optionally includes game context for better analysis.
    Returns parsed JSON response.
    """
    if not USE_GEMINI:
        raise Exception("Gemini API not configured.")
    
    print(f"🤖 Analyzing video with Gemini ({GEMINI_MODEL})...")
    
    # Build prompt with optional game context
    full_prompt = PRO_COACH_PROMPT
    if game_context_text:
        full_prompt = f"{PRO_COACH_PROMPT}\n\n{game_context_text}\n\nIMPORTANT: Use the game context above to understand the specific mechanics of this game. When analyzing, consider:\n- Game-specific movement capabilities (2D vs 3D, air dash, sidestep, etc.)\n- Character-specific states and meters from the rules provided\n- Team-based mechanics if applicable (assists, DHC, team supers)\n- How these mechanics influence the gameplay decisions you observe"
        print("📋 Game context included in prompt")
    
    # Initialize model
    model = genai.GenerativeModel(
        model_name=GEMINI_MODEL,
        generation_config={
            'response_mime_type': 'application/json',
        }
    )
    
    # Generate content with video and prompt
    response = model.generate_content(
        [full_prompt, video_file],
        request_options={'timeout': 600}  # 10 minute timeout for video analysis
    )
    
    # Parse JSON response
    try:
        result = json.loads(response.text)
        print("✅ Gemini analysis completed successfully")
        return result
    except json.JSONDecodeError as e:
        print(f"⚠️  Failed to parse JSON response: {e}")
        print(f"   Response text: {response.text[:500]}")
        raise Exception(f"Invalid JSON response from Gemini: {e}")

def cleanup_gemini_file(file: Any) -> None:
    """Delete uploaded file from Gemini File API."""
    try:
        genai.delete_file(file.name)
        print(f"🗑️  Deleted file from Gemini: {file.name}")
    except Exception as e:
        print(f"⚠️  Failed to delete Gemini file {file.name}: {e}")

# --------------------------------------------------------------------------
# 3. FASTAPI APPLICATION
# --------------------------------------------------------------------------

app = FastAPI()

class AnalysisRequest(BaseModel):
    youtube_url: Optional[str] = None
    video_path: Optional[str] = None  # Local video file path
    game_id: Optional[str] = None  # Game identifier (e.g., "sf6", "tekken8")
    p1_character_id: Optional[str] = None  # Player 1 character ID
    p2_character_id: Optional[str] = None  # Player 2 character ID
    game_metadata: Optional[Dict[str, Any]] = None  # Game metadata (global mechanics and constants)
    character_game_rules: Optional[Dict[str, Any]] = None  # Character-specific game rules
    game_context_text: Optional[str] = None  # Formatted human-readable game context for AI prompts (legacy)
    ai_context: Optional[str] = None  # Enhanced "Cheat Sheet" format with movesets (new Sensei Logic format)

@app.get("/")
def read_root():
    return {"message": "Fight GPT AI Coach API is running!"}

@app.post("/analyze")
async def analyze_video(request: AnalysisRequest):
    """
    Analyze a fighting game video using Gemini's native video understanding.
    Accepts either YouTube URL or local video file path.
    """
    if not USE_GEMINI:
        raise HTTPException(
            status_code=500,
            detail="Gemini API not configured. Set GOOGLE_API_KEY or GEMINI_API_KEY environment variable."
        )
    
    try:
        # Validate input
        if not request.youtube_url and not request.video_path:
            raise HTTPException(
                status_code=400,
                detail="Either 'youtube_url' or 'video_path' must be provided"
            )
        
        # Determine video source and get video path
        video_path = None
        video_source = None
        cache_key = None
        uploaded_file = None
        
        if request.video_path:
            # Local video file provided
            video_source = "local_file"
            if os.path.isabs(request.video_path):
                video_path = request.video_path
            else:
                # Relative path - check uploads folder first
                uploads_path = os.path.join('uploads', request.video_path)
                if os.path.exists(uploads_path):
                    video_path = uploads_path
                elif os.path.exists(request.video_path):
                    video_path = request.video_path
                else:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Video file not found: {request.video_path}"
                    )
            
            if not os.path.exists(video_path):
                raise HTTPException(
                    status_code=404,
                    detail=f"Video file not found: {video_path}"
                )
            
            cache_key = os.path.basename(video_path)
            print(f"📁 Using local video file: {video_path}")
            
            # Check cache for local videos
            if analysis_cache is not None:
                cached_result = analysis_cache.find_one({
                    'video_path': cache_key,
                    'video_source': 'local_file'
                })
                if cached_result:
                    print("✅ Returning result from cache")
                    return {
                        "status": "success",
                        "source": "cache",
                        "video_source": "local_file",
                        **cached_result['analysis']
                    }
        
        elif request.youtube_url:
            # YouTube URL provided
            video_source = "youtube"
            cache_key = request.youtube_url
            
            # Check cache for YouTube videos
            if analysis_cache is not None:
                cached_result = analysis_cache.find_one({'youtube_url': request.youtube_url})
                if cached_result:
                    print("✅ Returning result from cache")
                    return {
                        "status": "success",
                        "source": "cache",
                        "video_source": "youtube",
                        **cached_result['analysis']
                    }
            
            # Download video from YouTube
            print(f"⬇️  Downloading video from: {request.youtube_url}")
            video_path = download_video(request.youtube_url)
        
        # Upload video to Gemini File API
        uploaded_file = upload_video_to_gemini(video_path)
        
        # Extract game context text if provided (prefer ai_context over game_context_text)
        game_context_text = request.game_context_text
        ai_context = request.ai_context
        
        # Analyze with Gemini (prefer ai_context over game_context_text)
        analysis_result = analyze_video_with_gemini(
            uploaded_file,
            game_context_text=game_context_text,
            ai_context=ai_context
        )
        
        # Clean up uploaded file
        cleanup_gemini_file(uploaded_file)
        
        # Save to cache
        cache_data = {
            'analysis': analysis_result,
            'video_source': video_source
        }
        if video_source == "youtube":
            cache_data['youtube_url'] = request.youtube_url
        else:
            cache_data['video_path'] = cache_key
        
        if analysis_cache is not None:
            print("💾 Saving result to cache")
            analysis_cache.insert_one(cache_data)
        
        # Clean up local video file (only if downloaded)
        if video_source == "youtube" and os.path.exists(video_path):
            os.remove(video_path)
            print(f"🗑️  Removed downloaded video: {video_path}")
        
        # Return response
        return {
            "status": "success",
            "source": "new_analysis",
            "video_source": video_source,
            **analysis_result
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Clean up uploaded file on error
        if uploaded_file:
            try:
                cleanup_gemini_file(uploaded_file)
            except:
                pass
        
        # Clean up downloaded video on error
        if video_source == "youtube" and video_path and os.path.exists(video_path):
            try:
                os.remove(video_path)
            except:
                pass
        
        error_detail = str(e)
        print(f"❌ Analysis failed: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)
