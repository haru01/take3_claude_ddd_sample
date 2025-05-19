import { z } from 'zod';
import { UUID, createUUID, Result } from '../../shared/types';

export type TrainingId = UUID & { readonly _brand: unique symbol };

export function createTrainingId(): TrainingId {
  return createUUID() as TrainingId;
}

export enum TrainingLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

export const TrainingSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, { message: 'タイトルは必須です' }),
  description: z.string().min(1, { message: '説明は必須です' }),
  date: z.date(),
  location: z.string().min(1, { message: '場所は必須です' }),
  capacity: z.number().positive({ message: '定員は1以上である必要があります' }),
  level: z.nativeEnum(TrainingLevel),
  price: z.number().nonnegative({ message: '価格は0以上である必要があります' }),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Training = z.infer<typeof TrainingSchema>;

export interface CreateTrainingInput {
  title: string;
  description: string;
  date: Date;
  location: string;
  capacity: number;
  level: TrainingLevel;
  price: number;
}

export function createTraining(input: CreateTrainingInput): Result<Training> {
  const now = new Date();
  const training = {
    id: createTrainingId(),
    title: input.title,
    description: input.description,
    date: input.date,
    location: input.location,
    capacity: input.capacity,
    level: input.level,
    price: input.price,
    createdAt: now,
    updatedAt: now
  };

  const result = TrainingSchema.safeParse(training);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0]?.message || 'Validation error'
    };
  }

  return {
    success: true,
    value: result.data
  };
}