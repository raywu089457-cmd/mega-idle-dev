import { describe, it, expect, vi, afterEach } from 'vitest';
import { HeroManagementService } from '../../../lib/game/services/HeroManagementService.js';

afterEach(() => vi.restoreAllMocks());

// ─── Mock user factory ──────────────────────────────────────────────────────

let _heroStore;

function makeMockUser(overrides = {}) {
  _heroStore = new Map();

  const user = {
    gold: 1000,
    wanderingHeroCap: 5,
    territoryHeroCap: 10,
    heroes: {
      usedWanderingSlots: 0,
      usedTerritorySlots: 0,
      nextWanderingNumber: 1,
      nextTerritoryNumber: 1,
    },
    buildings: { tavern: { level: 1 } },
    materials: new Map([
      ['rations', 5],
      ['drinking_water', 5],
      ['potions', 3],
    ]),
    statistics: { heroesRecruited: 0, heroesTrained: 0 },

    getHero: (id) => _heroStore.get(id) ?? null,
    getTerritoryHeroes: () => [..._heroStore.values()].filter(h => h.type === 'territory'),
    getWanderingHeroes: () => [..._heroStore.values()].filter(h => h.type === 'wandering'),
    getExploringHeroes: () => [..._heroStore.values()].filter(h => h.isExploring),
    addHero: (hero) => { _heroStore.set(hero.id, hero); return hero; },
    removeHero: (id) => _heroStore.delete(id),
    addHeroToTeam: vi.fn(),
    removeHeroFromTeam: vi.fn(),
    ...overrides,
  };

  return user;
}

function addHeroToStore(user, partial) {
  const hero = {
    id: `hero_${Math.random()}`,
    name: 'Test',
    type: 'territory',
    profession: 'swordsman',
    rarity: 'D',
    level: 1,
    atk: 10,
    def: 5,
    maxHp: 100,
    currentHp: 80,
    experience: 0,
    totalXp: 0,
    hunger: 80,
    thirst: 80,
    isExploring: false,
    currentZone: null,
    currentSubZone: null,
    currentTeamIdx: null,
    attackRange: 'melee',
    equipment: {},
    ...partial,
  };
  _heroStore.set(hero.id, hero);
  return hero;
}

// ─── trainHero ──────────────────────────────────────────────────────────────

describe('HeroManagementService.trainHero', () => {
  it('increases level by 1 and deducts gold', () => {
    const user = makeMockUser({ gold: 500 });
    const hero = addHeroToStore(user, { level: 2 });
    const cost = 15 * (hero.level - 1); // 15

    const result = HeroManagementService.trainHero(user, hero.id);
    expect(result.success).toBe(true);
    expect(result.newLevel).toBe(3);
    expect(user.gold).toBe(500 - cost);
  });

  it('fails with insufficient gold', () => {
    const user = makeMockUser({ gold: 0 });
    const hero = addHeroToStore(user, { level: 5 });

    const result = HeroManagementService.trainHero(user, hero.id);
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/黃金/);
  });

  it('fails at MAX_HERO_LEVEL (100)', () => {
    const user = makeMockUser({ gold: 99999 });
    const hero = addHeroToStore(user, { level: 100 });

    const result = HeroManagementService.trainHero(user, hero.id);
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/最高等級/);
  });

  it('fails for non-existent hero', () => {
    const user = makeMockUser();
    const result = HeroManagementService.trainHero(user, 'ghost_id');
    expect(result.success).toBe(false);
  });

  it('fails for wandering hero', () => {
    const user = makeMockUser();
    const hero = addHeroToStore(user, { type: 'wandering' });
    const result = HeroManagementService.trainHero(user, hero.id);
    expect(result.success).toBe(false);
  });

  it('heals to full HP (pre-levelup maxHp) on level up', () => {
    const user = makeMockUser({ gold: 9999 });
    const hero = addHeroToStore(user, { level: 1, currentHp: 10, maxHp: 100 });
    const oldMaxHp = hero.maxHp;
    HeroManagementService.trainHero(user, hero.id);
    // Implementation: currentHp = maxHp THEN maxHp += statIncrease
    // So currentHp is set to old maxHp, then maxHp grows beyond it
    expect(hero.currentHp).toBe(oldMaxHp);
    expect(hero.maxHp).toBeGreaterThan(oldMaxHp);
  });
});

// ─── recruitFromTavern ──────────────────────────────────────────────────────

