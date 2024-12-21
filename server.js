const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize data.json if it doesn't exist
async function initializeDataFile() {
    try {
        await fs.access('data.json');
        console.log('data.json exists');
    } catch {
        console.log('Creating data.json');
        const defaultData = {
            currentContent: "Initial content",
            history: []
        };
        await fs.writeFile('data.json', JSON.stringify(defaultData, null, 2));
        console.log('data.json created with default content');
    }
}

// Initialize on startup
initializeDataFile();

// Debug endpoint to see current data
app.get('/debug', async (req, res) => {
    try {
        const data = await fs.readFile('data.json', 'utf8');
        console.log('Current data:', data);
        res.send(`<pre>${data}</pre>`);
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).send('Error reading data');
    }
});

// Route to get content
app.get('/api/content', async (req, res) => {
    try {
        const data = await fs.readFile('data.json', 'utf8');
        console.log('Sending data:', data);
        const jsonData = JSON.parse(data);
        res.json(jsonData);
    } catch (error) {
        console.error('Error in GET /api/content:', error);
        if (error.code === 'ENOENT') {
            const defaultData = {
                currentContent: "Initial content",
                history: []
            };
            await fs.writeFile('data.json', JSON.stringify(defaultData, null, 2));
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
        console.log('Received new content:', content);
        
        let data;
        try {
            const fileContent = await fs.readFile('data.json', 'utf8');
            data = JSON.parse(fileContent);
        } catch (error) {
            console.log('No existing data.json, creating new data object');
            data = { currentContent: "", history: [] };
        }

        const newEntry = {
            content: content,
            timestamp: new Date().toISOString()
        };

        data.currentContent = content;
        data.history.unshift(newEntry);
        
        if (data.history.length > 10) {
            data.history = data.history.slice(0, 10);
        }

        console.log('Writing new data:', JSON.stringify(data, null, 2));
        await fs.writeFile('data.json', JSON.stringify(data, null, 2));
        console.log('Data written successfully');
        
        res.json(data);
    } catch (error) {
        console.error('Error in POST /api/content:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});