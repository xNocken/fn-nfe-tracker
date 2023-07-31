import fs from 'fs';

const findFilesRecursive = (path: string, extension: string): string[] => {
  const files: string[] = [];

  fs.readdirSync(path).forEach((file) => {
    const filePath = `${path}/${file}`;

    if (fs.statSync(filePath).isDirectory()) {
      files.push(...findFilesRecursive(filePath, extension));
    }

    if (filePath.endsWith(extension)) {
      files.push(filePath);
    }
  });

  return files;
};

export default findFilesRecursive;
