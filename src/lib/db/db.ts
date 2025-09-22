import { createRxDatabase, RxDatabase, RxCollection } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { TZTaskSchema } from "../validation/task";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { addRxPlugin } from "rxdb/plugins/core";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";

// Add required plugins
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  addRxPlugin(RxDBDevModePlugin);
}
addRxPlugin(RxDBUpdatePlugin);

export const taskSchema = {
  title: "task schema",
  description: "Describes a todo task",
  version: 0,
  type: "object",
  primaryKey: "id",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    name: {
      type: "string",
      maxLength: 200,
    },
    category: {
      type: "string",
      maxLength: 50,
    },
    priority: {
      type: "string",
      maxLength: 20,
    },
    createdAt: {
      type: "string",
      maxLength: 50,
    },
    completed: { type: "boolean" },
  },
  required: ["id", "name", "category", "priority", "completed", "createdAt"],
  indexes: ["completed", "category", "priority", "createdAt"],
};

export type TaskCollection = RxCollection<TZTaskSchema>;
export type TaskDB = RxDatabase<{
  tasks: TaskCollection;
}>;

let dbInstance: TaskDB | null = null;
let dbPromise: Promise<TaskDB> | null = null;

export function initDB(): Promise<TaskDB> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    const db = await createRxDatabase({
      name: "taskbuddydb_v2",
      storage: wrappedValidateAjvStorage({
        storage: getRxStorageDexie(),
      }),
      multiInstance: true,
      ignoreDuplicate: true,
    });

    await db.addCollections({
      tasks: {
        schema: taskSchema,
      },
    });

    dbInstance = db as unknown as TaskDB;
    dbPromise = null;
    console.log("DB ready", db);
    return dbInstance;
  })();
  return dbPromise;
}

// Handle HMR to prevent DVM1
if (import.meta.hot) {
  import.meta.hot.dispose(async () => {
    if (dbInstance) {
      await dbInstance.remove();
      dbInstance = null;
    }
  });
}
