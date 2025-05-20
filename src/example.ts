// 研修情報管理の実装例
import { searchTrainings, SearchTrainingCriteria } from './domain/training/functions';
import { TrainingLevel, Training } from './domain/training/types';
import { createTraining } from './domain/training/functions';
import { isSuccess } from './shared/types';

console.log('=== 研修受付予約システム サンプル ===\n');

// ストーリー1-1: 研修情報の登録
console.log('1. 研修情報の登録');
console.log('---');

const trainingResult = createTraining({
  title: 'アジャイル開発入門',
  description: '初心者向けのアジャイル開発の基礎を学ぶ研修です',
  date: new Date('2025-06-01'),
  location: '東京都千代田区',
  capacity: 20,
  level: TrainingLevel.BEGINNER,
  price: 50000
});

if (isSuccess(trainingResult)) {
  const training = trainingResult.value;
  console.log('研修が登録されました:');
  console.log(`  研修ID: ${training.id}`);
  console.log(`  タイトル: ${training.title}`);
  console.log(`  日時: ${training.date.toLocaleDateString('ja-JP')}`);
  console.log(`  場所: ${training.location}`);
  console.log(`  定員: ${training.capacity}名`);
  console.log(`  レベル: ${training.level}`);
  console.log(`  費用: ¥${training.price.toLocaleString()}`);
} else {
  console.error('エラー:', trainingResult.error);
}

console.log('\n');

// ストーリー2-1: 研修の検索
console.log('2. 研修の検索（日付範囲）');
console.log('---');

// サンプルデータ（実際には複数の研修を作成）
const trainings: Training[] = [];
if (isSuccess(trainingResult)) {
  trainings.push(trainingResult.value);

  // 追加の研修データを作成
  const additionalTraining = createTraining({
    title: 'スクラムマスター研修',
    description: 'スクラムマスターの役割を学ぶ',
    date: new Date('2025-05-15'),
    location: '東京都渋谷区',
    capacity: 15,
    level: TrainingLevel.INTERMEDIATE,
    price: 70000
  });

  if (isSuccess(additionalTraining)) {
    trainings.push(additionalTraining.value);
  }
}

const searchCriteria: SearchTrainingCriteria = {
  startDate: new Date('2025-05-01'),
  endDate: new Date('2025-06-30')
};

const searchResult = searchTrainings(trainings, searchCriteria);

console.log(`検索結果: ${searchResult.length}件`);
searchResult.forEach(training => {
  console.log(`- ${training.title} (${training.date.toLocaleDateString('ja-JP')})`);
});

console.log('\n');

// 今後の実装予定
console.log('3. 今後の実装予定');
console.log('---');
console.log('- 研修情報の更新');
console.log('- キーワード検索');
console.log('- レベルでの絞り込み');
console.log('- 空席のある研修のみ表示');
console.log('- 予約管理機能');
console.log('- ユーザー管理機能');
console.log('- 通知機能');
console.log('- 管理者機能');