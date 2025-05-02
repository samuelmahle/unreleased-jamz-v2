import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getFormattedDate = (date: any): string => {
  if (!date) return 'Release date unknown';
  
  try {
    let parsedDate: Date;
    
    if (date instanceof Timestamp) {
      parsedDate = date.toDate();
    } else if (typeof date === 'string') {
      // Try parsing ISO string first
      parsedDate = new Date(date);
      
      // If that fails, try parsing as a timestamp number
      if (isNaN(parsedDate.getTime())) {
        const timestamp = parseInt(date, 10);
        if (!isNaN(timestamp)) {
          parsedDate = new Date(timestamp);
        }
      }
    } else if (typeof date === 'number') {
      parsedDate = new Date(date);
    } else {
      return 'Release date unknown';
    }

    if (isNaN(parsedDate.getTime())) {
      return 'Release date unknown';
    }

    return format(parsedDate, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Release date unknown';
  }
};
