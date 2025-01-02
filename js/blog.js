let currentPosts = [];

async function loadPosts() {
    try {
        const posts = await Posts.getAll();
        currentPosts = posts.filter(post => post.published);
        displayPosts();
    } catch (error) {
        UI.showToast(error.message, 'error');
    }
}

function displayPosts() {
    const postsList = document.querySelector('.posts-list');
    postsList.innerHTML = currentPosts.map(post => `
        <article class="post">
            <header class="post-header">
                <h2>${post.title}</h2>
                <div class="post-meta">
                    <span>By ${post.authorName}</span>
                    <span>${new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
            </header>
            <div class="post-content">
                ${post.content}
            </div>
        </article>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.currentUser) {
        window.location.href = '/index.html';
        return;
    }

    const userGreeting = document.getElementById('userGreeting');
    userGreeting.textContent = `Welcome, ${Auth.currentUser.username}!`;

    loadPosts();
});