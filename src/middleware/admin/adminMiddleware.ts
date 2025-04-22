import { NextFunction, Request, Response } from 'express';
import { sendCatchError, sendError } from '../../utils/commonFunctions';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export interface CustomRequestToken extends Request {
  adminId?: JwtPayload | string;
}

export const adminLoginMiddleware = async (req: Request, res: Response, next: NextFunction) => {

  if (!process.env.JWT_TOKEN) {
    return sendError(res, { message: 'JWT secret is not set.', code: 500 });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return sendError(res, { message: 'Authorization token is required.', code: 401 });
    }

    jwt.verify(token, process.env.JWT_TOKEN, (err) => {
      if (err) {
        return sendError(res, { message: 'Invalid or expired token.', code: 403 });
      }

      next();
    });
  } catch (error) {
    sendCatchError(res, {
      message: 'Error in authentication middleware',
      code: 500,
      errorDetail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const adminTokenCheckMiddleware = async (req: CustomRequestToken, res: Response, next: NextFunction) => {
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

      req.adminId = (decoded as JwtPayload).adminId as string;
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
