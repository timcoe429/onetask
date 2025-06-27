// components/projectView.js
window.ProjectView = {
    // Render the project detail view
    render: function(app) {
        if (!app.selectedProject) return '';
        
        // Get today's task or next available task
        const todayTask = app.projectTasks.find(t => !t.is_completed);
        const completedToday = app.projectTasks.filter(t => {
            if (!t.completed_at) return false;
            const completedDate = new Date(t.completed_at).toDateString();
            const today = new Date().toDateString();
            return completedDate === today;
        }).length;
        
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
                                <span class="text-4xl">${app.selectedProject.icon}</span>
                                <div>
                                    <h2 class="text-2xl font-bold text-gray-800">${Utils.escapeHtml(app.selectedProject.name)}</h2>
                                    ${app.selectedProject.description ? 
                                        `<p class="text-gray-600">${Utils.escapeHtml(app.selectedProject.description)}</p>` : 
                                        ''
                                    }
                                </div>
                            </div>
                            ${app.focusMode === 0 ? `
                                <button 
                                    onclick="app.showAddTaskModal()"
                                    class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Add Tasks
                                </button>
                            ` : ''}
                        </div>
                        
                        <div class="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p class="text-2xl font-bold text-blue-600">${app.selectedProject.current_streak || 0}</p>
                                <p class="text-sm text-gray-500">Current Streak</p>
                            </div>
                            <div>
                                <p class="text-2xl font-bold text-green-600">${app.selectedProject.total_points || 0}</p>
                                <p class="text-sm text-gray-500">Total Points</p>
                            </div>
                            <div>
                                <p class="text-2xl font-bold text-purple-600">${app.projectTasks.filter(t => t.is_completed).length}</p>
                                <p class="text-sm text-gray-500">Completed Tasks</p>
                            </div>
                        </div>
                    </div>
                    
                    ${app.focusMode === 0 ? 
                        this.renderNormalView(app, todayTask, completedToday) : 
                        this.renderFocusView(app, todayTask, completedToday)
                    }
                </div>
            </div>
            
            ${app.renderModals()}
        `;
    },
    
    // Render normal view with task queue
    renderNormalView: function(app, todayTask, completedToday) {
        return `
            <div class="mb-6">
                <h3 class="text-lg font-bold text-gray-800 mb-4">Today's Task</h3>
                ${todayTask ? `
                    <div class="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                        <div class="flex items-center justify-between">
                            <div class="flex-1 pr-4">
                                <h4 class="text-2xl font-bold text-gray-800 mb-2">${Utils.escapeHtml(todayTask.title)}</h4>
                                ${todayTask.description ? 
                                    `<p class="text-lg text-gray-600">${Utils.escapeHtml(todayTask.description)}</p>` : 
                                    ''
                                }
                            </div>
                            <button 
                                onclick="app.completeTask(${todayTask.id}, ${app.selectedProject.id})"
                                class="flex-shrink-0 w-16 h-16 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 text-gray-300 hover:text-green-500 rounded-full transition-all transform hover:scale-110 flex items-center justify-center group"
                                title="Mark as complete"
                            >
                                <svg class="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                <div class="absolute w-16 h-16 border-2 border-gray-300 rounded-full group-hover:hidden"></div>
                            </button>
                        </div>
                        ${completedToday > 0 ? 
                            `<div class="mt-4 text-sm text-green-600">
                                <p>🎯 You've already completed ${completedToday} task${completedToday > 1 ? 's' : ''} today!</p>
                            </div>` : 
                            ''
                        }
                    </div>
                ` : `
                    <div class="bg-white rounded-xl shadow-sm p-8 text-center">
                        ${app.projectTasks.length === 0 ? 
                            `<div>
                                <p class="text-gray-500 text-lg mb-4">No tasks yet for this project.</p>
                                <button 
                                    onclick="app.showAddTaskModal()"
                                    class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Add Your First Task
                                </button>
                            </div>` : 
                            `<div>
                                <p class="text-green-600 text-xl font-bold mb-2">🎉 All tasks completed!</p>
                                <p class="text-gray-600">Great job! Add more tasks to keep the momentum going.</p>
                                <button 
                                    onclick="app.showAddTaskModal()"
                                    class="mt-4 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Add More Tasks
                                </button>
                            </div>`
                        }
                    </div>
                `}
            </div>
            
            <div class="bg-white rounded-xl shadow-sm p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-gray-800">Task Queue</h3>
                    <span class="text-sm text-gray-500">${app.projectTasks.filter(t => !t.is_completed).length} pending</span>
                </div>
                <div class="space-y-2 max-h-64 overflow-y-auto" id="tasksList">
                    ${app.projectTasks.filter(t => !t.is_completed && t.id !== todayTask?.id).length > 0 ? 
                        app.projectTasks.filter(t => !t.is_completed && t.id !== todayTask?.id).map((task, index) => `
                            <div class="flex items-center p-3 rounded-lg bg-gray-50">
                                <span class="text-gray-400 text-sm mr-3">#${index + 2}</span>
                                <div class="flex-1">
                                    <p class="text-gray-700">${Utils.escapeHtml(task.title)}</p>
                                </div>
                            </div>
                        `).join('') :
                        '<p class="text-gray-400 text-center py-4">No more tasks in queue</p>'
                    }
                </div>
            </div>
        `;
    },
    
    // Render focus view
    renderFocusView: function(app, todayTask, completedToday) {
        if (!todayTask) {
            return `
                <div class="bg-white rounded-xl shadow-sm p-12 text-center">
                    ${app.projectTasks.length === 0 ? 
                        `<div>
                            <div class="text-6xl mb-4">📝</div>
                            <h3 class="text-2xl font-bold text-gray-800 mb-2">No tasks yet</h3>
                            <p class="text-gray-600 mb-6">Exit Focus Mode to add tasks to this project.</p>
                            <button 
                                onclick="app.toggleFocus()"
                                class="text-blue-600 hover:text-blue-800"
                            >
                                Exit Focus Mode
                            </button>
                        </div>` : 
                        `<div>
                            <div class="text-6xl mb-4">🎉</div>
                            <h3 class="text-2xl font-bold text-gray-800 mb-2">All Done!</h3>
                            <p class="text-gray-600 mb-6">You've completed all tasks in this project.</p>
                            <button 
                                onclick="app.toggleFocus()"
                                class="text-blue-600 hover:text-blue-800"
                            >
                                Exit Focus Mode to add more tasks
                            </button>
                        </div>`
                    }
                </div>
            `;
        }
        
        return `
            <div class="bg-white rounded-xl shadow-sm p-8">
                <div class="max-w-2xl mx-auto">
                    <h3 class="text-center text-sm font-medium text-gray-500 mb-6">TODAY'S FOCUS</h3>
                    <div class="text-center mb-8">
                        <h2 class="text-3xl font-bold text-gray-800 mb-3">${Utils.escapeHtml(todayTask.title)}</h2>
                        ${todayTask.description ? 
                            `<p class="text-lg text-gray-600">${Utils.escapeHtml(todayTask.description)}</p>` : 
                            ''
                        }
                    </div>
                    <div class="flex justify-center">
                        <button 
                            onclick="app.completeTask(${todayTask.id}, ${app.selectedProject.id})"
                            class="group flex items-center space-x-3 bg-green-500 text-white px-8 py-4 rounded-full hover:bg-green-600 transition-all transform hover:scale-105"
                        >
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span class="text-xl font-medium">Mark Complete</span>
                        </button>
                    </div>
                    ${completedToday > 0 ? 
                        `<div class="mt-6 text-center text-sm text-green-600">
                            <p>🎯 You've already completed ${completedToday} task${completedToday > 1 ? 's' : ''} today!</p>
                        </div>` : 
                        ''
                    }
                </div>
            </div>
        `;
    }
};
