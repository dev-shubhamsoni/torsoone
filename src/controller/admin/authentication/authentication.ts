import { Request, Response } from 'express';
import { db } from '../../../drizzle/db';
import { adminTable } from '../../../drizzle/schema';
import { sendCatchError, sendError, sendSuccess } from '../../../utils/commonFunctions';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
dotenv.config();

export interface CustomRequest extends Request {
  pass?: string;
  id?: string;
}

export const adminRegister = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!password || !email) {
    return sendError(res, { message: 'Please enter all the fields', code: 422 });
  }

  try {
    const hashPassword = await bcrypt.hash(password, 10);

    await db.insert(adminTable).values({
      email,
      password: hashPassword,
    });

    return sendSuccess(res, { message: 'Admin registered succcessfully.', code: 201 });
  } catch (error) {
    sendCatchError(res, {
      message: 'Error registering admin',
      code: 409,
      errorDetail: error,
    });
  }
};

export const adminLogin = async (req: CustomRequest, res: Response) => {
  if (!process.env.JWT_TOKEN) {
    return sendError(res, { message: 'JWT secret is not set.', code: 500 });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, { message: 'Please enter all the fields.', code: 422 });
  }

  try {
    const getAdminData = await db.select().from(adminTable).where(eq(adminTable.email, email));

    if (!bcrypt?.compareSync(password, getAdminData[0]?.password || '')) {
      return sendError(res, { message: 'Wrong password.', code: 422 });
    }

    const token = jwt.sign(
      { adminId: getAdminData[0]?.aid || '' }, 
      process.env.JWT_TOKEN, 
      { expiresIn: '12h' }  
    );
    
    if (token) {
      return sendSuccess(res, { message: 'Login Successful.', code: 200, data: [{ token }] });
    } else {
      return sendError(res, { message: 'Wrong password.', code: 500 });
    }
  } catch (error) {
    sendCatchError(res, {
      message: 'Error logging admin.',
      code: 409,
      errorDetail: error,
    });
  }
};
