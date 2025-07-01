// app.js - Main controller (now much cleaner!)
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
        this.showRocketFuel = false;
        this.newProject = { name: '', description: '', color: '#3B82F6', icon: '📁' };
        this.newTask = { title: '', description: '', priority: 0 };
        this.bulkTasks = '';
        
        // Focus modes: 0 = off, 1 = focus, 2 = super focus
        this.focusMode = StateManager.getFocusMode();
        this.currentProjectIndex = StateManager.getCurrentProjectIndex();
        
        // Initialize
        this.init();
        
        // Make app globally accessible
        window.app = this;
    }
    
    async init() {
        try {
            const { authenticated } = await API.checkAuth();
            
            if (!authenticated) {
                window.location.href = '/login';
                return;
            }
        } catch (err) {
            console.error('Auth check failed:', err);
            window.location.href = '/login';
            return;
        }
        await this.loadData();
        this.render();
        this.startAutoRefresh();
    }
    
    async loadData() {
        try {
            const data = await API.loadData();
            this.projects = data.projects;
            this.globalStats = data.globalStats;
        } catch (err) {
            console.error('Failed to load data:', err);
            this.projects = [];
        }
    }
    
    render() {
        const app = document.getElementById('app');
        
        if (this.currentView === 'dashboard') {
            app.innerHTML = Dashboard.render(this);
        } else if (this.currentView === 'project' && this.selectedProject) {
            app.innerHTML = ProjectView.render(this);
        }
        
        this.attachEvents();
        this.updateTheme();
    }
    
    renderModals() {
        return `
            ${this.showAddProject ? Modals.renderAddProject(this.newProject) : ''}
            ${this.showAddTask ? Modals.renderAddTask(this.selectedProject, this.bulkTasks) : ''}
            ${this.showRocketFuel ? Modals.renderRocketFuel(this) : ''}
        `;
    }
    
    // Event handlers
    toggleFocus() {
        // Cycle through modes: 0 -> 1 -> 2 -> 0
        this.focusMode = (this.focusMode + 1) % 3;
        StateManager.setFocusMode(this.focusMode);
        
        // Reset project index when entering super focus mode
        if (this.focusMode === 2) {
            this.currentProjectIndex = 0;
            StateManager.setCurrentProjectIndex(0);
        }
        
        this.render();
    }
    
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
    
    showRocketFuelModal() {
        this.showRocketFuel = true;
        this.render();
    }
    
    hideRocketFuelModal() {
        this.showRocketFuel = false;
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
            await API.createBulkTasks(this.selectedProject.id, tasks);
            
            // Success - reload and close
            await this.loadProjectTasks();
            this.hideAddTaskModal();
            
            // Show success notification
            Notifications.show(`Successfully added ${tasks.length} tasks!`, 'success');
        } catch (err) {
            console.error('Failed to create tasks:', err);
            button.textContent = originalText;
            button.disabled = false;
            Notifications.show('Failed to add tasks. Please try again.', 'error');
        }
    }
    
    async createProject() {
        if (!this.newProject.name.trim()) return;
        
        try {
            const success = await API.createProject(this.newProject);
            
            if (success) {
                await this.loadData();
                this.hideAddProjectModal();
            }
        } catch (err) {
            console.error('Failed to create project:', err);
        }
    }
    
    async deleteProject(projectId) {
        if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            return;
        }
        
        try {
            const success = await API.deleteProject(projectId);
            
            if (success) {
                await this.loadData();
                // If we're viewing the deleted project, go back to dashboard
                if (this.selectedProject && this.selectedProject.id === projectId) {
                    this.backToDashboard();
                } else {
                    this.render();
                }
                Notifications.show('Project deleted successfully', 'success');
            }
        } catch (err) {
            console.error('Failed to delete project:', err);
            Notifications.show('Failed to delete project', 'error');
        }
    }
    
    async reorderTasks(taskIds) {
        if (!this.selectedProject) return;
        
        try {
            const success = await API.reorderTasks(this.selectedProject.id, taskIds);
            
            if (success) {
                await this.loadProjectTasks();
                this.render();
                Notifications.show('Tasks reordered successfully', 'success');
            }
        } catch (err) {
            console.error('Failed to reorder tasks:', err);
            Notifications.show('Failed to reorder tasks', 'error');
        }
    }
    
    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        try {
            const success = await API.deleteTask(taskId);
            
            if (success) {
                await this.loadProjectTasks();
                this.render();
                Notifications.show('Task deleted successfully', 'success');
            }
        } catch (err) {
            console.error('Failed to delete task:', err);
            Notifications.show('Failed to delete task', 'error');
        }
    }
    
    async promoteTask(taskId) {
        try {
            const success = await API.promoteTask(taskId);
            
            if (success) {
                await this.loadProjectTasks();
                this.render();
                Notifications.show('Task promoted to current focus!', 'success');
            }
        } catch (err) {
            console.error('Failed to promote task:', err);
            Notifications.show('Failed to promote task', 'error');
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
            this.projectTasks = await API.loadProjectTasks(this.selectedProject.id);
        } catch (err) {
            console.error('Failed to load tasks:', err);
            this.projectTasks = [];
        }
    }
    
    async completeTask(taskId, projectId) {
        try {
            const result = await API.completeTask(taskId);
            
            // Show badge notification if earned
            if (result.newBadges && result.newBadges.length > 0) {
                Notifications.showBadge(result.newBadges[0]);
            }
            
            // Reload data
            await this.loadData();
            
            // If in project view, reload tasks
            if (this.currentView === 'project') {
                await this.loadProjectTasks();
            }
            
            this.render();
            
            // In super focus mode, advance to next project after completing task
            if (this.focusMode === 2 && this.currentView === 'dashboard') {
                const activeProjects = this.projects.filter(p => {
                    const task = p.todays_task;
                    return task && task.id && !task.is_completed;
                });
                
                if (activeProjects.length > 0) {
                    // Move to next project with uncompleted task
                    this.currentProjectIndex = (this.currentProjectIndex + 1) % activeProjects.length;
                    StateManager.setCurrentProjectIndex(this.currentProjectIndex);
                    this.render();
                }
            }
            
            // Check if there's a bonus task available
            if (this.currentView === 'dashboard') {
                this.checkForBonusTask(projectId);
            }
        } catch (err) {
            console.error('Failed to complete task:', err);
        }
    }
    
    async checkForBonusTask(projectId) {
        try {
            const bonusTask = await API.checkForBonusTask(projectId);
            if (bonusTask) {
                Notifications.showBonusTask(bonusTask, projectId);
            }
        } catch (err) {
            console.error('Failed to check for bonus task:', err);
        }
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
    
    // Calculate average daily task completion rate
    calculateDailyRate() {
        // For now, calculate based on total points and account age
        // In a real app, you'd track this properly in the database
        const accountAgeDays = 30; // Would come from user registration date
        if (accountAgeDays === 0) return 1;
        
        return (this.globalStats.total_points || 0) / accountAgeDays;
    }
    
    // Get current streak bonus percentage
    getStreakBonus() {
        let highestStreak = 0;
        this.projects.forEach(p => {
            if (p.current_streak > highestStreak) {
                highestStreak = p.current_streak;
            }
        });
        
        // Streak bonuses
        if (highestStreak >= 30) return 30;  // 30% bonus
        if (highestStreak >= 7) return 20;   // 20% bonus
        if (highestStreak >= 3) return 10;   // 10% bonus
        return 0;
    }
}

