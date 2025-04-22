import { Request, Response } from 'express';
import { sendCatchError, sendError, sendSuccess } from '../../../utils/commonFunctions';

import { games, market, userBids, userDetails, userTable, winData } from '../../../drizzle/schema';
import { db } from '../../../drizzle/db';
import { and, asc, desc, eq, sql } from 'drizzle-orm';

export const postAddWinData = async (req: Request, res: Response) => {
  try {
    const { marketId, gameId, win_number, bid_type, date: dateData } = req.body;

    if (!marketId || !gameId || !win_number || !bid_type || !dateData) {
      return sendError(res, { message: 'Please send all fields.', code: 401 });
    }

    if (bid_type !== 'Open' && bid_type !== 'Close') {
      return sendError(res, { message: `Please send only Open or Close in bid type`, code: 422 });
    }

    const getMarketList = await db.select().from(market).where(eq(market.id, marketId));

    if (getMarketList.length === 0) {
      return sendError(res, { message: `Market with id - ${marketId} doesn't exist`, code: 422 });
    }

    const getGameList = await db.select().from(games).where(eq(games.id, gameId));

    if (getGameList.length === 0) {
      return sendError(res, { message: `Game with id - ${gameId} doesn't exist`, code: 422 });
    }

    // Ensure dateData is a valid date
    const date = new Date(dateData as string);

    const formattedDate = date.toISOString().split('T')[0]; // "YYYY-MM-DD"

    const getWinDataSingle = await db
      .select()
      .from(winData)
      .where(
        and(
          eq(winData.marketId, marketId),
          eq(winData.gameId, gameId),
          eq(winData.bid_type, bid_type),
          sql`DATE(${winData.result_date}) = ${formattedDate}`
        )
      );

    if (getWinDataSingle.length !== 0) {
      return sendError(res, { message: `Data already exists`, code: 422 });
    }

    await db.insert(winData).values({
      marketId,
      gameId,
      win_number,
      bid_type,
      result_date: formattedDate,
    });

    return sendSuccess(res, {
      message: 'Winnings data added.',
      data: [],
      code: 200,
    });
  } catch (error) {
    sendCatchError(res, {
      message: 'Failed posting win data',
      code: 409,
      errorDetail: error,
    });
  }
};

