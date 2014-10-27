//
// 東京メトロ オープンデータ APIをいじるプログラム 
// Copyright (c) 2014 Satoshi Fujiwara
//
// このソースファイルはMITライセンスで提供します。
//
// The MIT License (MIT)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this 
// software and associated documentation files (the "Software"), to deal in the Software 
// without restriction, including without limitation the rights to use, copy, modify, merge,
// publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
// to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies 
// or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
// PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

process.setuid && process.setuid('node');

var fs = require('fs');
var https = require('https');
var q = require('q');
var jsdom = require('jsdom').jsdom;
var d3 = require('d3');
var ect = require('ect');
var zlib = require('zlib');

//var outputDataDir = '../html/data';
var outputDataDir = '/var/www/html/data';

var cacheDir = './data';
var apiUrl = 'https://api.tokyometroapp.jp/api/v2/';
var reg_type = new RegExp('.*\\/v2\\/([^\\/\\?\\&]*)\\?rdf\\:type\\=odpt\\:([^\\&]*)');
var reg_urn = new RegExp('.*\\/v2\\/([^\\/\\?\\&]*)\\/urn\\:ucode\\:([^\\&]*)');

//var reg = new RegExp('.*\\/v2\\/([^\\/\\?]*)(.*)$');
var stationGeoJsons = [];
var template = null;
var railways = null;
var stations = null;

var writeFile = q.nfbind(fs.writeFile);

q.nfcall(fs.readFile, 'apikey.json', 'utf-8')
.then(function (key) {
    var apiKey = JSON.parse(key).apiKey;
    var urls = [   
        { 'apiUrl' : apiUrl + 'datapoints?rdf:type=odpt:TrainInformation', 'path' : outputDataDir + '/trainInfo.json', 'apiKey' : apiKey },
        { 'apiUrl' : apiUrl + 'datapoints?rdf:type=odpt:Train', 'path' : outputDataDir + '/train.json', 'apiKey' : apiKey }
        ];
    setInterval(function () {
        // 運行情報の保存
        var promises = [];
        urls.forEach(function (d) {
            promises.push(callAPIAndSaveFileGzipped(d.apiUrl, d.path, d.apiKey));
        });
        q.all(promises)
        .then(function () {
            console.log('データ取得:' + new Date());
        })
        .catch(function (err) {
            console.log('エラーが発生しました。' + err.toString());
        });
    }, 60000);
})
.then(function () {
    console.log('### 初期化処理完了 ###');
})
.catch(function (err) {
    // エラー処理
    console.log('エラーが発生しました。' + err.toString());
});


//}, 1000 * 90);

// 東京MetroAPIの呼び出し
function callMetroAPI(url, apiKey) {
    
    var d = q.defer();
    
    var consumerKey = url.url.match(/\?/) ? '&acl:consumerKey=' + apiKey : '?acl:consumerKey=' + apiKey;
    https.get(url.url + consumerKey, function (res) {
        var body = '';
        res.setEncoding('utf8');
        
        res.on('data', function (chunk) {
            body += chunk;
        });
        
        res.on('end', function (res) {
            //            ret = JSON.parse(body);
            d.resolve(body);
        });
    }).on('error', function (e) {
        console.log(e);
        d.reject(e);
    });
    return d.promise;
}

// ローカルキャッシュ付きのAPI呼び出し
function callMetroAPICached(url, apiKey) {
    var s = url.cacheregex.exec(url.url);
    var dir = cacheDir + '/' + s[1];
    var path = (dir + '/' + encodeURIComponent(s[2]) + '.json');
    console.log(path);
    // まずキャッシュファイルの返却を試みる
    return q.nfcall(fs.readFile, path, 'utf-8')
    // エラー発生時の処理
    .catch(function (err) {
        if (err.code === 'ENOENT') {
            // キャッシュファイルがない場合はAPIで取得
            return q.delay(100)// ディレイをかます
            .then(callMetroAPI.bind(null, url, apiKey))
            .then(function (json) {
                q.nfcall(fs.mkdir, dir)// ディレクトリを作る
                .then(q.nfbind(fs.writeFile, path, json, 'utf-8')// ファイルを書き込む
                , function (err) {
                    // ディレクトリ作成失敗
                    if (err.code === 'EEXIST') {
                        // ディレクトリがある場合はリカバリ
                        return q.nfcall(fs.writeFile, path, json, 'utf-8');
                    }
                    throw err;
                })
                return json;
            });
        }        ;
        throw err;
    });

}

function compressGzip(path) {
    // gzipファイルを作成する
    var dout = q.defer();
    //console.log("write_content" + contPath);
    var out = fs.createWriteStream(path + '.gz');
    out.on('finish', dout.resolve.bind(dout));
    
    fs.createReadStream(path)
                    .pipe(zlib.createGzip({ level: zlib.Z_BEST_COMPRESSION }))
                    .pipe(out);
    return dout.promise;
}

function callAPIAndSaveFileGzipped(apiUrl,path,apiKey) {
    return callMetroAPI({ url: apiUrl }, apiKey)
    .then(function (json) {
        return writeFile(path, json, 'utf-8');
    })
    .then(compressGzip.bind(null, path));
}