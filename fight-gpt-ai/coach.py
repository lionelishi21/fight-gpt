import json
import os
from collections import deque

# --- Constants for Analysis ---
JUMP_THRESHOLD = 0.8
CROUCH_THRESHOLD = 0.15

# Landmark indices from MediaPipe Pose
# We need hands, hips, and shoulders for Hadoken detection
LEFT_ANKLE, RIGHT_ANKLE = 27, 28
LEFT_HIP, RIGHT_HIP = 23, 24
LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12
LEFT_WRIST, RIGHT_WRIST = 15, 16

def is_crouching(landmarks):
    hip_y = (landmarks[LEFT_HIP]['y'] + landmarks[RIGHT_HIP]['y']) / 2
    ankle_y = (landmarks[LEFT_ANKLE]['y'] + landmarks[RIGHT_ANKLE]['y']) / 2
    return abs(hip_y - ankle_y) < CROUCH_THRESHOLD

def is_jumping(landmarks):
    left_ankle_y = landmarks[LEFT_ANKLE]['y']
    right_ankle_y = landmarks[RIGHT_ANKLE]['y']
    return left_ankle_y < JUMP_THRESHOLD and right_ankle_y < JUMP_THRESHOLD

def detect_hadoken(frame_sequence):
    """Analyzes a sequence of frames to detect a Hadoken motion."""
    if len(frame_sequence) < 20: # Need at least 20 frames for the motion
        return False

    start_frame = frame_sequence[0]
    end_frame = frame_sequence[-1]

    # Simple check: Are wrists close to the hip at the start of the sequence?
    start_left_wrist = start_frame['landmarks'][LEFT_WRIST]
    start_right_wrist = start_frame['landmarks'][RIGHT_WRIST]
    start_hip_x = (start_frame['landmarks'][LEFT_HIP]['x'] + start_frame['landmarks'][RIGHT_HIP]['x']) / 2
    
    wrists_close_at_start = abs(start_left_wrist['x'] - start_hip_x) < 0.1 and \
                            abs(start_right_wrist['x'] - start_hip_x) < 0.1

    # Simple check: Have wrists moved forward significantly by the end of the sequence?
    end_left_wrist = end_frame['landmarks'][LEFT_WRIST]
    end_right_wrist = end_frame['landmarks'][RIGHT_WRIST]
    
    # Check if facing right or left by shoulder position
    facing_right = start_frame['landmarks'][LEFT_SHOULDER]['x'] < start_frame['landmarks'][RIGHT_SHOULDER]['x']
    
    if facing_right:
        # Moved forward to the right
        wrists_moved_forward = end_left_wrist['x'] > start_left_wrist['x'] + 0.15 and \
                               end_right_wrist['x'] > start_right_wrist['x'] + 0.15
    else:
        # Moved forward to the left
        wrists_moved_forward = end_left_wrist['x'] < start_left_wrist['x'] - 0.15 and \
                               end_right_wrist['x'] < start_right_wrist['x'] - 0.15

    return wrists_close_at_start and wrists_moved_forward

def analyze_fight_data(json_path):
    """Loads and analyzes the fight data for states and patterns."""
    with open(json_path, 'r') as f:
        data = json.load(f)

    # A deque is a special list that's efficient for adding/removing from the ends
    frame_buffer = deque(maxlen=30) # Keep a buffer of the last 30 frames (0.5 seconds)
    
    print(f"\n--- Starting Advanced Analysis of {json_path} ---")
    for frame_data in data:
        frame_buffer.append(frame_data)
        
        frame_number = frame_data['frame']
        landmarks = frame_data['landmarks']
        
        if frame_number % 30 == 0:
            crouching = is_crouching(landmarks)
            jumping = is_jumping(landmarks)
            
            state = "STANDING"
            if crouching:
                state = "CROUCHING"
            elif jumping:
                state = "JUMPING"
            
            # Now, check for patterns in our buffer
            hadoken_detected = detect_hadoken(list(frame_buffer))
            
            output = f"Frame {frame_number}: Player state is {state}"
            if hadoken_detected:
                output += "   <<<<< 🔥 HADOKEN DETECTED! >>>>>"
            
            print(output)

# --- Main execution block ---
if __name__ == "__main__":
    analysis_file = 'X-C435HjNhg.mp4_analysis.json'
    if not os.path.exists(analysis_file):
        print(f"Error: Analysis file not found. Make sure you've run the Docker container first.")
    else:
        analyze_fight_data(analysis_file)