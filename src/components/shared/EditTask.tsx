import { PencilIcon } from 'lucide-react';
import React from 'react';
import { TZTaskSchema } from '../../lib/validation/task';
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
  setData: (data: TZTaskSchema[]) => void;
  data: TZTaskSchema;
}>;

export default function EditTask({ data, setData }: Props) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex p-4 justify-between items-center border-b">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="ghost">
                    <PencilIcon />
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
            setData={setData}
            initialValues={data}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
