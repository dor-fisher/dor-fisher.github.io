function switchForm(type) {
    // Get the forms
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Get all tabs
    const tabs = document.querySelectorAll('.auth-tabs .tab');
    
    if (type === 'login') {
        // Show login form, hide register form
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        // Show register form, hide login form
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }

    // Update tab active states
    tabs.forEach(tab => {
        if (tab.textContent.toLowerCase() === type) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// Add this to verify the function is running
document.addEventListener('DOMContentLoaded', () => {
    console.log('Login script loaded');
});