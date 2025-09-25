import { z } from "zod";

export enum PRIORITY {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum CATEGORY {
  WORK = "work",
  PERSONAL = "personal",
  SHOPPING = "shopping",
  OTHER = "other",
}

const CreateTaskSchema = z.object({
  name: z.string().nonempty({ message: "Task name cannot be empty" }),
  priority: z.nativeEnum(PRIORITY),
  category: z.nativeEnum(CATEGORY),
  completed: z.boolean(),
});

const TaskSchema = CreateTaskSchema.extend({
  id: z.string().nonempty({ message: "Task id cannot be empty" }),

  createdAt: z.date().optional(),
});

type TZTaskSchema = z.infer<typeof TaskSchema>;
type TZCreateTaskSchema = z.infer<typeof CreateTaskSchema>;

export { CreateTaskSchema, TaskSchema };
export type { TZCreateTaskSchema, TZTaskSchema };
