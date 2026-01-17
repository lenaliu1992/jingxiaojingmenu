import { Request, Response, NextFunction } from 'express';

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('❌ 错误:', err);

  const errorResponse: ApiError = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || '服务器内部错误',
    },
  };

  res.status(500).json(errorResponse);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `路径 ${req.method} ${req.path} 不存在`,
    },
  });
}
