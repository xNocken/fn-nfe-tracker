import { fork } from 'child_process';

import handleNfes from './handle-nfes';
import env from './utils/env';
import findFilesRecursive from './utils/find-files-recursive';

import type { Messages, StartMessage } from './types/messages';

const files = findFilesRecursive(env.REPLAY_FOLDER, '.replay');

const threads = env.THREADS;

let threadsRunning = 0;
let fileIndex = 0;

const waitForThread = () => new Promise<void>((resolve) => {
  if (threadsRunning < threads) {
    resolve();

    return;
  }

  const interval = setInterval(() => {
    if (threadsRunning < threads) {
      clearInterval(interval);
      resolve();
    }
  });
});

const startThread = async (): Promise<void> => {
  if (fileIndex >= files.length) {
    return;
  }

  await waitForThread();

  console.log(`Starting thread ${fileIndex + 1}/${files.length}`);

  const file = files[fileIndex];

  fileIndex += 1;
  threadsRunning += 1;

  const thread = fork(`${__dirname}/parser`, {
    silent: true,
  });

  thread.on('message', (message: Messages) => {
    switch (message.type) {
      case 'finished': {
        console.log(`Finished thread ${fileIndex}/${files.length}`);

        const { netFieldExports, version } = message.data;

        handleNfes(netFieldExports, version);

        thread.kill();

        break;
      }

      default: {
        throw Error(`Unknown message type: ${message.type}`);
      }
    }
  });

  thread.on('exit', () => {
    threadsRunning -= 1;
  });

  // thread.stdout?.on('data', (data: Buffer) => {
  //   console.log(`${file}: ${data.toString().replace('\n', '')}`);
  // });

  thread.stderr?.on('data', (data: Buffer) => {
    console.error(`${file}: ${data.toString().replace('\n', '')}`);
  });

  thread.send({
    type: 'start',
    path: file,
  } satisfies StartMessage);

  startThread().finally(() => { });
};

startThread().finally(() => { });
