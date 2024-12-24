// Constants and configuration
const API_URL = 'https://laughable-news-production.up.railway.app';
const ELEMENTS = {
    content: '#content',
    userMessage: '#userMessage',
    contentHeader: '#contentH',
    contentParagraph: '#contentP',
    history: '#history'
};

// Utility functions
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date)) throw new Error('Invalid date');
        return date.toLocaleString();
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'Invalid date';
    }
}

function createElement(tag, className, textContent) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
}

// Display functions
function displayHistory(history) {
    const historyDiv = document.getElementById('history');
    if (!historyDiv) return;

    historyDiv.innerHTML = '';
    const list = document.createElement('ul');
    list.className = 'history-list';

    history.slice(1).forEach(entry => {
        const item = document.createElement('li');
        
        // Create title div
        const titleDiv = document.createElement('div');
        titleDiv.className = 'history-title';
        titleDiv.textContent = entry.content;
        
        // Create message div with truncated text
        const messageDiv = document.createElement('div');
        messageDiv.className = 'history-message';
        const words = entry.userMessage.split(' ');
        messageDiv.textContent = words.slice(0, 3).join(' ') + (words.length > 3 ? '...' : '');
        
        // Create timestamp div
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'history-timestamp';
        timestampDiv.textContent = formatDate(entry.timestamp);
        
        // Append all elements
        item.appendChild(titleDiv);
        item.appendChild(messageDiv);
        item.appendChild(timestampDiv);
        
        list.appendChild(item);
    });

    historyDiv.appendChild(list);
}
function updatePageContent(data) {
    const contentHeader = document.querySelector(ELEMENTS.contentHeader);
    const contentParagraph = document.querySelector(ELEMENTS.contentParagraph);
    
    if (contentHeader) contentHeader.textContent = data.currentContent || '';
    if (contentParagraph) contentParagraph.textContent = data.userMessage || '';
    
    if (data.history) {
        displayHistory(data.history);
    }
}

function clearInputs() {
    const contentInput = document.querySelector(ELEMENTS.content);
    const messageInput = document.querySelector(ELEMENTS.userMessage);
    
    if (contentInput) contentInput.value = '';
    if (messageInput) messageInput.value = '';
}

// API functions
async function fetchAPI(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
}

async function loadContent() {
    try {
        const data = await fetchAPI('/api/content');
        updatePageContent(data);
    } catch (error) {
        console.error('Error loading content:', error);
        // You might want to show an error message to the user
        alert('Failed to load content. Please try again later.');
    }
}

async function handleSubmit(event) {
    event.preventDefault();

    const contentInput = document.querySelector(ELEMENTS.content);
    const messageInput = document.querySelector(ELEMENTS.userMessage);

    if (!contentInput || !messageInput) {
        console.error('Form inputs not found');
        return;
    }

    const content = contentInput.value.trim();
    const userMessage = messageInput.value.trim();

    // Basic validation
    if (!content || !userMessage) {
        alert('Please fill in both fields');
        return;
    }

    try {
        const data = await fetchAPI('/api/content', {
            method: 'POST',
            body: JSON.stringify({ content, userMessage })
        });

        updatePageContent(data);
        clearInputs();
    } catch (error) {
        console.error('Error updating content:', error);
        alert('Failed to update content. Please try again later.');
    }
}

// Event listeners
function initializeEventListeners() {
    document.addEventListener('DOMContentLoaded', loadContent);
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
}

// Add this to your existing script.js
document.addEventListener('DOMContentLoaded', function() {
    // Character counter for textarea
    const messageArea = document.getElementById('userMessage');
    const counter = document.getElementById('messageCounter');
    
    messageArea.addEventListener('input', function() {
        const remaining = this.value.length;
        counter.textContent = `${remaining}/500`;
        
        if (remaining >= 450) {
            counter.style.color = '#ef4444';
        } else {
            counter.style.color = '#64748b';
        }
    });

    // Form validation feedback
    const form = document.getElementById('updateForm');
    const titleInput = document.getElementById('content');

    form.addEventListener('submit', function(event) {
        if (!titleInput.value.trim() || !messageArea.value.trim()) {
            event.preventDefault();
            alert('Please fill in all fields');
        }
    });

    // Loading states
    const submitButton = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function() {
        submitButton.disabled = true;
        submitButton.textContent = 'Posting...';
        
        // Reset button after 2 seconds if no response
        setTimeout(() => {
            submitButton.disabled = false;
            submitButton.textContent = 'Post Message';
        }, 2000);
    });
});

// Initialize
initializeEventListeners();