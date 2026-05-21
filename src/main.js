import sopData from './data/sop_data.json';

const LINK_OVERRIDES_KEY = 'sopDocumentLinkOverrides';

// State
let state = {
    sops: sopData,
    currentCategory: 'All', // 'All' or specific category name
    searchQuery: '',
    categories: [],
    linkOverrides: {},
    activeSopNumber: null
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
    resetSearchBtn: document.getElementById('reset-search-btn'),
    linkModal: document.getElementById('link-modal'),
    linkForm: document.getElementById('link-form'),
    linkModalClose: document.getElementById('link-modal-close'),
    selectedSopName: document.getElementById('selected-sop-name'),
    selectedSopNumber: document.getElementById('selected-sop-number'),
    documentLinkInput: document.getElementById('document-link-input'),
    removeLinkBtn: document.getElementById('remove-link-btn'),
    cancelLinkBtn: document.getElementById('cancel-link-btn'),
    toast: document.getElementById('toast')
};

// Initialize
function init() {
    // Hide loader
    if(elements.loadingState) elements.loadingState.classList.add('hidden');
    if(elements.sopList) elements.sopList.classList.remove('hidden');

    extractCategories();
    state.linkOverrides = loadLinkOverrides();
    renderNavigation();
    renderSOPs();
    setupEventListeners();
}

function loadLinkOverrides() {
    try {
        return JSON.parse(localStorage.getItem(LINK_OVERRIDES_KEY)) || {};
    } catch (error) {
        console.warn('Gagal membaca link SOP tersimpan:', error);
        return {};
    }
}

function saveLinkOverrides() {
    localStorage.setItem(LINK_OVERRIDES_KEY, JSON.stringify(state.linkOverrides));
}

function getSopLink(sop) {
    if (Object.prototype.hasOwnProperty.call(state.linkOverrides, sop.number)) {
        return state.linkOverrides[sop.number];
    }
    return sop.link || '';
}

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.remove('hidden');
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
        elements.toast.classList.add('hidden');
    }, 2500);
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
            
            const documentLink = getSopLink(sop);
            const linkHref = documentLink || '#';
            const target = documentLink ? 'target="_blank" rel="noopener noreferrer"' : '';
            const btnClass = documentLink ? 'btn-primary' : 'btn-outline';
            const btnText = documentLink ? 'Lihat Dokumen' : 'Tidak Ada Link';
            const editText = documentLink ? 'Ubah Link' : 'Input Link';

            // Buttons enabled with parsed links
            card.innerHTML = `
                <div class="sop-badge-container">
                    <span class="sop-doc-badge">${escapeHTML(sop.document || 'DOC')}</span>
                    <span class="sop-number">${escapeHTML(sop.number)}</span>
                </div>
                <h3 class="sop-title">${escapeHTML(sop.name)}</h3>
                <div class="sop-action">
                    <a href="${escapeHTML(linkHref)}" ${target} class="btn ${btnClass}" ${documentLink ? '' : 'aria-disabled="true"'}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        ${btnText}
                    </a>
                    <button type="button" class="btn btn-secondary edit-link-btn" data-sop-number="${escapeHTML(sop.number)}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                        ${editText}
                    </button>
                </div>
            `;
            if (!documentLink) {
                card.querySelector('a').addEventListener('click', (event) => event.preventDefault());
            }
            card.querySelector('.edit-link-btn').addEventListener('click', () => openLinkModal(sop));
            elements.sopList.appendChild(card);
        });
    }
}

function openLinkModal(sop) {
    state.activeSopNumber = sop.number;
    elements.selectedSopName.textContent = sop.name;
    elements.selectedSopNumber.textContent = sop.number;
    elements.documentLinkInput.value = getSopLink(sop);
    elements.linkModal.classList.remove('hidden');
    elements.documentLinkInput.focus();
}

function closeLinkModal() {
    state.activeSopNumber = null;
    elements.linkModal.classList.add('hidden');
    elements.linkForm.reset();
}

function getActiveSop() {
    return state.sops.find(sop => sop.number === state.activeSopNumber);
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

    elements.linkForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const activeSop = getActiveSop();
        const nextLink = elements.documentLinkInput.value.trim();

        if (!activeSop || !nextLink) return;

        state.linkOverrides[activeSop.number] = nextLink;
        saveLinkOverrides();
        closeLinkModal();
        renderSOPs();
        showToast('Link dokumen berhasil disimpan.');
    });

    elements.removeLinkBtn.addEventListener('click', () => {
        const activeSop = getActiveSop();
        if (!activeSop) return;

        delete state.linkOverrides[activeSop.number];
        saveLinkOverrides();
        closeLinkModal();
        renderSOPs();
        showToast('Link khusus SOP dihapus.');
    });

    elements.cancelLinkBtn.addEventListener('click', closeLinkModal);
    elements.linkModalClose.addEventListener('click', closeLinkModal);
    elements.linkModal.addEventListener('click', (event) => {
        if (event.target === elements.linkModal) {
            closeLinkModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !elements.linkModal.classList.contains('hidden')) {
            closeLinkModal();
        }
    });
}

// Start
document.addEventListener('DOMContentLoaded', init);
