import { Request, Response } from 'express';
import { sendCatchError, sendError, sendSuccess } from '../../../utils/commonFunctions';

import { db } from '../../../drizzle/db';
import { games } from '../../../drizzle/schema';
import { asc, desc, eq, ilike, sql } from 'drizzle-orm';

export const addGame = async (req: Request, res: Response) => {
  const { game_name, min_game_amount, max_game_amount } = req.body;

  if (!game_name || !min_game_amount || !max_game_amount) {
    return sendError(res, { message: 'Please enter all required fields', code: 422 });
  }

  try {
    await db.insert(games).values({
      game_name,
      min_game_amount,
      max_game_amount,
    });

    return sendSuccess(res, { message: 'Game added successfully.', code: 201 });
  } catch (error) {
    sendCatchError(res, {
      message: 'Error adding game',
      code: 409,
      errorDetail: error,
    });
  }
};

export const updateGame = async (req: Request, res: Response) => {
  const {id, game_name, min_game_amount, max_game_amount, game_status } = req.body;

  if (!id || !game_name || !min_game_amount || !max_game_amount ) {
    return sendError(res, { message: 'Please enter all required fields', code: 422 });
  }

  try {
    await db.update(games).set({
      game_name,
      min_game_amount,
      max_game_amount,
      game_status,
      updated_at: sql`NOW()`,
    }).where(eq(games.id, id));

    console.log("er are here");

    return sendSuccess(res, { message: 'Game updated successfully.', code: 201 });
  } catch (error) {
    sendCatchError(res, {
      message: 'Error updating game',
      code: 409,
      errorDetail: error,
    });
  }
};

export const getGameListAdmin = async (req: Request, res: Response) => {
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
    const validSortFields = ['id', 'game_name', 'game_status', 'created_at', 'updated_at'];

    const sortFieldToColumn = {
      id: games.id,
      game_name: games.game_name,
      min_game_amount: games.min_game_amount,
      max_game_amount: games.max_game_amount,
      game_status: games.game_status,
      created_at: games.created_at,
      updated_at: games.updated_at,
    };

    const orderByField = validSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const orderColumn = sortFieldToColumn[orderByField as keyof typeof sortFieldToColumn];

    // Get total records count
    const totalCountQuery = await db.select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` }).from(games);

    const totalCount = totalCountQuery[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const getList = await db
      .select({
        id: games.id,
        game_name: games.game_name,
        min_game_amount: games.min_game_amount,
        max_game_amount: games.max_game_amount,
        game_status: games.game_status,
        created_at: games.created_at,
        updated_at: games.updated_at,
      })
      .from(games)
      .where(searchString ? ilike(games.game_name, `%${searchString}%`) : undefined)

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
      message: 'Error fetching game list.',
      code: 409,
      errorDetail: error,
    });
  }
};

export const getSingleGameAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return sendError(res, { message: 'Please enter a valid id', code: 422 });
    }
    const getList = await db
      .select({
        id: games.id,
        game_name: games.game_name,
        min_game_amount: games.min_game_amount,
        max_game_amount: games.max_game_amount,
        game_status: games.game_status,
        created_at: games.created_at,
        updated_at: games.updated_at,
      })
      .from(games)
      .where(eq(games.id, id));

    return sendSuccess(res, {
      message: 'Success.',
      data: getList,
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
