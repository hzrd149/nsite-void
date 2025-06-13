import { openDB, type DBSchema, type IDBPDatabase } from "idb";

const DB_NAME = "nostr-void";
const DB_VERSION = 1;

interface Schema extends DBSchema {
  config: {
    key: string;
    value: { key: string; value: any };
  };
}

let db: IDBPDatabase<Schema> | null = null;

export default async function getDatabase(): Promise<IDBPDatabase<Schema>> {
  if (db) return db;

  db = await openDB<Schema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore("config", { keyPath: "key" });
    },
  });

  return db;
}
