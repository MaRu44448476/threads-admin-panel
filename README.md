# ThreadBot Studio - 管理パネル

🔒 **管理者専用サイト** - 外部からのアクセスは厳重に制限されています。

## ⚠️ セキュリティ警告

このサイトは管理者専用です。以下のセキュリティ対策が実装されています：

- **Basic認証**: ID/Passwordによる二段階認証
- **IPフィルタリング**: 許可されたIPアドレスからのみアクセス可能
- **ログ記録**: すべての操作が記録・監視されます
- **非公開URL**: 推測困難な管理専用ポート

## 🚀 機能

### 📊 ダッシュボード
- システム全体の統計情報
- リアルタイムアクティビティ監視
- パフォーマンス指標表示

### 👥 ユーザー管理
- ユーザーアカウント一覧・詳細表示
- アカウント有効化・無効化
- 権限管理・ロール設定
- 一括操作機能

### 📝 投稿管理
- 全投稿の一覧・検索・フィルタリング
- 不適切投稿の削除・非表示
- 投稿統計・分析
- AI生成履歴の確認

### 🔧 システム管理
- サーバー状態監視
- エラーログ確認
- データベース統計
- バックアップ管理

### 📈 アナリティクス
- 利用統計・トレンド分析
- AI生成コスト分析
- ユーザー行動分析
- レポート生成

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **データベース**: SQLite + Prisma ORM
- **認証**: Basic認証 + IP制限
- **UI**: TailwindCSS + Framer Motion
- **セキュリティ**: カスタムミドルウェア

## 📦 セットアップ

### 前提条件
- Node.js 18以上
- 管理者権限
- セキュアなネットワーク環境

### インストール手順

1. **依存関係のインストール**
```bash
npm install
```

2. **環境変数の設定**
```bash
cp .env.example .env.local
```

`.env.local`ファイルを編集：
```env
# 必須: Basic認証設定
BASIC_AUTH_USER="admin"
BASIC_AUTH_PASSWORD="your-super-secure-password"

# 必須: データベース
DATABASE_URL="file:./admin.db"

# 必須: セッション暗号化
NEXTAUTH_SECRET="your-ultra-secret-key"

# オプション: IPアドレス制限
ADMIN_ALLOWED_IPS="127.0.0.1,192.168.1.100"

# オプション: ポート設定
ADMIN_PORT="3001"
```

3. **データベースの初期化**
```bash
npx prisma generate
npx prisma db push
```

4. **管理サイトの起動**
```bash
npm run dev
```

5. **Basic認証でアクセス**
- URL: `http://localhost:3001`
- Username: 環境変数で設定したID
- Password: 環境変数で設定したパスワード

## 🔐 セキュリティ設定

### Basic認証の設定
```env
BASIC_AUTH_USER="admin"
BASIC_AUTH_PASSWORD="complex-password-123!"
```

### IPアドレス制限
```env
# 特定のIPのみ許可
ADMIN_ALLOWED_IPS="127.0.0.1,192.168.1.100,10.0.0.5"

# 制限なし（開発時のみ）
ADMIN_ALLOWED_IPS=""
```

### 本番環境での推奨設定
- **HTTPS必須**: SSL証明書の設定
- **VPN接続**: 社内ネットワーク経由のアクセス
- **IP制限**: 管理者のIPアドレスのみ許可
- **強力なパスワード**: 最低16文字、記号含む
- **ログ監視**: 不正アクセス検知

## 📝 操作ログ

すべての管理操作は`AdminLog`テーブルに記録されます：

- ログイン・ログアウト
- ユーザー作成・削除・編集
- 投稿削除・非表示
- 設定変更
- システム操作

## ⚡ 開発

### 新機能の追加
```bash
# 新しいページ作成
src/app/new-page/page.tsx

# API エンドポイント作成
src/app/api/admin/new-endpoint/route.ts
```

### データベーススキーマ変更
```bash
# スキーマ編集後
npx prisma db push

# マイグレーション作成
npx prisma migrate dev --name "add-new-feature"
```

## 🚨 緊急時の対応

### サイトの緊急停止
```bash
# プロセス強制終了
pkill -f "next-server"

# ポート確認
netstat -tulpn | grep :3001
```

### データベースバックアップ
```bash
# SQLiteファイルのコピー
cp prisma/admin.db backup/admin_$(date +%Y%m%d_%H%M%S).db
```

### ログ確認
```bash
# アクセスログ確認
tail -f logs/access.log

# エラーログ確認
tail -f logs/error.log
```

## 📄 ライセンス

管理者専用 - 機密情報を含むため外部配布禁止

## ⚠️ 注意事項

- **このサイトは絶対に公開しないでください**
- 管理者アカウント情報の厳重な管理
- 定期的なパスワード変更
- アクセスログの定期確認
- 不正アクセス検知時の即座の対応
