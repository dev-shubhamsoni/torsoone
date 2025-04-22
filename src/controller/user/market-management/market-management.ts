import { Request, Response } from 'express';
import { sendCatchError, sendError, sendSuccess } from '../../../utils/commonFunctions';

import { db } from '../../../drizzle/db';
import { games, market, userBids, userDetails, userTransactions } from '../../../drizzle/schema';
import { CustomRequestToken } from '../../../utils/types';
import { eq, sql } from 'drizzle-orm';

export const getMarketListUser = async (req: Request, res: Response) => {
  try {
    const getList = await db.select().from(market);

    return sendSuccess(res, { message: 'Success.', data: getList, code: 200 });
  } catch (error) {
    sendCatchError(res, {
      message: 'Failed fetching market list',
      code: 409,
      errorDetail: error,
    });
  }
};

export const addBid = async (req: CustomRequestToken, res: Response) => {
  const uid = typeof req.userId === 'string' ? req.userId : req.userId?.sub;

  if (!uid) {
    return sendError(res, { message: 'User ID is missing.', code: 401 });
  }

  const { marketId, gameId, bid_number, bid_amount, bid_type } = req.body;

  if (!marketId || !gameId || !bid_number || !bid_amount || !bid_type) {
    return sendError(res, { message: 'Please enter all the fields', code: 422 });
  }

  if (bid_type !== 'Open' && bid_type !== 'Close') {
    return sendError(res, { message: 'Please send Open or Close in bid_type', code: 422 });
  }

  try {
    const getMarketList = await db.select().from(market).where(eq(market.id, marketId));

    if (getMarketList.length === 0) {
      return sendError(res, { message: `Market with id - ${marketId} doesnt exist`, code: 422 });
    }

    const getGameList = await db.select().from(games).where(eq(games.id, gameId));

    if (getGameList.length === 0) {
      return sendError(res, { message: `Game with id - ${gameId} doesnt exist`, code: 422 });
    }

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

      if (currentBalance < bid_amount) {
        throw new Error('Insufficient funds: User does not have enough balance to place a bid.');
      }

      const newBalance = currentBalance - bid_amount;

      const bidData = await tx
        .insert(userBids)
        .values({
          userId: uid,
          marketId,
          gameId,
          bid_number,
          bid_amount,
          bid_type,
        })
        .returning({ bid_amount: userBids.bid_amount, bidId: userBids.id });

      if (bidData.length === 0) {
        throw new Error('User bid creation failed.');
      }

      const bidId = bidData[0]?.bidId;

      await db.insert(userTransactions).values({
        userId: uid,
        txn_id: bidId,
        txn_type: 'Bid Placed',
        amount: bid_amount,
        status: 'Approved',
      });

      await tx
        .update(userDetails)
        .set({ wallet_balance: newBalance, updated_at: sql`NOW()` })
        .where(eq(userDetails.userId, uid));
    });

    return sendSuccess(res, { message: 'Bid placed successfully.', code: 201 });
  } catch (error) {
    return sendCatchError(res, {
      errorDetail: error,
      message: 'Error placing bid.',
      code: 409,
    });
  }
};

export const getBidListUser = async (req: CustomRequestToken, res: Response) => {
  try {
    const uid = typeof req.userId === 'string' ? req.userId : req.userId?.sub;

    if (!uid) {
      return sendError(res, { message: 'User ID is missing.', code: 401 });
    }
    const getList = await db
      .select({
        bid_id: userBids.id,
        market_name: market.market_name,
        game_name: games.game_name,
        bid_number: userBids.bid_number,
        bid_amount: userBids.bid_amount,
        bid_type: userBids.bid_type,
        created_at: userBids.created_at,
        updated_at: userBids.updated_at,
      })
      .from(userBids)
      .innerJoin(market, eq(market.id, userBids.marketId))
      .innerJoin(games, eq(games.id, userBids.gameId))
      .where(eq(userBids.userId, uid));

    return sendSuccess(res, { message: 'Success.', data: getList, code: 200 });
  } catch (error) {
    sendCatchError(res, {
      message: 'Failed fetching market list',
      code: 409,
      errorDetail: error,
    });
  }
};
