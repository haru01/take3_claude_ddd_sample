import { Result } from '../../shared/types';
import { createTrainingId, Training, TrainingLevel, TrainingSchema, TrainingStatus, TrainingStatusFactory } from './types';
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