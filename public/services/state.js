// services/state.js
window.StateManager = {
    // Get focus mode from localStorage
    getFocusMode: function() {
        return parseInt(localStorage.getItem('focusMode') || '0');
    },
    
    // Set focus mode in localStorage
    setFocusMode: function(mode) {
        localStorage.setItem('focusMode', mode.toString());
    },
    
    // Get current project index for super focus mode
    getCurrentProjectIndex: function() {
        return parseInt(localStorage.getItem('currentProjectIndex') || '0');
    },
    
    // Set current project index
    setCurrentProjectIndex: function(index) {
        localStorage.setItem('currentProjectIndex', index.toString());
    }
};
