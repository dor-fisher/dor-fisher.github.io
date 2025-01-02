// login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Login form submitted');
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch(`${config.API_URL}/api/login`, {
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

            // Store user data
            Auth.currentUser = data;
            
            // Show success message
            UI.showToast('Login successful!', 'success');
            
            // Redirect based on role
            if (data.role === 'editor') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'blog.html';
            }
        } catch (error) {
            console.error('Login error:', error);
            UI.showToast(error.message, 'error');
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Register form submitted');

        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const role = document.getElementById('role').value;

        try {
            const response = await fetch(`${config.API_URL}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ username, password, role })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Store user data
            Auth.currentUser = data;
            
            // Show success message
            UI.showToast('Registration successful!', 'success');
            
            // Redirect based on role
            if (data.role === 'editor') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'blog.html';
            }
        } catch (error) {
            console.error('Registration error:', error);
            UI.showToast(error.message, 'error');
        }
    });
});

function switchForm(type) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.auth-tabs .tab');
    
    if (type === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }

    tabs.forEach(tab => {
        if (tab.textContent.toLowerCase() === type) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}