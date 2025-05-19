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
│   │   ├── order/                # 注文ドメイン
│   │   │   └── types.ts          # 型定義とファクトリ関数
│   │   └── shipping/             # 配送ドメイン
│   │       └── functions.ts      # 配送スケジュール検索
│   ├── shared/                   # 共通ユーティリティ
│   │   └── types.ts              # UUID、Result型など
│   └── example.ts                # 実行可能なサンプルコード
├── tests/                        # テストコード
│   └── domain/
│       ├── order/
│       │   └── types.test.ts     # 注文ドメインのテスト
│       └── shipping/
│           └── functions.test.ts # 配送機能のテスト
├── package.json                  # 依存関係とスクリプト
├── tsconfig.json                 # TypeScript設定
├── SPRINT_BACKLOG.md            # 開発ストーリー
├── USER_STORIES.md              # ユーザーストーリー
└── CLAUDE.md                    # プロジェクト説明（v1）
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

## 4. ドメインロジックの実装例

### 4.1 注文作成関数（createOrder）

```typescript
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

### 4.2 配送日程検索関数（searchDeliveries）

```typescript
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

#### 配送日程検索のテスト例

```typescript
describe('searchDeliveries', () => {
  it('日付範囲で配送予定を検索できる', () => {
    // 正常系テスト
  });

  it('日付範囲外の配送は検索結果に含まれない', () => {
    // 境界値外のテスト
  });

  it('検索範囲の境界日付の配送も含まれる', () => {
    // 境界値のテスト
  });

  it('空の注文リストの場合、空の結果が返る', () => {
    // エッジケース
  });

  it('開始日と終了日が同じ場合、その日の配送のみ検索される', () => {
    // 特殊ケース
  });

  it('開始日が終了日より後の場合、空の結果が返る', () => {
    // 異常系
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