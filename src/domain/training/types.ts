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
    status: TrainingStatusFactory.draft(),
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

export function updateTrainingStatus(training: Training, newStatus: 'DRAFT' | 'OPEN' | 'COMPLETED'): Result<Training> {
  const currentStatus = training.status.type;

  // 同じ状態への更新は何もせずに成功を返す
  if (currentStatus === newStatus) {
    return {
      success: true,
      value: training
    };
  }

  // 状態遷移の検証
  if (currentStatus === 'DRAFT' && newStatus === 'COMPLETED') {
    return {
      success: false,
      error: 'ドラフト状態から開催済み状態に直接更新することはできません'
    };
  }

  if (currentStatus === 'COMPLETED') {
    return {
      success: false,
      error: '開催済み状態から変更することはできません'
    };
  }

  if (currentStatus === 'CANCELED') {
    return {
      success: false,
      error: '中止状態の研修は変更できません'
    };
  }

  // 新しい状態オブジェクトを生成
  let updatedStatus: TrainingStatus;

  switch (newStatus) {
    case 'DRAFT':
      updatedStatus = TrainingStatusFactory.draft();
      break;
    case 'OPEN':
      updatedStatus = TrainingStatusFactory.open();
      break;
    case 'COMPLETED':
      updatedStatus = TrainingStatusFactory.completed();
      break;
    default:
      return {
        success: false,
        error: '不正な状態が指定されました'
      };
  }

  // 更新処理
  const updatedTraining = {
    ...training,
    status: updatedStatus,
    updatedAt: new Date()
  };

  // スキーマ検証
  const result = TrainingSchema.safeParse(updatedTraining);
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

export function cancelTraining(training: Training, reason: string): Result<Training> {
  // 状態チェック
  if (training.status.type === 'COMPLETED') {
    return {
      success: false,
      error: '開催済み状態の研修は中止にできません'
    };
  }

  if (training.status.type === 'CANCELED') {
    return {
      success: false,
      error: 'すでに中止済みの研修です'
    };
  }

  // 中止処理
  const now = new Date();
  const canceledTraining = {
    ...training,
    status: TrainingStatusFactory.canceled(reason),
    updatedAt: now
  };

  // スキーマ検証
  const result = TrainingSchema.safeParse(canceledTraining);
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