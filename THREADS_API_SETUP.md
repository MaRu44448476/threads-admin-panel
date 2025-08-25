# Threads API 完全セットアップガイド 🚀

このガイドでは、Threads APIを実際に使用できるようにする手順を、初心者の方でも分かりやすく説明します。

## 📋 事前準備

必要なもの：
- **Instagramビジネスアカウント** または **クリエイターアカウント**
- **Threadsアカウント**（Instagramアカウントと連携済み）
- **Facebookアカウント**（Meta Developer登録用）
- **公開プロフィール**（Threadsのプロフィールが公開設定になっている必要があります）

> ⚠️ **重要な制限事項**:
> - 個人のInstagramアカウントではThreads APIは使用できません
> - **Threadsプロフィールが非公開の場合はAPIを利用できません**
> - APIの権限は**90日間**有効（長期トークンで延長可能）
> - 他のユーザーのデータにアクセスする場合は**App Review**（アプリ審査）が必要

---

## 📝 STEP 1: Instagramをビジネスアカウントに変更

### 1.1 Instagramアプリを開く
1. スマートフォンでInstagramアプリを開く
2. 右下のプロフィールアイコンをタップ
3. 右上の三本線メニュー（≡）をタップ

### 1.2 アカウントタイプを変更
1. 「設定とプライバシー」をタップ
2. 「アカウントの種類とツール」をタップ
3. 「プロアカウントに切り替える」をタップ
4. 「クリエイター」または「ビジネス」を選択
   - **クリエイター**: 個人ブランド向け
   - **ビジネス**: 企業・店舗向け
5. カテゴリを選択（例：「デジタルクリエイター」「ソフトウェア会社」など）
6. 連絡先情報を入力（任意）

---

## 🔗 STEP 2: ThreadsアカウントをInstagramと連携

### 2.1 Threadsアプリをインストール
1. App Store / Google Playから「Threads」をダウンロード
2. アプリを開く

### 2.2 Instagramアカウントでログイン
1. 「Instagramでログイン」をタップ
2. ビジネスアカウントに変更したInstagramでログイン
3. プロフィール情報をインポート
4. 「Threadsに参加」をタップ

### 2.3 プロフィールを公開設定にする（必須）
1. Threadsアプリでプロフィールアイコンをタップ
2. 「設定」→「プライバシー」を選択
3. **「非公開プロフィール」をOFFにする**
   - ⚠️ これがONだとAPIが使用できません！

---

## 👨‍💻 STEP 3: Meta for Developers アカウント作成

