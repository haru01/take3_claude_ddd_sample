# Claude - TypeScriptによる関数型ドメイン駆動設計サンプル v2

## 1. プロジェクト概要

本プロジェクトは、TypeScriptを使用した関数型プログラミングパラダイムによるドメイン駆動設計（DDD）の実装サンプルです。

### 1.1 目的

- TypeScriptによる関数型プログラミングとDDDを組み合わせた実践的なアプローチを示す
- 不変データ構造と純粋関数によるドメインモデリング手法を示す
- 代数的データ型と型合成による堅牢なドメインモデルの構築方法を説明する
- Zodによる強力なバリデーションと型安全性を実現する
- 人が生成結果が確認できるように、テスト駆動開発のプログラミングフローを活用しステップバイステップで進める

### 実装されたドメイン

#### 注文管理ドメイン（Order Domain）
Eコマースシステムの注文管理として、注文の作成と配送日程の検索機能を提供します。

- **注文の作成**: 顧客ID、商品リスト、配送先情報を含む注文の作成
- **配送日程の検索**: 日付範囲による配送予定の検索

#### 研修管理ドメイン（Training Domain）
社内研修の管理システムとして、研修情報の登録と検索機能を提供します。

- **研修情報の登録**: タイトル、説明、日時、場所、定員などを含む研修情報の登録
- **研修の検索**: 日付範囲や状態による研修の検索
- **研修状態管理**: ドラフト、募集中、開催済み、中止などの状態遷移の管理

### 主な特徴
- **関数型プログラミング**: 不変性と純粋関数による実装
- **型駆動設計**: ブランド型とZodスキーマによる厳密な型定義
- **エラーハンドリング**: Result型による明示的なエラー処理
- **テスト駆動開発**: ステップバイステップで確認しやすく。境界値分析を含む包括的なテスト

## 2. 実際のフォルダ構造

```
claude_ddd_sample/
├── src/
│   ├── domain/                    # ドメイン層
│   │   ├── order/                 # 注文ドメイン
│   │   │   ├── types.ts           # 型定義
│   │   │   └── functions.ts       # ファクトリ関数、状態遷移関数
│   │   ├── shipping/              # 配送ドメイン
│   │   │   ├── types.ts           # 型定義
│   │   │   └── functions.ts       # 検索機能、状態遷移関数
│   │   └── training/              # 研修ドメイン
│   │       ├── types.ts           # 型定義
│   │       └── functions.ts       # 検索機能、状態遷移関数
│   ├── shared/                    # 共通ユーティリティ
│   │   └── types.ts               # UUID、Result型など
│   └── example.ts                 # 実行可能なサンプルコード
├── tests/                         # テストコード
│   └── domain/
│       ├── order/
│       │   ├── types.test.ts      # 注文ドメイン型のテスト
│       │   └── functions.test.ts  # 注文機能のテスト
│       ├── shipping/
│       │   ├── types.test.ts      # 配送ドメイン型のテスト
│       │   └── functions.test.ts  # 配送機能のテスト
│       └── training/
│           ├── types.test.ts      # 研修ドメイン型のテスト
│           └── functions.test.ts  # 研修検索機能のテスト
├── package.json                   # 依存関係とスクリプト
├── tsconfig.json                  # TypeScript設定
├── doc/
│   ├── USER_STORIES.md           # ユーザーストーリー
│   └── SPRINT_BACKLOG.md         # 開発ストーリー
└── CLAUDE.md                     # プロジェクト説明
```

## 3. 型駆動設計の実例

### 3.1 ブランド型による識別子

```typescript
// src/shared/types.ts
export type UUID = string & { readonly _brand: unique symbol };

// src/domain/order/types.ts
export type OrderId = UUID & { readonly _brand: unique symbol };
export type CustomerId = UUID & { readonly _brand: unique symbol };
```

### 3.2 Zodスキーマによるバリデーション

```typescript
// src/domain/order/types.ts
export const OrderSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive({ message: '数量は正の数である必要があります' }),
    unitPrice: z.number().nonnegative({ message: '単価は0以上である必要があります' })
  })).min(1, { message: '注文には最低1つの商品が必要です' }),
  shippingAddress: z.string().min(1, { message: '配送先は必須です' }),
  deliveryDate: z.date(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Order = z.infer<typeof OrderSchema>;
```

### 3.3 代数的データ型による状態表現

