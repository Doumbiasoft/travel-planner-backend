import express from "express";
import fs from "fs";
import path from "path";
import swaggerUi from "swagger-ui-express";
/**
 * Truly dynamic OpenAPI generator that scans controllers directory
 * and discovers @reflet routes automatically without manual configuration
 */

interface DiscoveredRoute {
  method: string;
  path: string;
  fullPath: string;
  controllerName: string;
  functionName: string;
  entityName: string;
  validation?: {
    params?: ValidationRule[];
    query?: ValidationRule[];
    body?: ValidationRule[];
  };
  metadata?: {
    summary?: string;
    description?: string;
    tags?: string[];
    operationId?: string;
  };
}

interface ValidationRule {
  field: string;
  required?: boolean;
  type?: "string" | "number" | "boolean" | "object" | "array";
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

/**
 * Dynamically discover all controller version folders and their files
 */
async function discoverControllers(
  controllersBaseDir: string
): Promise<string[]> {
  try {
    if (!fs.existsSync(controllersBaseDir)) {
      console.warn(`Controllers directory not found: ${controllersBaseDir}`);
      return [];
    }

    const allControllerFiles: string[] = [];
    const entries = fs.readdirSync(controllersBaseDir, { withFileTypes: true });

    // Find all version folders (v1, v2, etc.) and scan them for controllers
    for (const entry of entries) {
      if (entry.isDirectory() && /^v\d+$/.test(entry.name)) {
        const versionDir = path.join(controllersBaseDir, entry.name);
        //console.log(`🔍 Scanning version folder: ${entry.name}`);

        const versionFiles = fs.readdirSync(versionDir);
        const controllerFiles = versionFiles.filter(
          (file) =>
            file.endsWith(".controller.ts") || file.endsWith(".controller.js")
        );

        // Add full paths to the collection
        controllerFiles.forEach((file) => {
          allControllerFiles.push(path.join(versionDir, file));
        });
      }
    }

    return allControllerFiles;
  } catch (error) {
    console.error("Error discovering controllers:", error);
    return [];
  }
}

/**
 * Extract endpoint metadata from compiled @Use decorator content
 */
function extractCompiledEndpointMetadata(useContent: string):
  | {
      summary?: string;
      description?: string;
      tags?: string[];
      operationId?: string;
    }
  | undefined {
  const metadata: any = {};

  // Extract endpointMetadata object from compiled format
  const metadataMatch = useContent.match(
    /endpointMetadata_middleware_1\.endpointMetadata\)\(\{\s*([\s\S]*?)\}\)/
  );
  if (metadataMatch) {
    const objectContent = metadataMatch[1];

    // Extract summary from the object
    const summaryMatch = objectContent.match(/summary:\s*["'](.*?)["']/);
    if (summaryMatch) metadata.summary = summaryMatch[1];

    // Extract description from the object
    const descriptionMatch = objectContent.match(
      /description:\s*["']([\s\S]*?)["']/
    );
    if (descriptionMatch)
      metadata.description = descriptionMatch[1].replace(/\s+/g, " ").trim();

    // Extract operationId from the object
    const operationIdMatch = objectContent.match(
      /operationId:\s*["'](.*?)["']/
    );
    if (operationIdMatch) metadata.operationId = operationIdMatch[1];
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

/**
 * Extract validation rules from compiled @Use decorator content
 */
function extractCompiledValidationRules(useContent: string): {
  params?: ValidationRule[];
  query?: ValidationRule[];
  body?: ValidationRule[];
} {
  const validation: {
    params?: ValidationRule[];
    query?: ValidationRule[];
    body?: ValidationRule[];
  } = {};

  // Extract validateParams rules from compiled format
  const paramsMatch = useContent.match(
    /validation_middleware_1\.validateParams\)\(\{\s*rules:\s*\[([\s\S]*?)\]/
  );
  if (paramsMatch) {
    validation.params = parseValidationRules(paramsMatch[1]);
  }

  // Extract validateQuery rules from compiled format
  const queryMatch = useContent.match(
    /validation_middleware_1\.validateQuery\)\(\{\s*rules:\s*\[([\s\S]*?)\]/
  );
  if (queryMatch) {
    validation.query = parseValidationRules(queryMatch[1]);
  }

  // Extract validateBody rules from compiled format
  const bodyMatch = useContent.match(
    /validation_middleware_1\.validateBody\)\(\{\s*rules:\s*\[([\s\S]*?)\]/
  );
  if (bodyMatch) {
    validation.body = parseValidationRules(bodyMatch[1]);
  }

  return validation;
}

/**
 * Extract endpoint metadata from @Use decorator content
 */
function extractEndpointMetadata(useContent: string):
  | {
      summary?: string;
      description?: string;
      tags?: string[];
      operationId?: string;
    }
  | undefined {
  const metadata: any = {};

  // Extract endpointMetadata object
  const metadataMatch = useContent.match(
    /endpointMetadata\(\s*\{([^}]*)\}\s*\)/
  );
  if (metadataMatch) {
    const objectContent = metadataMatch[1];

    // Extract summary from the object
    const summaryMatch = objectContent.match(/summary:\s*["'](.*?)["']/);
    if (summaryMatch) metadata.summary = summaryMatch[1];

    // Extract description from the object
    const descriptionMatch = objectContent.match(
      /description:\s*["']([\s\S]*?)["']/
    );
    if (descriptionMatch)
      metadata.description = descriptionMatch[1].replace(/\s+/g, " ").trim();

    // Extract operationId from the object
    const operationIdMatch = objectContent.match(
      /operationId:\s*["'](.*?)["']/
    );
    if (operationIdMatch) metadata.operationId = operationIdMatch[1];
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

/**
 * Extract validation rules from @Use decorator content
 */
function extractValidationRules(useContent: string): {
  params?: ValidationRule[];
  query?: ValidationRule[];
  body?: ValidationRule[];
} {
  const validation: {
    params?: ValidationRule[];
    query?: ValidationRule[];
    body?: ValidationRule[];
  } = {};

  // Extract validateParams rules - simplified regex to handle the @Use content structure
  const paramsMatch = useContent.match(
    /validateParams\(\s*\{\s*rules:\s*\[([\s\S]*?)\]/
  );
  if (paramsMatch) {
    validation.params = parseValidationRules(paramsMatch[1]);
  }

  // Extract validateQuery rules - simplified regex
  const queryMatch = useContent.match(
    /validateQuery\(\s*\{\s*rules:\s*\[([\s\S]*?)\]/
  );
  if (queryMatch) {
    validation.query = parseValidationRules(queryMatch[1]);
  }

  // Extract validateBody rules - simplified regex
  const bodyMatch = useContent.match(
    /validateBody\(\s*\{\s*rules:\s*\[([\s\S]*?)\]/
  );
  if (bodyMatch) {
    validation.body = parseValidationRules(bodyMatch[1]);
  }

  return validation;
}

/**
 * Parse individual validation rules from rule array content
 */
function parseValidationRules(rulesContent: string): ValidationRule[] {
  const rules: ValidationRule[] = [];

  // Match individual rule objects with better handling of nested structures
  const ruleMatches = rulesContent.match(/\{\s*field[\s\S]*?\}/g);
  if (!ruleMatches) return rules;

  for (const ruleMatch of ruleMatches) {
    const rule: ValidationRule = { field: "" };

    // Extract field name - handle both single and double quotes
    const fieldMatch = ruleMatch.match(/field:\s*["'](.*?)["']/);
    if (fieldMatch) rule.field = fieldMatch[1];

    // Extract required - handle boolean values
    const requiredMatch = ruleMatch.match(/required:\s*(true|false)/);
    if (requiredMatch) rule.required = requiredMatch[1] === "true";

    // Extract type - handle string types
    const typeMatch = ruleMatch.match(/type:\s*["'](\w+)["']/);
    if (typeMatch) rule.type = typeMatch[1] as any;

    // Extract minLength
    const minLengthMatch = ruleMatch.match(/minLength:\s*(\d+)/);
    if (minLengthMatch) rule.minLength = parseInt(minLengthMatch[1]);

    // Extract maxLength
    const maxLengthMatch = ruleMatch.match(/maxLength:\s*(\d+)/);
    if (maxLengthMatch) rule.maxLength = parseInt(maxLengthMatch[1]);

    // Extract min
    const minMatch = ruleMatch.match(/min:\s*(\d+)/);
    if (minMatch) rule.min = parseInt(minMatch[1]);

    // Extract max
    const maxMatch = ruleMatch.match(/max:\s*(\d+)/);
    if (maxMatch) rule.max = parseInt(maxMatch[1]);

    if (rule.field) rules.push(rule);
  }

  return rules;
}

/**
 * Extract route information from controller file by analyzing the source code
 */
async function extractRoutesFromFile(
  filePath: string
): Promise<DiscoveredRoute[]> {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const routes: DiscoveredRoute[] = [];

    // Extract controller name and base path from @Router decorator
    // Handle both TypeScript source and compiled formats automatically
    let basePath = "";

    // Detect if this is a compiled file by looking for __decorate patterns
    const isCompiledFile =
      content.includes("__decorate") && content.includes("express_1.");

    if (isCompiledFile) {
      // Handle compiled format: (0, express_1.Router)((0, apiPrefix_1.buildRoute)("v1/posts"))
      const compiledBuildRouteMatch = content.match(
        /\(0, express_1\.Router\)\(\(0, apiPrefix_1\.buildRoute\)\(['"`]([^'"`]+)['"`]\)\)/
      );
      const compiledStaticRouterMatch = content.match(
        /\(0, express_1\.Router\)\(['"`]([^'"`]+)['"`]\)/
      );

      if (compiledBuildRouteMatch) {
        const routePath = compiledBuildRouteMatch[1];
        basePath = `/api/${routePath}`;
      } else if (compiledStaticRouterMatch) {
        basePath = compiledStaticRouterMatch[1];
        if (basePath && !basePath.startsWith("/api")) {
          basePath = `/api/${basePath}`;
        }
      }
    } else {
      // Handle TypeScript source format: @Router("path") or @Router(buildRoute("v1/users"))
      const staticRouterMatch = content.match(/@Router\(['"`]([^'"`]+)['"`]\)/);
      const buildRouteMatch = content.match(
        /@Router\(buildRoute\(['"`]([^'"`]+)['"`]\)\)/
      );

      if (staticRouterMatch) {
        basePath = staticRouterMatch[1];
        // If using path constraints, the full path is /api + controller path
        if (basePath && !basePath.startsWith("/api")) {
          basePath = `/api/${basePath}`;
        }
      } else if (buildRouteMatch) {
        // For buildRoute("v1/users") format, construct the full path
        const routePath = buildRouteMatch[1];
        basePath = `/api/${routePath}`;
      }
    }

    // Extract controller class name
    const classMatch = content.match(/class\s+(\w+Controller)/);
    const controllerName = classMatch ? classMatch[1] : "";

    // Extract entity name (Users, Posts, Comments)
    const entityName = controllerName.replace("Controller", "");

    if (!basePath || !controllerName) {
      console.warn(`Could not extract router info from ${filePath}`);
      return routes;
    }

    // Find all HTTP method decorators and their associated functions
    // Handle both TypeScript source and compiled formats automatically
    const methodRegex =
      /@(Get|Post|Put|Patch|Delete)\(([^)]*)\)\s*(@Use\s*\([\s\S]*?\)\s*)*async\s+(\w+)/g;
    const compiledMethodRegex =
      /__decorate\(\[\s*\(0, express_1\.(Get|Post|Put|Patch|Delete)\)\(([^)]*)\),?\s*\(0, express_1\.Use\)\(([\s\S]*?)\),?\s*__param[\s\S]*?\], (\w+Controller)\.prototype, "(\w+)"/g;

    let match;

    if (isCompiledFile) {
      // Use compiled format extraction
      while ((match = compiledMethodRegex.exec(content)) !== null) {
        const [
          ,
          httpMethod,
          routePath,
          useDecorator,
          controllerClassName,
          functionName,
        ] = match;
        // Clean up the routePath by removing quotes
        const cleanRoutePath = (routePath || "").replace(/['"]/g, "");
        const fullPath = basePath + cleanRoutePath;

        // Extract validation rules and metadata from @Use decorator if present
        let validation:
          | {
              params?: ValidationRule[];
              query?: ValidationRule[];
              body?: ValidationRule[];
            }
          | undefined;
        let metadata:
          | {
              summary?: string;
              description?: string;
              tags?: string[];
              operationId?: string;
            }
          | undefined;
        if (useDecorator) {
          validation = extractCompiledValidationRules(useDecorator);
          metadata = extractCompiledEndpointMetadata(useDecorator);
        }

        routes.push({
          method: httpMethod.toLowerCase(),
          path: cleanRoutePath,
          fullPath,
          controllerName,
          functionName,
          entityName,
          validation,
          metadata,
        });
      }
    } else {
      // Use TypeScript source format extraction
      while ((match = methodRegex.exec(content)) !== null) {
        const [, httpMethod, routePath, useDecorator, functionName] = match;
        // Clean up the routePath by removing quotes
        const cleanRoutePath = (routePath || "").replace(/['"]/g, "");
        const fullPath = basePath + cleanRoutePath;

        // Extract validation rules and metadata from @Use decorator if present
        let validation:
          | {
              params?: ValidationRule[];
              query?: ValidationRule[];
              body?: ValidationRule[];
            }
          | undefined;
        let metadata:
          | {
              summary?: string;
              description?: string;
              tags?: string[];
              operationId?: string;
            }
          | undefined;
        if (useDecorator) {
          validation = extractValidationRules(useDecorator);
          metadata = extractEndpointMetadata(useDecorator);
        }

        routes.push({
          method: httpMethod.toLowerCase(),
          path: cleanRoutePath,
          fullPath,
          controllerName,
          functionName,
          entityName,
          validation,
          metadata,
        });
      }
    }

    return routes;
  } catch (error) {
    console.error(`Error extracting routes from ${filePath}:`, error);
    return [];
  }
}

/**
 * Convert validation rule to OpenAPI parameter schema
 */
function validationRuleToSchema(rule: ValidationRule): any {
  const schema: any = { type: rule.type || "string" };

  if (rule.minLength !== undefined) schema.minLength = rule.minLength;
  if (rule.maxLength !== undefined) schema.maxLength = rule.maxLength;
  if (rule.min !== undefined) schema.minimum = rule.min;
  if (rule.max !== undefined) schema.maximum = rule.max;

  // No examples - keep parameters clean

  return schema;
}

/**
 * Generate OpenAPI parameters from validation rules
 */
function generateParametersFromValidation(validation?: {
  params?: ValidationRule[];
  query?: ValidationRule[];
  body?: ValidationRule[];
}): any[] {
  const parameters: any[] = [];

  // Add path parameters
  if (validation?.params) {
    for (const rule of validation.params) {
      parameters.push({
        name: rule.field,
        in: "path",
        required: rule.required !== false, // Default to required for path params
        schema: validationRuleToSchema(rule),
      });
    }
  }

  // Add query parameters
  if (validation?.query) {
    for (const rule of validation.query) {
      parameters.push({
        name: rule.field,
        in: "query",
        required: rule.required || false,
        schema: validationRuleToSchema(rule),
      });
    }
  }

  return parameters;
}

/**
 * Generate OpenAPI request body from validation rules
 */
function generateRequestBodyFromValidation(validation?: {
  params?: ValidationRule[];
  query?: ValidationRule[];
  body?: ValidationRule[];
}): any {
  if (!validation?.body || validation.body.length === 0) return undefined;

  const properties: any = {};
  const required: string[] = [];

  for (const rule of validation.body) {
    properties[rule.field] = validationRuleToSchema(rule);
    if (rule.required) {
      required.push(rule.field);
    }
  }

  const schema: any = {
    type: "object",
    properties,
  };

  if (required.length > 0) {
    schema.required = required;
  }

  return {
    required: true,
    content: {
      "application/json": { schema },
    },
  };
}

/**
 * Generate generic OpenAPI operation from discovered route
 */
function generateOperation(route: DiscoveredRoute): any {
  const {
    method,
    functionName,
    fullPath,
    controllerName,
    validation,
    metadata,
  } = route;

  // Extract tag name from controller (remove "Controller" suffix)
  const tagName = controllerName.replace("Controller", "");

  // Use metadata if available, otherwise fall back to generic values
  const operation: any = {
    tags: [tagName],
    summary: metadata?.summary || `${method.toUpperCase()} ${fullPath}`,
    description: metadata?.description || `Execute ${functionName} endpoint`,
    operationId: metadata?.operationId || functionName,
    responses: {
      200: {
        description: "Success",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: { type: "object", description: "Response data" },
              },
            },
          },
        },
      },
      400: {
        description: "Bad Request",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: { type: "string", example: "Validation failed" },
              },
            },
          },
        },
      },
      500: {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: { type: "string", example: "Internal server error" },
              },
            },
          },
        },
      },
    },
  };

  // Add 404 response for operations with path parameters
  if (fullPath.includes(":")) {
    operation.responses[404] = {
      description: "Resource not found",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              error: { type: "string", example: "Resource not found" },
            },
          },
        },
      },
    };
  }

  // Add parameters from validation rules
  const parameters = generateParametersFromValidation(validation);
  if (parameters.length > 0) {
    operation.parameters = parameters;
  }

  // Add request body from validation rules
  const requestBody = generateRequestBodyFromValidation(validation);
  if (requestBody) {
    operation.requestBody = requestBody;
  }

  return operation;
}

/**
 * Generate OpenAPI spec by dynamically discovering controllers
 */
export const generateDynamicOpenAPISpec = async (controllersDir?: string) => {
  // Default to src/controllers for development, or use provided path
  const defaultControllersDir =
    controllersDir ||
    (process.env.NODE_ENV === "production"
      ? path.join(process.cwd(), "dist/controllers")
      : path.join(process.cwd(), "src/controllers"));

  const controllerFiles = await discoverControllers(defaultControllersDir);
  const allRoutes: DiscoveredRoute[] = [];

  // Extract routes from each discovered controller
  for (const filePath of controllerFiles) {
    const routes = await extractRoutesFromFile(filePath);
    allRoutes.push(...routes);
  }

  const spec = {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Travel Planner API",
      description: `RESTful API - ${allRoutes.length} endpoints from ${controllerFiles.length} controllers`,
    },
    paths: {} as any,
  };

  if (allRoutes.length === 0) {
    console.warn("⚠️  No routes discovered from controllers");
    return spec;
  }

  // Generate OpenAPI paths from discovered routes
  for (const route of allRoutes) {
    const { fullPath, method } = route;

    if (!spec.paths[fullPath]) {
      spec.paths[fullPath] = {};
    }

    spec.paths[fullPath][method] = generateOperation(route);
  }

  return spec;
};

/**
 * Setup OpenAPI documentation with fully dynamic discovery
 */
export const setupDynamicOpenAPI = async (
  app: express.Application,
  options: {
    specPath?: string;
    docsPath?: string;
    swaggerPath?: string;
    enableSwagger?: boolean;
    enableScalar?: boolean;
    controllersDir?: string;
  } = {}
) => {
  const {
    specPath = "/api-docs",
    docsPath = "/docs",
    swaggerPath = "/swagger",
    enableSwagger = true,
    enableScalar = true,
    controllersDir,
  } = options;

  // Add spec endpoint with dynamic discovery
  app.get(specPath, async (_req, res) => {
    const spec = await generateDynamicOpenAPISpec(controllersDir);
    res.json(spec);
  });

  // Add Scalar UI
  if (enableScalar) {
    try {
      // Use Function constructor to avoid TypeScript compilation issues with dynamic imports
      const importScalar = new Function(
        'return import("@scalar/express-api-reference")'
      );
      const { apiReference } = await importScalar();

      app.use(
        docsPath,
        apiReference({
          spec: {
            url: specPath,
          },
          theme: "purple",
        } as any)
      );
    } catch (error) {
      console.warn(
        "Scalar API Reference not available, skipping Scalar endpoint:",
        error
      );
    }
  }

  // Add Swagger UI
  if (enableSwagger) {
    try {
      const swaggerSetup = async (req: any, _res: any, next: any) => {
        const spec = await generateDynamicOpenAPISpec(controllersDir);
        req.swaggerDoc = spec;
        next();
      };
      app.use(swaggerPath, swaggerSetup, swaggerUi.serve, swaggerUi.setup());
    } catch (error) {
      console.warn(
        "swagger-ui-express not available, skipping Swagger UI endpoint"
      );
    }
  }
};
