import { RequestHandler } from "express";

interface EndpointMetadata {
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
}

/**
 * Add metadata to endpoint for OpenAPI documentation
 * Similar to validateQuery, validateParams pattern
 */
export function endpointMetadata(metadata: EndpointMetadata): RequestHandler {
  const middleware: RequestHandler = (req, res, next) => {
    (req as any).__endpointMetadata = metadata;
    next();
  };

  // Store metadata for OpenAPI extraction
  (middleware as any).__metadata = metadata;
  return middleware;
}