// Drag and drop functionality for task reordering
let draggedElement = null;

window.handleDragStart = function(e) {
    draggedElement = e.target.closest('.task-item');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', draggedElement.outerHTML);
    draggedElement.classList.add('opacity-50');
};

window.handleDragOver = function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const taskItem = e.target.closest('.task-item');
    if (taskItem && taskItem !== draggedElement) {
        const rect = taskItem.getBoundingClientRect();
        const middle = rect.top + rect.height / 2;
        
        // Remove previous indicators
        document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
        
        // Add drop indicator
        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator h-1 bg-blue-500 rounded mx-4 my-1';
        
        if (e.clientY < middle) {
            taskItem.parentNode.insertBefore(indicator, taskItem);
        } else {
            taskItem.parentNode.insertBefore(indicator, taskItem.nextSibling);
        }
    }
};

window.handleDrop = function(e) {
    e.preventDefault();
    
    const taskItem = e.target.closest('.task-item');
    if (taskItem && taskItem !== draggedElement) {
        const rect = taskItem.getBoundingClientRect();
        const middle = rect.top + rect.height / 2;
        
        if (e.clientY < middle) {
            taskItem.parentNode.insertBefore(draggedElement, taskItem);
        } else {
            taskItem.parentNode.insertBefore(draggedElement, taskItem.nextSibling);
        }
        
        // Get new order of task IDs
        const tasksList = document.getElementById('tasksList');
        const taskItems = tasksList.querySelectorAll('.task-item');
        const taskIds = Array.from(taskItems).map(item => parseInt(item.dataset.taskId));
        
        // Send reorder request
        if (window.app) {
            window.app.reorderTasks(taskIds);
        }
    }
    
    // Clean up
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
};

window.handleDragEnd = function(e) {
    if (draggedElement) {
        draggedElement.classList.remove('opacity-50');
        draggedElement = null;
    }
    
    // Clean up any remaining indicators
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
};

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ProjectPlannerApp();
});
