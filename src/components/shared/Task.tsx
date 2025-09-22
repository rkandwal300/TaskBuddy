import dayjs from 'dayjs';
import { Flag, Trash2, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { cn, priorityStatusList } from '../../lib/utils';
import { TZTaskSchema } from '../../lib/validation/task';
import { TaskWithMeta } from '../../state/tasks';
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
  task: TaskWithMeta;
  onToggleComplete: () => Promise<TaskWithMeta | null | undefined>;
  onDelete: () => Promise<boolean>;
  onUpdate: (updates: Partial<TZTaskSchema>) => Promise<TaskWithMeta | null>;
}>;

export default function Task({
  task,
  onToggleComplete,
  onDelete,
  onUpdate,
}: Props) {
  const selectedPriority = priorityStatusList.find(
    (val) => val.value === task.priority
  );

  // Sync status indicator
  const getSyncStatusIcon = () => {
    switch (task._meta.syncStatus) {
      case 'synced':
        return <Wifi size={12} className="text-green-500" />;
      case 'pending':
        return <WifiOff size={12} className="text-orange-500" />;
      case 'error':
        return <AlertCircle size={12} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getSyncStatusText = () => {
    switch (task._meta.syncStatus) {
      case 'synced':
        return 'Synced';
      case 'pending':
        return 'Pending sync';
      case 'error':
        return 'Sync error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div
      className={cn(
        'border p-4 gap-4 flex justify-between items-center relative',
        task.completed && 'bg-background',
        task._meta.syncStatus === 'error' && 'border-red-200 bg-red-50'
      )}
    >
      {/* Sync status indicator in top-right corner */}
      <div className="absolute top-2 right-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                {getSyncStatusIcon()}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getSyncStatusText()}</p>
              {task._meta.isDirty && (
                <p className="text-xs text-gray-500">
                  Modified: {new Date(task._meta.lastModified).toLocaleTimeString()}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-center items-center gap-2">
          <Checkbox
            checked={task.completed}
            onCheckedChange={async () => {
              await onToggleComplete();
            }}
          />
          <span className={cn(
            "font-medium",
            task.completed && "line-through text-gray-500"
          )}>
            {task.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-1">
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
            {task.category}
          </Badge>
          {task.createdAt && (
            <Badge variant={'outline'} className="whitespace-nowrap">
              {dayjs(task.createdAt).format('MMM DD YYYY')}
            </Badge>
          )}
          {task._meta.isDirty && (
            <Badge variant={'outline'} className="text-orange-600 border-orange-300">
              Modified
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center">
          <EditTask task={task} onUpdate={onUpdate} />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="p-2"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this task?')) {
                      await onDelete();
                    }
                  }}
                >
                  <Trash2 size={16} className="text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete task</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
