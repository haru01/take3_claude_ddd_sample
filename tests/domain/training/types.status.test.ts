import { TrainingLevel, isStatusDraft, isStatusOpen, isStatusCompleted, Training } from '../../../src/domain/training/types';
import { createTraining, updateTrainingStatus } from '../../../src/domain/training/functions';

import { isSuccess, isError } from '../../../src/shared/types';

describe('updateTrainingStatus', () => {
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

  it('研修状態をドラフトから募集中に更新できる', () => {
    // 新規作成時はドラフト状態であることを確認
    expect(isStatusDraft(training.status)).toBe(true);

    // テスト中に確実にupdatedAtが変わるよう少し待機
    jest.advanceTimersByTime(100);
    const result = updateTrainingStatus(training, 'OPEN');

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const updatedTraining = result.value;
      expect(isStatusOpen(updatedTraining.status)).toBe(true);
      expect(updatedTraining.updatedAt.getTime()).toBeGreaterThan(training.updatedAt.getTime());
    }
  });

  it('研修状態を募集中から開催済みに更新できる', () => {
    // まずドラフトから募集中に更新
    const openResult = updateTrainingStatus(training, 'OPEN');
    expect(isSuccess(openResult)).toBe(true);

    // 次に募集中から開催済みに更新
    if (isSuccess(openResult)) {
      const openTraining = openResult.value;

      // テスト中に確実にupdatedAtが変わるよう少し待機
      jest.advanceTimersByTime(100);

      const completedResult = updateTrainingStatus(openTraining, 'COMPLETED');
      expect(isSuccess(completedResult)).toBe(true);

      if (isSuccess(completedResult)) {
        const completedTraining = completedResult.value;
        expect(isStatusCompleted(completedTraining.status)).toBe(true);
        expect(completedTraining.updatedAt.getTime()).toBeGreaterThan(openTraining.updatedAt.getTime());
      }
    }
  });

  it('研修状態をドラフトから開催済みに直接更新することはできない', () => {
    const result = updateTrainingStatus(training, 'COMPLETED');

    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBe('ドラフト状態から開催済み状態に直接更新することはできません');
    }
  });

  it('研修状態を開催済みからドラフトや募集中に戻すことはできない', () => {
    // ドラフト → 募集中 → 開催済みと更新
    const openResult = updateTrainingStatus(training, 'OPEN');
    expect(isSuccess(openResult)).toBe(true);

    if (isSuccess(openResult)) {
      const openTraining = openResult.value;
      const completedResult = updateTrainingStatus(openTraining, 'COMPLETED');
      expect(isSuccess(completedResult)).toBe(true);

      if (isSuccess(completedResult)) {
        const completedTraining = completedResult.value;

        // 開催済み → ドラフトは不可
        const toDraftResult = updateTrainingStatus(completedTraining, 'DRAFT');
        expect(isError(toDraftResult)).toBe(true);
        if (isError(toDraftResult)) {
          expect(toDraftResult.error).toBe('開催済み状態から変更することはできません');
        }

        // 開催済み → 募集中も不可
        const toOpenResult = updateTrainingStatus(completedTraining, 'OPEN');
        expect(isError(toOpenResult)).toBe(true);
        if (isError(toOpenResult)) {
          expect(toOpenResult.error).toBe('開催済み状態から変更することはできません');
        }
      }
    }
  });

  it('同じ状態への更新は何も変更せずに成功を返す', () => {
    // テスト用データのupdatedAtを保存
    const originalUpdatedAt = training.updatedAt;

    // ドラフトからドラフトへの更新
    const result = updateTrainingStatus(training, 'DRAFT');

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const updatedTraining = result.value;
      expect(isStatusDraft(updatedTraining.status)).toBe(true);
      // 更新日時は変わらないことを確認
      expect(updatedTraining.updatedAt).toEqual(originalUpdatedAt);
    }
  });
});