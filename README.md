# Adaptive-Graph-of-Thoughts-Web-App

Adaptive Graph of Thoughts Web App designed to be used with Anthropic models. This interactive web application uses Claude to explore complex topics through adaptive thought branching, creating a visual graph of interconnected ideas.

## Features

- 🧠 **Adaptive Thought Exploration**: Generates branching thought paths that adapt based on response quality
- 🎯 **Configurable Depth**: Control how deep the exploration goes (1-4 levels)
- 🌐 **Interactive Web Interface**: Clean, modern UI for easy interaction
- 📊 **Visual Graph Display**: Hierarchical visualization of thought nodes and connections
- ⚡ **Powered by Claude**: Uses Anthropic's Claude AI for intelligent response generation

## Prerequisites

- Node.js (v14 or higher)
- An Anthropic API key ([Get one here](https://console.anthropic.com/))

## Installation

1. Clone the repository:
```bash
git clone https://github.com/kre8orr-369/Adaptive-Graph-of-Thoughts-Web-App.git
cd Adaptive-Graph-of-Thoughts-Web-App
```

2. Install dependencies:
```bash
npm install
```

3. Configure your environment:
```bash
cp .env.example .env
```

4. Edit `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=your_actual_api_key_here
PORT=3000
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. Enter a question or prompt in the text area
4. Select your desired exploration depth
5. Click "Generate Thought Graph" to start the exploration

## How It Works

The Adaptive Graph of Thoughts system:

1. **Initial Prompt**: Takes your question as the root node
2. **Response Generation**: Uses Claude to generate thoughtful responses
3. **Branch Generation**: Automatically creates follow-up questions to explore deeper
4. **Adaptive Expansion**: Intelligently decides which branches to explore further
5. **Visualization**: Displays the complete thought graph with all nodes and connections

## API Endpoints

- `GET /` - Main web interface
- `POST /api/process` - Process a prompt and generate thought graph
  - Body: `{ "prompt": "string", "maxDepth": number }`
- `GET /api/health` - Health check endpoint

## Project Structure

```
.
├── server.js           # Express server and Graph of Thoughts logic
├── public/
│   ├── index.html     # Main HTML interface
│   ├── styles.css     # Styling
│   └── app.js         # Frontend JavaScript
├── package.json       # Node.js dependencies
├── .env.example       # Environment configuration template
└── README.md          # This file
```

## Technologies Used

- **Backend**: Node.js, Express.js
- **AI**: Anthropic Claude API (@anthropic-ai/sdk)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Configuration**: dotenv

## License

ISC
