# Pre-Execution Message Safety Guardian

An AI-powered preventive intelligence system that intercepts risky links and files in messages **before** users open or forward them. The system stops malware, phishing, and accidental data spread at the last responsible moment.

## Core Concept

The system inserts an **AI decision checkpoint** into messaging workflows. Before a user opens a link/file or forwards a message, the action is paused and evaluated by Gemini. Gemini performs contextual, multimodal reasoning and returns an enforceable decision: **ALLOW**, **WARN**, or **BLOCK**.

## Tech Stack

- **Frontend**: React (Vite), TailwindCSS, Lucide React
- **Backend**: FastAPI, Python, Pydantic
- **AI**: Google Gemini 3 Pro (via `google-generativeai`)

## Prototype Scope

Two simulated workflows:
1. **Email** - Inbox view with received emails containing links/files
2. **Chat** - Google Chat-style internal messaging

Both workflows reuse the same backend logic and Gemini prompt.

## Features

- **Intercept before opening** a link or file
- **Intercept before forwarding** a message
- **Counterfactual reasoning**: "If this action proceeds, what harm could occur?"
- **Structured decisions**: ALLOW (silent), WARN (user choice), BLOCK (prevented)
- **Channel-agnostic architecture**: Easy to extend to other surfaces

## Getting Started

### Prerequisites

- Node.js & npm
- Python 3.9+
- Google Gemini API Key

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create `.env` file:
```
GEMINI_API_KEY=your_api_key_here
```

Run server:
```bash
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Usage

1. Open `http://localhost:5173`
2. **Email workflow**: Select an email → click "Open Link" or "Forward"
3. **Chat workflow**: Click "Open" on a message link/file or "Forward"
4. Observe the **Guardian Interceptor** analyzing threats

### Test Scenarios

- **Risky email**: "Bank of America Security" with suspicious domain
- **Risky chat**: Message with `.exe` download link
- **Safe content**: Internal wiki links, legitimate attachments
