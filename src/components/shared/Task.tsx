import dayjs from 'dayjs';
import { Flag, Trash2 } from 'lucide-react';
import { cn, priorityStatusList } from '../../lib/utils';
import { TZTaskSchema } from '../../lib/validation/task';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import EditTask from './EditTask';

type Props = Readonly<{
  data: TZTaskSchema; 
  setCompleted: (data: TZTaskSchema) => void;
  setDelete: (data: TZTaskSchema) => void;
}>;
export default function Task({
  data,
  setCompleted, 
  setDelete,
}: Props) {
  const selectedPriority = priorityStatusList.find(
    (val) => val.value === data.priority
  );

  return (
    <div
      className={cn(
        'border p-4 gap-4 flex justify-between items-center',
        data.completed && 'bg-background'
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-center items-center gap-2">
          <Checkbox
            checked={data.completed}
            onCheckedChange={(checked) => {
              setCompleted({ ...data, completed: Boolean(checked) });
            }}
          />
          <span className="font-medium">{data.name}</span>
        </div>
        <div className="flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost">
                  <Flag
                    size={16}
                    className={cn(
                      selectedPriority?.color ?? priorityStatusList[0].color
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{selectedPriority?.label ?? priorityStatusList[0].label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Badge variant={'secondary'} className="h-6 capitalize">
            {data.category}
          </Badge>
          {data.createdAt && (
            <Badge variant={'outline'} className="whitespace-nowrap">
              {dayjs(data.createdAt).format('MMM DD YYYY')}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center">
          <EditTask data={data}  />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="p-0"
                  variant="ghost"
                  onClick={() => setDelete(data)}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
