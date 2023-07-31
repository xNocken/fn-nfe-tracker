import type { NetFieldExportGroup } from 'fortnite-replay-parser/dist/types/nfe';

export interface Message {
  type: string;
}

export interface StartMessage extends Message {
  type: 'start';
  path: string;
}

export interface Version {
  major: number;
  minor: number;
  changelist: number;
}

export interface FinishedMessage extends Message {
  type: 'finished';
  data: {
    netFieldExports: NetFieldExportGroup[];
    networkGuids: string[];
    version: Version;
  };
}

export type Messages = StartMessage | FinishedMessage;
