let currentPosts = [];
let currentEditingId = null;

async function loadPosts() {
    try {
        currentPosts = await Posts.getAll();
        displayPosts();
    } catch (error) {
        UI.showToast(error.message, 'error');
    }
}

function displayPosts() {
    const postsList = document.querySelector('.posts-list');
    postsList.innerHTML = currentPosts.map(post => `
        <article class="post ${post.published ? 'published' : 'draft'}">
            <header class="post-header">
                <h3>${post.title}</h3>
                <div class="post-meta">
                    <span>${new Date(post.createdAt).toLocaleDateString()}</span>
                    <span class="status">${post.published ? 'Published' : 'Draft'}</span>
                </div>
            </header>
            <div class="post-actions">
                <button onclick="editPost('${post.id}')" class="action-btn">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="deletePost('${post.id}')" class="action-btn delete">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </article>
    `).join('');
}

async function editPost(id) {
    const post = currentPosts.find(p => p.id === id);
    if (!post) return;

    currentEditingId = id;
    document.getElementById('editTitle').value = post.title;
    document.getElementById('editContent').value = post.content;
    document.getElementById('editPublished').checked = post.published;
    UI.showModal('editModal');
}

async function deletePost(id) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        await Posts.delete(id);
        UI.showToast('Post deleted successfully', 'success');
        await loadPosts();
    } catch (error) {
        UI.showToast(error.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.currentUser || Auth.currentUser.role !== 'editor') {
        window.location.href = '/index.html';
        return;
    }

    const userGreeting = document.getElementById('userGreeting');
    userGreeting.textContent = `Welcome, ${Auth.currentUser.username}!`;

    const postForm = document.getElementById('postForm');
    const editForm = document.getElementById('editForm');

    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('postTitle').value.trim();
        const content = document.getElementById('postContent').value.trim();
        const published = document.getElementById('publishPost').checked;

        try {
            await Posts.create(title, content, published);
            postForm.reset();
            UI.showToast('Post created successfully', 'success');
            await loadPosts();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('editTitle').value.trim();
        const content = document.getElementById('editContent').value.trim();
        const published = document.getElementById('editPublished').checked;

        try {
            await Posts.update(currentEditingId, title, content, published);
            UI.closeModal('editModal');
            UI.showToast('Post updated successfully', 'success');
            await loadPosts();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    });

    loadPosts();
});