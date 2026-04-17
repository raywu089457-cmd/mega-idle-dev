import { z } from "zod";

// =============================================================================
// Hero Schemas
// =============================================================================

export const HeroIdSchema = z.string().min(1);

export const HeroActionSchema = z.object({
  heroId: z.string().min(1, "缺少 heroId"),
});

// =============================================================================
// Dispatch Schemas
// =============================================================================

export const DispatchActionSchema = z.enum(["recall"]);

export const DispatchSchema = z.object({
  heroIds: z.array(z.string()).min(1, "缺少 heroIds"),
  zone: z.number().int().min(1).max(10),
  subZone: z.number().int().min(1).max(3),
  action: z.enum(["dispatch", "recall"]).optional(),
});

// =============================================================================
// Build Schemas
// =============================================================================

export const BuildingTypeSchema = z.enum([
  "castle", "tavern", "monument", "warehouse",
  "weaponShop", "armorShop", "potionShop",
  "lumberMill", "mine", "herbGarden",
  "guildHall", "barracks", "archery",
]);

export const BuildActionSchema = z.enum(["build", "upgrade"]);

export const BuildSchema = z.object({
  building: BuildingTypeSchema,
  action: BuildActionSchema,
});

// =============================================================================
// Inventory Schemas
// =============================================================================

export const EquipItemSchema = z.object({
  heroId: z.string().min(1, "缺少 heroId"),
  itemName: z.string().min(1, "缺少 itemName"),
  slot: z.enum(["weapon", "armor", "helmet", "accessory"]),
});

// =============================================================================
// Team Schemas
// =============================================================================

export const TeamAssignmentSchema = z.object({
  heroId: z.string().min(1, "缺少 heroId"),
  teamIdx: z.number().int().min(0).max(4),
});

// =============================================================================
// World Boss Schemas
// =============================================================================

export const WorldBossAttackSchema = z.object({
  heroIds: z.array(z.string()).min(1, "缺少 heroIds"),
});

// =============================================================================
// Heroes Action Schemas
// =============================================================================

export const TrainActionSchema = HeroActionSchema;
export const FeedActionSchema = HeroActionSchema;
export const WaterActionSchema = HeroActionSchema;
export const PotionActionSchema = HeroActionSchema;
export const ExpelActionSchema = HeroActionSchema;

// =============================================================================
// Guild Schemas
// =============================================================================

export const GuildActionSchema = z.object({
  action: z.enum(["claim", "refresh"]),
});

// =============================================================================
// Rewards Schemas
// =============================================================================

export const DailyRewardSchema = z.object({});
export const WeeklyRewardSchema = z.object({});

// =============================================================================
// Profile Schemas
// =============================================================================

export const ProfileUpdateSchema = z.object({
  username: z.string().min(1).max(20).optional(),
});