// Documentation Website JavaScript

// Search functionality
class DocumentationSearch {
    constructor() {
        this.searchInput = document.getElementById('search-input');
        this.searchResults = document.querySelector('.search-results');
        this.searchIndex = [];
        
        this.init();
    }
    
    async init() {
        if (this.searchInput) {
            await this.buildSearchIndex();
            this.setupEventListeners();
        }
    }
    
    async buildSearchIndex() {
        // Build search index from page content
        const content = document.body.textContent;
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        
        headings.forEach(heading => {
            this.searchIndex.push({
                title: heading.textContent,
                url: '#' + (heading.id || ''),
                type: 'heading',
                content: heading.textContent
            });
        });
        
        // Add API methods to search index
        const methods = Array.from(document.querySelectorAll('.api-method'));
        methods.forEach(method => {
            const signature = method.querySelector('.method-signature');
            if (signature) {
                this.searchIndex.push({
                    title: signature.textContent,
                    url: '#' + method.id,
                    type: 'method',
                    content: method.textContent
                });
            }
        });
    }
    
    setupEventListeners() {
        this.searchInput.addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });
        
        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value) {
                this.showResults();
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideResults();
            }
        });
    }
    
    performSearch(query) {
        if (!query.trim()) {
            this.hideResults();
            return;
        }
        
        const results = this.searchIndex.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.content.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
        
        this.displayResults(results);
    }
    
    displayResults(results) {
        if (results.length === 0) {
            this.searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
        } else {
            this.searchResults.innerHTML = results.map(result => 
                `<div class="search-result-item">
                    <a href="${result.url}" class="search-result-link">
                        <div class="search-result-title">${result.title}</div>
                        <div class="search-result-type">${result.type}</div>
                    </a>
                </div>`
            ).join('');
        }
        
        this.showResults();
    }
    
    showResults() {
        this.searchResults.style.display = 'block';
    }
    
    hideResults() {
        this.searchResults.style.display = 'none';
    }
}

// Smart Fields Demo
class SmartFieldsDemo {
    constructor() {
        this.init();
    }
    
    init() {
        const genderButton = document.getElementById('demo-gender-fill');
        const campusButton = document.getElementById('demo-campus-fill');
        
        if (genderButton) {
            genderButton.addEventListener('click', () => this.demoGenderFill());
        }
        
        if (campusButton) {
            campusButton.addEventListener('click', () => this.demoCampusFill());
        }
    }
    
    demoGenderFill() {
        const genderSelect = document.getElementById('gender-select');
        const sexSelect = document.getElementById('sex-select');
        
        // Simulate smart gender selection
        if (genderSelect) {
            genderSelect.value = 'Male';
            this.highlightField(genderSelect);
        }
        
        if (sexSelect) {
            sexSelect.value = 'M';
            this.highlightField(sexSelect);
        }
        
        this.showToast('Gender fields filled using smart selection!', 'success');
    }
    
    demoCampusFill() {
        const campusSelect = document.getElementById('campus-select');
        const universitySelect = document.getElementById('university-select');
        
        // Simulate smart campus selection
        if (campusSelect) {
            campusSelect.value = 'VIT-AP';
            this.highlightField(campusSelect);
        }
        
        if (universitySelect) {
            universitySelect.value = 'amaravathi';
            this.highlightField(universitySelect);
        }
        
        this.showToast('Campus fields filled using smart selection!', 'success');
    }
    
    highlightField(field) {
        field.style.background = '#dcfce7';
        field.style.borderColor = '#10b981';
        
        setTimeout(() => {
            field.style.background = '';
            field.style.borderColor = '';
        }, 2000);
    }
    
    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DocumentationSearch();
    new SmartFieldsDemo();
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});