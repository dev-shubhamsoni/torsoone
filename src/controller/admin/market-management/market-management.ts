import { Request, Response } from 'express';
import { sendCatchError, sendError, sendSuccess } from '../../../utils/commonFunctions';

import { db } from '../../../drizzle/db';
import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm';
import { games, market, userBids, userTable } from '../../../drizzle/schema';

export const getMarketListNames = async (req: Request, res: Response) => {
  try {
    const getList = await db
      .select({
        id: market.id,
        market_name: market.market_name,
      })
      .from(market);

    return sendSuccess(res, {
      message: 'Success.',
      data: getList,
      code: 200,
    });
  } catch (error) {
    sendCatchError(res, {
      message: 'Error fetching market list.',
      code: 409,
      errorDetail: error,
    });
  }
};
export const getGamesListNames = async (req: Request, res: Response) => {
  try {
    const getList = await db
      .select({
        id: games.id,
        game_name: games.game_name,
      })
      .from(games);

    return sendSuccess(res, {
      message: 'Success.',
      data: getList,
      code: 200,
    });
  } catch (error) {
    sendCatchError(res, {
      message: 'Error fetching market list.',
      code: 409,
      errorDetail: error,
    });
  }
};

export const addMarket = async (req: Request, res: Response) => {
  const { market_name } = req.body;

  if (!market_name) {
    return sendError(res, { message: 'Please enter all required fields', code: 422 });
  }

  const market_time = {
    Monday: {
      open: '09:00 am',
      close: '10:00 pm',
      status: true,
    },
    Tuesday: {
      open: '09:00 am',
      close: '10:00 pm',
      status: true,
    },
    Wednesday: {
      open: '09:00 am',
      close: '10:00 pm',
      status: true,
    },
    Thursday: {
      open: '10:00 am',
      close: '10:00 pm',
      status: true,
    },
    Friday: {
      open: '10:00 am',
      close: '10:00 pm',
      status: true,
    },
    Saturday: {
      open: '10:00 am',
      close: '11:00 pm',
      status: true,
    },
    Sunday: {
      open: '11:00 am',
      close: '09:00 pm',
      status: true,
    },
  };

  try {
    await db.insert(market).values({
      market_name: market_name,
      market_time: JSON.stringify(market_time),
    });

    return sendSuccess(res, { message: 'Market added successfully.', code: 201 });
  } catch (error) {
    sendCatchError(res, {
      message: 'Error adding market',
      code: 409,
      errorDetail: error,
    });
  }
};

export const updateMarket = async (req: Request, res: Response) => {
  const { id, market_name, market_time, market_status } = req.body;

  if (!market_name || !market_time || !id) {
    return sendError(res, { message: 'Please enter all required fields', code: 422 });
  }

  try {
    await db
      .update(market)
      .set({
        market_name: market_name,
        market_status: market_status,
        market_time: JSON.stringify(market_time),
        updated_at: sql`NOW()`,
      })
      .where(eq(market.id, id));

    return sendSuccess(res, { message: 'Market updated successfully.', code: 201 });
  } catch (error) {
    sendCatchError(res, {
      message: 'Error updating market',
      code: 409,
      errorDetail: error,
    });
  }
};

export const getSingleMarketAdmin = async (req: Request, res: Response) => {
  try {
    const { marketId } = req.query;

    if (!marketId || typeof marketId !== 'string') {
      return sendError(res, { message: 'Please enter a valid marketId', code: 422 });
    }

    const getList = await db.select().from(market).where(eq(market.id, marketId));

    return sendSuccess(res, {
      message: 'Success.',
      data: getList,
      code: 200,
    });
  } catch (error) {
    sendCatchError(res, {
      message: 'Error fetching market list.',
      code: 409,
      errorDetail: error,
    });
  }
};
export const getMarketListAdmin = async (req: Request, res: Response) => {
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
      'market_name',
      'market_time',
      'market_type',
      'market_status',
      'created_at',
      'updated_at',
    ];

    const sortFieldToColumn = {
      id: market.id,
      market_name: market.market_name,
      market_time: market.market_time,
      market_status: market.market_status,
      created_at: market.created_at,
      updated_at: market.updated_at,
    };

    const orderByField = validSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const orderColumn = sortFieldToColumn[orderByField as keyof typeof sortFieldToColumn];

    // Get total records count
    const totalCountQuery = await db.select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` }).from(market);

    const totalCount = totalCountQuery[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const getList = await db
      .select({
        id: market.id,
        market_name: market.market_name,
        market_time: market.market_time,
        market_status: market.market_status,
        created_at: market.created_at,
        updated_at: market.updated_at,
      })
      .from(market)
      .where(searchString ? ilike(market.market_name, `%${searchString}%`) : undefined)
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
      message: 'Error fetching market list.',
      code: 409,
      errorDetail: error,
    });
  }
};

export const getBidListAdmin = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      sortBy = 'created_at',
      sortOrder = 'desc',
      dateToSort = Date.now(),
      marketToSortId = '',
      gameToSortId = '',
      bidTypeToSortId = '',
    } = req.query;

    const date = new Date(dateToSort as string);
    const formattedDate = date.toISOString().split('T')[0];
    const marketId = marketToSortId as string;
    const gameId = gameToSortId as string;
    const bidId = bidTypeToSortId as string;
   

    // Convert pagination values to numbers.
    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * pageSize;

    // Validate sort order (only allow 'asc' or 'desc').
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    // Validate and sanitize sortBy field.
    const validSortFields = ['created_at', 'updated_at'];

    const sortFieldToColumn = {
      created_at: userBids.created_at,
      updated_at: userBids.updated_at,
    };

    const orderByField = validSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const orderColumn = sortFieldToColumn[orderByField as keyof typeof sortFieldToColumn];

    // Get total records count
    const totalCountQuery = await db.select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` }).from(market);

    const totalCount = totalCountQuery[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const whereConditions = [];

    if (formattedDate) {
      whereConditions.push(sql`DATE(${userBids.created_at}) = ${formattedDate}`);
    }

    if (marketId) {
      whereConditions.push(eq(market.market_name, marketId));
    }
    
    if (gameId) {
      whereConditions.push(eq(games.game_name, gameId));
    }
    if (bidId) {
      whereConditions.push(eq(userBids.bid_type, bidId));
    }

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
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
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
      message: 'Success.',
      data: [response],
      code: 200,
    });
  } catch (error) {
    sendCatchError(res, {
      message: 'Error fetching market list.',
      code: 409,
      errorDetail: error,
    });
  }
};
