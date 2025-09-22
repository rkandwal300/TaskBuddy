import { PencilIcon } from 'lucide-react';
import React from 'react';
import { TZTaskSchema } from '../../lib/validation/task';
import { TaskWithMeta } from '../../state/tasks';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import CreateTask from './CreateTask';

type Props = Readonly<{
  task: TaskWithMeta;
  onUpdate: (updates: Partial<TZTaskSchema>) => Promise<TaskWithMeta | null>;
}>;

export default function EditTask({ task, onUpdate }: Props) {
  const [open, setOpen] = React.useState(false);
  
  const handleUpdate = async (updatedTask: TZTaskSchema) => {
    await onUpdate(updatedTask);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" className="p-2" size="sm">
                  <PencilIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Task</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </span>
      </DialogTrigger>
      <DialogContent className="p-0">
        <CreateTask
          setOpen={setOpen}
          onSubmit={handleUpdate}
          initialValues={task}
          isEditing={true}
        />
      </DialogContent>
    </Dialog>
  );
}
