import { readFileSync } from 'fs';

import { parseBinary } from 'fortnite-replay-parser';
import { getFullGuidPath } from 'fortnite-replay-parser/dist/src/utils/get-full-guid-path';

import type { FinishedMessage, Messages } from './types/messages';
import type { NetworkGUID } from 'fortnite-replay-parser/dist/Classes/NetworkGUID';
import type { SetEvents, BaseResult, BaseStates } from 'fortnite-replay-parser/dist/types/lib';

if (!process.send) {
  throw Error('dont run this file directly');
}

const setEvents: SetEvents<BaseResult, BaseStates> = ({ parsing }) => {
  parsing.on('finished', ({ globalData }) => {
    if (!process.send) {
      return;
    }

    if (globalData.header === undefined) {
      throw Error('Header is undefined');
    }

    const guids = Object
      .values(globalData.netGuidCache.netGuids)
      .map((guid: NetworkGUID) => getFullGuidPath(guid))
      .filter((guid: string | null) => guid !== null);

    const finishedMessage: FinishedMessage = {
      type: 'finished',
      data: {
        netFieldExports: Object.values(globalData.debugNotReadingGroups),
        networkGuids: <string[]>guids,
        version: {
          major: globalData.header.major ?? 0,
          minor: globalData.header.minor ?? 0,
          changelist: globalData.header.changelist ?? 0,
        },
      },
    };

    process.send(finishedMessage);
  });
};

process.on('message', (message: Messages) => {
  switch (message.type) {
    case 'start': {
      const replay = readFileSync(message.path);

      parseBinary(replay, {
        setEvents,
        onlyUseCustomNetFieldExports: true,
        customNetFieldExports: [],
        parsePackets: true,
        parseEvents: false,
        useCheckpoints: true,
        debug: true,
      });
      break;
    }

    default:
      throw Error(`Unknown message type: ${message.type}`);
  }
});
