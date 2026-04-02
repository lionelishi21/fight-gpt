## Why

The system currently supports optional semantic video analysis via Grok, but users may prefer Google's Gemini API for video analysis due to its strong multimodal capabilities, competitive pricing, or existing Google Cloud infrastructure. Adding Gemini as an alternative semantic analysis provider gives users flexibility to choose their preferred LLM service or use both for comparison.

## What Changes

- Add optional Gemini API integration for semantic video analysis
- Support both Grok and Gemini simultaneously (users can enable one or both)
- Extract key frames from videos for Gemini processing (reuse existing function)
- Add environment variable configuration for Gemini API key
- Include Gemini analysis results in API response when available
- Gracefully degrade when Gemini API key is not configured (non-breaking)
- Allow users to choose their preferred semantic analysis provider

## Impact

- Affected specs: `ai-service`
- Affected code: `api.py` (added Gemini integration functions and enhanced `/analyze` endpoint)
- Breaking changes: None (Gemini is optional and gracefully degrades)
- Dependencies: Add `google-generativeai` Python package for Gemini API


