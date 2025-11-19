// Article metadata storage
const articles = [];

// Load article index on main page
async function loadArticleIndex() {
    try {
        const response = await fetch('articles/index.json');
        const articleList = await response.json();
        
        articles.push(...articleList);
        
        const articleListElement = document.getElementById('article-list');
        
        if (articles.length === 0) {
            articleListElement.innerHTML = '<p>No articles yet.</p>';
            return;
        }
        
        // Sort articles by date (newest first)
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        articleListElement.innerHTML = articles.map(article => `
            <div class="article-item">
                <h2><a href="article.html?id=${article.id}">${escapeHtml(article.title)}</a></h2>
                <div class="date">${formatDate(article.date)}</div>
                ${article.excerpt ? `<div class="excerpt">${escapeHtml(article.excerpt)}</div>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading article index:', error);
        document.getElementById('article-list').innerHTML = '<p>Error loading articles.</p>';
    }
}

// Load individual article
async function loadArticle() {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    
    if (!articleId) {
        document.getElementById('article-content').innerHTML = '<p>Article not found.</p>';
        return;
    }
    
    try {
        // Load article index to get metadata
        const response = await fetch('articles/index.json');
        const articleList = await response.json();
        
        const article = articleList.find(a => a.id === articleId);
        
        if (!article) {
            document.getElementById('article-content').innerHTML = '<p>Article not found.</p>';
            return;
        }
        
        // Set page title
        document.getElementById('article-title').textContent = article.title;
        
        // Load markdown content
        const mdResponse = await fetch(`articles/${articleId}.md`);
        const markdown = await mdResponse.text();
        
        // Render markdown to HTML
        const html = marked.parse(markdown);
        
        // Display article
        const articleElement = document.getElementById('article-content');
        articleElement.innerHTML = `
            <h1>${escapeHtml(article.title)}</h1>
            <div class="date" style="margin-bottom: 30px; color: #666666;">${formatDate(article.date)}</div>
            ${html}
        `;
    } catch (error) {
        console.error('Error loading article:', error);
        document.getElementById('article-content').innerHTML = '<p>Error loading article.</p>';
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

