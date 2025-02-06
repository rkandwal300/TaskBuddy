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
  setData: (data: TZTaskSchema[]) => void;
  initialValues?: TZTaskSchema;
}>;
export default function CreateTask({ setOpen, initialValues, setData }: Props) {
  const form = useForm<TZCreateTaskSchema>({
    resolver: zodResolver(CreateTaskSchema),
    defaultValues: initialValues ?? {
      name: '',
      completed: false,
      createdAt: new Date().toISOString(),
    },
  });
  function onSubmit(values: TZCreateTaskSchema) {
    const previousTaskStringified = localStorage.getItem('tasks');

    let previousTask: TZTaskSchema[] = [];
    if (previousTaskStringified) {
      previousTask = JSON.parse(previousTaskStringified);
    }
    let updatedTasks = [];
    if (initialValues) {
      updatedTasks = previousTask.map((item) => {
        if (item.id === initialValues.id) {
          return { ...values, id: initialValues.id };
        }
        return item;
      });
    } else {
      updatedTasks = [
        ...previousTask,
        { ...values, id: 'task-' + previousTask.length + 1 },
      ];
    }
    console.log(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    setData(updatedTasks);
    setOpen(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogTitle className="flex items-center justify-between p-4 border-b">
          <span className="font-medium text-base"> Create Task</span>
          <Button type="submit">Submit</Button>
        </DialogTitle>
        <div className="p-4 flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="task" {...field} />
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
                        <SelectValue placeholder="Select">
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
                          placeholder="Select"
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
