import { Request, Response } from 'express';
import { db } from '../../../drizzle/db';
import { userDetails, userTable } from '../../../drizzle/schema';
import { sendCatchError, sendError, sendSuccess } from '../../../utils/commonFunctions';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export interface CustomRequest extends Request {
  pass?: string;
  id?: string;
}

export const userRegister = async (req: Request, res: Response) => {
  const secretKey = process.env.JWT_TOKEN;
  if (!secretKey) {
    throw new Error('JWT secret key is not defined.');
  }
  const { name, mobile_number, password, pin } = req.body;

  if (!name || !mobile_number || !password || !pin) {
    return sendError(res, { message: 'Please enter all the fields', code: 422 });
  }

  const mobileRegex = /^[0-9]{10}$/;
  if (!mobileRegex.test(mobile_number)) {
    return sendError(res, { message: 'Mobile number must be 10 digits', code: 422 });
  }

  const pinRegex = /^[0-9]{4}$/;
  if (!pinRegex.test(pin)) {
    return sendError(res, { message: 'PIN must be 4 digits', code: 422 });
  }

  try {
    if (!process.env.JWT_TOKEN) {
      return sendError(res, { message: 'JWT secret is not set.', code: 500 });
    }
    const hashPassword = await bcrypt.hash(password, 10);

    await db.transaction(async (tx) => {
      const userData = await tx
        .insert(userTable)
        .values({
          full_name: name,
          mobile_number: mobile_number.toString(),
          password: hashPassword,
          pin: pin,
        })
        .returning({ id: userTable.uid });

      if (userData.length === 0) {
        throw new Error('User creation failed.');
      }

      const userIdFortoken = userData[0]?.id as string;

      await tx.insert(userDetails).values({
        userId: userIdFortoken,
        wallet_balance: 0,
        bank_name: '',
        account_holder_name: '',
        account_number: null,
        ifsc_code: '',
        phone_pay_no: '',
        google_pay_no: '',
        paytm_pay_no: '',
      });

      const token = jwt.sign({ userId: userIdFortoken || '' }, secretKey, { expiresIn: '12h' });
      return sendSuccess(res, { message: 'User registered succcessfully.', data: [{ token }], code: 201 });
    });
  } catch (error) {
    sendCatchError(res, {
      message: 'Error registering user',
      code: 409,
      errorDetail: error,
    });
  }
};

export const userLogin = async (req: CustomRequest, res: Response) => {
  if (!process.env.JWT_TOKEN) {
    return sendError(res, { message: 'JWT secret is not set.', code: 500 });
  }

  try {
    const { mobile_number, password } = req.body;

    if (!mobile_number || !password) {
      return sendError(res, { message: 'Please enter all the fields.', code: 422 });
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile_number)) {
      return sendError(res, { message: 'Mobile number must be 10 digits.', code: 422 });
    }

    if (!bcrypt?.compareSync(password, req.pass || '')) {
      return sendError(res, { message: 'Wrong password.', code: 400 });
    }

    const token = jwt.sign({ userId: req.id || '' }, process.env.JWT_TOKEN, { expiresIn: '12h' });

    if (token) {
      return sendSuccess(res, { message: 'Login Successful.', code: 200, data: [{ token }] });
    } else {
      return sendError(res, { message: 'Wrong password.', code: 500 });
    }
  } catch (error) {
    sendCatchError(res, {
      message: 'Error logging user.',
      code: 409,
      errorDetail: error,
    });
  }
};
