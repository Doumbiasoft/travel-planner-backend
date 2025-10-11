import axios from "axios";
import * as fs from "fs/promises";
import * as path from "path";
import { logger } from "./logger";

export interface AttachmentInput {
  filename: string;
  path?: string; // Can be local file path or URL
  content?: Buffer | string;
  contentType?: string;
}

export interface ProcessedAttachment {
  filename: string;
  content?: Buffer;
  path?: string;
  contentType?: string;
}

/**
 * Checks if a string is a URL
 */
const isUrl = (str: string): boolean => {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Checks if a file exists on the local file system
 */
const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Downloads a file from a URL and returns it as a Buffer along with filename from headers
 */
const downloadFileFromUrl = async (
  url: string
): Promise<{ buffer: Buffer; filename?: string }> => {
  try {
    logger.debug(`Downloading file from URL: ${url}`);
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 30000, // 30 second timeout
    });

    // Try to extract filename from Content-Disposition header
    let filename: string | undefined;
    const contentDisposition = response.headers["content-disposition"];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      );
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }
    }

    return {
      buffer: Buffer.from(response.data),
      filename,
    };
  } catch (error: any) {
    logger.error(`Failed to download file from ${url}: ${error.message}`);
    throw new Error(`Failed to download file from URL: ${error.message}`);
  }
};

/**
 * Converts Google Drive sharing URL to direct download URL
 * Example: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * To: https://drive.google.com/uc?export=download&id=FILE_ID
 */
const convertGoogleDriveUrl = (url: string): string | null => {
  const regex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return null;
};

/**
 * Processes file attachments for email sending
 * Handles both local files and remote URLs
 *
 * @param attachments - Array of attachment inputs
 * @returns Array of processed attachments ready for nodemailer
 */
export const processAttachments = async (
  attachments?: AttachmentInput[]
): Promise<ProcessedAttachment[]> => {
  if (!attachments || attachments.length === 0) {
    return [];
  }

  const processed: ProcessedAttachment[] = [];

  for (const attachment of attachments) {
    try {
      // If content is already provided, use it directly
      if (attachment.content) {
        processed.push({
          filename: attachment.filename,
          content: Buffer.isBuffer(attachment.content)
            ? attachment.content
            : Buffer.from(attachment.content),
          contentType: attachment.contentType,
        });
        logger.debug(`Attachment "${attachment.filename}" using provided content`);
        continue;
      }

      // If path is provided, determine if it's a URL or local file
      if (attachment.path) {
        // Check if it's a Google Drive URL and convert it
        if (attachment.path.includes("drive.google.com")) {
          const directUrl = convertGoogleDriveUrl(attachment.path);
          if (directUrl) {
            logger.debug(`Converting Google Drive URL for "${attachment.filename}"`);
            const { buffer, filename: downloadedFilename } =
              await downloadFileFromUrl(directUrl);

            let finalFilename = attachment.filename;

            // Case 1: Generic filename (download-xxx) -> use downloaded filename
            if (downloadedFilename && attachment.filename.startsWith("download-")) {
              finalFilename = downloadedFilename;
            }
            // Case 2: Custom filename without extension -> add extension
            else if (!path.extname(attachment.filename)) {
              // First try to get extension from downloadedFilename (Content-Disposition header)
              let ext = downloadedFilename ? path.extname(downloadedFilename) : null;

              // If no extension from header, try to extract from URL path
              if (!ext) {
                try {
                  const url = new URL(attachment.path);
                  const urlFilename = path.basename(url.pathname);
                  ext = path.extname(urlFilename);
                } catch {
                  // Ignore URL parsing errors
                }
              }

              // Add extension if found
              if (ext) {
                finalFilename = `${attachment.filename}${ext}`;
                logger.debug(
                  `Added extension to custom filename: "${attachment.filename}" -> "${finalFilename}"`
                );
              } else {
                logger.warn(
                  `Could not determine file extension for "${attachment.filename}". Using as-is.`
                );
              }
            }
            // Case 3: Custom filename with extension -> use as-is
            // (else: finalFilename already set to attachment.filename)

            // Auto-detect contentType from filename if not provided
            const finalContentType =
              attachment.contentType || getMimeType(finalFilename);

            processed.push({
              filename: finalFilename,
              content: buffer,
              contentType: finalContentType,
            });
            continue;
          } else {
            logger.warn(
              `Could not convert Google Drive URL for "${attachment.filename}". Skipping.`
            );
            continue;
          }
        }

        // Check if it's a remote URL
        if (isUrl(attachment.path)) {
          logger.debug(`Downloading remote file for "${attachment.filename}"`);
          const { buffer, filename: downloadedFilename } =
            await downloadFileFromUrl(attachment.path);

          let finalFilename = attachment.filename;

          // Case 1: Generic filename (download-xxx) -> use downloaded filename
          if (downloadedFilename && attachment.filename.startsWith("download-")) {
            finalFilename = downloadedFilename;
          }
          // Case 2: Custom filename without extension -> add extension
          else if (!path.extname(attachment.filename)) {
            // First try to get extension from downloadedFilename (Content-Disposition header)
            let ext = downloadedFilename ? path.extname(downloadedFilename) : null;

            // If no extension from header, try to extract from URL path
            if (!ext) {
              try {
                const url = new URL(attachment.path);
                const urlFilename = path.basename(url.pathname);
                ext = path.extname(urlFilename);
              } catch {
                // Ignore URL parsing errors
              }
            }

            // Add extension if found
            if (ext) {
              finalFilename = `${attachment.filename}${ext}`;
              logger.debug(
                `Added extension to custom filename: "${attachment.filename}" -> "${finalFilename}"`
              );
            } else {
              logger.warn(
                `Could not determine file extension for "${attachment.filename}". Using as-is.`
              );
            }
          }
          // Case 3: Custom filename with extension -> use as-is
          // (else: finalFilename already set to attachment.filename)

          // Auto-detect contentType from filename if not provided
          const finalContentType =
            attachment.contentType || getMimeType(finalFilename);

          processed.push({
            filename: finalFilename,
            content: buffer,
            contentType: finalContentType,
          });
          continue;
        }

        // Check if it's a local file path
        const exists = await fileExists(attachment.path);
        if (exists) {
          logger.debug(`Using local file for "${attachment.filename}"`);
          processed.push({
            filename: attachment.filename,
            path: attachment.path, // Nodemailer can handle local paths directly
            contentType: attachment.contentType,
          });
          continue;
        } else {
          logger.warn(
            `Local file not found: ${attachment.path}. Skipping attachment "${attachment.filename}".`
          );
          continue;
        }
      }

      logger.warn(
        `No valid path or content provided for attachment "${attachment.filename}". Skipping.`
      );
    } catch (error: any) {
      logger.error(
        `Error processing attachment "${attachment.filename}": ${error.message}`
      );
      // Continue with other attachments instead of failing completely
    }
  }

  return processed;
};

