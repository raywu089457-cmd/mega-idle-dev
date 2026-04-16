// game/combat/CombatResolver.js
const { getMonsterTarget } = require('./targeting');
const { calculateCrit } = require('./crit');

// Drop rate constants
const STONE_DROP_CHANCE = 0.3;
const MATERIAL_DROP_CHANCE = 0.5;
const MATERIAL_TYPES = ['wood', 'herb', 'iron', 'fruit', 'water'];

/**
 * 戰鬥結果 dataclass
 */
class CombatResult {
  constructor() {
    this.victory = false;
    this.goldReward = 0;
    this.magicStonesFound = 0;
    this.materialsFound = {};
    this.heroDamageTaken = 0;
    this.xpGained = 0;
    this.logMessages = [];
  }
}

/**
 * 敵人 dataclass
 */
class Enemy {
  constructor(monsterData, isElite = false, isBoss = false) {
    this.name = monsterData.name;
    this.maxHp = monsterData.hp;
    this.currentHp = monsterData.hp;
    this.atk = monsterData.atk;
    this.defense = monsterData.defense || 0;
    this.xp = monsterData.xp || 10;
    this.isElite = isElite || monsterData.is_elite;
    this.isBoss = isBoss || monsterData.is_boss;

    // 精英/Boss 倍率
    if (this.isElite) {
      this.maxHp = Math.floor(this.maxHp * 1.5);
      this.currentHp = this.maxHp;
      this.atk = Math.floor(this.atk * 1.3);
    }
    if (this.isBoss) {
      this.maxHp = Math.floor(this.maxHp * 2);
      this.currentHp = this.maxHp;
      this.atk = Math.floor(this.atk * 1.5);
    }
  }

  isAlive() {
    return this.currentHp > 0;
  }
}

class CombatResolver {
  /**
   * 解析戰鬥
   * @param {Array} heroes - 英雄陣列 (注意：死亡英雄會被就地復活為半血)
   * @param {Object} subZone - Sub-Zone 定義
   * @param {number} armyAtkBonus - 軍隊 ATK 加成
   * @returns {CombatResult}
   */
  resolveCombat(heroes, subZone, armyAtkBonus = 0) {
    const result = new CombatResult();
    const log = result.logMessages;

    if (!heroes || heroes.length === 0) {
      log.push('沒有可戰鬥的英雄');
      return result;
    }

    // 建立敵人
    if (!subZone.monsters || subZone.monsters.length === 0) {
      log.push('沒有可戰鬥的怪物');
      return result;
    }
    const monsterData = subZone.monsters[Math.floor(Math.random() * subZone.monsters.length)];
    const enemy = new Enemy(monsterData, subZone.is_elite, subZone.is_boss);

    // 設置敵人名稱前綴
    if (enemy.isBoss) enemy.name = `👑${enemy.name}`;
    else if (enemy.isElite) enemy.name = `⭐${enemy.name}`;

    log.push(`遭遇 ${enemy.name} (HP:${enemy.maxHp} ATK:${enemy.atk})`);

    // 戰鬥循環
    let round = 0;
    const maxRounds = 50;
    const deadHeroes = [];

    while (enemy.isAlive() && heroes.some(h => h.currentHp > 0) && round < maxRounds) {
      round++;

      log.push(`第${round}回合`);

      // 每個活著的英雄攻擊
      for (const hero of heroes) {
        if (!(hero.currentHp > 0)) continue;

        const { damage, isCrit } = calculateCrit(Math.max(1, (hero.atk + armyAtkBonus) - enemy.defense));
        enemy.currentHp -= damage;

        const critText = isCrit ? '暴擊！' : '';
        log.push(`[${hero.name}] 攻擊造成 ${damage} 傷害 ${critText}`.trim());

        if (!enemy.isAlive()) break;
      }

      // 敵人反擊（所有英雄攻擊後才結算）
      if (enemy.isAlive()) {
        const aliveHeroes = heroes.filter(h => h.currentHp > 0);
        const target = getMonsterTarget(aliveHeroes);

        if (target) {
          const actualDamage = Math.max(1, enemy.atk - target.defense);
          target.currentHp -= actualDamage;
          log.push(`[${enemy.name}] 攻擊 [${target.name}] 造成 ${actualDamage} 傷害 (HP: ${target.currentHp}/${target.maxHp})`);

          if (!(target.currentHp > 0)) {
            log.push(`[${target.name}] 倒下了！`);
            deadHeroes.push(target);
          }
        }
      }
    }

    // 勝利判定
    result.victory = !enemy.isAlive();

    if (result.victory) {
      log.push(`戰鬥勝利！`);

      // XP 獎勵
      result.xpGained = Math.floor(enemy.xp * subZone.xp_multiplier);
      log.push(`獲得 ${result.xpGained} 經驗`);

      // Gold 獎勵
      result.goldReward = subZone.gold_reward;
      log.push(`獲得 ${result.goldReward} 黃金`);

      // 魔法石掉落
      if (Math.random() < STONE_DROP_CHANCE) {
        const [min, max] = subZone.stone_drop;
        result.magicStonesFound = Math.floor(Math.random() * (max - min + 1)) + min;
        log.push(`發現 ${result.magicStonesFound} 顆魔法石`);
      }

      // 材料掉落
      if (Math.random() < MATERIAL_DROP_CHANCE) {
        const mat = MATERIAL_TYPES[Math.floor(Math.random() * MATERIAL_TYPES.length)];
        const amount = Math.floor(Math.random() * 5) * subZone.difficulty;
        result.materialsFound[mat] = amount;
        log.push(`獲得 ${amount} 個 ${mat}`);
      }
    } else {
      log.push('戰鬥失敗...');
    }

    // 復活死亡的英雄（半血）
    for (const hero of deadHeroes) {
      hero.currentHp = Math.floor(hero.maxHp / 2);
    }

    return result;
  }
}

module.exports = { CombatResolver, CombatResult, Enemy };
