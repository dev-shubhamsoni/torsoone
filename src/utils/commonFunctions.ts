import { Response } from 'express';

interface ResponseTypes<T = unknown> {
  data?: T[];
  message: string;
  code?: number;
  errorDetail?: unknown;
}

const istDate = new Date();
istDate.setMinutes(istDate.getMinutes() + 330);

export const istCurrDate = new Date(istDate);

export const sendError = (res: Response, { data = [], message, code = 400 }: ResponseTypes) => {
  const response = {
    status: false,
    statusCode: code,
    data: data,
    message: message,
  };

  res.status(code).json(response);
};

export const getDateCurr = () => {
  const istDate = new Date();
  istDate.setMinutes(istDate.getMinutes() + 330);

  return new Date(istDate);
};

export const sendCatchError = (res: Response, { data = [], message, code = 400, errorDetail }: ResponseTypes) => {
  // const errorInfo = errorDetail instanceof Error ? { message: errorDetail.message } : errorDetail;
console.log("errorDetail",errorDetail);
  const response = {
    status: false,
    statusCode: code,
    data: data,
    message: message,
    // error: errorInfo ?? null,
  };

  res.status(code).json(response);
};

export const sendSuccess = (res: Response, { data = [], message, code = 200 }: ResponseTypes) => {
  const response = {
    status: true,
    statusCode: code,
    data: data,
    message: message,
  };

  res.status(code).json(response);
};