```typescript
// src/domain/shipping/types.ts
// 配送状態を代数的データ型として定義
export type ShippingStatus =
  | { type: 'PENDING' }
  | { type: 'SHIPPED'; shippedAt: Date; trackingCode: string }
  | { type: 'DELIVERED'; deliveredAt: Date }
  | { type: 'FAILED'; failedAt: Date; reason: string };

// 状態の型ガードを定義
export const isStatusPending = (status: ShippingStatus): status is { type: 'PENDING' } => 
  status.type === 'PENDING';

export const isStatusShipped = (status: ShippingStatus): status is { type: 'SHIPPED'; shippedAt: Date; trackingCode: string } => 
  status.type === 'SHIPPED';

export const isStatusDelivered = (status: ShippingStatus): status is { type: 'DELIVERED'; deliveredAt: Date } => 
  status.type === 'DELIVERED';

export const isStatusFailed = (status: ShippingStatus): status is { type: 'FAILED'; failedAt: Date; reason: string } => 
  status.type === 'FAILED';

// バリデーション用のZodスキーマを定義
const ShippingStatusSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PENDING') }),
  z.object({ 
    type: z.literal('SHIPPED'), 
    shippedAt: z.date(),
    trackingCode: z.string().min(1, { message: '追跡コードは必須です' })
  }),
  z.object({ 
    type: z.literal('DELIVERED'), 
    deliveredAt: z.date() 
  }),
  z.object({ 
    type: z.literal('FAILED'), 
    failedAt: z.date(),
    reason: z.string().min(1, { message: '失敗理由は必須です' })
  })
]);

// src/domain/shipping/functions.ts
// 状態オブジェクトを生成するためのヘルパー関数
export const ShippingStatusFactory = {
  pending: (): ShippingStatus => ({ type: 'PENDING' }),
  shipped: (shippedAt: Date, trackingCode: string): ShippingStatus => 
    ({ type: 'SHIPPED', shippedAt, trackingCode }),
  delivered: (deliveredAt: Date): ShippingStatus => 
    ({ type: 'DELIVERED', deliveredAt }),
  failed: (failedAt: Date, reason: string): ShippingStatus => 
    ({ type: 'FAILED', failedAt, reason })
};
```

## 4. ドメインロジックの実装例

### 4.1 注文作成関数

```typescript
// src/domain/order/functions.ts
export function createOrder(
  customerId: CustomerId,
  items: OrderItem[],
  shippingAddress: string,
  deliveryDate: Date
): Result<Order> {
  const now = new Date();
  const order = {
    id: createOrderId(),
    customerId,
    items,
    shippingAddress,
    deliveryDate,
    createdAt: now,
    updatedAt: now
  };

  const result = OrderSchema.safeParse(order);
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
```

### 4.2 状態遷移関数

```typescript
// src/domain/order/functions.ts
export const placeOrder = (order: Order): Result<Order> => {
  if (order.status.type !== "draft") {
    return {
      success: false,
      error: "下書き状態の注文のみ確定できます"
    };
  }

  const result = OrderSchema.safeParse({
    ...order,
    status: { type: "placed" as const, placedAt: new Date() },
    updatedAt: new Date()
  });

  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  return { success: true, value: result.data };
};
```

### 4.3 配送状態遷移関数

```typescript
// src/domain/shipping/functions.ts
export function shipOrder(
  orderShipping: OrderShipping, 
  trackingCode: string
): Result<OrderShipping> {
  // 状態遷移チェック - 保留中状態からのみ発送可能
  if (!isStatusPending(orderShipping.status)) {
    return {
      success: false,
      error: '保留中状態の配送のみ発送処理できます'
    };
  }

  // トラッキングコードの必須チェック
  if (!trackingCode) {
    return {
      success: false,
      error: '追跡コードは必須です'
    };
  }

  // 発送状態に更新
  const now = new Date();
  const updatedShipping = {
    ...orderShipping,
    status: ShippingStatusFactory.shipped(now, trackingCode),
    updatedAt: now
  };

  // スキーマ検証
  const result = OrderShippingSchema.safeParse(updatedShipping);
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

export function markAsDelivered(orderShipping: OrderShipping): Result<OrderShipping> {
  // 状態遷移チェック - 発送済状態からのみ配達完了可能
  if (!isStatusShipped(orderShipping.status)) {
    return {
      success: false,
      error: '発送済状態の配送のみ配達完了にできます'
    };
  }

  // 配達完了状態に更新
  const now = new Date();
  const updatedShipping = {
    ...orderShipping,
    status: ShippingStatusFactory.delivered(now),
    updatedAt: now
  };

  // スキーマ検証
  const result = OrderShippingSchema.safeParse(updatedShipping);
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

export function markAsFailed(
  orderShipping: OrderShipping, 
  reason: string
): Result<OrderShipping> {
  // 失敗状態に遷移できるのは保留中または発送済状態のみ
  if (!isStatusPending(orderShipping.status) && !isStatusShipped(orderShipping.status)) {
    return {
      success: false,
      error: '保留中または発送済状態の配送のみ失敗状態にできます'
    };
  }

  // 失敗理由の必須チェック
  if (!reason) {
    return {
      success: false,
      error: '失敗理由は必須です'
    };
  }

  // 失敗状態に更新
  const now = new Date();
  const updatedShipping = {
    ...orderShipping,
    status: ShippingStatusFactory.failed(now, reason),
    updatedAt: now
  };

  // スキーマ検証
  const result = OrderShippingSchema.safeParse(updatedShipping);
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
```

