// services/api.js
window.API = {
    // Check authentication
    checkAuth: async function() {
        const authResponse = await fetch('/api/auth/check');
        return await authResponse.json();
    },
    
    // Load projects and stats
    loadData: async function() {
        const [projectsRes, statsRes] = await Promise.all([
            fetch('/api/projects'),
            fetch('/api/stats/global')
        ]);
        
        if (!projectsRes.ok) {
            throw new Error('Failed to load projects');
        }
        
        return {
            projects: await projectsRes.json(),
            globalStats: await statsRes.json()
        };
    },
    
    // Load tasks for a project
    loadProjectTasks: async function(projectId) {
        const response = await fetch(`/api/projects/${projectId}/tasks`);
        if (response.ok) {
            return await response.json();
        }
        return [];
    },
    
    // Create new project
    createProject: async function(projectData) {
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        });
        return response.ok;
    },
    
    // Create bulk tasks
    createBulkTasks: async function(projectId, tasks) {
        const results = [];
        for (const task of tasks) {
            const response = await fetch(`/api/projects/${projectId}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(task)
            });
            results.push(response);
        }
        return results;
    },
    
    // Complete a task
    completeTask: async function(taskId) {
        const response = await fetch(`/api/tasks/${taskId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            return await response.json();
        }
        throw new Error('Failed to complete task');
    },
    
    // Check for bonus task
    checkForBonusTask: async function(projectId) {
        const response = await fetch(`/api/projects/${projectId}/next-task`);
        if (response.ok) {
            return await response.json();
        }
        return null;
    },
    
    // Delete project
    deleteProject: async function(projectId) {
        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.ok;
    },
    
    // Reorder tasks
    reorderTasks: async function(projectId, taskIds) {
        const response = await fetch(`/api/projects/${projectId}/tasks/reorder`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskIds })
        });
        return response.ok;
    },
    
    // Delete a task
    deleteTask: async function(taskId) {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.ok;
    },
    
    // Promote task to current focus
    promoteTask: async function(taskId) {
        const response = await fetch(`/api/tasks/${taskId}/promote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.ok;
    }
};
