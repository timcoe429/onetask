// components/modals.js
window.Modals = {
    // Render add project modal
    renderAddProject: function(newProject) {
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
                                value="${Utils.escapeHtml(newProject.name)}"
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
                            >${Utils.escapeHtml(newProject.description)}</textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                            <div class="flex space-x-2">
                                ${icons.map(icon => `
                                    <button 
                                        class="p-2 rounded ${newProject.icon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'}"
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
                                        class="w-8 h-8 rounded ${newProject.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}"
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
    },
    
    // Render add task modal
    renderAddTask: function(selectedProject, bulkTasks) {
        return `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
                <div class="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-in">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">Add Tasks to ${selectedProject.name}</h3>
                    
                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <label class="block text-sm font-medium text-gray-700">Tasks (one per line)</label>
                            <span class="text-xs text-gray-500">${bulkTasks.split('\\n').filter(t => t.trim()).length} tasks</span>
                        </div>
                        <textarea 
                            id="bulkTasks"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            rows="15"
                            placeholder="Enter tasks, one per line:\n\nWrite project proposal\nResearch competitors\nCreate wireframes\nBuild MVP\n\nTip: Start with = for high priority, == for urgent"
                            onchange="app.bulkTasks = this.value"
                            oninput="app.updateTaskCount(this.value)"
                        >${Utils.escapeHtml(bulkTasks)}</textarea>
                        
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
    },
    
    // Render rocket fuel modal
    renderRocketFuel: function(app) {
        const totalTasks = app.globalStats.total_points || 0;
        const dailyRate = app.calculateDailyRate();
        const streakBonus = app.getStreakBonus();
        
        return `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
                <div class="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-in">
                    <div class="sticky top-0 bg-white border-b border-gray-200 p-6 pb-4">
                        <div class="flex items-center justify-between">
                            <h2 class="text-2xl font-bold text-gray-800">🚀 Productivity Rocket Fuel</h2>
                            <button 
                                onclick="app.hideRocketFuelModal()"
                                class="text-gray-400 hover:text-gray-600"
                            >
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="p-6">
                        ${BankAccount.render(totalTasks, dailyRate, streakBonus)}
                    </div>
                </div>
            </div>
        `;
    }
};
