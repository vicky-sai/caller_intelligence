from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import requests
import json
import os

app = Flask(__name__)
CORS(app)

# Load the Whisper model
# This will download the model on the first run, which may take a moment.
print("Loading Whisper model...")
model = whisper.load_model("base")
print("Whisper model loaded.")

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    print("Received request to /transcribe")
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files['audio']
    # Create a directory to store temporary audio files if it doesn't exist
    if not os.path.exists("temp"):
        os.makedirs("temp")
        
    audio_path = os.path.join("temp", "temp_audio.wav")
    audio_file.save(audio_path)
    print(f"Audio file saved to {audio_path}")

    # Transcribe the audio
    try:
        print("Transcribing audio...")
        result = model.transcribe(audio_path, fp16=False) # fp16=False can improve compatibility
        transcription = result["text"]
        print("Transcription successful.")
    except Exception as e:
        print(f"Error during transcription: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up the temporary audio file
        if os.path.exists(audio_path):
            os.remove(audio_path)

    # Analyze the transcription with Llama 3.2
    print("Analyzing transcription with OLLAMA...")
    try:
        ollama_payload = {
            "model": "llama3.2:latest",
            "prompt": f"""Analyze the following conversation transcription and provide the following in a valid JSON object format:
            1.  "sentiment": (string: "Positive", "Negative", or "Neutral")
            2.  "topics": (array of strings: main topics)
            3.  "intent": (string: the primary purpose of the conversation)
            4.  "entities": (array of strings: named entities like people, organizations, locations)
            5.  "follow_up_actions": (array of strings: actionable items)

            Transcription:
            "{transcription}"

            Provide only the raw JSON object as the output, without any extra text or explanations.
            """,
            "format": "json", # Request JSON format directly
            "stream": False
        }
        
        ollama_response = requests.post('http://localhost:11434/api/generate', json=ollama_payload)
        ollama_response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
        
        # The response from OLLAMA is a JSON string, which needs to be parsed twice.
        response_data = ollama_response.json()
        analysis_json = json.loads(response_data['response'])

        print("Analysis successful.")
        
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to OLLAMA: {e}")
        return jsonify({"error": f"Failed to connect to OLLAMA: {e}"}), 500
    except Exception as e:
        print(f"Error during analysis: {e}")
        return jsonify({"error": f"Error during analysis: {e}"}), 500

    # Return the final combined result
    return jsonify({
        "transcription": transcription,
        "analysis": analysis_json
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)