const API_URL = 'https://laughable-news-production.up.railway.app';

async function loadContent() {
    try {
        const response = await fetch(`${API_URL}/api/content`);
        const data = await response.json();
        document.querySelector('.main p').textContent = data.content;
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    const content = document.getElementById('content').value;
    
    try {
        const response = await fetch(`${API_URL}/api/content`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
        });
        
        if (response.ok) {
            loadContent(); // Refresh the content
            document.getElementById('content').value = ''; // Clear the input
        }
    } catch (error) {
        console.error('Error updating content:', error);
    }
}

// Load content when page loads
document.addEventListener('DOMContentLoaded', loadContent);