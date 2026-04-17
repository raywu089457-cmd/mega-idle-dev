import mongoose from "mongoose";

/**
 * Execute a function within a MongoDB transaction.
 * If no transaction is needed (single document), runs without overhead.
 */
export async function withTransaction<T>(
  operation: (session: mongoose.ClientSession | null) => Promise<T>
): Promise<T> {
  const hasActiveTransaction = mongoose.connection.readyState === 1;

  if (!hasActiveTransaction) {
    return operation(null);
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Execute multiple user mutations within a single transaction.
 * Ensures atomicity for multi-step operations.
 */
export async function withUserTransaction<T>(
  user: mongoose.Document,
  operations: (session: mongoose.ClientSession | null) => Promise<T>
): Promise<T> {
  return withTransaction(async (session) => {
    if (session) {
      user.$session(session);
    }
    return operations(session);
  });
}