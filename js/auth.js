class Auth {
    static currentUser = null;

    static async login(username, password) {
        try {
            const response = await fetch(`${config.API_URL}/api/login`, {
                ...config.API_CONFIG,
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Login failed');

            this.currentUser = data;
            this.redirectBasedOnRole();
            return data;
        } catch (error) {
            throw error;
        }
    }

    static async register(username, password, role) {
        try {
            const response = await fetch(`${config.API_URL}/api/register`, {
                ...config.API_CONFIG,
                method: 'POST',
                body: JSON.stringify({ username, password, role })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Registration failed');

            this.currentUser = data;
            this.redirectBasedOnRole();
            return data;
        } catch (error) {
            throw error;
        }
    }

    static async logout() {
        try {
            const response = await fetch(`${config.API_URL}/api/logout`, {
                ...config.API_CONFIG,
                method: 'POST'
            });

            if (!response.ok) throw new Error('Logout failed');
            this.currentUser = null;
            window.location.href = '/index.html';
        } catch (error) {
            throw error;
        }
    }

    static redirectBasedOnRole() {
        if (!this.currentUser) return;
        
        if (this.currentUser.role === 'editor') {
            window.location.href = '/admin.html';
        } else {
            window.location.href = '/blog.html';
        }
    }
}