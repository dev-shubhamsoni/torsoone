import { Request, Response } from 'express';
import { sendCatchError, sendSuccess } from '../../../utils/commonFunctions';
import { games } from '../../../drizzle/schema';
import { db } from '../../../drizzle/db';

export const getGameListuser = async (req: Request, res: Response) => {
  try {
    const getList = await db
      .select({
        id: games.id,
        game_name: games.game_name,
        game_status: games.game_status,
        min_game_amount: games.min_game_amount,
        max_game_amount: games.max_game_amount,
        created_at: games.created_at,
        updated_at: games.updated_at,
      })
      .from(games);

    return sendSuccess(res, { message: 'Game list.', data: getList, code: 200 });
  } catch (error) {
    sendCatchError(res, {
      message: 'Error fetching game list.',
      code: 409,
      errorDetail: error,
    });
  }
};
