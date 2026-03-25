import { createReadStream } from "node:fs";
import { access, appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";

const JSONL_NEWLINE = "\n";

export async function saveJsonLine<T>(filePath: string, value: T): Promise<void> {
  await ensureParentDirectory(filePath);
  const line = `${JSON.stringify(value)}${JSONL_NEWLINE}`;
  await appendFile(filePath, line, "utf8");
}

export async function saveJsonLines<T>(filePath: string, values: T[]): Promise<void> {
  if (!values.length) {
    return;
  }

  await ensureParentDirectory(filePath);
  const content = `${values.map((value) => JSON.stringify(value)).join(JSONL_NEWLINE)}${JSONL_NEWLINE}`;
  await appendFile(filePath, content, "utf8");
}

export async function writeJsonLines<T>(filePath: string, values: T[]): Promise<void> {
  await ensureParentDirectory(filePath);

  if (!values.length) {
    await writeFile(filePath, "", "utf8");
    return;
  }

  const content = `${values.map((value) => JSON.stringify(value)).join(JSONL_NEWLINE)}${JSONL_NEWLINE}`;
  await writeFile(filePath, content, "utf8");
}

export async function readJsonLines<T>(filePath: string): Promise<T[]> {
  const parsedValues: T[] = [];
  const stream = createReadStream(filePath, { encoding: "utf8" });
  const lineReader = createInterface({
    input: stream,
    crlfDelay: Number.POSITIVE_INFINITY,
  });
  let lineNumber = 0;

  try {
    for await (const line of lineReader) {
      lineNumber += 1;
      const normalized = line.trim();

      if (!normalized) {
        continue;
      }

      try {
        parsedValues.push(JSON.parse(normalized) as T);
      } catch {
        throw new Error(`Invalid JSONL format at line ${lineNumber} in ${filePath}`);
      }
    }

    return parsedValues;
  } finally {
    lineReader.close();
  }
}

export async function findJsonLines<T>(
  filePath: string,
  predicate: (value: T, lineNumber: number) => boolean | Promise<boolean>
): Promise<T[]> {
  const matchedValues: T[] = [];
  const stream = createReadStream(filePath, { encoding: "utf8" });
  const lineReader = createInterface({
    input: stream,
    crlfDelay: Number.POSITIVE_INFINITY,
  });
  let lineNumber = 0;

  try {
    for await (const line of lineReader) {
      lineNumber += 1;
      const normalized = line.trim();

      if (!normalized) {
        continue;
      }

      try {
        const parsedValue = JSON.parse(normalized) as T;

        if (await predicate(parsedValue, lineNumber)) {
          matchedValues.push(parsedValue);
        }
      } catch {
        throw new Error(`Invalid JSONL format at line ${lineNumber} in ${filePath}`);
      }
    }

    return matchedValues;
  } finally {
    lineReader.close();
  }
}

async function ensureParentDirectory(filePath: string): Promise<void> {
  try {
    await access(filePath);
    return;
  } catch {
    // file does not exist, continue to ensure parent directory
  }

  const directoryPath = path.dirname(filePath);
  await mkdir(directoryPath, { recursive: true });
}
