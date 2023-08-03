import { fork } from 'child_process';

import handleNfes from './handle-nfes';
import env from './utils/env';
import findFilesRecursive from './utils/find-files-recursive';

import type { Messages, StartMessage } from './types/messages';
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { NFEGroup } from './types/output';

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

// startThread().finally(() => { });

const outputFiles = findFilesRecursive('output', 'json');

outputFiles.forEach((file) => {
  const data = <NFEGroup[]>JSON.parse(readFileSync(file, 'utf-8'));

  data.forEach((group) => {
    group.properties.forEach((prop) => {
      prop.checksumHex = prop.checksum.toString(16).padStart(8, '0').toUpperCase();
    });
  });

  writeFileSync(file, Buffer.from(JSON.stringify(data, null, 2)));
});
