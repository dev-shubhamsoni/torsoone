import { Request, Response } from 'express';
import { sendCatchError, sendError, sendSuccess } from '../../../utils/commonFunctions';

import { adminTable, games, market, userBids, userDetails, userTable, userTransactions } from '../../../drizzle/schema';
import { db } from '../../../drizzle/db';
import { count, sql, and, gte, lte, ilike, asc, desc, eq } from 'drizzle-orm';
import { CustomRequestToken, CustomRequestTokenADmin } from '../../../utils/types';

export const getAllUsersList = async (req: Request, res: Response) => {
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
      'full_name',
      'wallet_balance',
      'betting',
      'transfer',
      'active',
      'created_at',
      'updated_at',
    ];

    const sortFieldToColumn = {
      full_name: userTable.full_name,
      wallet_balance: userDetails.wallet_balance,
      betting: userDetails.betting,
      transfer: userDetails.transfer,
      active: userDetails.active,
      created_at: userTable.created_at,
      updated_at: userTable.updated_at,
    };

    const orderByField = validSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const orderColumn = sortFieldToColumn[orderByField as keyof typeof sortFieldToColumn];

    // Get total records count
    const totalCountQuery = await db.select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` }).from(userTable);

    const totalCount = totalCountQuery[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const getList = await db
      .select({
        uid: userTable.uid,
        full_name: userTable.full_name,
        mobile_number: userTable.mobile_number,
        email: userTable.email,
        wallet_balance: userDetails.wallet_balance,
        betting: userDetails.betting,
        transfer: userDetails.transfer,
        active: userDetails.active,
        bank_name: userDetails.bank_name,
        account_holder_name: userDetails.account_holder_name,
        account_number: userDetails.account_number,
        ifsc_code: userDetails.ifsc_code,
        phone_pay_no: userDetails.phone_pay_no,
        google_pay_no: userDetails.google_pay_no,
        paytm_pay_no: userDetails.paytm_pay_no,
        created_at: userTable.created_at,
        updated_at: userTable.updated_at,
      })
      .from(userTable)
      .innerJoin(userDetails, eq(userTable.uid, userDetails.userId))
      .where(and(searchString ? ilike(userTable.full_name, `%${searchString}%`) : undefined))
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

    return sendSuccess(res, { message: 'Success.', data: [response], code: 200 });
  } catch (error) {
    sendCatchError(res, {
      message: 'Failed fetching user list',
      code: 409,
      errorDetail: error,
    });
  }
};

export const getSingleuser = async (req: Request, res: Response) => {
  try {
    const uid = req.query.uid as string;

    if (!uid) {
      return sendError(res, { message: 'User ID is missing.', code: 401 });
    }

    const getList = await db
      .select({
        full_name: userTable.full_name,
        mobile_number: userTable.mobile_number,
        email: userTable.email,
        pin: userTable.pin,
        wallet_balance: userDetails.wallet_balance,
        betting: userDetails.betting,
        transfer: userDetails.transfer,
        active: userDetails.active,
        bank_name: userDetails.bank_name,
        account_holder_name: userDetails.account_holder_name,
        account_number: userDetails.account_number,
        ifsc_code: userDetails.ifsc_code,
        phone_pay_no: userDetails.phone_pay_no,
        google_pay_no: userDetails.google_pay_no,
        paytm_pay_no: userDetails.paytm_pay_no,
        created_at: userTable.created_at,
        updated_at: userTable.updated_at,
      })
      .from(userTable)
      .innerJoin(userDetails, eq(userTable.uid, userDetails.userId))
      .where(eq(userTable.uid, uid));

    return sendSuccess(res, { message: 'Success.', data: getList, code: 200 });
  } catch (error) {
    sendCatchError(res, {
      message: 'Failed fetching user list',
      code: 409,
      errorDetail: error,
    });
  }
};

export const getUserTransactionsList = async (req: CustomRequestToken, res: Response) => {
  try {
    const uid = req.query.uid as string;
    const { page = '1', limit = '10', sortBy = 'created_at', sortOrder = 'desc', search } = req.query;

    if (!uid) {
      return sendError(res, { message: 'User ID is missing.', code: 401 });
    }

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

    const getList = await db
      .select({
        id: userTransactions.id,
        txn_id: userTransactions.txn_id,
        userId: userTransactions.userId,
        txn_type: userTransactions.txn_type,
        amount: userTransactions.amount,
        status: userTransactions.status,
        created_at: userTransactions.created_at,
        updated_at: userTransactions.updated_at,
      })
      .from(userTransactions)
      .where(
        and(
          eq(userTransactions.userId, uid),
          searchString ? ilike(userTable.full_name, `%${searchString}%`) : undefined
        )
      )
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
      message: 'Failed fetching transactions list',
      code: 409,
      errorDetail: error,
    });
  }
};

export const postAdminUpdateUserProfile = async (req: CustomRequestToken, res: Response) => {
  const { betting, transfer, active, uid } = req.body;

  try {
    const getUser = await db.select().from(userDetails).where(eq(userDetails.userId, uid));
    const user = getUser.length > 0 ? getUser[0] : null;
    if (!user) {
      return sendError(res, { message: 'User not found', code: 404 });
    }

    const updateData: Record<string, number | string | Date> = {};

    if (betting !== undefined) updateData.betting = betting;
    if (transfer !== undefined) updateData.transfer = transfer;
    if (active !== undefined) updateData.active = active;

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date();
      const up = new Date();
      await db.update(userDetails).set(updateData).where(eq(userDetails.userId, uid));
      await db.update(userTable).set({ updated_at: up }).where(eq(userTable.uid, uid));
      return sendSuccess(res, { message: 'User details updated.', code: 200 });
    } else {
      return sendError(res, { message: 'Please send values to update', code: 401 });
    }
  } catch (error) {
    sendCatchError(res, {
      message: 'Error updating user details',
      code: 409,
      errorDetail: error,
    });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const result = await db
      .select({
        user_count: count(),
        market_count: sql<number>`CAST((SELECT COUNT(*) FROM ${market}) AS INTEGER)`.as('market_count'),
        bid_count: sql<number>`CAST((SELECT COUNT(*) FROM ${userBids}) AS INTEGER)`.as('bid_count'),
        active_user_count:
          sql<number>`CAST((SELECT COUNT(*) FROM ${userDetails} WHERE ${userDetails.active} = TRUE) AS INTEGER)`.as(
            'active_user_count'
          ),
        deactive_user_count:
          sql<number>`CAST((SELECT COUNT(*) FROM ${userDetails} WHERE ${userDetails.active} = FALSE) AS INTEGER)`.as(
            'deactive_user_count'
          ),
      })
      .from(userTable);

    return sendSuccess(res, { message: 'Success.', data: [result[0]], code: 200 });
  } catch (error) {
    sendCatchError(res, {
      message: 'Failed fetching dashboard counts',
      code: 409,
      errorDetail: error,
    });
  }
};

export const getAllBids = async (req: Request, res: Response) => {
  try {
    const { date, marketId, bidType } = req.query;

    const conditions = [];

    if (date) {
      const startDate = new Date(date as string);
      const endDate = new Date(date as string);
      endDate.setHours(23, 59, 59, 999);

      conditions.push(and(gte(userBids.created_at, startDate), lte(userBids.created_at, endDate)));
    }

    if (marketId) {
      conditions.push(eq(userBids.marketId, marketId as string));
    }

    if (bidType) {
      conditions.push(eq(userBids.bid_type, bidType as string));
    }

    const result = await db
      .select({
        id: userBids.id,
        userId: userBids.userId,
        full_name: sql<string>`concat(${userTable.full_name}, ' (', ${userTable.mobile_number}, ')')`.as('full_name'),
        market: market.market_name,
        game_name: games.game_name,
        bid_number: userBids.bid_number,
        bid_amount: userBids.bid_amount,
        bid_type: userBids.bid_type,
        created_at: userBids.created_at,
        updated_at: userBids.updated_at,
      })
      .from(userBids)
      .innerJoin(userTable, eq(userTable.uid, userBids.userId))
      .innerJoin(market, eq(market.id, userBids.marketId))
      .innerJoin(games, eq(games.id, userBids.gameId))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return sendSuccess(res, { message: 'Success.', data: result, code: 200 });
  } catch (error) {
    sendCatchError(res, {
      message: 'Failed fetching bids.',
      code: 409,
      errorDetail: error,
    });
  }
};

export const postUpdateAdminProfile = async (req: CustomRequestTokenADmin, res: Response) => {
  const aid = typeof req.adminId === 'string' ? req.adminId : req.adminId?.sub;

  if (!aid) {
    return sendError(res, { message: 'Admin ID is missing.', code: 401 });
  }

  const {
    mobile_number,
    email,
    whatsapp_number,
    min_withdrwal_rate,
    max_withdrwal_rate,
    max_transfer,
    min_transfer,
    account_holder_name,
    account_number,
    ifsc_code,
    txn_upi_id,
  } = req.body;

  try {
    const getAdmin = await db.select().from(adminTable).where(eq(adminTable.aid, aid));
    const admin = getAdmin.length > 0 ? getAdmin[0] : null;

    if (!admin) {
      return sendError(res, { message: 'Admin not found', code: 404 });
    }

    const updateData = {
      ...(mobile_number !== undefined && { mobile_number }),
      ...(email !== undefined && { email }),
      ...(whatsapp_number !== undefined && { whatsapp_number }),
      ...(min_withdrwal_rate !== undefined && { min_withdrwal_rate }),
      ...(max_withdrwal_rate !== undefined && { max_withdrwal_rate }),
      ...(max_transfer !== undefined && { max_transfer }),
      ...(min_transfer !== undefined && { min_transfer }),
      ...(account_holder_name !== undefined && { account_holder_name }),
      ...(account_number !== undefined && { account_number }),
      ...(ifsc_code !== undefined && { ifsc_code }),
      ...(txn_upi_id !== undefined && { txn_upi_id }),
    } as Record<string, number | string | Date>;

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date();
      await db.update(adminTable).set(updateData).where(eq(adminTable.aid, aid));
      return sendSuccess(res, { message: 'Admin details updated.', code: 200 });
    } else {
      return sendError(res, { message: 'Please send values to update.', code: 401 });
    }
  } catch (error) {
    sendCatchError(res, {
      message: 'Error updating admin details',
      code: 409,
      errorDetail: error,
    });
  }
};



export const getSingleAdmin = async (req: Request, res: Response) => {
  try {
    
    const getList = await db
      .select()
      .from(adminTable)

    return sendSuccess(res, { message: 'Success.', data: getList, code: 200 });
  } catch (error) {
    sendCatchError(res, {
      message: 'Failed fetching admin list',
      code: 409,
      errorDetail: error,
    });
  }
};