describe('HeroManagementService.recruitFromTavern', () => {
  it('converts wandering → territory', () => {
    const user = makeMockUser();
    user.heroes.usedWanderingSlots = 1;
    const wand = addHeroToStore(user, { type: 'wandering' });

    const result = HeroManagementService.recruitFromTavern(user, wand.id);
    expect(result.success).toBe(true);
    expect(result.hero.type).toBe('territory');
    expect(user.heroes.usedWanderingSlots).toBe(0);
    expect(user.heroes.usedTerritorySlots).toBe(1);
    expect(user.statistics.heroesRecruited).toBe(1);
  });

  it('fails when territory slots full', () => {
    const user = makeMockUser();
    user.heroes.usedTerritorySlots = 10; // at cap
    const wand = addHeroToStore(user, { type: 'wandering' });

    const result = HeroManagementService.recruitFromTavern(user, wand.id);
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/槽位已滿/);
  });

  it('fails when no tavern', () => {
    const user = makeMockUser();
    user.buildings.tavern.level = 0;
    const wand = addHeroToStore(user, { type: 'wandering' });

    const result = HeroManagementService.recruitFromTavern(user, wand.id);
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/酒館/);
  });

  it('renames hero when newName provided', () => {
    const user = makeMockUser();
    user.heroes.usedWanderingSlots = 1;
    const wand = addHeroToStore(user, { type: 'wandering', name: 'OldName' });

    const result = HeroManagementService.recruitFromTavern(user, wand.id, 'NewName');
    expect(result.success).toBe(true);
    expect(result.hero.name).toBe('NewName');
  });
});

// ─── feedHero / giveWater / usePotion ────────────────────────────────────────

describe('HeroManagementService.feedHero', () => {
  it('increases hunger by 30 and consumes 1 ration', () => {
    const user = makeMockUser();
    const hero = addHeroToStore(user, { hunger: 50 });

    const result = HeroManagementService.feedHero(user, hero.id);
    expect(result.success).toBe(true);
    expect(hero.hunger).toBe(80);
    expect(user.materials.get('rations')).toBe(4);
  });

  it('fails when no rations', () => {
    const user = makeMockUser();
    user.materials.set('rations', 0);
    const hero = addHeroToStore(user, { hunger: 50 });

    const result = HeroManagementService.feedHero(user, hero.id);
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/口糧/);
  });

  it('fails when hero hunger already full (100)', () => {
    const user = makeMockUser();
    const hero = addHeroToStore(user, { hunger: 100 });

    const result = HeroManagementService.feedHero(user, hero.id);
    expect(result.success).toBe(false);
  });

  it('caps hunger at 100', () => {
    const user = makeMockUser();
    const hero = addHeroToStore(user, { hunger: 80 });

    HeroManagementService.feedHero(user, hero.id);
    expect(hero.hunger).toBe(100); // 80 + 30 capped to 100
  });
});

describe('HeroManagementService.giveWater', () => {
  it('increases thirst by 30 and consumes 1 drinking_water', () => {
    const user = makeMockUser();
    const hero = addHeroToStore(user, { thirst: 40 });

    const result = HeroManagementService.giveWater(user, hero.id);
    expect(result.success).toBe(true);
    expect(hero.thirst).toBe(70);
    expect(user.materials.get('drinking_water')).toBe(4);
  });
});

describe('HeroManagementService.usePotion', () => {
  it('heals 50% maxHp and consumes 1 potion', () => {
    const user = makeMockUser();
    const hero = addHeroToStore(user, { maxHp: 100, currentHp: 20 });

    const result = HeroManagementService.usePotion(user, hero.id);
    expect(result.success).toBe(true);
    expect(hero.currentHp).toBe(70); // 20 + 50
    expect(result.healAmount).toBe(50);
    expect(user.materials.get('potions')).toBe(2);
  });

  it('fails when already at full HP', () => {
    const user = makeMockUser();
    const hero = addHeroToStore(user, { maxHp: 100, currentHp: 100 });

    const result = HeroManagementService.usePotion(user, hero.id);
    expect(result.success).toBe(false);
  });
});

// ─── dispatchHero / recallHero ───────────────────────────────────────────────

