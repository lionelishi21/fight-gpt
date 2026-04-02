import sys
import os
import subprocess
import tempfile
import json
from pathlib import Path

def download_youtube_video(url, output_dir):
    try:
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        print(f"Downloading {url} to {output_dir}...")
        
        # Use yt-dlp to download the best mp4 format
        # -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"
        # -o output template
        output_template = os.path.join(output_dir, "%(id)s.%(ext)s")
        
        # Try multiple browsers for cookies to bypass bot protection
        browsers_to_try = [None, "safari", "chrome", "firefox", "edge"]
        success = False
        final_info = None
        result = None
        
        for browser in browsers_to_try:
            cmd = [
                "yt-dlp",
                "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
                "-o", output_template,
                "--merge-output-format", "mp4",
                "--print", "json",
                "--no-warnings",
            ]
            
            if browser:
                print(f"Trying to bypass bot protection using {browser} cookies...")
                cmd.extend(["--cookies-from-browser", browser])
            
            cmd.append(url)
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                success = True
                break
                
        if not success:
            print(f"Error downloading video: {result.stderr}", file=sys.stderr)
            sys.exit(1)
            
        # Parse the JSON output to get the final filename
        # yt-dlp outputs multiple JSON objects sometimes, we want the last one
        lines = result.stdout.strip().split('\n')
        final_info = None
        for line in reversed(lines):
            try:
                final_info = json.loads(line)
                break
            except json.JSONDecodeError:
                continue
                
        if not final_info:
             # Fallback if JSON parsing fails, just try to find the video ID
             video_id = url.split("v=")[-1].split("&")[0]
             expected_path = os.path.join(output_dir, f"{video_id}.mp4")
             if os.path.exists(expected_path):
                 print(expected_path)
                 sys.exit(0)
             else:
                 print("Could not determine downloaded file path", file=sys.stderr)
                 sys.exit(1)
                 
        # output the downloaded filepath
        downloaded_filepath = final_info.get('_filename')
        # yt-dlp's _filename might not have the correct extension if it merged
        if not downloaded_filepath.endswith('.mp4'):
             downloaded_filepath = os.path.splitext(downloaded_filepath)[0] + '.mp4'
             
        print(downloaded_filepath)
        
    except Exception as e:
        print(f"An error occurred: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python download_yt.py <url> <output_dir>", file=sys.stderr)
        sys.exit(1)
        
    url = sys.argv[1]
    output_dir = sys.argv[2]
    
    download_youtube_video(url, output_dir)
