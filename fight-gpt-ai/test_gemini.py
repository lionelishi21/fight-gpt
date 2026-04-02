#!/usr/bin/env python3
"""
Quick test script to verify Gemini API integration is working.
This tests the Gemini connection without processing a full video.
"""

import os
import sys

def test_gemini_connection():
    """Test if Gemini API key is configured and working."""
    
    # Check if API key is set
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY environment variable not set")
        print("   Set it with: export GEMINI_API_KEY='your-key-here'")
        return False
    
    print(f"✅ GEMINI_API_KEY found: {api_key[:10]}...")
    
    # Try to import and configure
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        print("✅ google-generativeai package imported successfully")
    except ImportError:
        print("❌ google-generativeai package not installed")
        print("   Install with: pip install google-generativeai")
        return False
    except Exception as e:
        print(f"❌ Error configuring Gemini: {e}")
        return False
    
    # Test a simple API call
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        print("✅ Gemini model initialized")
        
        # Simple test prompt
        response = model.generate_content("Say 'Hello from Gemini!' if you can read this.")
        print(f"✅ Gemini API test successful!")
        print(f"   Response: {response.text[:100]}...")
        return True
    except Exception as e:
        print(f"❌ Gemini API call failed: {e}")
        print("   Check your API key is valid at: https://makersuite.google.com/app/apikey")
        return False

if __name__ == "__main__":
    print("🧪 Testing Gemini API Integration...\n")
    success = test_gemini_connection()
    sys.exit(0 if success else 1)

