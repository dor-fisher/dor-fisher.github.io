const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 8080;

// In-memory storage (temporary solution)
let users = [];
let messages = [];

// Trust proxy
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({
    origin: ['https://dor-fisher.github.io', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        secure: true,
        httpOnly: true,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: true
});
app.use('/api/', limiter);

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
        req.session.userId = newUser.id;
        
        console.log('User registered:', { id: newUser.id, username: newUser.username });
        
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

        const user = users.find(u => u.username === username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.userId = user.id;
        
        console.log('User logged in:', { id: user.id, username: user.username });
        
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
app.get('/api/messages', (req, res) => {
    try {
        res.json(messages);
    } catch (error) {
        console.error('Error in GET /api/messages:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/messages', requireAuth, (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const user = users.find(u => u.id === req.session.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

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

        res.json(newMessage);
    } catch (error) {
        console.error('Error in POST /api/messages:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/messages/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

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

        res.json(messages[messageIndex]);
    } catch (error) {
        console.error('Error in PUT /api/messages/:id:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start server
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