/**
 * Helper to get MIME type from filename extension
 */
export const getMimeType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx":
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".xml": "application/xml",
    ".zip": "application/zip",
    ".rar": "application/x-rar-compressed",
    ".7z": "application/x-7z-compressed",
    ".tar": "application/x-tar",
    ".gz": "application/gzip",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".avi": "video/x-msvideo",
    ".mov": "video/quicktime",
  };
  return mimeTypes[ext] || "application/octet-stream";
};

/**
 * Extract filename from a file path or URL
 * @param filePath - Local file path or URL
 * @returns Extracted filename
 */
export const getFilenameFromPath = (filePath: string): string => {
  // Handle URLs
  if (isUrl(filePath)) {
    try {
      const url = new URL(filePath);
      const pathname = url.pathname;
      const filename = path.basename(pathname);
      // If URL doesn't have a clear filename, generate one
      if (!filename || filename === "/" || !path.extname(filename)) {
        return `download-${Date.now()}`;
      }
      return filename;
    } catch {
      return `download-${Date.now()}`;
    }
  }

  // Handle local file paths
  return path.basename(filePath);
};

/**
 * Get file information (name and content type) from a file path
 * @param filePath - Local file path or URL
 * @returns Object containing filename and contentType
 */
export const getFileInfo = (
  filePath: string
): { filename: string; contentType: string } => {
  const filename = getFilenameFromPath(filePath);
  const contentType = getMimeType(filename);

  return {
    filename,
    contentType,
  };
};

/**
 * Simplified helper to create an attachment from just a file path
 * Automatically extracts filename and detects content type
 *
 * @param filePath - Local file path or URL
 * @param customFilename - Optional: Override the auto-detected filename (extension will be auto-added if missing)
 * @returns AttachmentInput ready to use
 *
 * @example
 * // Simple usage - auto-detect everything
 * const attachment = createAttachment("/path/to/document.pdf");
 *
 * @example
 * // With custom filename (with extension)
 * const attachment = createAttachment(
 *   "https://example.com/file.pdf",
 *   "My-Custom-Name.pdf"
 * );
 *
 * @example
 * // With custom filename (without extension - will be auto-added from downloaded file)
 * const attachment = createAttachment(
 *   "https://example.com/file.pdf",
 *   "My-Custom-Name"  // Extension will be detected and added
 * );
 */
export const createAttachment = (
  filePath: string,
  customFilename?: string
): AttachmentInput => {
  const { filename, contentType } = getFileInfo(filePath);

  // If custom filename provided, check if it has an extension
  let finalFilename = customFilename || filename;

  if (customFilename) {
    const hasExtension = path.extname(customFilename);

    // If no extension in custom filename, we'll let processAttachments add it from downloaded file
    // Store a flag in a special property to indicate extension should be auto-added
    if (!hasExtension) {
      // For now, use the filename as-is. The processAttachments function will handle adding extension
      finalFilename = customFilename;
    }
  }

  return {
    filename: finalFilename,
    path: filePath,
    contentType: customFilename && !path.extname(customFilename) ? undefined : contentType,
  };
};

/**
 * Create multiple attachments from an array of file paths
 * @param filePaths - Array of local file paths or URLs
 * @returns Array of AttachmentInput
 *
 * @example
 * const attachments = createAttachments([
 *   "/path/to/document.pdf",
 *   "https://example.com/image.png",
 *   "/path/to/spreadsheet.xlsx"
 * ]);
 */
export const createAttachments = (filePaths: string[]): AttachmentInput[] => {
  return filePaths.map((filePath) => createAttachment(filePath));
};
