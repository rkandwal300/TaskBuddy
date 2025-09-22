// hooks/useTasks.ts
import { useEffect, useState } from "react";
import { initDB } from "../lib/db/db";
import { TZTaskSchema } from "../lib/validation/task";

export function useTasks() {
  const [tasks, setTasks] = useState<TZTaskSchema[]>([]);

  useEffect(() => {
    let cancelled = false;
    let sub: { unsubscribe: () => void } | null = null;

    (async () => {
      try {
        const db = await initDB();
        if (cancelled) return;

        // Live query subscription
        sub = db.tasks.find().$.subscribe((docs) => {
          if (!cancelled && docs) {
            setTasks(docs.map((d) => d.toJSON()));
          }
        });
      } catch (err) {
        console.error("Failed to initialize DB in useTasks:", err);
      }
    })();

    return () => {
      cancelled = true;
      if (sub) sub.unsubscribe();
    };
  }, []);

  // CRUD
  async function addTask(task: TZTaskSchema) {
    const db = await initDB();
    await db.tasks.insert(task);
  }

  async function toggleTask(task: TZTaskSchema) {
    const db = await initDB();
    const doc = await db.tasks.findOne({ selector: { id: task.id } }).exec();
    if (doc) await doc.update({ $set: { completed: !task.completed } });
    
  }

  async function deleteTask(task: TZTaskSchema) {
    const db = await initDB();
    const doc = await db.tasks.findOne({ selector: { id: task.id } }).exec();
    if (doc) await doc.remove();
  }

  async function updateTask(updated: TZTaskSchema) {
    const db = await initDB();
    const doc = await db.tasks.findOne({ selector: { id: updated.id } }).exec();
    if (doc) {
      await doc.update({
        $set: {
          name: updated.name,
          category: updated.category,
          priority: updated.priority,
          completed: updated.completed,
        },
      });
    }
  }

  return { tasks, addTask, toggleTask, deleteTask, updateTask };
}
