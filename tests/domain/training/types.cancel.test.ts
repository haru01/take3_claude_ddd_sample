import { TrainingLevel, TrainingStatusFactory, isStatusDraft, isStatusCanceled, Training } from '../../../src/domain/training/types';
import { createTraining, cancelTraining  } from '../../../src/domain/training/functions';

import { isSuccess, isError } from '../../../src/shared/types';

describe('cancelTraining', () => {
  // テスト内で時間操作を行うためのセットアップ
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  let training: Training;

  beforeEach(() => {
    // テスト用の研修データを作成
    const result = createTraining({
      title: 'アジャイル開発入門',
      description: '初心者向けのアジャイル開発の基礎を学ぶ研修です',
      date: new Date('2025-06-01'),
      location: '東京都千代田区',
      capacity: 20,
      level: TrainingLevel.BEGINNER,
      price: 50000
    });

    if (isSuccess(result)) {
      training = result.value;
    } else {
      throw new Error('テスト用研修データの作成に失敗しました');
    }
  });

  it('ドラフト状態の研修を中止にできる', () => {
    // 新規作成時はドラフト状態であることを確認
    expect(isStatusDraft(training.status)).toBe(true);

    // 更新日時が変わるように少し待機
    jest.advanceTimersByTime(1000);

    const result = cancelTraining(training, '講師の都合により中止');

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const canceledTraining = result.value;
      expect(isStatusCanceled(canceledTraining.status)).toBe(true);

      // 中止状態は中止理由を持つことを確認
      if (isStatusCanceled(canceledTraining.status)) {
        expect(canceledTraining.status.reason).toBe('講師の都合により中止');
      }

      expect(canceledTraining.updatedAt.getTime()).toBeGreaterThan(training.updatedAt.getTime());
    }
  });

  it('募集中状態の研修を中止にできる', () => {
    // まずドラフトから募集中に更新
    const openTraining = {
      ...training,
      status: TrainingStatusFactory.open()
    };

    // 更新日時が変わるように少し待機
    jest.advanceTimersByTime(1000);

    const result = cancelTraining(openTraining, '参加者が最小開催人数に達しなかったため');

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const canceledTraining = result.value;
      expect(isStatusCanceled(canceledTraining.status)).toBe(true);

      // 中止状態は中止理由を持つことを確認
      if (isStatusCanceled(canceledTraining.status)) {
        expect(canceledTraining.status.reason).toBe('参加者が最小開催人数に達しなかったため');
      }

      expect(canceledTraining.updatedAt.getTime()).toBeGreaterThan(openTraining.updatedAt.getTime());
    }
  });

  it('中止理由がない場合はエラーになる', () => {
    const result = cancelTraining(training, '');

    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBe('中止理由は必須です');
    }
  });

  it('中止理由が短すぎる場合はエラーになる', () => {
    const result = cancelTraining(training, '理由');

    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBe('中止理由は5文字以上である必要があります');
    }
  });

  it('開催済み状態の研修は中止にできない', () => {
    // 開催済み状態の研修を作成
    const completedTraining = {
      ...training,
      status: TrainingStatusFactory.completed()
    };

    const result = cancelTraining(completedTraining, '講師の都合により中止');

    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBe('開催済み状態の研修は中止にできません');
    }
  });

  it('既に中止状態の研修を再度中止することはできない', () => {
    // まず研修を中止
    const cancelResult = cancelTraining(training, '講師の都合により中止');
    expect(isSuccess(cancelResult)).toBe(true);

    if (isSuccess(cancelResult)) {
      const canceledTraining = cancelResult.value;

      // 中止された研修を再度中止
      const recancelResult = cancelTraining(canceledTraining, '別の理由で中止');

      expect(isError(recancelResult)).toBe(true);
      if (isError(recancelResult)) {
        expect(recancelResult.error).toBe('すでに中止済みの研修です');
      }
    }
  });
});