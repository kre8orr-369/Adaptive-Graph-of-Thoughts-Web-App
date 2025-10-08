const express = require('express');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Graph of Thoughts API endpoint
app.post('/api/process', async (req, res) => {
  try {
    const { prompt, maxDepth = 3 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ 
        error: 'ANTHROPIC_API_KEY not configured. Please set it in your .env file.' 
      });
    }

    // Initialize the graph of thoughts
    const thoughtGraph = await processAdaptiveGraph(prompt, maxDepth);

    res.json({
      success: true,
      graph: thoughtGraph
    });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: error.message 
    });
  }
});

// Adaptive Graph of Thoughts implementation
async function processAdaptiveGraph(initialPrompt, maxDepth) {
  const graph = {
    nodes: [],
    edges: [],
    root: null
  };

  // Create root node
  const rootNode = {
    id: 'node-0',
    prompt: initialPrompt,
    response: null,
    depth: 0,
    children: []
  };

  graph.root = rootNode.id;
  graph.nodes.push(rootNode);

  // Process the root node
  await expandNode(rootNode, graph, maxDepth);

  return graph;
}

async function expandNode(node, graph, maxDepth) {
  if (node.depth >= maxDepth) {
    return;
  }

  try {
    // Generate initial response
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: node.prompt
      }]
    });

    node.response = message.content[0].text;

    // Generate follow-up thought branches
    const branches = await generateBranches(node.prompt, node.response);

    // Create child nodes for each branch
    for (let i = 0; i < Math.min(branches.length, 3); i++) {
      const childNode = {
        id: `node-${graph.nodes.length}`,
        prompt: branches[i],
        response: null,
        depth: node.depth + 1,
        children: []
      };

      graph.nodes.push(childNode);
      graph.edges.push({
        from: node.id,
        to: childNode.id
      });

      node.children.push(childNode.id);

      // Recursively expand child nodes (adaptive depth)
      if (shouldExpand(node.response, childNode.prompt)) {
        await expandNode(childNode, graph, maxDepth);
      }
    }

  } catch (error) {
    console.error(`Error expanding node ${node.id}:`, error);
    node.response = `Error: ${error.message}`;
  }
}

async function generateBranches(originalPrompt, response) {
  try {
    const branchPrompt = `Given the original question: "${originalPrompt}"
And this response: "${response}"

Generate 3 follow-up questions or thought directions that would help explore this topic more deeply. 
Return only the questions, one per line, without numbering.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: branchPrompt
      }]
    });

    const branchText = message.content[0].text;
    const branches = branchText
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+[\.)]\s*/, '').trim())
      .slice(0, 3);

    return branches;

  } catch (error) {
    console.error('Error generating branches:', error);
    return [];
  }
}

function shouldExpand(response, branchPrompt) {
  // Simple heuristic: expand if response is substantial and branch is meaningful
  const responseLength = response.length;
  const branchLength = branchPrompt.length;
  
  // Randomly decide to expand with 60% probability for more interesting graphs
  return responseLength > 50 && branchLength > 10 && Math.random() > 0.4;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    hasApiKey: !!process.env.ANTHROPIC_API_KEY
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Key configured: ${!!process.env.ANTHROPIC_API_KEY}`);
});
