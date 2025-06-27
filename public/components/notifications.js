// components/notifications.js
window.Notifications = {
    // Show generic notification
    show: function(message, type = 'success') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        notification.className = `fixed bottom-4 right-4 ${bgColor} text-white p-4 rounded-lg shadow-lg animate-slide-in z-50`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    },
    
    // Show bonus task notification
    showBonusTask: function(task, projectId) {
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg animate-slide-in z-50';
        notification.innerHTML = `
            <p class="font-bold mb-1">Bonus Task Available! 🎯</p>
            <p class="text-sm">${Utils.escapeHtml(task.title)}</p>
            <button 
                onclick="app.loadData().then(() => app.render()); this.parentElement.remove();"
                class="mt-2 bg-white text-green-500 px-3 py-1 rounded text-sm hover:bg-green-50"
            >
                Show Task
            </button>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 10000);
    },
    
    // Show badge earned notification
    showBadge: function(badge) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-4 rounded-full shadow-2xl z-50 animate-slide-in';
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <span class="text-3xl">${badge.icon}</span>
                <div>
                    <p class="font-bold text-lg">Badge Earned!</p>
                    <p class="text-sm">${badge.name} - ${badge.description}</p>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 5000);
    }
};
