import React from 'react';
import { TZTaskSchema } from '../../lib/validation/task';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import CreateTask from './CreateTask';

type Props = Readonly<{
  setData: (data: TZTaskSchema[]) => void;
}>;
export default function Header({ setData }: Props) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex p-4 justify-between items-center border-b">
      <span className="text-lg font-medium">Task Buddy</span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Create</Button>
        </DialogTrigger>
        <DialogContent className="p-0">
          <CreateTask setOpen={setOpen} setData={setData} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
