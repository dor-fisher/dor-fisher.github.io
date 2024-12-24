async function handleLogout() {
    try {
        const response = await fetch(`${API_URL}/api/logout`, {
            ...API_CONFIG,
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error('Logout failed');
        }

        currentUser = null;
        updateAuthUI();
        showToast('Logged out successfully!', 'success');
        loadMessages();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Message Functions
async function loadMessages() {
    try {
        const response = await fetch(`${API_URL}/api/messages`, API_CONFIG);
        const messages = await response.json();

        if (!response.ok) {
            throw new Error('Failed to load messages');
        }

        displayMessages(messages);
    } catch (error) {
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

        if (!response.ok) {
            throw new Error(data.error || 'Failed to post message');
        }

        elements.messageForm.reset();
        loadMessages();
        showToast('Message posted successfully!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleMessageEdit(event) {
    event.preventDefault();
    const content = elements.editContent.value.trim();

    if (!content) {
        showToast('Message cannot be empty', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/messages/${currentEditingMessageId}`, {
            ...API_CONFIG,
            method: 'PUT',
            body: JSON.stringify({ content })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update message');
        }

        closeEditModal();
        loadMessages();
        showToast('Message updated successfully!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// UI Functions
function displayMessages(messages) {
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

function openEditModal(messageId, content) {
    currentEditingMessageId = messageId;
    elements.editContent.value = content;
    elements.editModal.classList.remove('hidden');
}

function closeEditModal() {
    elements.editModal.classList.add('hidden');
    currentEditingMessageId = null;
    elements.editForm.reset();
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
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);
    elements.messageForm.addEventListener('submit', handleMessageSubmit);
    elements.editForm.addEventListener('submit', handleMessageEdit);
    loadMessages();
});

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === elements.authModal) {
        closeAuthModal();
    }
    if (event.target === elements.editModal) {
        closeEditModal();
    }
});