import sopData from './data/sop_data.json';

// State
let state = {
    sops: sopData,
    currentCategory: 'All', // 'All' or specific category name
    searchQuery: '',
    categories: []
};

// DOM Elements
const elements = {
    navUpm: document.getElementById('nav-upm'),
    sopList: document.getElementById('sop-list-container'),
    categoryTitle: document.getElementById('current-category-title'),
    categoryCount: document.getElementById('current-category-count'),
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search'),
    emptyState: document.getElementById('empty-state'),
    loadingState: document.getElementById('loading-state'),
    resetSearchBtn: document.getElementById('reset-search-btn')
};

// Initialize
function init() {
    // Hide loader
    if(elements.loadingState) elements.loadingState.classList.add('hidden');
    if(elements.sopList) elements.sopList.classList.remove('hidden');

    extractCategories();
    renderNavigation();
    renderSOPs();
    setupEventListeners();
}

// Extract unique categories
function extractCategories() {
    const set = new Set();
    state.sops.forEach(sop => {
        set.add(sop.category);
    });
    state.categories = Array.from(set);
}

// Render Sidebar Navigation
function renderNavigation() {
    // Add 'All' option
    elements.navUpm.innerHTML = '';
    const allItem = createNavItem('Semua SOP', 'All', state.sops.length, state.currentCategory === 'All');
    elements.navUpm.appendChild(allItem);

    // Categories
    state.categories.forEach(cat => {
        const count = state.sops.filter(s => s.category === cat).length;
        elements.navUpm.appendChild(createNavItem(cat, cat, count, state.currentCategory === cat));
    });
}

function createNavItem(label, categoryValue, count, isActive) {
    const li = document.createElement('li');
    li.className = `nav-item ${isActive ? 'active' : ''}`;
    li.dataset.category = categoryValue;
    
    // Clean up long names
    let displayLabel = label;
    if(displayLabel.length > 30) {
        displayLabel = displayLabel.substring(0, 30) + '...';
    }

    li.innerHTML = `
        <span title="${label}">${displayLabel}</span>
        <span class="nav-count">${count}</span>
    `;

    li.addEventListener('click', () => {
        state.currentCategory = categoryValue;
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        li.classList.add('active');
        elements.categoryTitle.textContent = label;
        renderSOPs();
    });

    return li;
}

// Render SOP Cards
function renderSOPs() {
    let filtered = state.sops;

    if (state.currentCategory !== 'All') {
        filtered = filtered.filter(s => s.category === state.currentCategory);
    }

    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(s => 
            s.name.toLowerCase().includes(query) || 
            s.number.toLowerCase().includes(query)
        );
    }

    elements.categoryCount.textContent = `${filtered.length} Dokumen`;
    elements.sopList.innerHTML = '';
    
    if (filtered.length === 0) {
        elements.sopList.classList.add('hidden');
        elements.emptyState.classList.remove('hidden');
    } else {
        elements.sopList.classList.remove('hidden');
        elements.emptyState.classList.add('hidden');

        filtered.forEach(sop => {
            const card = document.createElement('div');
            card.className = 'sop-card';
            
            const linkHref = sop.link ? sop.link : '#';
            const target = sop.link ? 'target="_blank" rel="noopener noreferrer"' : '';
            const btnClass = sop.link ? 'btn-primary' : 'btn-outline';
            const btnText = sop.link ? 'Lihat Dokumen' : 'Tidak Ada Link';

            // Buttons enabled with parsed links
            card.innerHTML = `
                <div class="sop-badge-container">
                    <span class="sop-doc-badge">${sop.document || 'DOC'}</span>
                    <span class="sop-number">${sop.number}</span>
                </div>
                <h3 class="sop-title">${sop.name}</h3>
                <div class="sop-action">
                    <a href="${linkHref}" ${target} class="btn ${btnClass}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        ${btnText}
                    </a>
                </div>
            `;
            elements.sopList.appendChild(card);
        });
    }
}

// Event Listeners
function setupEventListeners() {
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        
        if (state.searchQuery.length > 0) {
            elements.clearSearchBtn.classList.remove('hidden');
        } else {
            elements.clearSearchBtn.classList.add('hidden');
        }
        
        renderSOPs();
    });

    elements.clearSearchBtn.addEventListener('click', () => {
        state.searchQuery = '';
        elements.searchInput.value = '';
        elements.clearSearchBtn.classList.add('hidden');
        elements.searchInput.focus();
        renderSOPs();
    });

    elements.resetSearchBtn.addEventListener('click', () => {
        state.searchQuery = '';
        elements.searchInput.value = '';
        elements.clearSearchBtn.classList.add('hidden');
        state.currentCategory = 'All';
        elements.categoryTitle.textContent = 'Semua SOP';
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.querySelector('.nav-item[data-category="All"]').classList.add('active');
        renderSOPs();
    });
}

// Start
document.addEventListener('DOMContentLoaded', init);
