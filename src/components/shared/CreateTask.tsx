import { zodResolver } from '@hookform/resolvers/zod';
import { SelectTrigger } from '@radix-ui/react-select';
import { useForm } from 'react-hook-form';
import {
  CATEGORY,
  CreateTaskSchema,
  PRIORITY,
  TZCreateTaskSchema,
  TZTaskSchema,
} from '../../lib/validation/task';
import { Button } from '../ui/button';
import { DialogDescription, DialogTitle } from '../ui/dialog';
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
import {  storeActions } from '../../lib/store/store';

type Props = Readonly<{
  setOpen: (b: boolean) => void;
  initialValues?: TZTaskSchema;
}>;
export default function CreateTask({ setOpen, initialValues }: Props) {
  const form = useForm<TZCreateTaskSchema>({
    resolver: zodResolver(CreateTaskSchema),
    defaultValues: initialValues ?? {
      name: '',
      completed: false,
    },
  });
  function onSubmit(values: TZCreateTaskSchema) {

    if (initialValues) {
      storeActions.updateTask(initialValues.id, values);
    }
    else {
      storeActions.addTask(values);
    }
    setOpen(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogTitle className="flex items-center justify-between p-4 border-b">
          <DialogDescription className="font-medium text-base"> Create Task</DialogDescription>
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
                          {Object.values(PRIORITY).map((item) => (
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
                      <SelectTrigger className="w-full border capitalize rounded-sm h-9">
                        <SelectValue
                          className="text-start"
                          placeholder="Select"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {Object.values(CATEGORY).map((item) => (
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