### 3.1 Meta for Developersにアクセス
1. ブラウザで [https://developers.facebook.com/](https://developers.facebook.com/) を開く
2. 右上の「ログイン」をクリック
3. Facebookアカウントでログイン

### 3.2 開発者アカウントを作成
1. 初回ログイン時に「開発者として登録」画面が表示される
2. 以下を入力：
   - **電話番号**: SMS認証用
   - **メールアドレス**: 確認メール受信用
3. 「次へ」をクリック
4. SMSで届いた認証コードを入力
5. 利用規約に同意して「登録を完了」

---

## 🎯 STEP 4: Threads API アプリを作成

### 4.1 新しいアプリを作成
1. Meta for Developersダッシュボードで「アプリを作成」をクリック
2. 「その他」を選択 → 「次へ」
3. アプリタイプで「ビジネス」を選択

### 4.2 アプリ情報を入力
```
アプリ名: Threads Admin Panel（好きな名前でOK）
アプリの連絡先メールアドレス: あなたのメール
アプリの目的: 自分自身または自分のビジネス
```

### 4.3 アプリ作成を完了
1. 「アプリを作成」をクリック
2. パスワードを再入力して確認

---

## 🔧 STEP 5: Threads APIを有効化

### 5.1 製品を追加
1. 左サイドバーの「製品を追加」をクリック
2. 「Threads」を探して「設定」をクリック
3. 「Threads APIを使用」を選択

### 5.2 必要な権限を設定
1. 左サイドバー「アプリの設定」→「ベーシック」
2. 以下の情報をメモ：
   - **アプリID**
   - **app secret**（「表示」をクリックして確認）

### 5.3 Threads Use Caseを追加
1. 左サイドバー「製品」→「Threads」→「Use Cases」
2. 「Add Use Case」をクリック
3. 以下の権限を選択：
   - `threads_basic` - 基本的な読み書き
   - `threads_content_publish` - コンテンツ投稿
   - `threads_manage_insights` - インサイト取得（任意）
   - `threads_manage_replies` - 返信管理（任意）
   - `threads_read_replies` - 返信読み取り（任意）

---

## 🔑 STEP 6: アクセストークンを取得

### 6.1 Graph API Explorerを使用
1. [Graph API Explorer](https://developers.facebook.com/tools/explorer/) にアクセス
2. 右上でアプリを選択（作成したアプリ名）

### 6.2 アクセストークンを生成
1. 「User or Page」ドロップダウンから「User Token」を選択
2. 「Add Permissions」をクリック
3. **Threads権限**を選択：
   - `threads_basic`（必須）
   - `threads_content_publish`（投稿に必要）
   - `threads_manage_insights`（分析データ取得、任意）
   - `threads_read_replies`（返信読み取り、任意）
   - `threads_manage_replies`（返信管理、任意）

### 6.3 トークンを生成
1. 「Generate Access Token」をクリック
2. Instagramビジネスアカウントでログイン承認
3. 生成されたトークンをコピー（後で使用）

> ⚠️ **重要**: このトークンは60日間有効です。長期トークンが必要な場合は次のステップへ。

---

## 🔄 STEP 7: 長期アクセストークンに変換（推奨）

### 7.1 短期トークンを長期トークンに変換
ブラウザで以下のURLにアクセス（値を置き換えてください）：

```
https://graph.facebook.com/v18.0/oauth/access_token?
grant_type=fb_exchange_token&
client_id=あなたのアプリID&
client_secret=あなたのapp_secret&
fb_exchange_token=Step6で取得したトークン
```

### 7.2 レスポンスから長期トークンを取得
```json
{
  "access_token": "これが長期トークンです",
  "token_type": "bearer",
  "expires_in": 5184000  // 60日間有効
}
```

---

## ⚙️ STEP 8: プロジェクトに設定

### 8.1 環境変数ファイルを作成
1. `threads-admin-panel`フォルダに`.env.local`ファイルを作成
2. 以下の内容を追加：

```env
# Threads API設定
THREADS_ACCESS_TOKEN=ここに長期アクセストークンを貼り付け
THREADS_USER_ID=あなたのThreadsユーザーID

# 既存の設定（変更不要）
BASIC_AUTH_USER=admin
BASIC_AUTH_PASSWORD=your-password-123
DATABASE_URL=file:./admin.db
NEXTAUTH_SECRET=your-secret-key
```

### 8.2 Threads User IDを取得
Graph API Explorerで以下を実行：
1. アクセストークンを設定
2. エンドポイントに `me/threads_profile` を入力
3. 「Submit」をクリック
4. レスポンスの `id` がThreads User ID

---

## 🧪 STEP 9: 接続テスト

### 9.1 管理パネルを起動
```bash
cd C:\Dev\Projects\threads-admin-panel
npm run dev
```

### 9.2 ブラウザでアクセス
1. http://localhost:3001 を開く
2. Basic認証でログイン
3. 「AI Generator」セクションへ移動
4. テスト投稿を作成：
   ```
   APIテスト投稿です！ #ThreadsAPI #テスト
   ```
5. 「Threadsに投稿」をクリック

### 9.3 確認
1. Threadsアプリを開く
2. 投稿が表示されていれば成功！🎉

---

## ❗ トラブルシューティング

### エラー: "機能をご利用いただけません" / "This feature is not available"
**最も一般的な原因と解決方法：**

1. **Threadsプロフィールが非公開になっている**
   - Threadsアプリ → プロフィール → 設定 → プライバシー
   - 「非公開プロフィール」をOFFにする（必須）

2. **Instagramアカウントが個人アカウント**
   - ビジネスまたはクリエイターアカウントに変更が必要
   - Instagram → 設定 → アカウントの種類とツール → プロアカウントに切り替える

3. **必要な権限が不足**
   - Graph API Explorerで以下のThreads権限を選択：
     - `threads_basic`（必須）
     - `threads_content_publish`（投稿に必須）
   - ⚠️ `pages_` や `instagram_` 権限は不要です！

4. **アプリにThreads Use Caseが追加されていない**
   - Meta for Developers → アプリ → 製品を追加 → Threads
   - Use Casesで必要な権限を追加

### エラー: "Invalid OAuth access token"
- トークンが正しくコピーされているか確認
- トークンの前後に空白がないか確認
- Graph API Explorerで新しいトークンを生成
- トークンの有効期限（90日）を確認

### エラー: "Permissions error"
- Graph API Explorerで必要な権限が選択されているか確認
- 特に `pages_show_list` が含まれているか確認
- アプリのUse Casesで権限が有効になっているか確認

### エラー: "User not authorized"
- Instagramアカウントがビジネス/クリエイターアカウントか確認
- ThreadsアカウントがInstagramと連携されているか確認
- Threadsプロフィールが公開設定になっているか確認

### 投稿が表示されない
- Threadsアプリを完全に終了して再起動
- 数分待ってから確認（反映に時間がかかる場合あり）
- APIレート制限を確認（24時間で250投稿まで）

---

## 🚨 APIレート制限

Threads APIには以下の制限があります：

- **投稿**: 24時間あたり最大250投稿
- **返信**: 24時間あたり最大1,000返信
- **削除**: 24時間あたり最大100削除
- **場所検索**: 24時間あたり最大500検索
- **API呼び出し**: `4800 × インプレッション数`（最小10）

制限状況は`threads_publishing_limit`エンドポイントで確認可能です。

---

## 🔄 App Review（アプリ審査）について

### 自分のアカウントのみ使用する場合
- **App Reviewは不要**
- 開発モードのままで利用可能
- 90日ごとにトークンを更新する必要あり

### 他のユーザーのデータにアクセスする場合
- **App Reviewが必須**
- Meta for Developersでアプリを本番モードに変更
- 使用目的の説明とスクリーンキャスト提出が必要
- 審査には数日〜数週間かかる場合あり

---

## 📚 参考リンク

- [Threads API公式ドキュメント](https://developers.facebook.com/docs/threads)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Meta for Developers](https://developers.facebook.com/)
- [Threads API Changelog](https://developers.facebook.com/docs/threads/changelog)

---

## 🔐 セキュリティ注意事項

1. **アクセストークンは絶対に公開しない**
   - GitHubにプッシュしない
   - SNSに投稿しない
   - 他人と共有しない

2. **定期的にトークンを更新**
   - 60日ごとに新しいトークンを生成
   - 古いトークンは無効化される

3. **本番環境では環境変数を使用**
   - ハードコーディングは避ける
   - `.env.local`は`.gitignore`に追加

---

質問があれば、遠慮なく聞いてください！ 🚀