class Posts {
    static async getAll() {
        try {
            const response = await fetch(`${config.API_URL}/api/posts`, config.API_CONFIG);
            if (!response.ok) throw new Error('Failed to load posts');
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    static async create(title, content, published = false) {
        try {
            const response = await fetch(`${config.API_URL}/api/posts`, {
                ...config.API_CONFIG,
                method: 'POST',
                body: JSON.stringify({ title, content, published })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create post');
            return data;
        } catch (error) {
            throw error;
        }
    }

    static async update(id, title, content, published) {
        try {
            const response = await fetch(`${config.API_URL}/api/posts/${id}`, {
                ...config.API_CONFIG,
                method: 'PUT',
                body: JSON.stringify({ title, content, published })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to update post');
            return data;
        } catch (error) {
            throw error;
        }
    }

    static async delete(id) {
        try {
            const response = await fetch(`${config.API_URL}/api/posts/${id}`, {
                ...config.API_CONFIG,
                method: 'DELETE'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete post');
            }
        } catch (error) {
            throw error;
        }
    }
}