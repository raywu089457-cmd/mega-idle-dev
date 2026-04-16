const mongoose = require('mongoose');

const worldBossSchema = new mongoose.Schema({
  _id: { type: String, default: 'global_world_boss' },
  bossId: { type: String, default: 'ancient_dragon' },
  name: { type: String, default: '遠古巨龍' },
  maxHp: { type: Number, default: 3000000 },
  currentHp: { type: Number, default: 3000000 },
  level: { type: Number, default: 50 },
  atk: { type: Number, default: 400 },
  defense: { type: Number, default: 150 },
  isAlive: { type: Boolean, default: true },
  lastRespawnAt: { type: Date, default: null },
  respawnDelayMs: { type: Number, default: 3600000 }, // 1 hour respawn
}, { _id: false, versionKey: false });

// Singleton getter
worldBossSchema.statics.getBoss = async function() {
  try {
    let boss = await this.findById('global_world_boss');
    if (!boss) {
      boss = new this({ _id: 'global_world_boss' });
      await boss.save();
    }
    return boss;
  } catch (error) {
    throw new Error(`Failed to get boss: ${error.message}`);
  }
};

// Apply damage
worldBossSchema.methods.applyDamage = async function(damage) {
  try {
    this.currentHp = Math.max(0, this.currentHp - damage);
    if (this.currentHp <= 0) {
      this.isAlive = false;
      this.lastRespawnAt = new Date();
    }
    await this.save();
    return this;
  } catch (error) {
    throw new Error(`Failed to apply damage to boss: ${error.message}`);
  }
};

// Auto-respawn if timer expired
worldBossSchema.methods.checkRespawn = async function() {
  try {
    if (this.isAlive) return this;
    if (!this.lastRespawnAt) {
      this.currentHp = this.maxHp;
      this.isAlive = true;
      await this.save();
      return this;
    }
    const elapsed = Date.now() - new Date(this.lastRespawnAt).getTime();
    if (elapsed >= this.respawnDelayMs) {
      this.currentHp = this.maxHp;
      this.isAlive = true;
      this.lastRespawnAt = null;
      await this.save();
    }
    return this;
  } catch (error) {
    throw new Error(`Failed to check boss respawn: ${error.message}`);
  }
};

module.exports = mongoose.model('WorldBoss', worldBossSchema);