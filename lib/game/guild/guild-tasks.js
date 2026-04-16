const { zones } = require("../_UNIVERSE");

// Task templates
const taskTemplates = [
  // Kill tasks
  {
    type: "kill",
    descriptions: [
      "在 {zone} 擊敗 {count} 個敵人",
      "征服 {zone} 的怪物",
      "掃蕩 {zone}",
    ],
    targetRange: [5, 15],
    reward: { goldRange: [100, 300] },
  },
  // Collect tasks
  {
    type: "collect",
    descriptions: [
      "收集 {count} 份 {resource}",
      "囤積 {resource} x{count}",
    ],
    resources: ["水果", "水", "木材", "鐵礦", "草藥"],
    targetRange: [10, 30],
    reward: { goldRange: [150, 400], itemChance: 0.3 },
  },
  // Explore tasks
  {
    type: "explore",
    descriptions: [
      "探索 {zone} 3次",
      "征服 {zone}",
    ],
    targetRange: [3, 5],
    reward: { goldRange: [200, 500], magicStone: [1, 3] },
  },
];

// Generate daily tasks for a user
function generateDailyTasks(user) {
  const taskCount = Math.floor(Math.random() * 3) + 3; // 3-5 tasks
  const tasks = [];

  const availableZones = user.unlockedZones || [1];
  const maxZone = Math.max(...availableZones);

  for (let i = 0; i < taskCount; i++) {
    const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
    const target = Math.floor(Math.random() * (template.targetRange[1] - template.targetRange[0]) + template.targetRange[0]);

    // Select zone based on task type
    let zoneId = availableZones[Math.floor(Math.random() * availableZones.length)];
    if (template.type === "explore") {
      zoneId = Math.min(zoneId + 1, maxZone); // Higher zone for explore
    }
    const zone = zones.find(z => z.id === zoneId) || zones[0];

    // Build description
    let description = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];
    description = description.replace("{zone}", zone.name);
    description = description.replace("{count}", target);

    if (template.type === "collect") {
      const resource = template.resources[Math.floor(Math.random() * template.resources.length)];
      description = description.replace("{resource}", resource);
    }

    // Calculate reward
    const goldReward = Math.floor(Math.random() * (template.reward.goldRange[1] - template.reward.goldRange[0]) + template.reward.goldRange[0]);

    let reward = { gold: goldReward };
    if (template.reward.magicStone) {
      reward.magicStone = Math.floor(Math.random() * (template.reward.magicStone[1] - template.reward.magicStone[0]) + template.reward.magicStone[0]);
    }

    tasks.push({
      id: Date.now() + i,
      type: template.type,
      description,
      target,
      progress: 0,
      reward,
      completed: false,
      zoneId: zone.id,
    });
  }

  return tasks;
}

// Check and refresh daily tasks
function checkAndRefreshTasks(user) {
  const now = Date.now();
  const lastRefresh = user.guild.lastTaskRefresh || new Date(0);

  // Refresh if more than 24 hours since last refresh
  const hoursSinceRefresh = (now - lastRefresh) / (1000 * 60 * 60);

  if (hoursSinceRefresh >= 24 || !user.guild.dailyTasks || user.guild.dailyTasks.length === 0) {
    user.guild.dailyTasks = generateDailyTasks(user);
    user.guild.lastTaskRefresh = now;
  }

  return user;
}

// Update task progress
function updateTaskProgress(user, taskType, amount, metadata = {}) {
  if (!user.guild.dailyTasks) return false;

  let updated = false;

  user.guild.dailyTasks.forEach(task => {
    if (task.completed) return;

    if (task.type === taskType) {
      // For kill tasks
      if (taskType === "kill" && metadata.zone) {
        // Only credit if the task's target zone matches the kill's zone
        if (task.zoneId === undefined || task.zoneId === metadata.zone) {
          task.progress += amount;
          updated = true;
        }
      }
      // For collect tasks
      else if (taskType === "collect" && metadata.resource) {
        task.progress += amount;
        updated = true;
      }
      // For explore tasks
      else if (taskType === "explore") {
        task.progress += amount;
        updated = true;
      }

      // Check completion
      if (task.progress >= task.target) {
        task.completed = true;
        task.progress = task.target;
      }
    }
  });

  return updated;
}

// Get completed task rewards
function claimTaskReward(user, taskId) {
  if (!user.guild.dailyTasks) return null;

  const task = user.guild.dailyTasks.find(t => t.id === taskId);

  if (!task) return { success: false, message: "任務不存在" };
  if (!task.completed) return { success: false, message: "任務尚未完成" };

  // Apply rewards
  user.gold += task.reward.gold;
  if (task.reward.magicStone) {
    user.magicStones += task.reward.magicStone;
  }
  if (task.reward.items) {
    // Handle item rewards if needed
  }

  user.guild.tasksCompleted += 1;

  // Remove claimed task
  user.guild.dailyTasks = user.guild.dailyTasks.filter(t => t.id !== taskId);

  return {
    success: true,
    reward: task.reward,
  };
}

module.exports = {
  generateDailyTasks,
  checkAndRefreshTasks,
  updateTaskProgress,
  claimTaskReward,
};