// api/telegram.ts
import axios from "axios";
import { API_URL } from "../config";

export interface IDatabaseStatus {
  connected: boolean;
  dbName: string;
  collectionsCount: number;
  collections: string[];
  stats: {
    db: string;
    collections: number;
    views: number;
    objects: number;
    avgObjSize: number;
    dataSize: number;
    storageSize: number;
    totalFreeStorageSize: number;
    numExtents: number;
    indexes: number;
    indexSize: number;
    indexFreeStorageSize: number;
    fileSize: number;
    nsSizeMB: number;
    ok: number;
  };
}

export const getDatabaseStatus = async (): Promise<IDatabaseStatus> => {
    const res = await axios.get<IDatabaseStatus>(`${API_URL}api/database/status`, {
        withCredentials: true,
    });
    return res.data;
};