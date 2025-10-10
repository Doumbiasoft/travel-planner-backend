import { Request, Response, NextFunction, RequestHandler } from "express";
import "colors";

export interface LogRequestOptions {
  includeBody?: boolean; // Log request body (default: false)
  includeResponse?: boolean; // Log response body (default: false)
  includeHeaders?: boolean; // Log headers (default: false)
  level?: "info" | "debug" | "warn" | "error"; // Log level (default: 'info')
  customLogger?: (data: any) => void; // Custom logger function
}

export const logRequest = (options: LogRequestOptions = {}): RequestHandler => {
  const level = options.level || "info";
  const logger =
    options.customLogger ||
    ((data: any) => {
      console.log(
        `[${level.toUpperCase()}]`.green,
        JSON.stringify(data, null, 2).yellow
      );
    });

  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const logData: any = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    };

    if (options.includeHeaders) {
      logData.headers = req.headers;
    }

    if (options.includeBody && req.body) {
      logData.body = req.body;
    }

    if (options.includeResponse) {
      // Store original json and send methods
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      res.json = function (data: any) {
        logData.response = data;
        logData.responseTime = Date.now() - startTime;
        logData.statusCode = res.statusCode;
        logger(logData);
        return originalJson(data);
      };

      res.send = function (data: any) {
        logData.response = data;
        logData.responseTime = Date.now() - startTime;
        logData.statusCode = res.statusCode;
        logger(logData);
        return originalSend(data);
      };
    } else {
      // Log when response finishes
      res.on("finish", () => {
        logData.responseTime = Date.now() - startTime;
        logData.statusCode = res.statusCode;
        logger(logData);
      });
    }

    next();
  };
};
