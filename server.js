Copyconst express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const PORT = process.env.PORT || 3000;  // Add this line here

const app = express();
const DATA_FILE_PATH = path.join(__dirname, 'data.json');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// Caching mechanism
let dataCache = null;
let lastRead = 0;
const CACHE_DURATION = 5000;

async function readDataFile() {
    const now = Date.now();
    if (dataCache && (now - lastRead) < CACHE_DURATION) {
        return dataCache;
    }

    try {
        const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf8');
        dataCache = JSON.parse(fileContent);
        lastRead = now;
        return dataCache;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return { currentContent: "Initial content", history: [] };
        }
        throw error;
    }
}

async function writeDataFile(data) {
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2));
    dataCache = data;
    lastRead = Date.now();
}

// Initialize data file
async function initializeDataFile() {
    try {
        await readDataFile();
    } catch (error) {
        const defaultData = {
            currentContent: "Initial content",
            history: []
        };
        await writeDataFile(defaultData);
    }
}

initializeDataFile();

// Routes
app.get('/api/content', async (req, res) => {
    try {
        const data = await readDataFile();
        res.json(data);
    } catch (error) {
        console.error('Error in GET /api/content:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/content', async (req, res) => {
    try {
        const { content, userMessage } = req.body;

        // Validation
        if (!content || !userMessage) {
            return res.status(400).json({ 
                error: 'Both content and userMessage are required' 
            });
        }

        if (content.length > 1000 || userMessage.length > 1000) {
            return res.status(400).json({ 
                error: 'Content or message exceeds maximum length' 
            });
        }

        const data = await readDataFile();
        
        const newEntry = {
            content,
            userMessage,
            timestamp: new Date().toISOString()
        };

        data.currentContent = content;
        data.userMessage = userMessage;
        data.history.unshift(newEntry);
        data.history = data.history.slice(0, 10);

        await writeDataFile(data);
        res.json(data);

    } catch (error) {
        console.error('Error in POST /api/content:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Debug endpoint (consider removing in production)
if (process.env.NODE_ENV !== 'production') {
    app.get('/debug', async (req, res) => {
        try {
            const data = await readDataFile();
            res.send(`<pre>${JSON.stringify(data, null, 2)}</pre>`);
        } catch (error) {
            res.status(500).send('Error reading data');
        }
    });
}

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});