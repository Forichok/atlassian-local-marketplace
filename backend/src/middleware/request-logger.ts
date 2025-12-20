import morgan from 'morgan';
import { Request, Response } from 'express';
import logger from '../lib/logger';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

// Add request ID middleware
export const addRequestId = (req: Request, res: Response, next: Function) => {
  req.requestId = uuidv4();
  req.startTime = Date.now();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// Create custom morgan token for request ID
morgan.token('request-id', (req: Request) => req.requestId || 'unknown');

// Create custom morgan token for response time
morgan.token('response-time-ms', (req: Request) => {
  if (!req.startTime) return '0';
  return `${Date.now() - req.startTime}ms`;
});

// Morgan stream to winston
const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Define morgan format
const morganFormat = ':method :url :status :response-time-ms - :request-id';

// Export configured morgan middleware
export const httpLogger = morgan(morganFormat, { stream });

// Detailed request/response logger
export const detailedLogger = (req: Request, res: Response, next: Function) => {
  const { method, url, headers, body, query, params } = req;

  logger.info('Incoming request', {
    requestId: req.requestId,
    method,
    url,
    headers: {
      'user-agent': headers['user-agent'],
      'content-type': headers['content-type'],
      'accept': headers['accept'],
    },
    query,
    params,
    body: body && Object.keys(body).length > 0 ? body : undefined,
  });

  // Capture the original end function
  const originalEnd = res.end;

  // Override the end function to log response
  res.end = function(this: Response, ...args: any[]): Response {
    logger.info('Outgoing response', {
      requestId: req.requestId,
      method,
      url,
      statusCode: res.statusCode,
      duration: req.startTime ? `${Date.now() - req.startTime}ms` : 'unknown',
    });

    // Call the original end function
    return originalEnd.apply(this, args as any);
  };

  next();
};

// Error logger middleware
export const errorLogger = (err: Error, req: Request, res: Response, next: Function) => {
  logger.error('Request error', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
  });

  next(err);
};
