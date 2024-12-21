// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Route to get content
app.get('/api/content', async (req, res) => {
    try {
        const data = await fs.readFile('data.json', 'utf8');
        const jsonData = JSON.parse(data);
        res.json(jsonData);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // If file doesn't exist, create it with default content
            const defaultData = { content: "I'm hosted with GitHub Pages." };
            await fs.writeFile('data.json', JSON.stringify(defaultData));
            res.json(defaultData);
        } else {
            res.status(500).json({ error: 'Server error' });
        }
    }
});

// Route to update content
app.post('/api/content', async (req, res) => {
    try {
        const { content } = req.body;
        const data = { content };
        await fs.writeFile('data.json', JSON.stringify(data));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
