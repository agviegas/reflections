// Article metadata storage
const articles = [];
let filteredArticles = [];

// Load article index on main page
async function loadArticleIndex() {
    try {
        const response = await fetch('articles/index.json');
        const articleList = await response.json();
        
        articles.length = 0;
        articles.push(...articleList);
        
        // Load content for all articles
        await loadArticleContents();
        
        // Sort articles by date (newest first)
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        filteredArticles = [...articles];
        
        renderArticles();
        
        // Set up search functionality
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', handleSearch);
    } catch (error) {
        console.error('Error loading article index:', error);
        document.getElementById('article-list').innerHTML = '<p>Error loading articles.</p>';
    }
}

// Load markdown content for all articles
async function loadArticleContents() {
    const contentPromises = articles.map(async (article) => {
        try {
            const mdResponse = await fetch(`articles/${article.id}.md`);
            const content = await mdResponse.text();
            article.content = content.toLowerCase(); // Store lowercase for case-insensitive search
            return article;
        } catch (error) {
            console.error(`Error loading content for article ${article.id}:`, error);
            article.content = ''; // Set empty content if fetch fails
            return article;
        }
    });
    
    await Promise.all(contentPromises);
}

// Render articles to the page
function renderArticles() {
    const articleListElement = document.getElementById('article-list');
    
    if (filteredArticles.length === 0) {
        articleListElement.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; padding: 40px 0;">No articles found.</p>';
        return;
    }
    
    articleListElement.innerHTML = filteredArticles.map(article => `
        <div class="article-item">
            <h2><a href="article.html?id=${article.id}">${escapeHtml(article.title)}</a></h2>
            <div class="date">${formatDate(article.date)}</div>
            ${article.excerpt ? `<div class="excerpt">${escapeHtml(article.excerpt)}</div>` : ''}
        </div>
    `).join('');
}

// Handle search input
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredArticles = [...articles];
    } else {
        filteredArticles = articles.filter(article => {
            const titleMatch = article.title.toLowerCase().includes(searchTerm);
            const excerptMatch = article.excerpt && article.excerpt.toLowerCase().includes(searchTerm);
            const contentMatch = article.content && article.content.includes(searchTerm);
            return titleMatch || excerptMatch || contentMatch;
        });
    }
    
    renderArticles();
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
            <div class="date" style="margin-bottom: 30px;">${formatDate(article.date)}</div>
            ${html}
        `;
    } catch (error) {
        console.error('Error loading article:', error);
        document.getElementById('article-content').innerHTML = '<p>Error loading article.</p>';
    }
}

// Theme management
function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme() {
    return localStorage.getItem('theme');
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function initTheme() {
    const storedTheme = getStoredTheme();
    const systemTheme = getSystemTheme();
    
    // Use stored theme if available, otherwise use system preference
    const theme = storedTheme || systemTheme;
    setTheme(theme);
    
    // Listen for system theme changes if no stored preference
    if (!storedTheme && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!getStoredTheme()) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
}

// Initialize theme immediately to prevent flash
(function() {
    const storedTheme = getStoredTheme();
    const systemTheme = getSystemTheme();
    const theme = storedTheme || systemTheme;
    document.documentElement.setAttribute('data-theme', theme);
})();

// Set up theme toggle button and complete initialization after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
});

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

