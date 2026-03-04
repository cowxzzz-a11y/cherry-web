
# Cherry Studio Web Version

This is a web-based version of Cherry Studio, designed for internal team use.

## Features
- **Web Access**: Accessible via browser (IP:Port).
- **Public Knowledge Base**: Shared knowledge base for all users (read-only management, upload allowed).
- **Private Knowledge Base**: Users can create their own knowledge bases.
- **Single Assistant Mode**: Simplified chat interface focused on sessions.

## Architecture
- **web-server**: A Node.js Express server that wraps the core logic of Cherry Studio. It mocks Electron APIs to reuse the existing business logic (RAG, Chat, etc.).
- **web-client**: A React frontend adapted from the Electron renderer. It communicates with the server via REST API instead of IPC.

## Prerequisites
- Node.js 18+
- pnpm or npm

## Installation

1.  Install dependencies for the root project (if not done):
    ```bash
    npm install
    ```

2.  Install dependencies for Web Server:
    ```bash
    cd web-server
    npm install
    ```

3.  Install dependencies for Web Client:
    ```bash
    cd web-client
    npm install
    ```

## Running

1.  **Start the Server**:
    ```bash
    cd web-server
    npm run dev
    ```
    The server runs on http://localhost:3000.

2.  **Start the Client**:
    ```bash
    cd web-client
    npm run dev
    ```
    The client runs on http://localhost:5173.

## Configuration
- **Knowledge Bases**: Stored in `web-server/storage/knowledge_bases.json`.
- **Files**: Uploaded files are stored in `web-server/storage/files`.
- **Vector DB**: Stored in `web-server/storage/KnowledgeBase`.
- **LLM Configuration**: Currently uses `web-server/storage/config.json`. You may need to manually configure `llm.providers` in this file or implement a UI for it.

## Notes
- The `Public Knowledge Base` is created automatically on first run.
- Users can upload files to Public KB but cannot delete/rename it.
