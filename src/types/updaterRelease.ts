export interface UpdaterReleaseFile {
  name: string;
  relativePath: string;
  sizeBytes: number;
  modifiedAt: string;
  downloadUrl: string;
}

export interface UpdaterReleaseVersion {
  version: string;
  files: UpdaterReleaseFile[];
  fileCount: number;
  totalSizeBytes: number;
  updatedAt: string | null;
}

export interface UpdaterReleaseChannel {
  channel: string;
  rootFiles: UpdaterReleaseFile[];
  versions: UpdaterReleaseVersion[];
  fileCount: number;
  totalSizeBytes: number;
}

export interface UpdaterReleaseList {
  publicBaseUrl: string;
  storage: UpdaterReleaseStorage;
  generatedAt: string;
  channels: UpdaterReleaseChannel[];
}

export interface UpdaterReleaseStorage {
  root: string;
  available: boolean;
}
