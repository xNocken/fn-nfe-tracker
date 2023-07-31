export interface NFEProp {
  name: string;
  checksum: number;
}

export interface NFEGroup {
  path: string;
  propertyCount: number;
  properties: NFEProp[];
}
