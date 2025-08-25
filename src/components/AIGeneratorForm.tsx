'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Copy, RefreshCw, Send } from 'lucide-react';

interface AIGeneratorFormProps {
  onGenerate?: (result: any) => void;
}

export default function AIGeneratorForm({ onGenerate }: AIGeneratorFormProps) {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('casual');
  const [length, setLength] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postResult, setPostResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('トピックを入力してください');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          tone,
          length
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.data);
        onGenerate?.(data.data);
      } else {
        setError(data.error || 'AI生成に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('AI Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text);
      alert('📋 クリップボードにコピーしました！');
    }
  };

  const postToThreads = async () => {
    if (!result?.text) {
      setError('投稿する内容がありません');
      return;
    }

    setIsPosting(true);
    setError('');
    setPostResult(null);

    try {
      const response = await fetch('/api/admin/threads/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: result.text,
          userId: 'admin-system'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPostResult(data.data);
        onGenerate?.(data.data); // データ更新のコールバック
        alert(`🎉 ${data.data.message}\n\n投稿ID: ${data.data.threadsPostId}`);
      } else {
        setError(data.error || 'Threads投稿に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Threads post error:', err);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-lg p-6 mb-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-xl">
          <Wand2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI投稿生成</h2>
          <p className="text-gray-600 text-sm">実際のGemini APIを使用して投稿を生成</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 入力フォーム */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              トピック *
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例: 今日の天気について、新しい技術のトレンド、おすすめのカフェ..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                トーン
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="casual">カジュアル</option>
                <option value="professional">プロフェッショナル</option>
                <option value="funny">ユーモア</option>
                <option value="inspirational">感動的</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                長さ
              </label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="short">短い</option>
                <option value="medium">中程度</option>
                <option value="long">長い</option>
              </select>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                投稿を生成
              </>
            )}
          </motion.button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">❌ {error}</p>
            </div>
          )}
        </div>

        {/* 結果表示 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              生成結果
            </label>
            <div className="h-48 p-4 border border-gray-300 rounded-lg bg-gray-50 overflow-y-auto">
              {result ? (
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-gray-900 whitespace-pre-wrap">{result.text}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>トークン使用量: {result.tokensUsed}</span>
                    <span>{new Date(result.timestamp).toLocaleString('ja-JP')}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  {isGenerating ? (
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p>AI生成中...</p>
                    </div>
                  ) : (
                    <p>ここに生成された投稿が表示されます</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {result && (
            <div className="space-y-3">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={copyToClipboard}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                クリップボードにコピー
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={postToThreads}
                disabled={isPosting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPosting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    投稿中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Threadsに投稿
                  </>
                )}
              </motion.button>

              {postResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <p className="text-green-700 text-sm">
                    ✅ {postResult.message}
                    <br />
                    投稿ID: {postResult.threadsPostId}
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}