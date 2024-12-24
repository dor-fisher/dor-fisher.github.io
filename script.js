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

// Auth Functions
async function handleLogin(event) {
    event.preventDefault();
    console.log('Login form submitted');

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        currentUser = data;
        updateAuthUI();
        closeAuthModal();
        showToast('Logged in successfully!', 'success');
        loadMessages();
    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || 'Login failed', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    console.log('Register form submitted');

    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!username || !password || !confirmPassword) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        currentUser = data;
        updateAuthUI();
        closeAuthModal();
        showToast('Registered successfully!', 'success');
        loadMessages();
    } catch (error) {
        console.error('Registration error:', error);
        showToast(error.message || 'Registration failed', 'error');
    }
}

// UI Functions
function showToast(message, type = 'info') {
    const toast = elements.toast;
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function updateAuthUI() {
    if (currentUser) {
        elements.loggedOutView.classList.add('hidden');
        elements.loggedInView.classList.remove('hidden');
        elements.userGreeting.textContent = `Welcome, ${currentUser.username}!`;
        elements.messageForm.classList.remove('hidden');
        elements.loginPrompt.classList.add('hidden');
    } else {
        elements.loggedOutView.classList.remove('hidden');
        elements.loggedInView.classList.add('hidden');
        elements.messageForm.classList.add('hidden');
        elements.loginPrompt.classList.remove('hidden');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Add form submit event listeners
    elements.loginForm?.addEventListener('submit', handleLogin);
    elements.registerForm?.addEventListener('submit', handleRegister);
    elements.messageForm?.addEventListener('submit', handleMessageSubmit);
    elements.editForm?.addEventListener('submit', handleMessageEdit);

    // Add click handlers for auth buttons
    document.querySelectorAll('.auth-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const action = button.getAttribute('data-action');
            if (action === 'login' || action === 'register') {
                showAuthModal(action);
            }
        });
    });

    loadMessages();
});

// Add these UI functions if they're not already present
function showAuthModal(type) {
    console.log('Showing auth modal:', type);
    elements.authModal.classList.remove('hidden');
    switchAuthForm(type);
}

function closeAuthModal() {
    console.log('Closing auth modal');
    elements.authModal.classList.add('hidden');
    elements.loginForm.reset();
    elements.registerForm.reset();
}

function switchAuthForm(type) {
    console.log('Switching to form type:', type);
    if (type === 'login') {
        elements.loginForm.classList.remove('hidden');
        elements.registerForm.classList.add('hidden');
    } else {
        elements.loginForm.classList.add('hidden');
        elements.registerForm.classList.remove('hidden');
    }
}

// Keep your existing showToast function and other UI functions...