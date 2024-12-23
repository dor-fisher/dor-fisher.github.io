const API_URL = 'https://laughable-news-production.up.railway.app';

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

function displayHistory(history) {
    const historyDiv = document.getElementById('history');
    if (!historyDiv) return;

    historyDiv.innerHTML = '<h3>History:</h3>';
    const list = document.createElement('ul');
    list.className = 'history-list';
    
    history.slice(1).forEach(entry => {
        const item = document.createElement('li');
        item.textContent = `${entry.content} | Message: ${entry.userMessage} (${formatDate(entry.timestamp)})`;
        list.appendChild(item);
    });
    
    historyDiv.appendChild(list);
}

async function loadContent() {
    try {
        const response = await fetch(`${API_URL}/api/content`);
        const data = await response.json();
        document.querySelector('.main p').textContent = data.currentContent;
        
        if (data.history) {
            displayHistory(data.history);
        }
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    const content = document.getElementById('content').value;
    const userMessage = document.getElementById('userMessage').value;
    try {
        const response = await fetch(`${API_URL}/api/content`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content , userMessage}),
        });
        
        if (response.ok) {
            const data = await response.json();
            document.querySelector('.main p').textContent = data.currentContent;
            if (data.history) {
                displayHistory(data.history);
            }
            document.getElementById('content').value = ''; // Clear the input
            document.getElementById('userMessage').value = '';
        }
    } catch (error) {
        console.error('Error updating content:', error);
        
    }
}

// Load content when page loads
document.addEventListener('DOMContentLoaded', loadContent);