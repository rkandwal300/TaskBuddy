import { zodResolver } from '@hookform/resolvers/zod';
import { SelectTrigger } from '@radix-ui/react-select';
import { useForm } from 'react-hook-form';
import {
  category,
  CreateTaskSchema,
  priority,
  TZCreateTaskSchema,
  TZTaskSchema,
} from '../../lib/validation/task';
import { TaskWithMeta } from '../../state/tasks';
import { taskOperations } from '../../state/sync';
import { Button } from '../ui/button';
import { DialogTitle } from '../ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectValue,
} from '../ui/select';

type Props = Readonly<{
  setOpen: (b: boolean) => void;
  onSubmit?: (task: TZTaskSchema) => Promise<void>;
  initialValues?: TaskWithMeta;
  isEditing?: boolean;
}>;

export default function CreateTask({ setOpen, onSubmit, initialValues, isEditing = false }: Props) {
  const form = useForm<TZCreateTaskSchema>({
    resolver: zodResolver(CreateTaskSchema),
    defaultValues: initialValues ?? {
      name: '',
      completed: false,
      createdAt: new Date().toISOString(),
    },
  });

  async function handleSubmit(values: TZCreateTaskSchema) {
    try {
      if (isEditing && initialValues && onSubmit) {
        // Edit existing task
        const updatedTask: TZTaskSchema = {
          ...initialValues,
          ...values,
        };
        await onSubmit(updatedTask);
      } else {
        // Create new task
        await taskOperations.create({
          name: values.name,
          category: values.category,
          priority: values.priority,
          completed: values.completed || false,
        });
        setOpen(false);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      // Handle error - maybe show a toast
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <DialogTitle className="flex items-center justify-between p-4 border-b">
          <span className="font-medium text-base">
            {isEditing ? 'Edit Task' : 'Create Task'}
          </span>
          <Button type="submit">
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogTitle>
        <div className="p-4 flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter task name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full border rounded-sm h-9">
                        <SelectValue placeholder="Select priority">
                          <span className="text-start capitalize">
                            {field.value}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {Object.values(priority).map((item) => (
                            <SelectItem
                              key={item}
                              value={item}
                              className="capitalize font-medium"
                            >
                              {item}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full border rounded-sm h-9">
                        <SelectValue
                          className="text-start capitalize"
                          placeholder="Select category"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {Object.values(category).map((item) => (
                            <SelectItem
                              key={item}
                              value={item}
                              className="capitalize font-medium"
                            >
                              {item}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  );
}
