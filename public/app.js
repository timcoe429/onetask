// app.js - Main Project Planner Controller
class ProjectPlannerApp {
    constructor() {
        // State
        this.projects = [];
        this.selectedProject = null;
        this.globalStats = { total_points: 0 };
        this.currentView = 'dashboard'; // 'dashboard' or 'project'
        
        // UI state
        this.showAddProject = false;
        this.showAddTask = false;
        this.newProject = { name: '', description: '', color: '#3B82F6', icon: '📁' };
        this.newTask = { title: '', description: '', priority: 0 };
        
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
                                    <p class="text-2xl font-bold text-blue-600">${this.globalStats.total_points}</p>
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
                        <div class="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-6 hover:border-blue-400 cursor-pointer transition-all"
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
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                 onclick="app.selectProject(${project.id})">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <span class="text-3xl">${project.icon}</span>
                            <h3 class="text-lg font-bold text-gray-800">${project.name}</h3>
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
                                        ${task.title}
                                    </p>
                                    ${task.description ? `
                                        <p class="text-sm text-gray-600 mt-1">${task.description}</p>
                                    ` : ''}
                                </div>
                                <div class="ml-4">
                                    ${isCompleted ? 
                                        '<span class="text-green-500 text-2xl">✓</span>' : 
                                        '<span class="text-gray-300 text-2xl">○</span>'
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
        // This will be implemented next - shows detailed project view with all tasks
        return `
            <div class="min-h-screen bg-gray-50">
                <div class="max-w-4xl mx-auto px-4 py-8">
                    <button onclick="app.backToDashboard()" class="mb-4 text-blue-600 hover:text-blue-800">
                        ← Back to Projects
                    </button>
                    <h2>${this.selectedProject.name}</h2>
                    <!-- Project details here -->
                </div>
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
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div class="bg-white rounded-xl p-6 w-full max-w-md">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">Create New Project</h3>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                            <input 
                                type="text" 
                                id="projectName"
                                value="${this.newProject.name}"
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
                            >${this.newProject.description}</textarea>
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
    
    selectProject(projectId) {
        this.selectedProject = this.projects.find(p => p.id === projectId);
        this.currentView = 'project';
        this.render();
    }
    
    backToDashboard() {
        this.currentView = 'dashboard';
        this.selectedProject = null;
        this.render();
    }
    
    attachEvents() {
        // Global event attachments if needed
    }
    
    updateTheme() {
        // Update theme based on global streak or achievements
        // Similar to the original but simplified
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
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ProjectPlannerApp();
});
