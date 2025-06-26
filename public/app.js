// app.js - Complete Project Planner (no dependencies on other files)
class ProjectPlannerApp {
    constructor() {
        // State
        this.projects = [];
        this.selectedProject = null;
        this.projectTasks = [];
        this.globalStats = { total_points: 0 };
        this.currentView = 'dashboard'; // 'dashboard' or 'project'
        
        // UI state
        this.showAddProject = false;
        this.showAddTask = false;
        this.newProject = { name: '', description: '', color: '#3B82F6', icon: '📁' };
        this.newTask = { title: '', description: '', priority: 0 };
        this.bulkTasks = '';
        
        // Initialize
        this.init();
        
        // Make app globally accessible
        window.app = this;
    }
    
    async init() {
        await this.loadData();
        this.render();
        this.startAutoRefresh();
    }
    
    async loadData() {
        try {
            // Load projects with today's tasks
            const [projectsRes, statsRes] = await Promise.all([
                fetch('/api/projects'),
                fetch('/api/stats/global')
            ]);
            
            if (!projectsRes.ok) {
                throw new Error('Failed to load projects');
            }
            
            this.projects = await projectsRes.json();
            this.globalStats = await statsRes.json();
        } catch (err) {
            console.error('Failed to load data:', err);
            this.projects = [];
        }
    }
    
    render() {
        const app = document.getElementById('app');
        
        if (this.currentView === 'dashboard') {
            app.innerHTML = this.renderDashboard();
        } else if (this.currentView === 'project' && this.selectedProject) {
            app.innerHTML = this.renderProjectView();
        }
        
        this.attachEvents();
        this.updateTheme();
    }
    
    renderDashboard() {
        const todayCount = this.projects.filter(p => 
            p.todays_task && p.todays_task.id && p.todays_task.is_completed
        ).length;
        
        return `
            <div class="min-h-screen bg-gray-50">
                <!-- Header -->
                <header class="bg-white shadow-sm border-b border-gray-200">
                    <div class="max-w-6xl mx-auto px-4 py-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <h1 class="text-2xl font-bold text-gray-800">Project Planner</h1>
                                <p class="text-sm text-gray-600">Focus on one task per project, every day</p>
                            </div>
                            <div class="flex items-center space-x-4">
                                <div class="text-right">
                                    <p class="text-2xl font-bold text-blue-600">${this.globalStats.total_points || 0}</p>
                                    <p class="text-xs text-gray-500">Total Points</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-2xl font-bold text-green-600">${todayCount}</p>
                                    <p class="text-xs text-gray-500">Done Today</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Projects Grid -->
                <main class="max-w-6xl mx-auto px-4 py-8">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${this.projects.map(project => this.renderProjectCard(project)).join('')}
                        
                        <!-- Add Project Card -->
                        <div class="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-6 hover:border-blue-400 cursor-pointer transition-all card-hover"
                             onclick="app.showAddProjectModal()">
                            <div class="text-center">
                                <div class="text-4xl mb-2">➕</div>
                                <p class="text-gray-600 font-medium">Add New Project</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            
            ${this.renderModals()}
        `;
    }
    
