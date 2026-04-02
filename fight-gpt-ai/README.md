# Fight GPT AI Coach 🥋

An AI-powered fight analysis system that uses computer vision to detect and analyze fighting game moves from YouTube videos.

## Features

- **Video Analysis**: Downloads and processes YouTube fighting game videos
- **Pose Detection**: Uses MediaPipe to track player body positions and movements
- **Move Recognition**: Detects special moves like Hadoken (fireball motion)
- **State Tracking**: Identifies player states (Standing, Crouching, Jumping)
- **Semantic Analysis**: Optional Grok and/or Gemini integration for strategic insights and character recognition
- **REST API**: FastAPI-based API for video analysis requests
- **Database Caching**: MongoDB integration for caching analysis results

## Tech Stack

- **Python 3.10**
- **OpenCV**: Video processing and frame extraction
- **MediaPipe**: Pose estimation and landmark detection
- **yt-dlp**: YouTube video downloading
- **FastAPI**: API framework
- **MongoDB**: Database for caching results
- **Docker**: Containerized deployment

## Project Structure

```
fight-gpt-ai/
├── api.py              # FastAPI application with video analysis pipeline
├── coach.py            # Standalone coaching analysis script
├── main.py             # Main analysis script (same as coach.py)
├── scraper.py          # Frame data scraper for Street Fighter characters
├── requirements.txt    # Python dependencies
├── Dockerfile         # Docker image configuration
├── docker-compose.yml # Docker Compose orchestration
└── videos/            # Downloaded videos directory
```

## Quick Start with Docker (Recommended)

### Prerequisites
- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (comes with Docker Desktop)

### Running the Application

1. **Build and start the container:**
   ```bash
   docker-compose up --build
   ```

2. **The API will be available at:** `http://localhost:8000`

3. **Test the API:**
   ```bash
   # Check if API is running
   curl http://localhost:8000/

   # Analyze a YouTube video
   curl -X POST http://localhost:8000/analyze \
     -H "Content-Type: application/json" \
     -d '{"youtube_url": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"}'
   ```

### Stopping the Application
```bash
docker-compose down
```

## Local Development (Without Docker)

### Prerequisites
- Python 3.10
- Virtual environment

### Setup

1. **Create and activate virtual environment:**
   ```bash
   python3.10 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the API:**
   ```bash
   uvicorn api:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Or run standalone analysis:**
   ```bash
   # Run coach analysis on existing JSON data
   python coach.py
   
   # Or use main.py
   python main.py
   ```

### Frame Data Scraper

Populate MongoDB with character frame data before running advanced analysis pipelines:

```bash
# Inside Docker (recommended)
docker-compose run --rm fight-gpt-api python scraper.py --all

# Or locally once dependencies are installed
python scraper.py --game sf6 --all
```

Environment variables:

- `MONGO_URI` – connection string (defaults to the same value used by the API service)
- `MONGO_DB_NAME` – database name (default: `fight_gpt_db`)
- `MONGO_FRAME_COLLECTION` – collection for storing frame data (default: `frame_data`)
- `FRAME_DATA_BASE_URL` – override the source wiki template URL (default points to SuperCombo SF6 pages)

## API Endpoints

### `GET /`
Health check endpoint.

**Response:**
```json
{
  "message": "Fight GPT AI Coach API is running!"
}
```

### `POST /analyze`
Analyze a YouTube fighting game video.

