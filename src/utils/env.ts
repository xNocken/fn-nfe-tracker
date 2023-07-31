import dotenv from 'dotenv';

dotenv.config();

export interface Env {
  THREADS: number;
  REPLAY_FOLDER: string;
}

if (!process.env.THREADS || Number.isNaN(Number(process.env.THREADS))) {
  throw new Error('THREADS is not defined');
}

if (!process.env.REPLAY_FOLDER) {
  throw new Error('REPLAY_FOLDER is not defined');
}

export default {
  THREADS: Number(process.env.THREADS),
  REPLAY_FOLDER: process.env.REPLAY_FOLDER,
} satisfies Env;
