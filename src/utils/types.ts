import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export interface DatabaseError extends Error {
  detail?: string;
}


export interface CustomRequestToken extends Request {
  userId?: JwtPayload | string;
}

export interface CustomRequestTokenADmin extends Request {
  adminId?: JwtPayload | string;
}
