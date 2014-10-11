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

var fs = require('fs');
var https = require('https');
var q = require('q');
var jsdom = require('jsdom').jsdom;
var d3 = require('d3');
var ect = require('ect');
var zlib = require('zlib');
var outputDir = '../html/';
var outputDataDir = '../html/data';
var apiKey = null;
var apiUrl = 'https://api.tokyometroapp.jp/api/v2/';
var reg_type = new RegExp('.*\\/v2\\/([^\\/\\?\\&]*)\\?rdf\\:type\\=odpt\\:([^\\&]*)');
var reg_urn = new RegExp('.*\\/v2\\/([^\\/\\?\\&]*)\\/urn\\:ucode\\:([^\\&]*)');

//var reg = new RegExp('.*\\/v2\\/([^\\/\\?]*)(.*)$');
var railWayGeoJsons = [];
var stationGeoJsons = [];
var template = null;

var writeFile = q.nfbind(fs.writeFile);


// 各線の色情報
var lineColor = {
    'm' : '#e60012',
    'M' : '#e60012',
    'G' : '#f39700',
    'Z' : '#9b7cb6',
    'T' : '#00a7db',
    'H' : '#9caeb7',
    'N' : '#00ada9',
    'F' : '#bb641d',
    'Y' : '#d7c447',
    'C' : '#009944'
};

q.nfcall(fs.readFile, 'apikey.json', 'utf-8')
.then(function (key) {
    // マスタ的な情報をまずまとめて取得する。
    apiKey = JSON.parse(key).apiKey;
    //    var url = apiUrl + 'datapoints?rdf:type=odpt:Train&acl:consumerKey=' + apiKey;
    //    var url = apiUrl + 'datapoints?rdf:type=odpt:StationTimetable&odpt:station=odpt.Station:TokyoMetro.Tozai.Otemachi&acl:consumerKey=' + apiKey;
    var promises = [];
    var urls = [
        { url : apiUrl + 'datapoints?rdf:type=odpt:Railway',cacheregex : reg_type,cache: true },
        { url : apiUrl + 'datapoints?rdf:type=odpt:Station',cacheregex : reg_type,cache: true }
        ];
    urls.forEach(function (url) {
        var api = url.cache? callMetroAPICached : callMetroAPI;
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
    var railWays = d[0];
    var result = q(0);
    railWays.forEach(function (railWay) {
        result = result
        .then(function () { return callMetroAPICached({ url : railWay ['ug:region'], cacheregex : reg_urn,cache : false }, apiKey); })
        .then(function (json) {
            railWayGeoJsons.push({ title: railWay['dc:title'],railWayData:railWay, geometry: JSON.parse(json) });
        });
    });
    // 駅位置データ取得
    var stations = d[1];
    stations.forEach(function (st) {
        result = result
        .then(q.fbind(callMetroAPICached, {url: st['ug:region'], cacheregex : reg_urn, cache : false }, apiKey))
        .then(function (json) {
            stationGeoJsons.push({ title: st['dc:title'], stationData: st, geometry: JSON.parse(json) });
        });
    });
    // 
    return result;
})
// 東京との境界図をロードする
.then(q.nfbind(fs.readFile ,'data/tokyo-to.json','utf-8'))
.then(function (jsonString) {
    var json = JSON.parse(jsonString);
//    document = jsdom.jsdom(htmlFile);
//    window = document.parentWindow;
    var width = 1920,
        height = 1080;
    var svg = d3.select('body').append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('id', 'metroMap').append('g').append('g');
    var projection = d3.geo.mercator()
            .scale(200000)
            .center([139.845,35.65]);
//            .center(d3.geo.centroid(json));
//            .translate([width / 2, height / 2]);
           
    var path = d3.geo.path().projection(projection);
    svg.append('g')
      .attr('id','tokyoMap')
      .selectAll('path')
      .data(json.features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', function (d) {
        return 'none';
        //return 'rgba(128,128,128,0.15)';
       })
      .attr('stroke', 'black');
    
    
    svg
    .append('g')
    .attr('id', 'railWays')
    .selectAll('path')
    .data(railWayGeoJsons)
    .enter()
    .append('g')
    .attr('data-linetitle', function (d) { return d.title; })
    .attr('data-linecode', function (d) { return d.railWayData['odpt:lineCode']; })
    .append('path')
    .attr('d', function (d) {
        return path(d.geometry);
    })
    .attr('fill', 'none')
    .attr('stroke', function (d) { return lineColor[d.railWayData['odpt:lineCode']]; })
    .attr('stroke-width', '5');

    
    // 駅位置の表示
    var gst = svg.append('g');
    stationGeoJsons.forEach(function (gj) {
        
        //console.log(gj.stationData['dc:title']);
        var ppos = projection(gj.geometry.coordinates);
        var px = ppos[0];
        var py = ppos[1];
        gst.append('circle')
        .attr('cx', px)
        .attr('cy', py)
        .attr('r' , '2')
        .attr('fill', 'white');

        gst.append('text')
        .attr('x',px)
        .attr('y', py)
        .style('font-size', '4px')
        .style('text-anchor', 'left')
        .text(gj.stationData['dc:title']);
    });

    var svgData = d3.select('body').node().innerHTML;
    var renderer = ect({ root : './' });
    var data = {
        title : '東京メトロAPIテスト(Zoom機能の実装)',
        articleBody: svgData
    };

    return writeFile(outputDir + '/index.html', renderer.render('template_0001.html',data), 'utf-8');
})
.then(compressGzip.bind(null, outputDir + '/index.html'))
.then(function(){
    // 運行情報の取得
    var trainInfosPath = outputDataDir + '/trainInfo.json';
    var trainInfos = callMetroAPI({ url: 'https://api.tokyometroapp.jp/api/v2/datapoints?rdf:type=odpt:TrainInformation' }, apiKey)
    .then(function (json) {
        return writeFile(trainInfosPath, json, 'utf-8');
    })
    .then(compressGzip.bind(null, trainInfosPath));

    // 列車位置情報の取得
    var trainsPath = outputDataDir + '/train.json';
    var trains  = callMetroAPI({ url: 'https://api.tokyometroapp.jp/api/v2/datapoints?rdf:type=odpt:Train' }, apiKey)
    .then(function (json) {
        return writeFile(trainsPath, json, 'utf-8');
    })
    .then(compressGzip.bind(null, trainsPath));
    return q.all([trainInfos,trains]);
})
.then(function () {
    console.log('### 処理終了 ###');
})
.catch(function (err) {
    // エラー処理
    console.log('エラーが発生しました。' + err.toString());
});


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
    var dir = outputDataDir + '/' + s[1];
    var path = (dir + '/' + encodeURIComponent(s[2]) + '.json');
    console.log(path);
    // まずキャッシュファイルの返却を試みる
    return q.nfcall(fs.readFile, path, 'utf-8')
    // エラー発生時の処理
    .catch(function (err) {
        if (err.code === 'ENOENT') {
            // キャッシュファイルがない場合はAPIで取得
            return q.delay(100) // ディレイをかます
            .then(callMetroAPI.bind(null,url, apiKey))
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
                .then(compressGzip.bind(null,path));
                return json;
            });
        };
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