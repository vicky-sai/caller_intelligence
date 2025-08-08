# Truecaller Caller Intelligence

This project is a proof-of-concept for an AI-powered call analysis dashboard. It records audio, transcribes it locally using Whisper, and analyzes the conversation for sentiment, topics, intent, and action items using a local LLM via OLLAMA.

## Project Structure

- **/backend**: Python Flask server that handles audio transcription and analysis.
- **/frontend**: React application for the user interface, recording audio, and displaying results.

## How to Run

### 1. Backend Server

- Navigate to the `backend` directory:
  `cd backend`
- Create and activate a virtual environment:
  `python3 -m venv venv`
  `source venv/bin/activate`
- Install dependencies:
  `pip install -r requirements.txt`
- Run the server:
  `python app.py`

The backend will be running on `http://localhost:5001`.

### 2. Frontend Application

- Navigate to the `frontend` directory:
  `cd frontend`
- Install dependencies:
  `npm install`
- Run the application:
  `npm start`

The frontend will open and run on `http://localhost:3000`.

### Prerequisites

- Python 3.x
- Node.js and npm
- `ffmpeg` installed on your system
- OLLAMA installed and running with the `llama3.2:latest` model pulled.