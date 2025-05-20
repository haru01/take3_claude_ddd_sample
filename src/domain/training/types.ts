import { z } from 'zod';
import { UUID, createUUID } from '../../shared/types';

export type TrainingId = UUID & { readonly _brand: unique symbol };

export function createTrainingId(): TrainingId {
  return createUUID() as TrainingId;
}

export enum TrainingLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

// 研修状態を代数的データ型として定義
export type TrainingStatus =
  | { type: 'DRAFT' }
  | { type: 'OPEN' }
  | { type: 'COMPLETED' }
  | { type: 'CANCELED'; reason: string };

// 状態オブジェクトを生成するためのヘルパー関数
export const TrainingStatusFactory = {
  draft: (): TrainingStatus => ({ type: 'DRAFT' }),
  open: (): TrainingStatus => ({ type: 'OPEN' }),
  completed: (): TrainingStatus => ({ type: 'COMPLETED' }),
  canceled: (reason: string): TrainingStatus => ({ type: 'CANCELED', reason })
};

// 状態の型ガードを定義
export const isStatusDraft = (status: TrainingStatus): status is { type: 'DRAFT' } =>
  status.type === 'DRAFT';

export const isStatusOpen = (status: TrainingStatus): status is { type: 'OPEN' } =>
  status.type === 'OPEN';

export const isStatusCompleted = (status: TrainingStatus): status is { type: 'COMPLETED' } =>
  status.type === 'COMPLETED';

export const isStatusCanceled = (status: TrainingStatus): status is { type: 'CANCELED'; reason: string } =>
  status.type === 'CANCELED';

// バリデーション用のZodスキーマを定義
const TrainingStatusSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('DRAFT') }),
  z.object({ type: z.literal('OPEN') }),
  z.object({ type: z.literal('COMPLETED') }),
  z.object({
    type: z.literal('CANCELED'),
    reason: z.string().min(1, { message: '中止理由は必須です' })
          .min(5, { message: '中止理由は5文字以上である必要があります' })
  })
]);

export const TrainingSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, { message: 'タイトルは必須です' }),
  description: z.string().min(1, { message: '説明は必須です' }),
  date: z.date(),
  location: z.string().min(1, { message: '場所は必須です' }),
  capacity: z.number().positive({ message: '定員は1以上である必要があります' }),
  level: z.nativeEnum(TrainingLevel),
  price: z.number().nonnegative({ message: '価格は0以上である必要があります' }),
  status: TrainingStatusSchema.default(TrainingStatusFactory.draft()),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Training = z.infer<typeof TrainingSchema>;
