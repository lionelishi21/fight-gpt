## Context

The current implementation uses MediaPipe for pose tracking and OpenCV for frame processing, requiring significant local compute and providing limited semantic understanding. Gemini's native video understanding offers superior capabilities for fighting game analysis by understanding context, character interactions, and strategic patterns.

## Goals / Non-Goals

### Goals
- Leverage Gemini's multimodal video understanding for superior coaching insights
- Simplify architecture by removing heavy local dependencies (MediaPipe, OpenCV)
- Provide structured JSON responses with actionable coaching recommendations
- Maintain backward compatibility for video download (yt-dlp) and caching (MongoDB)

### Non-Goals
- Frame-by-frame pose tracking (replaced by Gemini's understanding)
- Local computer vision processing
- Real-time analysis (async processing acceptable)
- Support for other LLM providers in this pipeline (Grok kept separate)

## Decisions

### Decision: Use Gemini File API for Video Upload
- **What**: Upload entire video files to Gemini File API instead of extracting key frames
- **Why**: Gemini 1.5/2.0 can process full videos natively, providing better context understanding
- **Alternatives considered**:
  - Key frame extraction (rejected - loses temporal context)
  - Streaming video (rejected - File API is simpler and more reliable)

### Decision: Use Strict JSON Mode
- **What**: Configure `response_mime_type="application/json"` in generation config
- **Why**: Ensures reliable parsing and schema compliance
- **Alternatives considered**:
  - Natural language with parsing (rejected - unreliable)
  - Schema-based generation (accepted - using generation config)

### Decision: Model Selection (gemini-1.5-flash or gemini-2.0-flash)
- **What**: Use Flash models for faster, cost-effective video analysis
- **Why**: Flash models provide good quality at lower cost and latency
- **Alternatives considered**:
  - Pro models (rejected - slower and more expensive for video)
  - 1.5 vs 2.0 (configurable via environment variable)

### Decision: Maintain yt-dlp for Downloads
- **What**: Keep yt-dlp for YouTube video downloads
- **Why**: Still needed for YouTube URLs, Gemini doesn't handle downloads
- **Migration**: None needed

## Risks / Trade-offs

### Risks
- **API Quotas**: Gemini File API may have rate limits
  - **Mitigation**: Implement retry logic and quota monitoring
- **File Size Limits**: Large videos may exceed upload limits
  - **Mitigation**: Validate file size before upload, document limits
- **Processing Time**: File upload and processing may take longer than frame extraction
  - **Mitigation**: Async processing, status endpoints for long-running jobs
- **Cost**: API calls cost money per video
  - **Mitigation**: Caching prevents redundant analysis

### Trade-offs
- **Lost**: Fine-grained frame-by-frame pose data
- **Gained**: Semantic understanding of gameplay, strategies, and coaching insights
- **Lost**: Real-time processing capabilities
- **Gained**: Better coaching quality and reduced infrastructure complexity

## Migration Plan

### Steps
1. Implement new Gemini-native pipeline alongside existing code
2. Add feature flag to switch between old and new pipelines
3. Test with sample videos
4. Update API consumers to handle new schema
5. Remove old MediaPipe/OpenCV code after validation
6. Update documentation

### Rollback
- Keep old code in git history
- Feature flag allows quick rollback if issues arise
- Old pipeline can be restored by reverting commits

## Open Questions
- Should we keep Grok integration for comparison/backup?
- What is the maximum video file size Gemini File API accepts?
- Should we implement async job queue for long-running analyses?
- Do we need to handle video format conversion (e.g., to MP4) before upload?

