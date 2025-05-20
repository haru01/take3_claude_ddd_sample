import { createTraining, searchTrainings, SearchTrainingCriteria } from '../../../src/domain/training/functions';
import { TrainingLevel, Training } from '../../../src/domain/training/types';
import { isSuccess } from '../../../src/shared/types';

describe('searchTrainings', () => {
  let trainings: Training[];

  beforeEach(() => {
    // Arrange: 研修データのセットアップ
    trainings = [];

    const trainingData = [
      {
        id: 'training-1',
        title: '5月15日の研修',
        date: new Date('2025-05-15'),
        description: '5月15日開催の研修',
        location: '東京都千代田区',
        capacity: 20,
        level: TrainingLevel.BEGINNER,
        price: 50000
      },
      {
        id: 'training-2',
        title: '6月1日の研修',
        date: new Date('2025-06-01'),
        description: '6月1日開催の研修',
        location: '東京都渋谷区',
        capacity: 15,
        level: TrainingLevel.INTERMEDIATE,
        price: 70000
      },
      {
        id: 'training-3',
        title: '6月15日の研修',
        date: new Date('2025-06-15'),
        description: '6月15日開催の研修',
        location: '大阪府大阪市',
        capacity: 30,
        level: TrainingLevel.ADVANCED,
        price: 100000
      },
      {
        id: 'training-4',
        title: '7月1日の研修',
        date: new Date('2025-07-01'),
        description: '7月1日開催の研修',
        location: '東京都新宿区',
        capacity: 25,
        level: TrainingLevel.BEGINNER,
        price: 40000
      }
    ];

    trainingData.forEach(data => {
      const result = createTraining(data);
      if (isSuccess(result)) {
        trainings.push(result.value as Training);
      }
    });
  });

  describe('日付範囲での基本的な検索', () => {
    it('日付範囲内の研修をすべて返す', () => {
      // Arrange
      const searchCriteria: SearchTrainingCriteria = {
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-06-30')
      };

      // Act
      const result = searchTrainings(trainings, searchCriteria);

      // Assert
      expect(result).toHaveLength(3);
      expect(result.map(t => t.title)).toEqual([
        '5月15日の研修',
        '6月1日の研修',
        '6月15日の研修'
      ]);
    });

    it('日付範囲外の研修は含まれない', () => {
      // Arrange: 5月31日まで（6月の研修は含まれない）
      const searchCriteria: SearchTrainingCriteria = {
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-05-31')
      };

      // Act
      const result = searchTrainings(trainings, searchCriteria);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe('5月15日の研修');
    });
  });

  describe('境界日付の扱い', () => {
    it('開始日当日の研修が含まれる', () => {
      // Arrange: 5月15日開始（境界日）
      const searchCriteria: SearchTrainingCriteria = {
        startDate: new Date('2025-05-15'),
        endDate: new Date('2025-05-20')
      };

      // Act
      const result = searchTrainings(trainings, searchCriteria);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe('5月15日の研修');
    });

    it('終了日当日の研修が含まれる', () => {
      // Arrange: 6月15日終了（境界日）
      const searchCriteria: SearchTrainingCriteria = {
        startDate: new Date('2025-06-10'),
        endDate: new Date('2025-06-15')
      };

      // Act
      const result = searchTrainings(trainings, searchCriteria);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe('6月15日の研修');
    });

    it('開始日と終了日が同じ場合、その日の研修のみ返す', () => {
      // Arrange: 6月1日のみ
      const searchCriteria: SearchTrainingCriteria = {
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-01')
      };

      // Act
      const result = searchTrainings(trainings, searchCriteria);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe('6月1日の研修');
    });
  });

  describe('エッジケース', () => {
    it('空の研修リストの場合、空の結果を返す', () => {
      // Arrange
      const emptyTrainings: Training[] = [];
      const searchCriteria: SearchTrainingCriteria = {
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-06-30')
      };

      // Act
      const result = searchTrainings(emptyTrainings, searchCriteria);

      // Assert
      expect(result).toHaveLength(0);
    });

    it('開始日が終了日より後の場合、空の結果を返す', () => {
      // Arrange: 不正な日付範囲
      const searchCriteria: SearchTrainingCriteria = {
        startDate: new Date('2025-06-30'),
        endDate: new Date('2025-05-01')
      };

      // Act
      const result = searchTrainings(trainings, searchCriteria);

      // Assert
      expect(result).toHaveLength(0);
    });

    it('すべての研修が範囲外の場合、空の結果を返す', () => {
      // Arrange: 2024年の検索（データはすべて2025年）
      const searchCriteria: SearchTrainingCriteria = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      };

      // Act
      const result = searchTrainings(trainings, searchCriteria);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('結果の順序', () => {
    it('検索結果は日付昇順でソートされる', () => {
      // Arrange
      const searchCriteria: SearchTrainingCriteria = {
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-07-31')
      };

      // Act
      const result = searchTrainings(trainings, searchCriteria);

      // Assert
      expect(result).toHaveLength(4);
      const dates = result.map(t => t.date.toISOString().split('T')[0]);
      expect(dates).toEqual([
        '2025-05-15',
        '2025-06-01',
        '2025-06-15',
        '2025-07-01'
      ]);
    });
  });
});