import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { priority } from './validation/task';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const priorityStatusList = [
  { value: 'undefined', label: 'Priority', color: 'text-gray-300' },
  {
    value: priority.URGENT,
    label: priority.URGENT.charAt(0).toUpperCase() + priority.URGENT.slice(1),
    color: 'text-red-500',
  },
  {
    value: priority.HIGH,
    label: priority.HIGH.charAt(0).toUpperCase() + priority.HIGH.slice(1),
    color: 'text-yellow-500',
  },
  {
    value: priority.MEDIUM,
    label: priority.MEDIUM.charAt(0).toUpperCase() + priority.MEDIUM.slice(1),
    color: 'text-blue-500',
  },
  {
    value: priority.LOW,
    label: priority.LOW.charAt(0).toUpperCase() + priority.LOW.slice(1),
    color: 'text-gray-500',
  },
];
