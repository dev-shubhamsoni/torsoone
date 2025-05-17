import { Response } from 'express';
import { sendCatchError, sendError, sendSuccess } from '../../../utils/commonFunctions';

import { adminTable, userDetails, userTable } from '../../../drizzle/schema';
import { db } from '../../../drizzle/db';

import { eq } from 'drizzle-orm';
import { CustomRequestToken } from '../../../utils/types';

export const postUpdateProfile = async (req: CustomRequestToken, res: Response) => {
  const uid = typeof req.userId === 'string' ? req.userId : req.userId?.sub;

  if (!uid) {
    return sendError(res, { message: 'User ID is missing.', code: 401 });
  }

  const { bank_name, account_holder_name, account_number, ifsc_code, phone_pay_no, google_pay_no, paytm_pay_no } =
    req.body;

  try {
    const getUser = await db.select().from(userDetails).where(eq(userDetails.userId, uid));
    const user = getUser.length > 0 ? getUser[0] : null;
    if (!user) {
      return sendError(res, { message: 'User not found', code: 404 });
    }

    const updateData: Record<string, number | string | Date> = {};

    if (bank_name !== undefined) updateData.bank_name = bank_name;
    if (account_holder_name !== undefined) updateData.account_holder_name = account_holder_name;
    if (account_number !== undefined) updateData.account_number = account_number;
    if (ifsc_code !== undefined) updateData.ifsc_code = ifsc_code;
    if (phone_pay_no !== undefined) updateData.phone_pay_no = phone_pay_no?.toString();
    if (google_pay_no !== undefined) updateData.google_pay_no = google_pay_no?.toString();
    if (paytm_pay_no !== undefined) updateData.paytm_pay_no = paytm_pay_no?.toString();

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date();
      await db.update(userDetails).set(updateData).where(eq(userDetails.userId, uid));
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

export const getProfileData = async (req: CustomRequestToken, res: Response) => {
  const uid = typeof req.userId === 'string' ? req.userId : req.userId?.sub;

  if (!uid) {
    return sendError(res, { message: 'User ID is missing.', code: 401 });
  }

  try {
    const getList = await db
      .select({
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

export const getSingleAdmin = async (req: CustomRequestToken, res: Response) => {
  try {
    const getList = await db
      .select({
        mobile_number: adminTable.mobile_number,
        email: adminTable.email,
        whatsapp_number: adminTable.whatsapp_number,
        min_withdrwal_rate: adminTable.min_withdrwal_rate,
        max_withdrwal_rate: adminTable.max_withdrwal_rate,
        max_transfer: adminTable.max_transfer,
        min_transfer: adminTable.min_transfer,
        account_holder_name: adminTable.account_holder_name,
        account_number: adminTable.account_number,
        ifsc_code: adminTable.ifsc_code,
        txn_upi_id: adminTable.txn_upi_id,
      })
      .from(adminTable);

    return sendSuccess(res, { message: 'Success.', data: getList, code: 200 });
  } catch (error) {
    sendCatchError(res, {
      message: 'Failed fetching admin list',
      code: 409,
      errorDetail: error,
    });
  }
};
