import fs from 'fs/promises';
import path from 'path';

export const sessions = new Map();

export function setDeep(obj, pathStr, value) {
  const parts = pathStr.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    if (i === parts.length - 1) {
      cur[key] = value;
    } else {
      if (cur[key] == null || typeof cur[key] !== 'object') {
        cur[key] = {};
      }
      cur = cur[key];
    }
  }
}

export async function persistToFile(sessionId, session) {
  const dataDir = path.join(process.cwd(), 'server', 'data');
  await fs.mkdir(dataDir, { recursive: true });
  const filePath = path.join(dataDir, `${sessionId}.json`);
  await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf8');
}

export async function loadFromFile(sessionId) {
  try {
    const filePath = path.join(process.cwd(), 'server', 'data', `${sessionId}.json`);
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}
