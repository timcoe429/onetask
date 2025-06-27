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
                                <h1 class="text-2xl font-bold text-gray-800">OneTask</h1>
                                <p class="text-sm text-gray-600">${app.focusMode === 2 ? 'Super Focus Mode - One project at a time' : app.focusMode === 1 ? 'Focus Mode' : 'One task. Everyday. Forever.'}</p>
                            </div>
                            <div class="flex items-center space-x-4">
                                <div class="text-center">
                                    <p class="text-2xl font-bold text-blue-600">${app.globalStats.total_points || 0}</p>
                                    <p class="text-xs text-gray-500">Total Points</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-2xl font-bold text-green-600">${todayCount}</p>
                                    <p class="text-xs text-gray-500">Done Today</p>
                                </div>
                                
                                <!-- Focus Toggle -->
                                <button 
                                    onclick="app.toggleFocus()"
                                    class="flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all ${
                                        app.focusMode === 2 
                                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                            : app.focusMode === 1
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }"
                                    title="${app.focusMode === 2 ? 'Super Focus Mode' : app.focusMode === 1 ? 'Focus Mode' : 'Normal Mode'}"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    <span class="text-sm font-medium">${app.focusMode === 2 ? 'SUPER' : app.focusMode === 1 ? 'ON' : 'OFF'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Projects Grid -->
                <main class="max-w-6xl mx-auto px-4 py-8">
                    <!-- Bank Account Widget -->
                    ${app.globalStats && app.globalStats.total_points ? 
                        BankAccount.render(
                            app.globalStats.total_points || 0,
                            1.2, // Default daily rate for now
                            0    // Default no streak bonus for now
                        ) : ''
                    }
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${app.focusMode === 2 ? 
                            // Super Focus Mode - show only current project
                            (() => {
                                const activeProjects = app.projects.filter(p => {
                                    const task = p.todays_task;
                                    return task && task.id && !task.is_completed;
                                });
                                
                                if (activeProjects.length === 0) {
                                    return `
                                        <div class="col-span-full">
                                            <div class="bg-white rounded-xl shadow-sm p-12 text-center">
                                                <div class="text-6xl mb-4">🎉</div>
                                                <h3 class="text-2xl font-bold text-gray-800 mb-2">All Done!</h3>
                                                <p class="text-gray-600 mb-6">You've completed all tasks for today!</p>
                                                <button 
                                                    onclick="app.toggleFocus()"
                                                    class="text-blue-600 hover:text-blue-800"
                                                >
                                                    Exit Super Focus Mode
                                                </button>
                                            </div>
                                        </div>
                                    `;
                                }
                                
                                // Ensure currentProjectIndex is valid
                                if (app.currentProjectIndex >= activeProjects.length) {
                                    app.currentProjectIndex = 0;
                                    localStorage.setItem('currentProjectIndex', '0');
                                }
                                
                                const currentProject = activeProjects[app.currentProjectIndex];
                                return `
                                    <div class="col-span-full">
                                        <div class="text-center mb-6 text-lg text-gray-500">
                                            Project ${app.currentProjectIndex + 1} of ${activeProjects.length}
                                        </div>
                                        <div class="max-w-4xl mx-auto transform scale-110">
                                            ${this.renderProjectCard(currentProject, app)}
                                        </div>
                                    </div>
                                `;
                            })() :
                            // Normal or Focus mode - show all projects
                            app.projects.map(project => this.renderProjectCard(project, app)).join('')
                        }
                        
                        ${app.focusMode !== 2 ? `
                            <!-- Add Project Card -->
                            <div class="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-6 hover:border-blue-400 cursor-pointer transition-all card-hover"
                                 onclick="app.showAddProjectModal()">
                                <div class="text-center">
                                    <div class="text-4xl mb-2">➕</div>
                                    <p class="text-gray-600 font-medium">Add New Project</p>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </main>
            </div>
            
            ${app.renderModals()}
        `;
    },
    
    // Render individual project card
    renderProjectCard: function(project, app) {
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
                    
                    ${app.focusMode === 0 ? `
                        <div class="mt-4 flex items-center justify-between text-sm text-gray-500">
                            <span>${project.pending_tasks_count || 0} pending tasks</span>
                            <span>${project.total_points || 0} points</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
};
