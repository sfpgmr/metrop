﻿//
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

//process.setuid && process.setuid('sfpg');


var fs = require('fs');
var https = require('https');
var http = require('http');
var q = require('q');
var jsdom = require('jsdom').jsdom;
var d3 = require('d3');
var ect = require('ect');
var zlib = require('zlib');
var outputDir = '../html/';
var outputDataDir = '../html/data';

var outputDir = '../html/';
var outputDataDir = '../html/data';

var cacheDir = './data';
var apiKey = null;
var apiUrl = 'https://api.tokyometroapp.jp/api/v2/';
var reg_type = new RegExp('.*\\/v2\\/([^\\/\\?\\&]*)\\?rdf\\:type\\=odpt\\:([^\\&]*)');
var reg_urn = new RegExp('.*\\/v2\\/([^\\/\\?\\&]*)\\/urn\\:ucode\\:([^\\&]*)');

//var reg = new RegExp('.*\\/v2\\/([^\\/\\?]*)(.*)$');
var stationGeoJsons = {};
var template = null;
var railways = null;
var stations = null;

var writeFile = q.nfbind(fs.writeFile);


// 各線の色情報
var lineInfos = {
    '4号線丸ノ内線分岐線' : { color: '#e60012', 'owl:sameAs': 'odpt.Railway:TokyoMetro.MarunouchiBranch',direction:'odpt.RailDirection:TokyoMetro.NakanoSakaue' },
    '4号線丸ノ内線' : {color : '#e60012', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Marunouchi', direction: 'odpt.RailDirection:TokyoMetro.Ikebukuro'},
    '3号線銀座線' : {color:'#f39700', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Ginza', direction: 'odpt.RailDirection:TokyoMetro.Asakusa'},
    '11号線半蔵門線' :{color: '#9b7cb6', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Hanzomon', direction: 'odpt.RailDirection:TokyoMetro.Oshiage'},
    '5号線東西線' : {color:'#00a7db', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Tozai',direction: 'odpt.RailDirection:TokyoMetro.NishiFunabashi' },
    '2号線日比谷線' : { color:'#9caeb7', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Hibiya' ,direction: 'odpt.RailDirection:TokyoMetro.KitaSenju'},
    '7号線南北線' : { color : '#00ada9','owl:sameAs': 'odpt.Railway:TokyoMetro.Namboku', direction: 'odpt.RailDirection:TokyoMetro.AkabaneIwabuchi'},
    '13号線副都心線' : { color : '#bb641d','owl:sameAs': 'odpt.Railway:TokyoMetro.Fukutoshin', direction: 'odpt.RailDirection:TokyoMetro.Shibuya'},
    '8号線有楽町線' : { color : '#d7c447','owl:sameAs': 'odpt.Railway:TokyoMetro.Yurakucho', direction: 'odpt.RailDirection:TokyoMetro.ShinKiba'},
    '9号線千代田線' : { color : '#009944','owl:sameAs': 'odpt.Railway:TokyoMetro.Chiyoda', direction: 'odpt.RailDirection:TokyoMetro.Ayase'},
};

// 各線の情報
var railwayInfos = {
    'odpt.Railway:TokyoMetro.MarunouchiBranch' : {direction: 'odpt.RailDirection:TokyoMetro.NakanoSakaue' },
    'odpt.Railway:TokyoMetro.Marunouchi' :{ direction: 'odpt.RailDirection:TokyoMetro.Ikebukuro' },
    'odpt.Railway:TokyoMetro.Ginza' : {direction: 'odpt.RailDirection:TokyoMetro.Asakusa' },
    'odpt.Railway:TokyoMetro.Hanzomon' : {direction: 'odpt.RailDirection:TokyoMetro.Oshiage' },
    'odpt.Railway:TokyoMetro.Tozai': {direction: 'odpt.RailDirection:TokyoMetro.NishiFunabashi'},
    'odpt.Railway:TokyoMetro.Hibiya' : { direction: 'odpt.RailDirection:TokyoMetro.KitaSenju' },
    'odpt.Railway:TokyoMetro.Namboku':{ direction: 'odpt.RailDirection:TokyoMetro.AkabaneIwabuchi' },
    'odpt.Railway:TokyoMetro.Fukutoshin':{ direction: 'odpt.RailDirection:TokyoMetro.Wakoshi' },
    'odpt.Railway:TokyoMetro.Yurakucho' :{ direction: 'odpt.RailDirection:TokyoMetro.Wakoshi' },
    'odpt.Railway:TokyoMetro.Chiyoda' :{direction: 'odpt.RailDirection:TokyoMetro.Ayase' }
};

//setInterval( function () {
q.nfcall(fs.readFile, 'apikey.json', 'utf-8')
.then(function (key) {
    // マスタ的な情報をまずまとめて取得する。
    apiKey = JSON.parse(key).apiKey;
    var promises = [];
    var urls = [
        { url : apiUrl + 'datapoints?rdf:type=odpt:Railway', cacheregex : reg_type, cache: true },
        { url : apiUrl + 'datapoints?rdf:type=odpt:Station', cacheregex : reg_type, cache: true }
        ];
    urls.forEach(function (url) {
        var api = url.cache ? callMetroAPICached : callMetroAPI;
        promises.push(
            api(url, apiKey)
            .then(function (json) {
                return JSON.parse(json);
            })
        );
    });
    return q.all(promises);
})
.then(function (d) {
    // 路線描画 geoJsonデータの取得
    railways = d[0];
    stations = d[1];
    var result = q(0);
    // 駅位置データ取得
    stations
    .forEach(function (st) {
        result = result
        .then(q.fbind(callMetroAPICached, { url: st['ug:region'], cacheregex : reg_urn, cache : true }, apiKey))
        .then(function (json) {
            var gj = JSON.parse(json);
            st['ug:region'] = gj;
            stationGeoJsons[st['dc:title']] = { stationData: st, geometry: JSON.parse(json) };

//            stationGeoJsons.push({ title: st['dc:title'], stationData: st, geometry: JSON.parse(json) });
        });
    });
    
    // 
    return result;
})
.then(function () {
    var promises = [];
    //// 運行情報の保存
    //[   { 'apiUrl' : apiUrl + 'datapoints?rdf:type=odpt:TrainInformation', 'path' : outputDataDir + '/trainInfo.json', 'apiKey' : apiKey },
    //    { 'apiUrl' : apiUrl + 'datapoints?rdf:type=odpt:Train', 'path' : outputDataDir + '/train.json', 'apiKey' : apiKey }
    //]
    //.forEach(function (d) {
    //    promises.push(callAPIAndSaveFileGzipped(d.apiUrl, d.path, d.apiKey));
    //});
    
    // その他情報の保存
    [
        { url : apiUrl + 'datapoints?rdf:type=odpt:StationFacility', cacheregex : reg_type, path : outputDataDir + '/stationFacility.json'},
        { url : apiUrl + 'datapoints?rdf:type=odpt:PassengerSurvey', cacheregex : reg_type, path : outputDataDir + '/passengerSurvey.json'},
        { url : apiUrl + 'datapoints?rdf:type=odpt:RailwayFare', cacheregex : reg_type,path : outputDataDir + '/railwayFare.json'}//,
    ].forEach(function (d) {
        promises.push(
            callMetroAPICached(d, apiKey)
            .then(function (json){
                return writeFile(d.path,json,'utf-8');
            })
            .then(compressGzip.bind(null,d.path))
        );
    });
    
    // 駅時刻表は駅ごとに分割して保存する
    promises.push(
      callMetroAPICached({ url : apiUrl + 'datapoints?rdf:type=odpt:StationTimetable', cacheregex : reg_type }, apiKey)
        .then(function (json) {
          var r = q(0);
          var stationTimeTableIndexs = {};
          var tbls = JSON.parse(json);
          tbls.forEach(function (d) {
            var fname = d["owl:sameAs"].split(':')[1] + '.json';
            var fp = outputDataDir + '/stationTimeTable/' + fname;
            if (!stationTimeTableIndexs[d['odpt:station']]) {
              stationTimeTableIndexs[d['odpt:station']] = [];
            }
            stationTimeTableIndexs[d['odpt:station']].push({ direction: d['odpt:railDirection'], path : '/data/stationTimeTable/' + fname });
            r = r.then(writeFile.bind(null, fp, JSON.stringify(d), 'utf-8')).then(compressGzip.bind(null, fp));
          });
          r = r.then(writeFile.bind(null,outputDataDir + '/stationTimeTable/stationTimeTableIndexs.json', JSON.stringify(stationTimeTableIndexs),'utf-8'));
          return r;
        })
    );

    //// 列車時刻表は列車ごとに分割して保存する
    //promises.push(
    //  callMetroAPICached({ url : apiUrl + 'datapoints?rdf:type=odpt:TrainTimetable', cacheregex : reg_type }, apiKey)
    //    .then(function (json) {
    //      var r = q(0);
    //      var tbls = JSON.parse(json);
    //      tbls.forEach(function (d) {
    //        var fname = d["owl:sameAs"].split(':')[1] + '.json';
    //        var fp = outputDataDir + '/trainTimeTable/' + fname;
    //        r = r.then(writeFile.bind(null, fp, JSON.stringify(d), 'utf-8')).then(compressGzip.bind(null, fp));
    //      });
    //      return r;
    //    })
    //);


    var stationDataPath = outputDataDir + '/stations.json';
    promises.push(
      writeFile(stationDataPath, JSON.stringify(stations), 'utf-8')
      .then(compressGzip.bind(null, stationDataPath))
    );
        
    var railwaysDataPath = outputDataDir + '/railways.json';
    promises.push(
      writeFile(railwaysDataPath, JSON.stringify(railways), 'utf-8')
      .then(compressGzip.bind(null, railwaysDataPath))
    );
        


    return q.all(promises);
  })
.then(function () {
    // 3年分の休日データを取得

  return httpGet('http://www.google.com/calendar/feeds/ja.japanese%23holiday%40group.v.calendar.google.com/public/full?alt=json&max-results=100')
  .then(function (json) {
     return writeFile(outputDataDir + '/holidays.json', json, 'utf-8')
  })
  .then(compressGzip.bind(null, outputDataDir + '/holidays.json'));
})
.then(function () {
    console.log('### 処理終了 ###');
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

// http get 
function httpGet(url) {
  
  var d = q.defer();
  
  http.get(url, function (res) {
    var body = '';
    res.setEncoding('utf8');
    
    res.on('data', function (chunk) {
      body += chunk;
    });
    
    res.on('end', function (res) {
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