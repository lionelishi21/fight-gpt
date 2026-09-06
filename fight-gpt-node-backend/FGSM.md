# FGSM (Fighting Game Scene Model) Architecture

## Overview
The goal of FGSM is to create a robust, hallucination-free AI engine for fighting game analysis (e.g., Street Fighter 6). Generalized LLMs like Gemini often misinterpret specific game states, moves, and frame data when analyzing raw video. FGSM solves this by introducing a specialized architecture tailored for fighting games.

## The Problem with Current LLM Video Analysis
When a multimodal LLM watches a fighting game video, it tries to understand the match based on general video training. It lacks the granular, frame-by-frame knowledge of specific hitboxes, hurtboxes, and move properties, leading to incorrect analysis and hallucinations (e.g., confusing a poke for a special move).

## Proposed Architecture: The Extraction Pipeline
Instead of training a massive foundation model from scratch to process pixels directly, FGSM uses a decoupled architecture. We separate the "seeing" from the "thinking."

### 1. Vision Extraction Layer (The "Eyes")
We use specialized Computer Vision (CV) models to extract raw gameplay video into structured data frame-by-frame.
- **Vision Transformer (ViT) & ConvNeXt:** Used for **Move Classification**. Identifies character poses (e.g., "Ryu Crouching Medium Kick", "Recovery Frames").
- **DETR / OETR (Object Detection):** Tracks spatial elements such as hitboxes, hurtboxes, projectiles (fireballs), spacing between characters, and UI elements (Lifebar, Drive Gauge, Super Meter).
- **Output:** A structured time-series log (JSON) detailing exactly what is happening on screen mathematically.

### 2. Logic & Frame Data Engine (The "Math")
The structured CV output is cross-referenced with a hardcoded database of frame data.
- **Function:** Calculates frame advantage and state interactions.
- **Output:** "Player 1's Crouching Heavy Kick was blocked. Player 1 is -12 on block."

### 3. LLM Analysis Layer (The "Coach")
The math-perfect log is fed into an LLM (like GPT-4 or Gemini) configured for analysis and coaching (e.g., for **Metapunish**).
- **Process:** The LLM applies next-move prediction logic, similar to how it predicts next tokens in NLP. Given the context (Player is -12 on block, opponent has full meter), what is the optimal punish?
- **Result:** Highly accurate, hallucination-free coaching feedback.

## Why this Architecture?
By structuring FGSM as an extraction pipeline rather than a raw pixel-to-text foundation model, we ensure 100% accuracy on game state data while leveraging the reasoning capabilities of existing LLMs for the final coaching output.