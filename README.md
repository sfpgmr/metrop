metrop
======

東京メトロオープンデータ活用コンテスト用アプリケーション作成レポジとりです。
公開サイトは http://www.enoie.net/metrop/ です。

動機
======

 GISに興味を持ち、d3.js等を使用して地図をSVGでプロットすることを試している時にちょうどこのコンテストが開催されていることを知りました。またRDFa LiteやJSON-LDに興味があり、具体的なデータで学んでみたいということもあり、丁度良い題材であったため作ってみることにしました。

使用しているソフトウェア・ライブラリ
======

* Visual Studio 2013 Express For Web ... エディタ
* Chrome ブラウザ ... デバッグ用
* node.js ... サーバー側データ処理エンジン
* nginx ... Webサーバー
* d3.js ... データ可視化/UI構築
* Bootstrap  ... UI構築
* require.js ... 非同期モジュール読み込み
* q.js ... 非同期処理効率化(Promise/Future)
* jQuery  ... UI構築
* domReady.js ... DOM読み込む完了検出
* ect ... サーバー側 HTMLテンプレート/レンダリングエンジン
* bootstrap-submenu ... ドロップダウンメニューをサブメニュー化するライブラリ
* LESS ... CSS編集

今後について
==========

実行するとわかりますが、簡単な機能しか実装できておりません。今後これをベースとして下記の機能を実装しようと考えております。

* 地図ソフトウェアとの連携
* Geo Location APIとの連携
* 列車時刻表と列車ロケーション情報を使用し、リアルタイムで列車走行位置をシミュレーション・表示する
* 描画パフォーマンス向上のため、WebGL(Three.js)による描画


License
=======
MITライセンスです。

The MIT License (MIT)

Copyright (c) 2014 Satoshi Fujiwara

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

