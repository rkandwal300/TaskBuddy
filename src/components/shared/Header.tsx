import React from 'react'; 
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import CreateTask from './CreateTask';

 
export default function Header( ) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex p-4 justify-between items-center border-b">
      <span className="text-lg font-medium">Task Buddy</span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Create</Button>
        </DialogTrigger>
        <DialogContent className="p-0">
          <CreateTask setOpen={setOpen}    />
        </DialogContent>
      </Dialog>
    </div>
  );
}