### 4.4 研修状態管理

```typescript
// src/domain/training/types.ts
// 研修状態を代数的データ型として定義
export type TrainingStatus =
  | { type: 'DRAFT' }
  | { type: 'OPEN' }
  | { type: 'COMPLETED' }
  | { type: 'CANCELED'; reason: string };

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

// src/domain/training/functions.ts
// 状態オブジェクトを生成するためのヘルパー関数
export const TrainingStatusFactory = {
  draft: (): TrainingStatus => ({ type: 'DRAFT' }),
  open: (): TrainingStatus => ({ type: 'OPEN' }),
  completed: (): TrainingStatus => ({ type: 'COMPLETED' }),
  canceled: (reason: string): TrainingStatus => ({ type: 'CANCELED', reason })
};

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
```

### 4.5 検索関数

```typescript
// src/domain/shipping/functions.ts
export interface DeliverySearchCriteria {
  startDate: Date;
  endDate: Date;
}

export function searchDeliveries(
  orders: Order[],
  criteria: DeliverySearchCriteria
): Order[] {
  return orders.filter(order => {
    const deliveryDate = order.deliveryDate;
    return deliveryDate >= startOfDay(criteria.startDate) &&
           deliveryDate <= endOfDay(criteria.endDate);
  });
}

// src/domain/training/functions.ts
export interface SearchTrainingCriteria {
  startDate: Date;
  endDate: Date;
}

export function searchTrainings(
  trainings: Training[],
  criteria: SearchTrainingCriteria
): Training[] {
  // 日付の妥当性チェック
  if (criteria.startDate > criteria.endDate) {
    return [];
  }

  // フィルタリングと日付順のソート
  return trainings
    .filter(training => {
      const trainingDate = training.date;
      return trainingDate >= startOfDay(criteria.startDate) &&
             trainingDate <= endOfDay(criteria.endDate);
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
```

## 5. テスト戦略

### 5.1 境界値分析に基づくテスト

本プロジェクトでは、境界値分析を活用して網羅的なテストを実装しています。

#### 注文作成のテスト例

```typescript
describe('createOrder', () => {
  it('注文を作成できる', () => {
    // 正常系テスト
  });

  it('商品が0個の場合はエラーになる', () => {
    // 境界値テスト
  });

  it('数量が負の数の場合はエラーになる', () => {
    // 異常系テスト
  });

  it('配送先が空文字列の場合はエラーになる', () => {
    // 必須項目のバリデーションテスト
  });
});
```

#### 配送状態遷移のテスト例

```typescript
describe('shipOrder', () => {
  it('保留中の配送を発送状態に更新できる', () => {
    // 正常系テスト - ステータス変更
  });

  it('追跡コードのない発送はエラーになる', () => {
    // 必須項目検証テスト
  });

  it('すでに発送済みの配送は再度発送処理できない', () => {
    // 状態遷移の制約テスト
  });

  it('失敗状態の配送は発送処理できない', () => {
    // 状態遷移の制約テスト
  });
});

describe('markAsDelivered', () => {
  it('発送済みの配送を配達完了状態に更新できる', () => {
    // 正常系テスト - ステータス変更
  });

  it('保留中の配送は配達完了にできない', () => {
    // 状態遷移の制約テスト  
  });

  it('すでに配達完了の配送を再度完了処理できない', () => {
    // 状態遷移の制約テスト
  });
});
```

#### 研修状態遷移のテスト例

