import { Training } from './types';
import { startOfDay, endOfDay } from 'date-fns';

export interface SearchTrainingCriteria {
  startDate: Date;
  endDate: Date;
}

export function searchTrainings(
  trainings: Training[],
  criteria: SearchTrainingCriteria
): Training[] {
  const startOfSearchDate = startOfDay(criteria.startDate);
  const endOfSearchDate = endOfDay(criteria.endDate);

  return trainings
    .filter(training => {
      const trainingDate = training.date;
      return trainingDate >= startOfSearchDate &&
             trainingDate <= endOfSearchDate;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}