export const getWinList = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      sortBy = 'result_date',
      sortOrder = 'desc',
      createdDate = Date.now(),
    } = req.query;

    // Convert pagination values to numbers.
    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * pageSize;

    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    const validSortFields = ['result_date', 'created_at', 'updated_at'];

    const sortFieldToColumn = {
      created_at: winData.created_at,
      updated_at: winData.updated_at,
      result_date: winData.result_date,
    };

    const orderByField = validSortFields.includes(sortBy as string) ? sortBy : 'result_date';
    const orderColumn = sortFieldToColumn[orderByField as keyof typeof sortFieldToColumn];

    // Get total records count
    const totalCountQuery = await db.select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` }).from(winData);

    const totalCount = totalCountQuery[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const date = new Date(createdDate as string);
    const formattedDate = date.toISOString().split('T')[0];

    const getList = await db
      .select({
        id: winData.id,
        market_name: market.market_name,
        market_id: market.id,
        game_name: games.game_name,
        game_id: games.id,
        bid_type: winData.bid_type,
        money_settled: winData.money_settled,
        result_date: winData.result_date,
        win_number: winData.win_number,
        created_at: winData.created_at,
        updated_at: winData.updated_at,
      })
      .from(winData)
      .where(and(sql`DATE(${winData.created_at}) = ${formattedDate}`))
      .innerJoin(market, eq(market.id, winData.marketId))
      .innerJoin(games, eq(games.id, winData.gameId))
      .orderBy(orderDirection === 'asc' ? asc(orderColumn) : desc(orderColumn))
      .limit(pageSize)
      .offset(offset);

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
      message: 'Error fetching win list.',
      code: 409,
      errorDetail: error,
    });
  }
};
export const deleteWinData = async (req: Request, res: Response) => {
  try {
    const { win_id } = req.query;

    if (!win_id || Array.isArray(win_id)) {
      return res.status(400).json({ message: 'Invalid or missing win_id' });
    }

    await db.delete(winData).where(eq(winData.id, win_id as string));

    return sendSuccess(res, {
      message: 'Data Deleted.',
      data: [],
      code: 200,
    });
  } catch (error) {
    return res.status(409).json({
      message: 'Error deleting win data.',
      code: 409,
      errorDetail: error,
    });
  }
};
export const getWinnersList = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      sortBy = 'result_date',
      sortOrder = 'desc',
      marketId,
      gameId,
      bid_type,
      win_number,
      resultDate = Date.now(),
    } = req.query;

    if (!marketId || !gameId || !win_number || !bid_type || !resultDate) {
      return sendError(res, { message: 'Please send all fields.', code: 422 });
    }

    // Convert pagination values to numbers.
    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * pageSize;

    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    const validSortFields = ['created_at', 'updated_at'];

    const sortFieldToColumn = {
      created_at: userBids.created_at,
      updated_at: userBids.updated_at,
    };

    const orderByField = validSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const orderColumn = sortFieldToColumn[orderByField as keyof typeof sortFieldToColumn];

    // Get total records count
    const totalCountQuery = await db.select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` }).from(userBids);

    const totalCount = totalCountQuery[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const date = new Date(resultDate as string);
    const formattedDate = date.toISOString().split('T')[0];

    const marketIdStr = String(marketId);
    const gameIdStr = String(gameId);
    const bidTypeStr = String(bid_type);
    const winNumberStr = Number(win_number);

    const getList = await db
      .select({
        bid_id: userBids.id,
        full_name: sql<string>`concat(${userTable.full_name}, ' (', ${userTable.mobile_number}, ')')`.as('full_name'),
        market_name: market.market_name,
        game_name: games.game_name,
        bid_number: userBids.bid_number,
        bid_amount: userBids.bid_amount,
        bid_type: userBids.bid_type,
        created_at: userBids.created_at,
        updated_at: userBids.updated_at,
      })
      .from(userBids)
      .where(
        and(
          eq(userBids.marketId, marketIdStr),
          eq(userBids.gameId, gameIdStr),
          eq(userBids.bid_type, bidTypeStr),
          eq(userBids.bid_number, winNumberStr),
          sql`DATE(${userBids.created_at}) = ${formattedDate}`
        )
      )
      .innerJoin(userTable, eq(userTable.uid, userBids.userId))
      .innerJoin(market, eq(market.id, userBids.marketId))
      .innerJoin(games, eq(games.id, userBids.gameId))
      .orderBy(orderDirection === 'asc' ? asc(orderColumn) : desc(orderColumn))
      .limit(pageSize)
      .offset(offset);

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
      message: 'User List Fetched.',
      data: [response],
      code: 200,
    });
  } catch (error) {
    sendCatchError(res, {
      message: 'Error fetching game list.',
      code: 409,
      errorDetail: error,
    });
  }
};



export const postDeclareWinners = async (req: Request, res: Response) => {
  try {
    const { marketId, gameId, bid_amount, bid_type, resultDate: date } = req.body;

    if (!marketId || !gameId || !bid_amount || !bid_type || !date) {
      return sendError(res, { message: 'Please send all fields.', code: 422 });
    }

    await db.transaction(async (tx) => {
      await tx
        .update(userDetails)
        .set({
          wallet_balance: sql`${userDetails.wallet_balance} + COALESCE(subquery."total_bid_amount", 0)`,
        })
        .from(
          tx
            .select({
              userId: userBids.userId,
              total_bid_amount: sql`SUM(${userBids.bid_amount})`.as('total_bid_amount'), // FIX: Explicit alias
            })
            .from(userBids)
            .where(
              and(
                eq(userBids.marketId, marketId),
                eq(userBids.gameId, gameId),
                eq(userBids.bid_type, bid_type),
                sql`${userBids.created_at}::DATE = ${date}::DATE`
              )
            )
            .groupBy(userBids.userId)
            .as('subquery')
        )
        .where(eq(userDetails.userId, sql`subquery."userId"`)); // Ensure case sensitivity

      return sendSuccess(res, {
        message: 'Result Updated.',
        data: [],
        code: 200,
      });
    });
  } catch (error) {
    sendCatchError(res, {
      message: 'Error updating result',
      code: 409,
      errorDetail: error,
    });
  }
};