```typescript
describe('updateTrainingStatus', () => {
  it('研修状態をドラフトから募集中に更新できる', () => {
    // 正常系テスト - ステータス変更
    expect(isStatusDraft(training.status)).toBe(true);
    
    const result = updateTrainingStatus(training, 'OPEN');
    
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const updatedTraining = result.value;
      expect(isStatusOpen(updatedTraining.status)).toBe(true);
      expect(updatedTraining.updatedAt.getTime()).toBeGreaterThan(training.updatedAt.getTime());
    }
  });

  it('研修状態をドラフトから開催済みに直接更新することはできない', () => {
    // 状態遷移の制約テスト
    const result = updateTrainingStatus(training, 'COMPLETED');
    
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBe('ドラフト状態から開催済み状態に直接更新することはできません');
    }
  });
});

describe('cancelTraining', () => {
  it('ドラフト状態の研修を中止にできる', () => {
    // 正常系テスト - 中止処理
    expect(isStatusDraft(training.status)).toBe(true);
    
    const result = cancelTraining(training, '講師の都合により中止');
    
    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const canceledTraining = result.value;
      expect(isStatusCanceled(canceledTraining.status)).toBe(true);
      
      // 中止状態は中止理由を持つことを確認
      if (isStatusCanceled(canceledTraining.status)) {
        expect(canceledTraining.status.reason).toBe('講師の都合により中止');
      }
    }
  });

  it('中止理由が短すぎる場合はエラーになる', () => {
    // バリデーションテスト
    const result = cancelTraining(training, '理由');
    
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBe('中止理由は5文字以上である必要があります');
    }
  });
});
```

#### 検索機能のテスト例

```typescript
describe('searchTrainings', () => {
  it('日付範囲で研修を検索できる', () => {
    // 正常系テスト
    const searchCriteria: SearchTrainingCriteria = {
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-06-30')
    };

    const result = searchTrainings(trainings, searchCriteria);

    expect(result).toHaveLength(3);
    expect(result.map(t => t.title)).toEqual([
      '5月15日の研修',
      '6月1日の研修',
      '6月15日の研修'
    ]);
  });

  it('日付範囲外の研修は含まれない', () => {
    // 境界値外のテスト
    const searchCriteria: SearchTrainingCriteria = {
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-05-31')
    };

    const result = searchTrainings(trainings, searchCriteria);

    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe('5月15日の研修');
  });

  it('開始日と終了日が同じ場合、その日の研修のみ検索される', () => {
    // 特殊ケース
    const searchCriteria: SearchTrainingCriteria = {
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-06-01')
    };

    const result = searchTrainings(trainings, searchCriteria);

    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe('6月1日の研修');
  });
});
```

## 6. 実行方法とコマンド一覧

### 6.1 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install
```

### 6.2 利用可能なコマンド

```bash
# TypeScriptのビルド
npm run build

# 型チェック
npm run type-check

# テストの実行
npm run test

# テストの監視モード
npm run test:watch

# サンプルの実行
npm run example

# リンターの実行
npm run lint
```

### 6.3 サンプル実行例

```bash
$ npm run example

=== 注文管理システム サンプル ===

1. 注文の作成
---
注文が作成されました:
  注文ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
  顧客ID: customer-123
  商品数: 2個
  配送先: 東京都千代田区...
  配送予定日: 2025/5/26

2. 配送予定の検索
---
検索結果:
- 注文#a1b2c3d4 (配送日: 2025/5/26)
```

## 7. 今後の拡張ポイント

### 7.1 ドメインの拡張

1. **商品管理ドメイン**
   - 商品カタログの管理
   - 在庫管理
   - 価格設定

2. **支払いドメイン**
   - 決済処理
   - 請求書発行
   - 返金処理

3. **配送追跡ドメイン**
   - 配送状況の更新
   - トラッキング番号の管理
   - 配送完了通知

### 7.2 技術的な拡張

1. **永続化層の追加**
   - リポジトリパターンの実装
   - データベース接続
   - マイグレーション

2. **APIレイヤーの追加**
   - REST API or GraphQL
   - 認証・認可
   - エラーハンドリング

3. **イベント駆動アーキテクチャ**
   - ドメインイベントの定義
   - イベントハンドラー
   - イベントソーシング

### 7.3 テストの拡充

1. **統合テスト**
   - APIレベルのテスト
   - E2Eテスト

2. **プロパティベーステスト**
   - fast-checkの導入
   - 自動生成されたテストケース

3. **パフォーマンステスト**
   - 大量データでの検索性能
   - 同時アクセス時の挙動

## 8. 参考資料

- [Zod Documentation](https://zod.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- [Functional Programming in TypeScript](https://github.com/gcanti/fp-ts)

---

本プロジェクトは、TypeScriptで関数型プログラミングとDDDを組み合わせた実装例を示しています。継続的な改善とフィードバックを歓迎します。