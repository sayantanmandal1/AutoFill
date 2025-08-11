/* Prism.js - Minimal syntax highlighting */
(function() {
    if (typeof self === 'undefined' || !self.Prism || !self.document) {
        return;
    }
    
    Prism.highlightAll = function() {
        var elements = document.querySelectorAll('code[class*="language-"], pre[class*="language-"]');
        for (var i = 0; i < elements.length; i++) {
            Prism.highlightElement(elements[i]);
        }
    };
    
    Prism.highlightElement = function(element) {
        // Basic syntax highlighting for JavaScript
        var code = element.textContent;
        
        // Simple token replacement for demo purposes
        code = code.replace(/(function|const|let|var|if|else|for|while|return|class|async|await)/g, '<span class="token keyword">$1</span>');
        code = code.replace(/('.*?'|".*?")/g, '<span class="token string">$1</span>');
        code = code.replace(/(//.*$)/gm, '<span class="token comment">$1</span>');
        code = code.replace(/(d+)/g, '<span class="token number">$1</span>');
        
        element.innerHTML = code;
    };
    
    // Auto-highlight on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', Prism.highlightAll);
    } else {
        Prism.highlightAll();
    }
})();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Prism;
}