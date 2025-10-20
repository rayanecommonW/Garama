// src/config.ts
// Loads environment variables for the backend. Uses Bun/Dotenv runtime if available.
import fs from 'fs';
import path from 'path';

type Config = {
  BACK_PORT: number;
  FRONT_PORT: number;
  FRONT_URL: string;
};

// Try to load a .env file in project root (backend folder)
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf-8');
  const parsed: Record<string, string> = {};
  raw.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) return;
  const key = m[1] as string;
    let val = m[2] || '';
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    parsed[key] = val;
  });

  // Assign parsed values to process.env without triggering TS index errors
  Object.assign(process.env as any, parsed);
}

const BACK_PORT = Number(process.env.BACK_PORT || process.env.PORT || 3001);
const FRONT_PORT = Number(process.env.FRONT_PORT || 3000);
const FRONT_URL = process.env.FRONT_URL || `http://localhost:${FRONT_PORT}`;

const config: Config = {
  BACK_PORT,
  FRONT_PORT,
  FRONT_URL,
};

export default config;
