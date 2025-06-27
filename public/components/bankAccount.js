// components/bankAccount.js
window.BankAccount = {
    // Calculate projections based on current stats
    calculateProjections: function(currentTasks, avgTasksPerDay) {
        // If no daily rate yet, assume 1 task per day
        const dailyRate = avgTasksPerDay || 1;
        
        return {
            current: currentTasks,
            sixMonths: Math.round(currentTasks + (dailyRate * 180)),
            oneYear: Math.round(currentTasks + (dailyRate * 365)),
            fiveYears: Math.round(currentTasks + (dailyRate * 365 * 5)),
            tenYears: Math.round(currentTasks + (dailyRate * 365 * 10))
        };
    },
    
    // Get rocket milestone for task count
    getRocketMilestone: function(tasks) {
        // 1 task = 1 ton of thrust
        if (tasks < 50) return { emoji: '🚀', desc: 'Model rocket ready' };
        if (tasks < 180) return { emoji: '🛰️', desc: 'Satellite launcher' };
        if (tasks < 365) return { emoji: '🚀', desc: 'Falcon 9 liftoff!' };
        if (tasks < 1000) return { emoji: '🌙', desc: 'Moon mission ready' };
        if (tasks < 3650) return { emoji: '🔴', desc: 'Mars capable' };
        return { emoji: '⭐', desc: 'Interstellar journey' };
    },
    
    // Render the bank account widget
    render: function(totalTasks, dailyRate, streakBonus = 0) {
        // Don't render if no tasks yet
        if (!totalTasks || totalTasks === 0) {
            return '';
        }
        
        const projections = this.calculateProjections(totalTasks, dailyRate);
        
        // Visual progress bar calculations
        const maxTasks = projections.tenYears;
        const progressPercentage = (totalTasks / maxTasks) * 100;
        
        return `
            <div class="bg-white rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-sm text-gray-500">1 task = 1 ton of thrust</span>
                </div>
                
                <!-- Current Balance -->
                <div class="mb-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-gray-600">Current Thrust Power</span>
                        <span class="text-2xl font-bold text-blue-600">${totalTasks} tons</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div class="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500" 
                             style="width: ${Math.min(progressPercentage, 100)}%"></div>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">${this.getRocketMilestone(totalTasks).desc}</p>
                </div>
                
                <!-- Projections -->
                <div class="space-y-3">
                    <h4 class="text-sm font-medium text-gray-700 mb-2">If you continue at ${dailyRate.toFixed(1)} tasks/day:</h4>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p class="text-xs text-gray-500">6 months</p>
                                <p class="font-semibold">${projections.sixMonths.toLocaleString()} tons</p>
                            </div>
                            <div class="text-right">
                                <span class="text-2xl">🛰️</span>
                                <p class="text-xs text-gray-600">Launch satellite</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p class="text-xs text-gray-500">1 year</p>
                                <p class="font-semibold">${projections.oneYear.toLocaleString()} tons</p>
                            </div>
                            <div class="text-right">
                                <span class="text-2xl">🚀</span>
                                <p class="text-xs text-gray-600">Falcon 9 power</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div>
                                <p class="text-xs text-blue-600">5 years</p>
                                <p class="font-semibold text-blue-700">${projections.fiveYears.toLocaleString()} tons</p>
                            </div>
                            <div class="text-right">
                                <span class="text-2xl">🌙</span>
                                <p class="text-xs text-blue-600">Moon mission!</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <div>
                                <p class="text-xs text-purple-600">10 years</p>
                                <p class="font-semibold text-purple-700">${projections.tenYears.toLocaleString()} tons</p>
                            </div>
                            <div class="text-right">
                                <span class="text-2xl">🔴</span>
                                <p class="text-xs text-purple-600">Mars capable!</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${streakBonus > 0 ? `
                    <div class="mt-4 p-3 bg-orange-50 rounded-lg">
                        <p class="text-sm text-orange-800">
                            🔥 <strong>${streakBonus}% streak bonus active!</strong> Your daily rate is boosted.
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
    }
};
