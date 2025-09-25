import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PRIORITY } from './validation/task';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const priorityStatusList = [
  { value: 'undefined', label: 'Priority', color: 'text-gray-300' },
  {
    value: PRIORITY.URGENT,
    label: PRIORITY.URGENT.charAt(0).toUpperCase() + PRIORITY.URGENT.slice(1),
    color: 'text-red-500',
  },
  {
    value: PRIORITY.HIGH,
    label: PRIORITY.HIGH.charAt(0).toUpperCase() + PRIORITY.HIGH.slice(1),
    color: 'text-yellow-500',
  },
  {
    value: PRIORITY.MEDIUM,
    label: PRIORITY.MEDIUM.charAt(0).toUpperCase() + PRIORITY.MEDIUM.slice(1),
    color: 'text-blue-500',
  },
  {
    value: PRIORITY.LOW,
    label: PRIORITY.LOW.charAt(0).toUpperCase() + PRIORITY.LOW.slice(1),
    color: 'text-gray-500',
  },
];
