import { Response } from 'express';
import { sendCatchError, sendError, sendSuccess } from '../../../utils/commonFunctions';

import { userDetails, userTransactions } from '../../../drizzle/schema';
import { db } from '../../../drizzle/db';

import { desc, eq } from 'drizzle-orm';
import { CustomRequestToken } from '../../../utils/types';

export const getTransactionsList = async (req: CustomRequestToken, res: Response) => {
  const uID = typeof req.userId === 'string' ? req.userId : req.userId?.sub;

  if (!uID) {
    return sendError(res, { message: 'User ID is missing.', code: 401 });
  }

  try {
    const getList = await db
      .select({
        txn_id: userTransactions.txn_id,
        txn_type: userTransactions.txn_type,
        amount: userTransactions.amount,
        status: userTransactions.status,
        created_at: userTransactions.created_at,
        updated_at: userTransactions.updated_at,
      })
      .from(userTransactions)
      .where(eq(userTransactions.userId, uID))
      .orderBy(desc(userTransactions.created_at));

    return sendSuccess(res, { message: 'Success.', data: getList, code: 200 });
  } catch (error) {
    sendCatchError(res, {
      message: 'Failed fetching transactions list',
      code: 409,
      errorDetail: error,
    });
  }
};

export const postRequestAddMoney = async (req: CustomRequestToken, res: Response) => {
  const uID = typeof req.userId === 'string' ? req.userId : req.userId?.sub;

  if (!uID) {
    return sendError(res, { message: 'User ID is missing.', code: 401 });
  }

  const { txn_id, amount } = req.body;

  if (!txn_id || !amount) {
    return sendError(res, { message: 'Please enter all the fields', code: 422 });
  }

  try {
    await db.insert(userTransactions).values({
      userId: uID,
      txn_id,
      txn_type: 'Money add request',
      amount,
    });

    return sendSuccess(res, { message: 'Request placed successfully.', code: 201 });
  } catch (error) {
    sendCatchError(res, {
      message: 'Failed to add transaction',
      code: 409,
      errorDetail: error,
    });
  }
};

export const postWithdrawMoney = async (req: CustomRequestToken, res: Response) => {
  try {
    const uID = typeof req.userId === 'string' ? req.userId : req.userId?.sub;

    if (!uID) {
      return sendError(res, { message: 'User ID is missing.', code: 401 });
    }

    const { amount } = req.body;

    if (!amount) {
      return sendError(res, { message: 'Please enter amount', code: 422 });
    }
    
    const user = await db
    .select({ wallet_balance: userDetails.wallet_balance })
    .from(userDetails)
    .where(eq(userDetails.userId, uID))
    .limit(1);
    
    if (user.length === 0) {
      throw new Error('User not found.');
    }
    
    const currentBalance = user[0]?.wallet_balance ?? 0;
    
    if(currentBalance < amount){
      
      return sendError(res, { message: 'User does not have enough money to withdraw.', code: 422 });

    }

    const randomUUID = crypto.randomUUID();
    await db.insert(userTransactions).values({
      userId: uID,
      txn_id: randomUUID,
      txn_type: 'Money withdraw request',
      amount,
    });

    return sendSuccess(res, { message: 'Request placed successfully.', code: 201 });
  } catch (error) {
    sendCatchError(res, {
      message: 'Failed to withdraw transaction',
      code: 409,
      errorDetail: error,
    });
  }
};
