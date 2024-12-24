// API Configuration
const API_URL = 'https://laughable-news-production.up.railway.app';
const API_CONFIG = {
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
    }
};

// State management
let currentUser = null;
let currentEditingMessageId = null;

// DOM Elements
const elements = {
    authModal: document.getElementById('authModal'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    loggedOutView: document.getElementById('loggedOutView'),
    loggedInView: document.getElementById('loggedInView'),
    userGreeting: document.getElementById('userGreeting'),
    messageForm: document.getElementById('messageForm'),
    loginPrompt: document.getElementById('loginPrompt'),
    messagesList: document.getElementById('messagesList'),
    editModal: document.getElementById('editModal'),
    editForm: document.getElementById('editForm'),
    editContent: document.getElementById('editContent'),
    toast: document.getElementById('toast')
};

// Message Functions
async function loadMessages() {
    try {
        const response = await fetch(`${API_URL}/api/messages`, {
            ...API_CONFIG,
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Failed to load messages');
        }

        const messages = await response.json();
        displayMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
        showToast(error.message, 'error');
    }
}

function displayMessages(messages) {
    if (!elements.messagesList) return;

    elements.messagesList.innerHTML = messages.map(message => `
        <div class="message" data-id="${message.id}">
            <div class="message-header">
                <span class="username">${message.username}</span>
                <span class="timestamp">${new Date(message.createdAt).toLocaleString()}</span>
            </div>
            <div class="message-content">${message.content}</div>
            ${currentUser && currentUser.id === message.userId ? `
                <div class="message-actions">
                    <button onclick="openEditModal('${message.id}', '${message.content.replace(/'/g, "\\'")}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Auth Functions
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            ...API_CONFIG,
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');

        currentUser = data;
        updateAuthUI();
        closeAuthModal();
        showToast('Logged in successfully!', 'success');
        await loadMessages();
    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message, 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/register`, {
            ...API_CONFIG,
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Registration failed');

        currentUser = data;
        updateAuthUI();
        closeAuthModal();
        showToast('Registered successfully!', 'success');
        await loadMessages();
    } catch (error) {
        console.error('Registration error:', error);
        showToast(error.message, 'error');
    }
}

async function handleLogout() {
    try {
        const response = await fetch(`${API_URL}/api/logout`, {
            ...API_CONFIG,
            method: 'POST'
        });

        if (!response.ok) throw new Error('Logout failed');

        currentUser = null;
        updateAuthUI();
        showToast('Logged out successfully!', 'success');
        await loadMessages();
    } catch (error) {
        console.error('Logout error:', error);
        showToast(error.message, 'error');
    }
}

async function handleMessageSubmit(event) {
    event.preventDefault();
    const content = elements.messageForm.content.value.trim();

    if (!content) {
        showToast('Message cannot be empty', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/messages`, {
            ...API_CONFIG,
            method: 'POST',
            body: JSON.stringify({ content })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to post message');

        elements.messageForm.reset();
        await loadMessages();
        showToast('Message posted successfully!', 'success');
    } catch (error) {
        console.error('Post message error:', error);
        showToast(error.message, 'error');
    }
}

// UI Functions
function updateAuthUI() {
    if (currentUser) {
        elements.loggedOutView.classList.add('hidden');
        elements.loggedInView.classList.remove('hidden');
        elements.userGreeting.textContent = `Welcome, ${currentUser.username}!`;
        elements.messageForm?.classList.remove('hidden');
        elements.loginPrompt?.classList.add('hidden');
    } else {
        elements.loggedOutView.classList.remove('hidden');
        elements.loggedInView.classList.add('hidden');
        elements.messageForm?.classList.add('hidden');
        elements.loginPrompt?.classList.remove('hidden');
    }
}

function showAuthModal(type) {
    elements.authModal.classList.remove('hidden');
    switchAuthForm(type);
}

function closeAuthModal() {
    elements.authModal.classList.add('hidden');
    elements.loginForm.reset();
    elements.registerForm.reset();
}

function switchAuthForm(type) {
    if (type === 'login') {
        elements.loginForm.classList.remove('hidden');
        elements.registerForm.classList.add('hidden');
    } else {
        elements.loginForm.classList.add('hidden');
        elements.registerForm.classList.remove('hidden');
    }
}

function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = `toast toast-${type}`;
    elements.toast.classList.remove('hidden');

    setTimeout(() => {
        elements.toast.classList.add('hidden');
    }, 3000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Auth form listeners
    elements.loginForm?.addEventListener('submit', handleLogin);
    elements.registerForm?.addEventListener('submit', handleRegister);
    elements.messageForm?.addEventListener('submit', handleMessageSubmit);

    // Load initial messages
    loadMessages().catch(console.error);
});