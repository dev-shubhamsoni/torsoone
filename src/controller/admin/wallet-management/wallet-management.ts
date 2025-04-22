import { Request, Response } from 'express';
import { sendCatchError, sendError, sendSuccess } from '../../../utils/commonFunctions';

import { userDetails, userTable, userTransactions } from '../../../drizzle/schema';
import { db } from '../../../drizzle/db';
import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm';

export const getAllTransactionsList = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', sortBy = 'created_at', sortOrder = 'desc', search } = req.query;

    // Convert pagination values to numbers.
    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * pageSize;

    // Convert search to a valid string or undefined
    const searchQuery = Array.isArray(search) ? search[0] : search;
    const searchString = typeof searchQuery === 'string' ? searchQuery : undefined;

    // Validate sort order (only allow 'asc' or 'desc').
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    // Validate and sanitize sortBy field.
    const validSortFields = [
      'id',
      'userId',
      'full_name',
      'txn_id',
      'txn_type',
      'amount',
      'status',
      'created_at',
      'updated_at',
    ];

    const sortFieldToColumn = {
      id: userTransactions.id,
      userId: userTransactions.userId,
      full_name: userTable.full_name,
      txn_id: userTransactions.txn_id,
      txn_type: userTransactions.txn_type,
      amount: userTransactions.amount,
      status: userTransactions.status,
      created_at: userTransactions.created_at,
      updated_at: userTransactions.updated_at,
    };

    const orderByField = validSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const orderColumn = sortFieldToColumn[orderByField as keyof typeof sortFieldToColumn];

    // Get total records count
    const totalCountQuery = await db.select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` }).from(userTransactions);

    const totalCount = totalCountQuery[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Get paginated list of transactions
    const getList = await db
      .select({
        id: userTransactions.id,
        userId: userTransactions.userId,
        full_name: sql<string>`concat(${userTable.full_name}, ' (', ${userTable.mobile_number}, ')')`.as('full_name'),
        txn_id: userTransactions.txn_id,
        txn_type: userTransactions.txn_type,
        amount: userTransactions.amount,
        status: userTransactions.status,
        created_at: userTransactions.created_at,
        updated_at: userTransactions.updated_at,
      })
      .from(userTransactions)
      .innerJoin(userTable, eq(userTable.uid, userTransactions.userId))
      .where(and(searchString ? ilike(userTable.full_name, `%${searchString}%`) : undefined))
      .orderBy(orderDirection === 'asc' ? asc(orderColumn) : desc(orderColumn))
      .limit(pageSize)
      .offset(offset);

    // Construct response
    const response = {
      data: getList,
      pagination: {
        totalRecords: totalCount,
        totalPages: totalPages,
        currentPage: pageNumber,
        pageSize: pageSize,
      },
    };

    return sendSuccess(res, {
      message: 'Success.',
      data: [response],
      code: 200,
    });
  } catch (error) {
    sendCatchError(res, {
      message: 'Failed fetching transactions list',
      code: 409,
      errorDetail: error,
    });
  }
};

export const postUpdateTransactionStatus = async (req: Request, res: Response) => {
  const { tranId, status, tranType, userMainId, tranAmount } = req.body;

  if (!tranId || !status || !tranType || !userMainId || !tranAmount) {
    return sendError(res, { message: 'Please enter all the fields', code: 422 });
  }

  if (status !== 'Approved' && status !== 'Rejected') {
    return sendError(res, { message: 'Please send Approved or Rejected in status', code: 422 });
  }

  try {
    if (status === 'Approved' && tranType === 'Money add request') {
      await db.transaction(async (tx) => {
        const tranData = await tx
          .update(userTransactions)
          .set({
            status,
            updated_at: sql`NOW()`,
          })
          .where(eq(userTransactions.id, tranId))
          .returning({ uid: userTransactions.userId, amount: userTransactions.amount });

        if (tranData.length === 0) {
          throw new Error('Update Transaction failed.');
        }

        const userId = tranData[0]?.uid;
        const userAmount = tranData[0]?.amount;

        await tx
          .update(userDetails)
          .set({
            wallet_balance: sql`${userDetails.wallet_balance} + ${userAmount}`,
            updated_at: sql`NOW()`,
          })
          .where(eq(userDetails.userId, userId));
        return sendSuccess(res, { message: 'Transaction approved successfully.', code: 200 });
      });
    } else if (status === 'Approved' && tranType === 'Money withdraw request') {
      await db.transaction(async (tx) => {
        const user = await tx
          .select({ wallet_balance: userDetails.wallet_balance })
          .from(userDetails)
          .where(eq(userDetails.userId, userMainId))
          .limit(1);

        if (user.length === 0) {
          throw new Error('User not found.');
        }

        const currentBalance = user[0]?.wallet_balance ?? 0;

        if (currentBalance < tranAmount) {
          return sendError(res, {
            message: `User doesnt have enough money to withdraw, current user balance - ${currentBalance}`,
            code: 401,
          });
        }

        const tranData = await tx
          .update(userTransactions)
          .set({
            status,
            updated_at: sql`NOW()`,
          })
          .where(eq(userTransactions.id, tranId))
          .returning({ uid: userTransactions.userId, amount: userTransactions.amount });

        if (tranData.length === 0) {
          throw new Error('Update Transaction failed.');
        }

        const userId = tranData[0]?.uid;
        const userAmount = tranData[0]?.amount;

        await tx
          .update(userDetails)
          .set({
            wallet_balance: sql`${userDetails.wallet_balance} - ${userAmount}`,
            updated_at: sql`NOW()`,
          })
          .where(eq(userDetails.userId, userId));
        return sendSuccess(res, { message: 'Transaction approved successfully.', code: 200 });
      });
    } else {
      await db
        .update(userTransactions)
        .set({
          status,
          updated_at: sql`NOW()`,
        })
        .where(eq(userTransactions.id, tranId));
      return sendSuccess(res, { message: 'Transaction rejected successfully.', code: 200 });
    }
  } catch (error) {
    sendCatchError(res, {
      message: 'Failed to update transaction',
      code: 409,
      errorDetail: error,
    });
  }
};

export const adminRemoveMoney = async (req: Request, res: Response) => {
  const { uid, amount } = req.body;

  if (!uid || !amount) {
    return sendError(res, { message: 'User ID or Amount is missing.', code: 401 });
  }

  try {
    await db.transaction(async (tx) => {
      const user = await tx
        .select({ wallet_balance: userDetails.wallet_balance })
        .from(userDetails)
        .where(eq(userDetails.userId, uid))
        .limit(1);

      if (user.length === 0) {
        throw new Error('User not found.');
      }

      const currentBalance = user[0]?.wallet_balance ?? 0;

      if (currentBalance < amount) {
        const randomUUID = crypto.randomUUID();

        await db.insert(userTransactions).values({
          userId: uid,
          txn_id: randomUUID,
          txn_type: 'Money withdraw request',
          amount: amount,
          status: 'Approved',
        });

        await tx
          .update(userDetails)
          .set({ wallet_balance: 0, updated_at: sql`NOW()` })
          .where(eq(userDetails.userId, uid));

        return sendSuccess(res, { message: 'Money withdraw request successfully.', code: 201 });
      }

      const newBalance = currentBalance - amount;
      const randomUUID = crypto.randomUUID();

      await db.insert(userTransactions).values({
        userId: uid,
        txn_id: randomUUID,
        txn_type: 'Money withdraw request',
        amount: amount,
        status: 'Approved',
      });

      await tx
        .update(userDetails)
        .set({ wallet_balance: newBalance, updated_at: sql`NOW()` })
        .where(eq(userDetails.userId, uid));
      return sendSuccess(res, { message: 'Money withdraw request successfully.', code: 201 });
    });
  } catch (error) {
    return sendCatchError(res, {
      errorDetail: error,
      message: 'Error withdrawing money.',
      code: 409,
    });
  }
};

export const adminAddMoney = async (req: Request, res: Response) => {
  const { uid, amount } = req.body;

  if (!uid || !amount) {
    return sendError(res, { message: 'User ID or Amount is missing.', code: 401 });
  }

  try {
    const randomUUID = crypto.randomUUID();

    await db.transaction(async (tx) => {
      const user = await tx
        .select({ wallet_balance: userDetails.wallet_balance })
        .from(userDetails)
        .where(eq(userDetails.userId, uid))
        .limit(1);

      if (user.length === 0) {
        throw new Error('User not found.');
      }

      const currentBalance = user[0]?.wallet_balance ?? 0;
      const newBalance = currentBalance + amount;
      await db.insert(userTransactions).values({
        userId: uid,
        txn_id: randomUUID,
        txn_type: 'Money add request',
        amount: amount,
        status: 'Approved',
      });

      await tx
        .update(userDetails)
        .set({ wallet_balance: newBalance, updated_at: sql`NOW()` })
        .where(eq(userDetails.userId, uid));
      return sendSuccess(res, { message: 'Money add request successfully.', code: 201 });
    });
  } catch (error) {
    return sendCatchError(res, {
      errorDetail: error,
      message: 'Error adding money.',
      code: 409,
    });
  }
};
