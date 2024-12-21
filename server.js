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
            const defaultData = {
                currentContent: "I'm hosted with GitHub Pages.",
                history: []
            };
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
        let data;
        
        try {
            const fileContent = await fs.readFile('data.json', 'utf8');
            data = JSON.parse(fileContent);
        } catch (error) {
            data = { currentContent: "", history: [] };
        }

        // Create new entry
        const newEntry = {
            content: content,
            timestamp: new Date().toISOString()
        };

        // Update the current content and add to history
        data.currentContent = content;
        data.history.unshift(newEntry); // Add to start of array
        
        // Keep only the last 10 entries
        if (data.history.length > 10) {
            data.history = data.history.slice(0, 10);
        }

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