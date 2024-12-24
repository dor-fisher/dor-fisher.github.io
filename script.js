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
function displayHistory(history = []) {
    const historyDiv = document.querySelector(ELEMENTS.history);
    if (!historyDiv) return;

    historyDiv.innerHTML = '<h3>History:</h3>';
    const list = createElement('ul', 'history-list');

    history.slice(1).forEach(entry => {
        const item = createElement('li');
        item.textContent = `${entry.content || 'No content'} | Message: ${entry.userMessage || 'No message'} (${formatDate(entry.timestamp)})`;
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

// Initialize
initializeEventListeners();