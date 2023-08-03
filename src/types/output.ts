export interface NFEProp {
  name: string;
  checksum: number;
  checksumHex: string;
}

export interface NFEGroup {
  path: string;
  propertyCount: number;
  properties: NFEProp[];
}
