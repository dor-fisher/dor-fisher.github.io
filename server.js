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
let posts = [];

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
        const { username, password, role } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Username, password, and role are required' });
        }

        if (!['reader', 'editor'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: uuidv4(),
            username,
            password: hashedPassword,
            role,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        req.session.userId = newUser.id;
        req.session.role = newUser.role;
        
        res.json({ 
            id: newUser.id, 
            username: newUser.username,
            role: newUser.role,
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
        req.session.role = user.role;
        
        res.json({ 
            id: user.id, 
            username: user.username,
            role: user.role,
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

const requireEditor = (req, res, next) => {
    if (!req.session.userId || req.session.role !== 'editor') {
        return res.status(403).json({ error: 'Unauthorized: Editor access required' });
    }
    next();
};

// Message routes
app.get('/api/posts', (req, res) => {
    try {
        const publicPosts = posts.map(post => ({
            ...post,
            content: post.published ? post.content : 'This post is not published yet.'
        })).filter(post => post.published || 
            (req.session.userId && req.session.role === 'editor'));
        
        res.json(publicPosts);
    } catch (error) {
        console.error('Error in GET /api/posts:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/posts', requireEditor, (req, res) => {
    try {
        const { title, content, published = false } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const user = users.find(u => u.id === req.session.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const newPost = {
            id: uuidv4(),
            title,
            content,
            published,
            userId: user.id,
            authorName: user.username,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        posts.unshift(newPost);
        res.json(newPost);
    } catch (error) {
        console.error('Error in POST /api/posts:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/posts/:id', requireEditor, (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, published } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const postIndex = posts.findIndex(p => p.id === id);
        if (postIndex === -1) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (posts[postIndex].userId !== req.session.userId) {
            return res.status(403).json({ error: 'Unauthorized to edit this post' });
        }

        posts[postIndex] = {
            ...posts[postIndex],
            title,
            content,
            published,
            updatedAt: new Date().toISOString()
        };

        res.json(posts[postIndex]);
    } catch (error) {
        console.error('Error in PUT /api/posts/:id:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/posts/:id', requireEditor, (req, res) => {
    try {
        const { id } = req.params;
        const postIndex = posts.findIndex(p => p.id === id);
        
        if (postIndex === -1) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (posts[postIndex].userId !== req.session.userId) {
            return res.status(403).json({ error: 'Unauthorized to delete this post' });
        }

        posts.splice(postIndex, 1);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /api/posts/:id:', error);
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