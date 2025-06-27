// components/dashboard.js
window.Dashboard = {
    // Render the main dashboard
    render: function(app) {
        const todayCount = app.projects.filter(p => 
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
                                <button 
                                    onclick="Dashboard.renderModal(app)"
                                    class="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                    title="View Dashboard"
                                >
                                    <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                    </svg>
                                </button>
                                <div class="text-right">
                                    <p class="text-2xl font-bold text-blue-600">${app.globalStats.total_points || 0}</p>
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
                        ${app.projects.map(project => Dashboard.renderProjectCard(app, project)).join('')}
                        
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
        `;
    },
    
    // Render project card
    renderProjectCard: function(app, project) {
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
                            <h3 class="text-lg font-bold text-gray-800">${Utils.escapeHtml(project.name)}</h3>
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
                                        ${Utils.escapeHtml(task.title)}
                                    </p>
                                    ${task.description ? `
                                        <p class="text-sm text-gray-600 mt-1">${Utils.escapeHtml(task.description)}</p>
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
    },
    
    // Render dashboard modal
    renderModal: function(app) {
        // Remove any existing modal
        const existingModal = document.getElementById('dashboardModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'dashboardModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in';
        
        const todayCount = app.projects.filter(p => 
            p.todays_task && p.todays_task.id && p.todays_task.is_completed
        ).length;

        const activeTasks = app.projects.filter(p => 
            p.todays_task && p.todays_task.id && !p.todays_task.is_completed
        ).length;

        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-in">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
                    <button 
                        onclick="document.getElementById('dashboardModal').remove()"
                        class="text-gray-500 hover:text-gray-700"
                    >
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-blue-50 rounded-lg p-4">
                        <p class="text-3xl font-bold text-blue-600">${app.globalStats.total_points || 0}</p>
                        <p class="text-sm text-gray-600">Total Points</p>
                    </div>
                    <div class="bg-green-50 rounded-lg p-4">
                        <p class="text-3xl font-bold text-green-600">${todayCount}</p>
                        <p class="text-sm text-gray-600">Completed Today</p>
                    </div>
                    <div class="bg-yellow-50 rounded-lg p-4">
                        <p class="text-3xl font-bold text-yellow-600">${activeTasks}</p>
                        <p class="text-sm text-gray-600">Active Tasks</p>
                    </div>
                    <div class="bg-purple-50 rounded-lg p-4">
                        <p class="text-3xl font-bold text-purple-600">${app.projects.length}</p>
                        <p class="text-sm text-gray-600">Total Projects</p>
                    </div>
                </div>

                <!-- Project Progress -->
                <div class="flex-1 overflow-y-auto">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">Project Progress</h3>
                    <div class="space-y-3">
                        ${app.projects.map(project => {
                            const streak = project.current_streak || 0;
                            const points = project.total_points || 0;
                            const pendingTasks = project.pending_tasks_count || 0;
                            const todayTask = project.todays_task;
                            const hasTask = todayTask && todayTask.id;
                            const isCompleted = hasTask && todayTask.is_completed;

                            return `
                                <div class="bg-gray-50 rounded-lg p-4">
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="flex items-center space-x-2">
                                            <span class="text-xl">${project.icon}</span>
                                            <h4 class="font-medium text-gray-800">${Utils.escapeHtml(project.name)}</h4>
                                        </div>
                                        <div class="flex items-center space-x-3 text-sm">
                                            ${streak > 0 ? `
                                                <span class="flex items-center space-x-1 text-orange-600">
                                                    <span>🔥</span>
                                                    <span>${streak}</span>
                                                </span>
                                            ` : ''}
                                            <span class="text-gray-600">${points} pts</span>
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center justify-between text-sm">
                                        <span class="text-gray-600">${pendingTasks} pending tasks</span>
                                        ${hasTask ? 
                                            `<span class="${isCompleted ? 'text-green-600' : 'text-yellow-600'}">
                                                ${isCompleted ? '✓ Completed today' : '○ Today\'s task pending'}
                                            </span>` :
                                            '<span class="text-gray-400">No task assigned</span>'
                                        }
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Close Button -->
                <button 
                    onclick="document.getElementById('dashboardModal').remove()"
                    class="mt-6 w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Close Dashboard
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
};
