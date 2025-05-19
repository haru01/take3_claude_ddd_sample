import { createTraining, TrainingLevel } from '../../../src/domain/training/types';
import { isSuccess, isError } from '../../../src/shared/types';

describe('createTraining', () => {
  it('研修情報を正常に作成できる', () => {
    const result = createTraining({
      title: 'アジャイル開発入門',
      description: '初心者向けのアジャイル開発の基礎を学ぶ研修です',
      date: new Date('2025-06-01'),
      location: '東京都千代田区',
      capacity: 20,
      level: TrainingLevel.BEGINNER,
      price: 50000
    });

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const training = result.value;
      expect(training.title).toBe('アジャイル開発入門');
      expect(training.description).toBe('初心者向けのアジャイル開発の基礎を学ぶ研修です');
      expect(training.date).toEqual(new Date('2025-06-01'));
      expect(training.location).toBe('東京都千代田区');
      expect(training.capacity).toBe(20);
      expect(training.level).toBe(TrainingLevel.BEGINNER);
      expect(training.price).toBe(50000);
      expect(training.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(training.createdAt).toBeInstanceOf(Date);
      expect(training.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('タイトルが空の場合はエラーになる', () => {
    const result = createTraining({
      title: '',
      description: '説明',
      date: new Date('2025-06-01'),
      location: '東京都千代田区',
      capacity: 20,
      level: TrainingLevel.BEGINNER,
      price: 50000
    });

    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBe('タイトルは必須です');
    }
  });

  it('説明が空の場合はエラーになる', () => {
    const result = createTraining({
      title: 'タイトル',
      description: '',
      date: new Date('2025-06-01'),
      location: '東京都千代田区',
      capacity: 20,
      level: TrainingLevel.BEGINNER,
      price: 50000
    });

    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBe('説明は必須です');
    }
  });

  it('場所が空の場合はエラーになる', () => {
    const result = createTraining({
      title: 'タイトル',
      description: '説明',
      date: new Date('2025-06-01'),
      location: '',
      capacity: 20,
      level: TrainingLevel.BEGINNER,
      price: 50000
    });

    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBe('場所は必須です');
    }
  });

  it('定員が0以下の場合はエラーになる', () => {
    const result = createTraining({
      title: 'タイトル',
      description: '説明',
      date: new Date('2025-06-01'),
      location: '東京都千代田区',
      capacity: 0,
      level: TrainingLevel.BEGINNER,
      price: 50000
    });

    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBe('定員は1以上である必要があります');
    }
  });

  it('定員が負の数の場合はエラーになる', () => {
    const result = createTraining({
      title: 'タイトル',
      description: '説明',
      date: new Date('2025-06-01'),
      location: '東京都千代田区',
      capacity: -1,
      level: TrainingLevel.BEGINNER,
      price: 50000
    });

    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBe('定員は1以上である必要があります');
    }
  });

  it('価格が負の数の場合はエラーになる', () => {
    const result = createTraining({
      title: 'タイトル',
      description: '説明',
      date: new Date('2025-06-01'),
      location: '東京都千代田区',
      capacity: 20,
      level: TrainingLevel.BEGINNER,
      price: -1
    });

    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBe('価格は0以上である必要があります');
    }
  });

  it('価格が0の場合は正常に作成できる（無料研修）', () => {
    const result = createTraining({
      title: 'タイトル',
      description: '説明',
      date: new Date('2025-06-01'),
      location: '東京都千代田区',
      capacity: 20,
      level: TrainingLevel.BEGINNER,
      price: 0
    });

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.value.price).toBe(0);
    }
  });

  it('定員が1の場合は正常に作成できる（境界値）', () => {
    const result = createTraining({
      title: 'タイトル',
      description: '説明',
      date: new Date('2025-06-01'),
      location: '東京都千代田区',
      capacity: 1,
      level: TrainingLevel.BEGINNER,
      price: 50000
    });

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.value.capacity).toBe(1);
    }
  });

  it('すべての研修レベルで正常に作成できる', () => {
    const levels = [TrainingLevel.BEGINNER, TrainingLevel.INTERMEDIATE, TrainingLevel.ADVANCED];
    
    levels.forEach(level => {
      const result = createTraining({
        title: 'タイトル',
        description: '説明',
        date: new Date('2025-06-01'),
        location: '東京都千代田区',
        capacity: 20,
        level,
        price: 50000
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value.level).toBe(level);
      }
    });
  });
});