**Request Body:**
```json
{
  "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**
```json
{
  "status": "success",
  "analysis": [
    "Frame 0: Player state is STANDING",
    "Frame 30: Player state is CROUCHING",
    "Frame 60: Player state is JUMPING",
    "Frame 90: Player state is STANDING   <<<<< 🔥 HADOKEN DETECTED! >>>>>"
  ],
  "grok_analysis": {
    "grok_analysis": "Strategic insights...",
    "model": "grok-beta"
  },
  "gemini_analysis": {
    "gemini_analysis": "Detailed analysis from Gemini...",
    "model": "gemini-1.5-pro"
  }
}
```

**Note:** The `grok_analysis` and `gemini_analysis` fields are only included when their respective API keys are configured and analysis succeeds.

## How It Works

1. **Video Download**: Downloads the YouTube video using yt-dlp
2. **Frame Processing**: Extracts frames and processes them with OpenCV
3. **Pose Detection**: Uses MediaPipe to detect 33 body landmarks per frame
4. **State Analysis**: Analyzes landmarks to determine player states:
   - **Crouching**: Hip-to-ankle distance < 0.15
   - **Jumping**: Ankle Y-position < 0.8
   - **Standing**: Default state
5. **Move Detection**: Detects special moves by analyzing landmark sequences:
   - **Hadoken**: Wrists starting near hips, then extending forward
6. **Semantic Analysis** (Optional): If Grok and/or Gemini API keys are configured:
   - Extracts 5 key frames from the video
   - Sends frames and MediaPipe results to enabled LLM services for semantic understanding
   - Provides strategic insights, character recognition, and coaching recommendations
   - Both services can run simultaneously for comparison
7. **Caching**: Stores results in MongoDB to avoid reprocessing (including semantic analysis results)

## Configuration

### MongoDB Connection
Update the MongoDB URI in `api.py`:
```python
MONGO_URI = "your_mongodb_connection_string"
```

### Video Output Directory
Videos are saved to the `videos/` directory by default. Change in `api.py`:
```python
output_path = 'your_custom_path'
```

### Semantic Analysis (Optional - Grok and/or Gemini)
The system supports optional semantic video analysis using Grok (xAI's multimodal LLM) and/or Google's Gemini API for higher-level strategic insights, character recognition, and natural language coaching recommendations. You can enable one or both services.

#### Grok Semantic Analysis

**To enable Grok analysis:**

1. **Get a Grok API key** from [xAI](https://x.ai/) (requires xAI API access)

2. **Set the environment variable:**
   ```bash
   export GROK_API_KEY="your-grok-api-key-here"
   ```

3. **For Docker deployments**, add to `docker-compose.yml`:
   ```yaml
   environment:
     - GROK_API_KEY=your-grok-api-key-here
   ```

4. **Optional: Customize Grok API URL** (if using a different endpoint):
   ```bash
   export GROK_API_URL="https://api.x.ai/v1/chat/completions"
   ```

#### Gemini Semantic Analysis

**To enable Gemini analysis:**

1. **Get a Gemini API key** from [Google AI Studio](https://makersuite.google.com/app/apikey) (free tier available)

2. **Set the environment variable:**
   ```bash
   export GEMINI_API_KEY="your-gemini-api-key-here"
   ```

3. **For Docker deployments**, add to `docker-compose.yml`:
   ```yaml
   environment:
     - GEMINI_API_KEY=your-gemini-api-key-here
   ```

**Note:** Both integrations are completely optional. If neither API key is set, the system will work normally with MediaPipe analysis only. The system gracefully handles API failures and continues with MediaPipe analysis. You can enable both Grok and Gemini simultaneously to compare insights from both services.

**Response format with semantic analysis enabled:**
```json
{
  "status": "success",
  "analysis": [
    "Frame 0: Player state is STANDING",
    "Frame 30: Player state is CROUCHING"
  ],
  "grok_analysis": {
    "grok_analysis": "Strategic insights about the gameplay...",
    "model": "grok-beta"
  },
  "gemini_analysis": {
    "gemini_analysis": "Detailed analysis from Gemini...",
    "model": "gemini-1.5-pro"
  }
}
```

**Note:** The `grok_analysis` and `gemini_analysis` fields are only included when their respective API keys are configured and analysis succeeds.

## Troubleshooting

### Docker Issues
- **Port already in use**: Change the port mapping in `docker-compose.yml`
- **Build fails**: Try `docker-compose build --no-cache`

### OpenCV Issues on macOS
If you encounter C++ compilation errors when installing locally:
```bash
# Temporarily remove conflicting system libraries
brew uninstall --ignore-dependencies protobuf abseil

# Install Python packages
pip install -r requirements.txt

# Reinstall system libraries
brew install protobuf abseil
```

### MediaPipe Issues
MediaPipe requires certain system dependencies. Using Docker avoids these issues.

## Development

### Adding New Move Detection
Add new detection functions in `coach.py` or `api.py`:
```python
def detect_shoryuken(frame_sequence):
    # Implement uppercut detection logic
    pass
```

### Testing Locally
Use the provided test video:
```bash
python coach.py  # Analyzes X-C435HjNhg.mp4_analysis.json
```

## Future Enhancements

- [ ] Add more fighting moves detection (Shoryuken, Tatsumaki, etc.)
- [ ] Multi-player tracking
- [ ] Real-time video analysis
- [ ] Web UI for video upload and analysis
- [ ] Frame data integration for move validation
- [ ] Training mode with feedback
- [ ] Combo detection and scoring

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- MediaPipe for pose detection
- OpenCV for video processing
- FastAPI for the API framework



