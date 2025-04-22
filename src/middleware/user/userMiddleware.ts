import { NextFunction, Request, Response } from 'express';
import { sendCatchError, sendError } from '../../utils/commonFunctions';
import { db } from '../../drizzle/db';
import { userTable } from '../../drizzle/schema';
import { eq, InferSelectModel } from 'drizzle-orm';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { CustomRequestToken } from '../../utils/types';
dotenv.config();

export interface CustomRequest extends Request {
  pass?: string;
  id?: string;
}


type User = InferSelectModel<typeof userTable>;

export const userRegisterMiddleware = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { mobile_number } = req.body;

  const mobileRegex = /^[0-9]{10}$/;
  if (!mobileRegex.test(mobile_number)) {
    return sendError(res, { message: 'Mobile number must be 10 digits', code: 422 });
  }

  try {
    const getMobNumber: User[] = await db.select().from(userTable).where(eq(userTable.mobile_number, mobile_number));

    if (getMobNumber.length > 0) {
      return sendError(res, { message: 'Mobile number already exists.', code: 422 });
    } else {
      req.pass = getMobNumber[0]?.password;
      next();
    }
  } catch (error) {
    sendCatchError(res, {
      message: 'Error register middleware user',
      code: 409,
      errorDetail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const userLoginMiddleware = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { mobile_number } = req.body;

  const mobileRegex = /^[0-9]{10}$/;
  if (!mobileRegex.test(mobile_number)) {
    return sendError(res, { message: 'Mobile number must be 10 digits', code: 422 });
  }

  try {
    const getMobNumber: User[] = await db.select().from(userTable).where(eq(userTable.mobile_number, mobile_number));

    if (getMobNumber?.length > 0) {
      req.pass = getMobNumber[0]?.password;
      req.id = getMobNumber[0]?.uid;
      next();
    } else {
      return sendError(res, { message: 'Mobile number doesnt exists.', code: 422 });
    }
  } catch (error) {
    sendCatchError(res, {
      message: 'Error logging middleware user',
      code: 409,
      errorDetail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const userTokenCheckMiddleware = async (req: CustomRequestToken, res: Response, next: NextFunction) => {
  if (!process.env.JWT_TOKEN) {
    return sendError(res, { message: 'JWT secret is not set.', code: 500 });
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, { message: 'Authorization token is required.', code: 401 });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
      if (err) {
        console.error('JWT Verification Error:', err.message);
        return sendError(res, { message: 'Invalid or expired token.', code: 403 });
      }
 

      req.userId = (decoded as JwtPayload).userId as string;
      next();
    });

  } catch (error) {
    sendCatchError(res, {
      message: 'Error in token middleware',
      code: 500,
      errorDetail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
