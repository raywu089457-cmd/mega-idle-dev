import User from "@/models/User";

// Define a UserDocument type based on the Mongoose model
type UserDoc = Awaited<ReturnType<typeof User.findOne>>;

export class UserRepository {
  /**
   * Find user by userId (discord snowflake or email_xxx)
   */
  static async findById(userId: string): Promise<UserDoc> {
    return User.findOne({ userId });
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<UserDoc> {
    return User.findOne({ email: email.toLowerCase() });
  }

  /**
   * Find user by userId, excluding soft-deleted users
   */
  static async findByIdActive(userId: string): Promise<UserDoc> {
    // Must use $eq:null not $exists:false — Mongoose default null means field exists with null value
    return User.findOne({ userId, deletedAt: { $eq: null } });
  }

  /**
   * Find or create user (for Discord OAuth flow)
   */
  static async findOrCreate(userId: string, username: string, authProvider: "discord" | "email" = "discord"): Promise<UserDoc> {
    let user = await this.findByIdActive(userId);
    if (!user) {
      user = new User({
        userId,
        username,
        authProvider,
        lastTick: new Date(),
        statistics: {
          firstPlayTime: new Date(),
          lastActiveTime: new Date(),
        },
      });
      await user.save();
    }
    return user;
  }

  /**
   * Register new email user
   */
  static async register(email: string, password: string, username?: string): Promise<UserDoc> {
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new Error("這個電子郵件已經被註冊過了");
    }

    const bcrypt = require("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = `email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const user = new User({
      userId,
      username: username || `Player_${userId.slice(-4)}`,
      email: email.toLowerCase(),
      passwordHash,
      authProvider: "email",
      lastTick: new Date(),
      statistics: {
        firstPlayTime: new Date(),
        lastActiveTime: new Date(),
      },
    });

    await user.save();
    return user;
  }

  /**
   * Soft delete user (sets deletedAt timestamp)
   */
  static async softDelete(userId: string): Promise<UserDoc | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    user.deletedAt = new Date();
    await user.save();
    return user;
  }
}