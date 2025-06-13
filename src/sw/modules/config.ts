import { BehaviorSubject, of } from "rxjs";
import type { AppConfig } from "../../common/types";
import getDatabase from "../db";
import { rpcServer } from "../rpc-server";

const DEFAULT_CONFIG: AppConfig = {
  apiUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "claude-sonnet-4",
  maxSteps: 5,
};

export const config$ = new BehaviorSubject<AppConfig>(DEFAULT_CONFIG);

// Load the config from the database
async function loadConfig() {
  const db = await getDatabase();
  const fields = await db.getAll("config");
  const config = Object.fromEntries(
    fields.map((field) => [field.key, field.value]),
  );
  config$.next({ ...DEFAULT_CONFIG, ...config });
}
loadConfig();

// RPC methods
rpcServer.register("getConfig", () => config$.asObservable());
rpcServer.register("setConfig", async (payload: Partial<AppConfig>) => {
  const db = await getDatabase();
  const config: AppConfig = { ...config$.value, ...payload };
  config$.next(config);

  // Save to the database
  const tx = db.transaction("config", "readwrite");
  for (const [key, value] of Object.entries(config)) {
    tx.store.put({ key, value });
  }
  await tx.done;

  // Return the new config
  return of(config);
});
rpcServer.register("resetConfig", () => {
  config$.next(DEFAULT_CONFIG);
  return of(DEFAULT_CONFIG);
});
