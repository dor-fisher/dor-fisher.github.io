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

// Debug logging for form submission
console.log('Initial elements:', elements);

// Auth Functions
function handleLogin(event) {
    event.preventDefault();
    console.log('Login form submitted');
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    console.log('Attempting login for username:', username);

    fetch(`${API_URL}/api/login`, {
        ...API_CONFIG,
        method: 'POST',
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        console.log('Login response status:', response.status);
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        console.log('Login successful:', data);
        currentUser = data;
        updateAuthUI();
        closeAuthModal();
        showToast('Logged in successfully!', 'success');
        loadMessages();
    })
    .catch(error => {
        console.error('Login error:', error);
        showToast(error.message, 'error');
    });
}

function handleRegister(event) {
    event.preventDefault();
    console.log('Register form submitted');
    
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    console.log('Attempting registration for username:', username);

    fetch(`${API_URL}/api/register`, {
        ...API_CONFIG,
        method: 'POST',
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        console.log('Register response status:', response.status);
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        console.log('Registration successful:', data);
        currentUser = data;
        updateAuthUI();
        closeAuthModal();
        showToast('Registered successfully!', 'success');
        loadMessages();
    })
    .catch(error => {
        console.error('Registration error:', error);
        showToast(error.message, 'error');
    });
}

// Rest of your existing code...

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Debug log for form elements
    console.log('Login form:', elements.loginForm);
    console.log('Register form:', elements.registerForm);

    // Add event listeners for auth forms
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
        console.log('Login form event listener attached');
    }
    
    if (elements.registerForm) {
        elements.registerForm.addEventListener('submit', handleRegister);
        console.log('Register form event listener attached');
    }

    // Message form listener
    if (elements.messageForm) {
        elements.messageForm.addEventListener('submit', handleMessageSubmit);
        console.log('Message form event listener attached');
    }

    // Edit form listener
    if (elements.editForm) {
        elements.editForm.addEventListener('submit', handleMessageEdit);
        console.log('Edit form event listener attached');
    }

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