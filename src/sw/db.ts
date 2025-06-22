import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { type CoreMessage } from "ai";

const DB_NAME = "nostr-void";
const DB_VERSION = 2;

interface Schema extends DBSchema {
  config: {
    key: string;
    value: { key: string; value: any };
  };
  messages: {
    key: number;
    value: { id?: number; message: CoreMessage };
  };
}

let db: IDBPDatabase<Schema> | null = null;

export default async function getDatabase(): Promise<IDBPDatabase<Schema>> {
  if (db) return db;

  db = await openDB<Schema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore("config", { keyPath: "key" });
      }
      if (oldVersion < 2) {
        db.createObjectStore("messages", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    },
  });

  return db;
}

// Helper functions for message persistence
export async function saveMessages(messages: CoreMessage[]): Promise<void> {
  const database = await getDatabase();
  const tx = database.transaction("messages", "readwrite");

  // Clear existing messages first
  await tx.store.clear();

  // Save all messages
  for (const message of messages) {
    await tx.store.add({ message });
  }

  await tx.done;
}

export async function loadMessages(): Promise<CoreMessage[]> {
  const database = await getDatabase();
  const messages = await database.getAll("messages");
  return messages.map((item) => item.message);
}

export async function clearMessages(): Promise<void> {
  const database = await getDatabase();
  const tx = database.transaction("messages", "readwrite");
  await tx.store.clear();
  await tx.done;
}
