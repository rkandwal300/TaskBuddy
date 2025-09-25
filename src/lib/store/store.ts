import { TZCreateTaskSchema, TZTaskSchema } from "../validation/task";
import {
  computed,
  Observable,
  observable,
  ObservablePrimitive,
} from "@legendapp/state";
import { configureSynced, syncObservable } from "@legendapp/state/sync";
import { observablePersistIndexedDB } from "@legendapp/state/persist-plugins/indexeddb";

export interface Store {
  taskList: TZTaskSchema[];
  total: ObservablePrimitive<number>;
  completedTasks: ObservablePrimitive<number>;
  pendingTasks: ObservablePrimitive<number>;
}

// -----------------------------
// Store
// -----------------------------
export const store$: Observable<Store> = observable({
  taskList: [] as TZTaskSchema[],
  total: computed(() => store$.taskList.peek().length),
  completedTasks: computed(
    () => store$.taskList.peek().filter((t) => t.completed).length
  ),
  pendingTasks: computed(
    () => store$.taskList.peek().filter((t) => !t.completed).length
  ),
});

// -----------------------------
// Store
// -----------------------------

// Create default persist options
const persistOptions = configureSynced({
  persist: {
    plugin: observablePersistIndexedDB({
      databaseName: "Legend",
      version: 2,
      tableNames: ["taskListState", "store"],
    }),
  },
});

syncObservable(
  store$,
  persistOptions({
    persist: {
      name: "taskListState", // IndexedDB table name
    },
  })
);

// Actions (kept separate)
export const storeActions = {
  addTask(data: TZCreateTaskSchema) {
    store$.taskList.push({
      id: `${Date.now()}-${Math.random()}`,
      ...data,
      createdAt: new Date(),
    });
  },

  toggleTask(id: string) {
    const task = store$.taskList.find((t) => t.id.get() === id);
    if (task) {
      task.completed.set(!task.completed.get());
    }
  },

  deleteTask(id: string) {
    store$.taskList.set(store$.taskList.peek().filter((t) => t.id !== id));
  },

  updateTask(id: string, data: Partial<TZTaskSchema>) {
    const task = store$.taskList.find((t) => t.id.get() === id);
    if (task) {
      task.assign(data);
    }
  },
};
