import fs from "fs";
import path from "path";

export const readTemplateContent = async (TemplateFileName: string) => {
  const filePath: string = path.join(
    process.cwd(),
    "src/emailTemplates",
    `${TemplateFileName}`
  );
  return fs.readFileSync(filePath, "utf-8").toString(); // Read the HTML content
};
