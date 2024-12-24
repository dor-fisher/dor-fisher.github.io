const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// File paths
const USERS_FILE_PATH = path.join(__dirname, 'users.json');
const MESSAGES_FILE_PATH = path.join(__dirname, 'messages.json');

// Middleware
app.use(helmet());
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// Cache mechanism
let usersCache = null;
let messagesCache = null;
let lastUsersRead = 0;
let lastMessagesRead = 0;
const CACHE_DURATION = 5000;

// File reading utilities
async function readJsonFile(filePath, cache, lastRead) {
    const now = Date.now();
    if (cache && (now - lastRead) < CACHE_DURATION) {
        return cache;
    }

    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function writeJsonFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// User routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const users = await readJsonFile(USERS_FILE_PATH, usersCache, lastUsersRead);
        
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: uuidv4(),
            username,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await writeJsonFile(USERS_FILE_PATH, users);
        usersCache = users;
        lastUsersRead = Date.now();

        req.session.userId = newUser.id;
        
        res.json({ 
            id: newUser.id, 
            username: newUser.username,
            createdAt: newUser.createdAt
        });
    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const users = await readJsonFile(USERS_FILE_PATH, usersCache, lastUsersRead);
        const user = users.find(u => u.username === username);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.userId = user.id;
        
        res.json({ 
            id: user.id, 
            username: user.username,
            createdAt: user.createdAt
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

// Message routes
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await readJsonFile(MESSAGES_FILE_PATH, messagesCache, lastMessagesRead);
        res.json(messages);
    } catch (error) {
        console.error('Error in GET /api/messages:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/messages', requireAuth, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const users = await readJsonFile(USERS_FILE_PATH, usersCache, lastUsersRead);
        const user = users.find(u => u.id === req.session.userId);

        const messages = await readJsonFile(MESSAGES_FILE_PATH, messagesCache, lastMessagesRead);
        
        const newMessage = {
            id: uuidv4(),
            content,
            userId: user.id,
            username: user.username,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        messages.unshift(newMessage);
        
        if (messages.length > 100) {
            messages.pop();
        }

        await writeJsonFile(MESSAGES_FILE_PATH, messages);
        messagesCache = messages;
        lastMessagesRead = Date.now();

        res.json(newMessage);
    } catch (error) {
        console.error('Error in POST /api/messages:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/messages/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const messages = await readJsonFile(MESSAGES_FILE_PATH, messagesCache, lastMessagesRead);
        const messageIndex = messages.findIndex(m => m.id === id);

        if (messageIndex === -1) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (messages[messageIndex].userId !== req.session.userId) {
            return res.status(403).json({ error: 'Unauthorized to edit this message' });
        }

        messages[messageIndex] = {
            ...messages[messageIndex],
            content,
            updatedAt: new Date().toISOString()
        };

        await writeJsonFile(MESSAGES_FILE_PATH, messages);
        messagesCache = messages;
        lastMessagesRead = Date.now();

        res.json(messages[messageIndex]);
    } catch (error) {
        console.error('Error in PUT /api/messages/:id:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Initialize files
async function initializeFiles() {
    try {
        await readJsonFile(USERS_FILE_PATH, null, 0);
        await readJsonFile(MESSAGES_FILE_PATH, null, 0);
    } catch (error) {
        console.error('Error initializing files:', error);
    }
}

initializeFiles();

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