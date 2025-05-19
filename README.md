# TypeScriptによる関数型ドメイン駆動設計サンプル

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![Zod](https://img.shields.io/badge/Zod-3.22.4-green.svg)](https://zod.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 概要

本プロジェクトは、TypeScriptを使用した関数型プログラミングパラダイムによるドメイン駆動設計（DDD）の実装サンプルです。アジャイル開発における研修受付予約システムをドメインとして、実践的な関数型DDDアプローチを示しています。

## 技術的特徴

- **型駆動設計**: ブランド型と `zod` スキーマによる厳密な型定義
- **関数型プログラミング**: 不変性と純粋関数による実装
- **エラーハンドリング**: `Result` 型による明示的なエラー処理
- **テスト駆動開発**: ステップバイステップのワークフロー
- **テスト設計**: 境界値分析を含む包括的なテスト

## 実装されたドメイン

### 研修管理ドメイン（Training Domain）

アジャイル研修の予約管理システムとして、以下の機能を提供します：

- **研修情報の登録**: タイトル、説明、日時、場所、定員を含む研修の作成
- **研修の検索**: 日付範囲による研修検索機能

## フォルダ構造

```
claude_ddd_sample/
├── src/
│   ├── domain/                    # ドメイン層
│   │   └── training/              # 研修管理ドメイン
│   │       ├── types.ts           # 型定義とファクトリ関数
│   │       └── functions.ts       # ドメインロジック
│   ├── shared/                    # 共通ユーティリティ
│   │   └── types.ts              # Result型、UUID型など
│   └── example.ts                # 実行可能なサンプルコード
├── tests/                        # テストコード
│   └── domain/
│       └── training/
│           ├── types.test.ts      # 型のテスト
│           └── functions.test.ts  # 関数のテスト
├── package.json                  # 依存関係とスクリプト
├── tsconfig.json                 # TypeScript設定
├── jest.config.js                # Jestテスト設定
├── SPRINT_BACKLOG.md            # 開発ストーリー
├── USER_STORIES.md              # ユーザーストーリー
├── CLAUDE.md                    # 詳細な設計説明
└── README.md                    # このファイル
```

## インストール

### 前提条件

- Node.js (v16以上推奨)
- npm または yarn

### セットアップ

```bash
# リポジトリのクローン
git clone [repository-url]
cd claude_ddd_sample

# 依存関係のインストール
npm install
```

## 使用方法

### 開発コマンド

```bash
# TypeScriptビルド
npm run build

# 型チェック
npm run type-check

# テスト実行
npm run test

# テスト監視モード
npm run test:watch

# サンプル実行
npm run example

# リンター実行
npm run lint
```

### サンプル実行例

```bash
$ npm run example

=== 研修受付予約システム サンプル ===

1. 研修情報の登録
---
研修が登録されました:
  研修ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
  タイトル: アジャイル開発入門
  日時: 2025/6/1
  場所: 東京都千代田区
  定員: 20名
  レベル: BEGINNER

2. 研修の検索
---
検索結果:
- アジャイル開発入門 (2025/6/1)
```

## 主要な実装例

### 型定義

```typescript
// ブランド型によるID定義
export type TrainingId = UUID & { readonly _brand: unique symbol };

// Zodスキーマによるモデル定義
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
```

### ドメインロジック

```typescript
// 研修作成関数
export function createTraining(input: CreateTrainingInput): Result<Training> {
  const now = new Date();
  const training = {
    id: createTrainingId(),
    ...input,
    createdAt: now,
    updatedAt: now
  };

  const result = TrainingSchema.safeParse(training);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0].message
    };
  }

  return {
    success: true,
    value: result.data
  };
}

// 研修検索関数
export function searchTrainings(
  trainings: Training[],
  criteria: SearchTrainingCriteria
): Training[] {
  return trainings
    .filter(training => {
      const trainingDate = training.date;
      return trainingDate >= startOfDay(criteria.startDate) &&
             trainingDate <= endOfDay(criteria.endDate);
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
```

## 設計原則

1. **不変性**: すべてのデータ構造は不変
2. **純粋関数**: 副作用のない関数による実装
3. **型安全性**: ZodスキーマとTypeScriptの型システムの組み合わせ
4. **明示的エラー処理**: Result型による成功/失敗の明示的な表現
5. **テスト駆動**: 境界値分析に基づく網羅的なテスト

## 依存関係

### 実行時依存関係
- [Zod](https://zod.dev/) - スキーマ定義とバリデーション
- [date-fns](https://date-fns.org/) - 日付操作ユーティリティ

### 開発時依存関係
- TypeScript - 型付きJavaScript
- Jest - テストフレームワーク
- ESLint - コード品質チェック
- ts-node - TypeScript実行環境

## ライセンス

このプロジェクトはMITライセンスのもとで公開されています。

## 貢献

プルリクエストや改善提案を歓迎します。大きな変更を提案する場合は、まずissueを作成して変更内容について議論してください。

## 参考資料

- [CLAUDE.md](./CLAUDE.md) - 詳細な設計説明とアーキテクチャ
- [USER_STORIES.md](./USER_STORIES.md) - ユーザーストーリー
- [SPRINT_BACKLOG.md](./SPRINT_BACKLOG.md) - 開発ストーリー

## 関連リンク

- [Zod Documentation](https://zod.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)