    renderProjectCard(project) {
        const streak = project.current_streak || 0;
        const task = project.todays_task;
        const hasTask = task && task.id;
        const isCompleted = hasTask && task.is_completed;
        
        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer card-hover"
                 onclick="app.selectProject(${project.id})">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <span class="text-3xl">${project.icon}</span>
                            <h3 class="text-lg font-bold text-gray-800">${this.escapeHtml(project.name)}</h3>
                        </div>
                        <div class="flex items-center space-x-2">
                            ${streak > 0 ? `
                                <div class="flex items-center space-x-1 bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                                    <span class="text-sm">🔥</span>
                                    <span class="text-xs font-bold">${streak}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${hasTask ? `
                        <div class="bg-gray-50 rounded-lg p-4 ${isCompleted ? 'opacity-75' : ''}">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <p class="font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}">
                                        ${this.escapeHtml(task.title)}
                                    </p>
                                    ${task.description ? `
                                        <p class="text-sm text-gray-600 mt-1">${this.escapeHtml(task.description)}</p>
                                    ` : ''}
                                </div>
                                <div class="ml-4">
                                    ${isCompleted ? 
                                        '<span class="text-green-500 text-2xl">✓</span>' : 
                                        '<button onclick="event.stopPropagation(); app.completeTask(' + task.id + ', ' + project.id + ')" class="text-gray-300 hover:text-green-500 text-2xl transition-colors">○</button>'
                                    }
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="bg-yellow-50 rounded-lg p-4">
                            <p class="text-yellow-800 text-sm">No tasks yet. Click to add some!</p>
                        </div>
                    `}
                    
                    <div class="mt-4 flex items-center justify-between text-sm text-gray-500">
                        <span>${project.pending_tasks_count || 0} pending tasks</span>
                        <span>${project.total_points || 0} points</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderProjectView() {
        if (!this.selectedProject) return '';
        
        return `
            <div class="min-h-screen bg-gray-50">
                <div class="max-w-4xl mx-auto px-4 py-8">
                    <button onclick="app.backToDashboard()" class="mb-4 text-blue-600 hover:text-blue-800 flex items-center space-x-2">
                        <span>←</span>
                        <span>Back to Projects</span>
                    </button>
                    
                    <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center space-x-3">
                                <span class="text-4xl">${this.selectedProject.icon}</span>
                                <div>
                                    <h2 class="text-2xl font-bold text-gray-800">${this.escapeHtml(this.selectedProject.name)}</h2>
                                    ${this.selectedProject.description ? 
                                        `<p class="text-gray-600">${this.escapeHtml(this.selectedProject.description)}</p>` : 
                                        ''
                                    }
                                </div>
                            </div>
                            <button 
                                onclick="app.showAddTaskModal()"
                                class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Add Tasks
                            </button>
                        </div>
                        
                        <div class="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p class="text-2xl font-bold text-blue-600">${this.selectedProject.current_streak || 0}</p>
                                <p class="text-sm text-gray-500">Current Streak</p>
                            </div>
                            <div>
                                <p class="text-2xl font-bold text-green-600">${this.selectedProject.total_points || 0}</p>
                                <p class="text-sm text-gray-500">Total Points</p>
                            </div>
                            <div>
                                <p class="text-2xl font-bold text-purple-600">${this.projectTasks.filter(t => t.is_completed).length}</p>
                                <p class="text-sm text-gray-500">Completed Tasks</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">Tasks</h3>
                        <div class="space-y-2" id="tasksList">
                            ${this.projectTasks.length > 0 ? 
                                this.projectTasks.map(task => this.renderTaskItem(task)).join('') :
                                '<p class="text-gray-500 text-center py-8">No tasks yet. Add your first task!</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>
            
            ${this.renderModals()}
        `;
    }
    
    renderTaskItem(task) {
        return `
            <div class="flex items-center p-3 rounded-lg hover:bg-gray-50 ${task.is_completed ? 'opacity-50' : ''}">
                <div class="flex-1">
                    <p class="font-medium ${task.is_completed ? 'line-through text-gray-500' : 'text-gray-800'}">
                        ${this.escapeHtml(task.title)}
                    </p>
                    ${task.description ? 
                        `<p class="text-sm text-gray-600">${this.escapeHtml(task.description)}</p>` : 
                        ''
                    }
                </div>
                ${!task.is_completed ? 
                    `<button 
                        onclick="app.completeTask(${task.id}, ${this.selectedProject.id})"
                        class="ml-4 text-gray-400 hover:text-green-500 transition-colors"
                    >
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </button>` :
                    '<span class="ml-4 text-green-500">✓</span>'
                }
            </div>
        `;
    }
    
    renderModals() {
        return `
            ${this.showAddProject ? this.renderAddProjectModal() : ''}
            ${this.showAddTask ? this.renderAddTaskModal() : ''}
        `;
    }
    
    renderAddProjectModal() {
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
        const icons = ['📁', '🚀', '💡', '🎯', '📊', '🔧', '📝', '🎨'];
        
        return `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
                <div class="bg-white rounded-xl p-6 w-full max-w-md animate-slide-in">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">Create New Project</h3>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                            <input 
                                type="text" 
                                id="projectName"
                                value="${this.escapeHtml(this.newProject.name)}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="My Awesome Project"
                                onchange="app.newProject.name = this.value"
                            />
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                            <textarea 
                                id="projectDesc"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="2"
                                placeholder="What's this project about?"
                                onchange="app.newProject.description = this.value"
                            >${this.escapeHtml(this.newProject.description)}</textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                            <div class="flex space-x-2">
                                ${icons.map(icon => `
                                    <button 
                                        class="p-2 rounded ${this.newProject.icon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'}"
                                        onclick="app.newProject.icon = '${icon}'; app.render()"
                                    >${icon}</button>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Color</label>
                            <div class="flex space-x-2">
                                ${colors.map(color => `
                                    <button 
                                        class="w-8 h-8 rounded ${this.newProject.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}"
                                        style="background-color: ${color}"
                                        onclick="app.newProject.color = '${color}'; app.render()"
                                    ></button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex space-x-3 mt-6">
                        <button 
                            onclick="app.createProject()"
                            class="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                        >
                            Create Project
                        </button>
                        <button 
                            onclick="app.hideAddProjectModal()"
                            class="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderAddTaskModal() {
        return `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
                <div class="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-in">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">Add Tasks to ${this.selectedProject.name}</h3>
                    
                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <label class="block text-sm font-medium text-gray-700">Tasks (one per line)</label>
                            <span class="text-xs text-gray-500">${this.bulkTasks.split('\\n').filter(t => t.trim()).length} tasks</span>
                        </div>
                        <textarea 
                            id="bulkTasks"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            rows="15"
                            placeholder="Enter tasks, one per line:\n\nWrite project proposal\nResearch competitors\nCreate wireframes\nBuild MVP\n\nTip: Start with = for high priority, == for urgent"
                            onchange="app.bulkTasks = this.value"
                            oninput="app.updateTaskCount(this.value)"
                        >${this.escapeHtml(this.bulkTasks)}</textarea>
                        
                        <div class="mt-2 text-xs text-gray-600">
                            <p>📝 <strong>Tips:</strong></p>
                            <p>• One task per line</p>
                            <p>• Start with <code>=</code> for high priority</p>
                            <p>• Start with <code>==</code> for urgent priority</p>
                            <p>• Empty lines are ignored</p>
                        </div>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button 
                            onclick="app.createBulkTasks()"
                            class="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Add All Tasks
                        </button>
                        <button 
                            onclick="app.hideAddTaskModal()"
                            class="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Event handlers
    showAddProjectModal() {
        this.showAddProject = true;
        this.render();
    }
    
    hideAddProjectModal() {
        this.showAddProject = false;
        this.newProject = { name: '', description: '', color: '#3B82F6', icon: '📁' };
        this.render();
    }
    
    showAddTaskModal() {
        this.showAddTask = true;
        this.render();
    }
    
    hideAddTaskModal() {
        this.showAddTask = false;
        this.newTask = { title: '', description: '', priority: 0 };
        this.bulkTasks = '';
        this.render();
    }
    
    updateTaskCount(value) {
        const count = value.split('\n').filter(t => t.trim()).length;
        const countElement = document.querySelector('.text-xs.text-gray-500');
        if (countElement) {
            countElement.textContent = `${count} tasks`;
        }
    }
    
    async createBulkTasks() {
        if (!this.bulkTasks.trim() || !this.selectedProject) return;
        
        const lines = this.bulkTasks.split('\n').filter(line => line.trim());
        const tasks = [];
        
        for (const line of lines) {
            let title = line.trim();
            let priority = 0;
            
            // Check for priority markers
            if (title.startsWith('==')) {
                priority = 2; // Urgent
                title = title.substring(2).trim();
            } else if (title.startsWith('=')) {
                priority = 1; // High
                title = title.substring(1).trim();
            }
            
            if (title) {
                tasks.push({ title, priority, description: '' });
            }
        }
        
        // Show loading state
        const button = document.querySelector('[onclick="app.createBulkTasks()"]');
        const originalText = button.textContent;
        button.textContent = `Adding ${tasks.length} tasks...`;
        button.disabled = true;
        
        try {
            // Create all tasks
            for (const task of tasks) {
                await fetch(`/api/projects/${this.selectedProject.id}/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(task)
                });
            }
            
            // Success - reload and close
            await this.loadProjectTasks();
            this.hideAddTaskModal();
            
            // Show success notification
            this.showNotification(`Successfully added ${tasks.length} tasks!`, 'success');
        } catch (err) {
            console.error('Failed to create tasks:', err);
            button.textContent = originalText;
            button.disabled = false;
            this.showNotification('Failed to add tasks. Please try again.', 'error');
        }
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        notification.className = `fixed bottom-4 right-4 ${bgColor} text-white p-4 rounded-lg shadow-lg animate-slide-in z-50`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
    
    async createProject() {
        if (!this.newProject.name.trim()) return;
        
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.newProject)
            });
            
            if (response.ok) {
                await this.loadData();
                this.hideAddProjectModal();
            }
        } catch (err) {
            console.error('Failed to create project:', err);
        }
    }
    

    
    async selectProject(projectId) {
        this.selectedProject = this.projects.find(p => p.id === projectId);
        if (this.selectedProject) {
            await this.loadProjectTasks();
            this.currentView = 'project';
            this.render();
        }
    }
    
    async loadProjectTasks() {
        if (!this.selectedProject) return;
        
        try {
            const response = await fetch(`/api/projects/${this.selectedProject.id}/tasks`);
            if (response.ok) {
                this.projectTasks = await response.json();
            }
        } catch (err) {
            console.error('Failed to load tasks:', err);
            this.projectTasks = [];
        }
    }
    
    async completeTask(taskId, projectId) {
        try {
            const response = await fetch(`/api/tasks/${taskId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Show badge notification if earned
                if (result.newBadges && result.newBadges.length > 0) {
                    this.showBadgeNotification(result.newBadges[0]);
                }
                
                // Reload data
                await this.loadData();
                
                // If in project view, reload tasks
                if (this.currentView === 'project') {
                    await this.loadProjectTasks();
                }
                
                this.render();
                
                // Check if there's a bonus task available
                if (this.currentView === 'dashboard') {
                    this.checkForBonusTask(projectId);
                }
            }
        } catch (err) {
            console.error('Failed to complete task:', err);
        }
    }
    
    async checkForBonusTask(projectId) {
        try {
            const response = await fetch(`/api/projects/${projectId}/next-task`);
            if (response.ok) {
                const bonusTask = await response.json();
                if (bonusTask) {
                    this.showBonusTaskNotification(bonusTask, projectId);
                }
            }
        } catch (err) {
            console.error('Failed to check for bonus task:', err);
        }
    }
    
    showBonusTaskNotification(task, projectId) {
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg animate-slide-in z-50';
        notification.innerHTML = `
            <p class="font-bold mb-1">Bonus Task Available! 🎯</p>
            <p class="text-sm">${this.escapeHtml(task.title)}</p>
            <button 
                onclick="app.loadData().then(() => app.render()); this.parentElement.remove();"
                class="mt-2 bg-white text-green-500 px-3 py-1 rounded text-sm hover:bg-green-50"
            >
                Show Task
            </button>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 10000);
    }
    
    showBadgeNotification(badge) {
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
    
    backToDashboard() {
        this.currentView = 'dashboard';
        this.selectedProject = null;
        this.projectTasks = [];
        this.render();
    }
    
    attachEvents() {
        // Any global events can be attached here
    }
    
    updateTheme() {
        // Check highest global streak and apply theme
        let highestStreak = 0;
        this.projects.forEach(p => {
            if (p.current_streak > highestStreak) {
                highestStreak = p.current_streak;
            }
        });
        
        // Remove all theme classes
        document.body.classList.remove('theme-fire', 'theme-lightning', 'theme-diamond', 'theme-legendary');
        
        // Apply theme based on highest streak
        if (highestStreak >= 100) {
            document.body.classList.add('theme-legendary');
        } else if (highestStreak >= 30) {
            document.body.classList.add('theme-diamond');
        } else if (highestStreak >= 7) {
            document.body.classList.add('theme-lightning');
        } else if (highestStreak >= 3) {
            document.body.classList.add('theme-fire');
        }
    }
    
    startAutoRefresh() {
        // Refresh data every minute to check for new day
        setInterval(() => {
            this.loadData().then(() => {
                if (this.currentView === 'dashboard') {
                    this.render();
                }
            });
        }, 60000);
    }
    
    // Utility function to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ProjectPlannerApp();
});
