import fs from 'fs';

import type { Version } from './types/messages';
import type { NFEGroup } from './types/output';
import type { NetFieldExportGroup } from 'fortnite-replay-parser/dist/types/nfe';

export default (nfes: NetFieldExportGroup[], version: Version) => {
  if (!fs.existsSync(`./output/${version.major}`)) {
    fs.mkdirSync(`./output/${version.major}`, {
      recursive: true,
    });
  }

  const seasonFile = `./output/${version.major}/${version.major}.json`;
  const versionFile = `./output/${version.major}/${version.major}.${version.minor}.json`;
  const lifetimeFile = './output/lifetime.json';

  let seasonData: NFEGroup[] = [];
  let versionData: NFEGroup[] = [];
  let lifetimeData: NFEGroup[] = [];

  if (fs.existsSync(seasonFile)) {
    seasonData = <NFEGroup[]>JSON.parse(fs.readFileSync(seasonFile).toString());
  }

  if (fs.existsSync(versionFile)) {
    versionData = <NFEGroup[]>JSON.parse(fs.readFileSync(versionFile).toString());
  }

  if (fs.existsSync(lifetimeFile)) {
    lifetimeData = <NFEGroup[]>JSON.parse(fs.readFileSync(lifetimeFile).toString());
  }

  let newSeasonData = false;
  let newVersionData = false;
  let newLifetimeData = false;

  nfes.forEach((nfe) => {
    const path = nfe.pathName;

    let seasonEntry = seasonData.find((entry) => entry.path === path);

    if (!seasonEntry) {
      seasonEntry = {
        path,
        propertyCount: 0,
        properties: [],
      };

      seasonData.push(seasonEntry);
    }

    let versionEntry = versionData.find((entry) => entry.path === path);

    if (!versionEntry) {
      versionEntry = {
        path,
        propertyCount: 0,
        properties: [],
      };

      versionData.push(versionEntry);
    }

    let lifetimeEntry = lifetimeData.find((entry) => entry.path === path);

    if (!lifetimeEntry) {
      lifetimeEntry = {
        path,
        propertyCount: 0,
        properties: [],
      };

      lifetimeData.push(lifetimeEntry);
    }

    if (!nfe.properties) {
      return;
    }

    Object.values(nfe.properties).forEach((prop) => {
      if (!prop || !seasonEntry || !versionEntry || !lifetimeEntry) {
        return;
      }

      let seasonProp = seasonEntry.properties.find((p) => p.checksum === prop.compatibleChecksum);

      if (!seasonProp) {
        seasonProp = {
          name: prop.name,
          checksum: prop.compatibleChecksum,
          checksumHex: prop.compatibleChecksum.toString(16).padStart(8, '0').toUpperCase(),
        };

        seasonEntry.properties.push(seasonProp);
        seasonEntry.propertyCount += 1;

        newSeasonData = true;
      }

      let versionProp = versionEntry.properties.find((p) => p.checksum === prop.compatibleChecksum);

      if (!versionProp) {
        versionProp = {
          name: prop.name,
          checksum: prop.compatibleChecksum,
          checksumHex: prop.compatibleChecksum.toString(16).padStart(8, '0').toUpperCase(),
        };

        versionEntry.properties.push(versionProp);
        versionEntry.propertyCount += 1;

        newVersionData = true;
      }

      let lifetimeProp = lifetimeEntry.properties.find((p) => p.checksum === prop.compatibleChecksum);

      if (!lifetimeProp) {
        lifetimeProp = {
          name: prop.name,
          checksum: prop.compatibleChecksum,
          checksumHex: prop.compatibleChecksum.toString(16).padStart(8, '0').toUpperCase(),
        };

        lifetimeEntry.properties.push(lifetimeProp);
        lifetimeEntry.propertyCount += 1;

        newLifetimeData = true;
      }
    });

    seasonEntry.properties = Object.values(seasonEntry.properties).sort((a, b) => a.name.localeCompare(b.name));
    versionEntry.properties = Object.values(versionEntry.properties).sort((a, b) => a.name.localeCompare(b.name));
    lifetimeEntry.properties = Object.values(lifetimeEntry.properties).sort((a, b) => a.name.localeCompare(b.name));
  });

  if (newSeasonData) {
    const sortedSeasonData = seasonData.sort((a, b) => (a.path < b.path ? -1 : 1));

    fs.writeFileSync(seasonFile, JSON.stringify(sortedSeasonData, null, 2));
  }

  if (newVersionData) {
    const sortedVersionData = versionData.sort((a, b) => (a.path < b.path ? -1 : 1));

    fs.writeFileSync(versionFile, JSON.stringify(sortedVersionData, null, 2));
  }

  if (newLifetimeData) {
    const sortedLifetimeData = lifetimeData.sort((a, b) => (a.path < b.path ? -1 : 1));

    fs.writeFileSync(lifetimeFile, JSON.stringify(sortedLifetimeData, null, 2));
  }
};