describe('HeroManagementService.dispatchHero', () => {
  it('dispatches territory hero to valid zone/difficulty', () => {
    const user = makeMockUser();
    const hero = addHeroToStore(user, { type: 'territory', isExploring: false });

    const result = HeroManagementService.dispatchHero(user, hero.id, 3, 2);
    expect(result.success).toBe(true);
    expect(hero.isExploring).toBe(true);
    expect(hero.currentZone).toBe(3);
    expect(hero.currentSubZone).toBe(2);
  });

  it('rejects zone < 1', () => {
    const user = makeMockUser();
    const hero = addHeroToStore(user, { type: 'territory', isExploring: false });
    const result = HeroManagementService.dispatchHero(user, hero.id, 0, 1);
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/無效的區域/);
  });

  it('rejects zone > 10', () => {
    const user = makeMockUser();
    const hero = addHeroToStore(user, { type: 'territory', isExploring: false });
    const result = HeroManagementService.dispatchHero(user, hero.id, 11, 1);
    expect(result.success).toBe(false);
  });

  it('rejects difficulty < 1', () => {
    const user = makeMockUser();
    const hero = addHeroToStore(user, { type: 'territory', isExploring: false });
    const result = HeroManagementService.dispatchHero(user, hero.id, 1, 0);
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/無效的難度/);
  });

  it('rejects difficulty > 3', () => {
    const user = makeMockUser();
    const hero = addHeroToStore(user, { type: 'territory', isExploring: false });
    const result = HeroManagementService.dispatchHero(user, hero.id, 1, 4);
    expect(result.success).toBe(false);
  });

  it('rejects already-exploring hero', () => {
    const user = makeMockUser();
    const hero = addHeroToStore(user, { type: 'territory', isExploring: true });
    const result = HeroManagementService.dispatchHero(user, hero.id, 1, 1);
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/探索中/);
  });

  it('rejects wandering hero', () => {
    const user = makeMockUser();
    const hero = addHeroToStore(user, { type: 'wandering', isExploring: false });
    const result = HeroManagementService.dispatchHero(user, hero.id, 1, 1);
    expect(result.success).toBe(false);
  });
});

describe('HeroManagementService.recallHero', () => {
  it('recalls specific exploring hero', () => {
    const user = makeMockUser();
    const hero = addHeroToStore(user, {
      type: 'territory',
      isExploring: true,
      currentZone: 3,
      currentSubZone: 2,
    });

    const result = HeroManagementService.recallHero(user, hero.id);
    expect(result.success).toBe(true);
    expect(hero.isExploring).toBe(false);
    expect(hero.currentZone).toBeNull();
    expect(hero.lastZone).toBe(3);
  });

  it('recalls all exploring heroes when no heroId provided', () => {
    const user = makeMockUser();
    const h1 = addHeroToStore(user, { type: 'territory', isExploring: true, currentZone: 1, currentSubZone: 1 });
    const h2 = addHeroToStore(user, { type: 'territory', isExploring: true, currentZone: 2, currentSubZone: 2 });

    const result = HeroManagementService.recallHero(user);
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(h1.isExploring).toBe(false);
    expect(h2.isExploring).toBe(false);
  });

  it('fails when hero not exploring', () => {
    const user = makeMockUser();
    const hero = addHeroToStore(user, { isExploring: false });

    const result = HeroManagementService.recallHero(user, hero.id);
    expect(result.success).toBe(false);
  });
});

// ─── addXp ───────────────────────────────────────────────────────────────────

describe('HeroManagementService.addXp', () => {
  it('adds XP to hero without leveling up', () => {
    const user = makeMockUser();
    const hero = addHeroToStore(user, { level: 1, experience: 0, totalXp: 0 });

    const result = HeroManagementService.addXp(user, hero.id, 50);
    expect(hero.experience).toBe(50);
    expect(result.leveledUp).toBe(false);
  });

  it('triggers level up when XP threshold met', () => {
    const user = makeMockUser();
    const hero = addHeroToStore(user, { level: 1, experience: 99, totalXp: 99, maxHp: 100, currentHp: 50, atk: 10, def: 5 });

    const oldMaxHp = hero.maxHp;
    const result = HeroManagementService.addXp(user, hero.id, 5); // total 104 > 100
    expect(result.leveledUp).toBe(true);
    expect(hero.level).toBe(2);
    // Implementation: currentHp = maxHp THEN maxHp += statIncrease
    expect(hero.currentHp).toBe(oldMaxHp);
    expect(hero.maxHp).toBeGreaterThan(oldMaxHp);
  });

  it('returns null for non-existent hero', () => {
    const user = makeMockUser();
    const result = HeroManagementService.addXp(user, 'ghost', 100);
    expect(result).toBeNull();
  });
});
