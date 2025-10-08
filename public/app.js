// DOM Elements
const promptInput = document.getElementById('prompt');
const maxDepthSelect = document.getElementById('maxDepth');
const processBtn = document.getElementById('processBtn');
const statusSection = document.getElementById('statusSection');
const statusMessage = document.getElementById('statusMessage');
const resultsSection = document.getElementById('resultsSection');
const graphContainer = document.getElementById('graphContainer');
const graphStats = document.getElementById('graphStats');

// Event Listeners
processBtn.addEventListener('click', processPrompt);

// Allow Enter key to submit (with Shift+Enter for new line)
promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        processPrompt();
    }
});

async function processPrompt() {
    const prompt = promptInput.value.trim();
    const maxDepth = parseInt(maxDepthSelect.value);

    if (!prompt) {
        showStatus('Please enter a prompt', true);
        return;
    }

    // Disable button and show loading
    processBtn.disabled = true;
    processBtn.textContent = 'Generating Thought Graph...';
    
    showStatus('Processing your prompt and generating thought branches... This may take a minute.', false);
    resultsSection.style.display = 'none';

    try {
        const response = await fetch('/api/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, maxDepth })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to process prompt');
        }

        displayGraph(data.graph);
        showStatus('Thought graph generated successfully!', false, true);

    } catch (error) {
        console.error('Error:', error);
        showStatus(`Error: ${error.message}`, true);
    } finally {
        processBtn.disabled = false;
        processBtn.textContent = 'Generate Thought Graph';
    }
}

function showStatus(message, isError = false, isSuccess = false) {
    statusSection.style.display = 'block';
    statusMessage.textContent = message;
    statusMessage.className = 'status-message';
    
    if (isError) {
        statusMessage.classList.add('error');
    } else if (isSuccess) {
        statusMessage.classList.add('success');
    }
}

function displayGraph(graph) {
    if (!graph || !graph.nodes || graph.nodes.length === 0) {
        graphContainer.innerHTML = '<p>No graph data to display</p>';
        return;
    }

    // Show results section
    resultsSection.style.display = 'block';

    // Display stats
    const totalNodes = graph.nodes.length;
    const totalEdges = graph.edges.length;
    const maxDepth = Math.max(...graph.nodes.map(n => n.depth));

    graphStats.innerHTML = `
        <div class="stat-item">
            <strong>${totalNodes}</strong> thought nodes
        </div>
        <div class="stat-item">
            <strong>${totalEdges}</strong> connections
        </div>
        <div class="stat-item">
            <strong>${maxDepth + 1}</strong> depth levels
        </div>
    `;

    // Build a map for quick node lookup
    const nodeMap = new Map();
    graph.nodes.forEach(node => {
        nodeMap.set(node.id, node);
    });

    // Render the graph as a hierarchical tree
    graphContainer.innerHTML = '';
    
    if (graph.root) {
        const rootNode = nodeMap.get(graph.root);
        renderNode(rootNode, nodeMap, graphContainer);
    } else {
        graphContainer.innerHTML = '<p>Invalid graph structure</p>';
    }

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderNode(node, nodeMap, container) {
    const nodeElement = document.createElement('div');
    nodeElement.className = `node depth-${node.depth}`;
    nodeElement.id = node.id;

    const childrenInfo = node.children.length > 0 
        ? `<div class="node-children">↳ ${node.children.length} follow-up thought${node.children.length > 1 ? 's' : ''}</div>`
        : '';

    nodeElement.innerHTML = `
        <div class="node-header">
            <span class="node-id">${node.id}</span>
            <span class="node-depth">Depth ${node.depth}</span>
        </div>
        <div class="node-prompt">
            <strong>Prompt:</strong> ${escapeHtml(node.prompt)}
        </div>
        ${node.response ? `
            <div class="node-response">
                <strong>Response:</strong><br>
                ${escapeHtml(node.response)}
            </div>
        ` : '<div class="node-response"><em>No response generated</em></div>'}
        ${childrenInfo}
    `;

    container.appendChild(nodeElement);

    // Recursively render children
    if (node.children && node.children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'children-container';
        
        node.children.forEach(childId => {
            const childNode = nodeMap.get(childId);
            if (childNode) {
                renderNode(childNode, nodeMap, container);
            }
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Check API health on page load
async function checkHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (!data.hasApiKey) {
            showStatus('⚠️ Warning: ANTHROPIC_API_KEY is not configured. Please set it in your .env file.', true);
        }
    } catch (error) {
        console.error('Health check failed:', error);
    }
}

// Run health check when page loads
checkHealth();
