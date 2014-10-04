
var fs = require('fs');
var https = require('https');
var q = require('q');
var jsdom = require('jsdom').jsdom;
var d3 = require('d3');
var ect = require('ect');
var outputDir = '../html/';
var apiKey = null;
var apiUrl = 'https://api.tokyometroapp.jp/api/v2/';
//var reg = new RegExp('rdf\\:type\\=odpt\\:([^\\&]*)');
var reg = new RegExp('.*\\/v2\\/([^\\/\\?]*)(.*)$');
var railWayGeoJsons = [];
var template = null;

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
    // 情報をまずまとめて取得する。
    apiKey = JSON.parse(key).apiKey;
    //    var url = apiUrl + 'datapoints?rdf:type=odpt:Train&acl:consumerKey=' + apiKey;
    //    var url = apiUrl + 'datapoints?rdf:type=odpt:StationTimetable&odpt:station=odpt.Station:TokyoMetro.Tozai.Otemachi&acl:consumerKey=' + apiKey;
    var promises = [];
    var urls = [
        apiUrl + 'datapoints?rdf:type=odpt:Railway',
        apiUrl + 'datapoints?rdf:type=odpt:Station'
        //apiUrl + 'datapoints?rdf:type=odpt:StationTimetable&odpt:station=odpt.Station:TokyoMetro.Tozai.Otemachi&acl:consumerKey=' + apiKey,
        //apiUrl + 'datapoints?rdf:type=odpt:StationTimetable&odpt:station=odpt.Station:TokyoMetro.Tozai.Otemachi&acl:consumerKey=' + apiKey,
        //apiUrl + 'datapoints?rdf:type=odpt:Station&dc:title=上野&odpt:railway=odpt.Railway:TokyoMetro.Hibiya&acl:consumerKey=' + apiKey
        ];
    urls.forEach(function (url) {
        promises.push(
            callMetroAPICached(url, apiKey)
            .then(function (json) {
            return JSON.parse(json);
            })
        );
    });
    return q.all(promises);
})
.then(function (d) {
    // 路線データ 駅データの取得完了
    var railWays = d[0];
    var result = q(0);
    railWays.forEach(function (railWay) {
        result = result
        .then(function () { return callMetroAPICached(railWay['ug:region'], apiKey); })
        .then(function (json) {
            railWayGeoJsons.push({ title: railWay['dc:title'],railWayData:railWay, geometry: JSON.parse(json) });
        });
    });
    return result;
})
// 東京との境界図をロードする
.then(q.nfbind(fs.readFile ,'data/tokyo23.json','utf-8'))
.then(function (jsonString) {
    var json = JSON.parse(jsonString);
//    document = jsdom.jsdom(htmlFile);
//    window = document.parentWindow;
    var width = 1024,
        height = 768;
    var svg = d3.select('body').append('svg')
        .attr('width', width)
        .attr('height', height);
    var g = svg.append('g');
    
    var projection = d3.geo.mercator()
            .scale(100000)
            .center([139.76,35.67])
//            .center(d3.geo.centroid(json))
            .translate([width / 2, height / 2]);
    var path = d3.geo.path().projection(projection);
    g.selectAll('path')
      .data(json.features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', function (d) {
        // 適当に色を塗るなど
        return 'none';
        //return 'rgba(128,128,128,0.15)';
       })
      .attr('stroke', 'black');
    
    railWayGeoJsons.forEach(function (gj) {
      var g1 = svg.append('g');
        console.log(gj.railWayData['dc:title']);
        console.log(gj.railWayData['odpt:lineCode']);
        g1.selectAll('path')
      .data([gj.geometry])
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', function (d) {
            // 適当に色を塗るなど
            return 'none';
        })
      .attr('stroke',lineColor[gj.railWayData['odpt:lineCode']])
      .attr('stroke-width', '4');
    });
    var svgData = d3.select('body').node().innerHTML;
    var renderer = ect({ root : './' });
    var data = { articleBody: svgData };

    return q.nfcall(fs.writeFile, '../html/out.html', renderer.render('template_0001.html',data), 'utf-8');
})
.then(function () {
    console.log('### 処理終了 ###');
})
.catch(function (err) {
    // エラー処理
    console.log('エラーが発生しました。' + err.toString());
});

;

// 東京MetroAPIの呼び出し
function callMetroAPI(url, apiKey) {
   
    var d = q.defer();
    
    var consumerKey = url.match(/\?/) ? '&acl:consumerKey=' + apiKey : '?acl:consumerKey=' + apiKey;
    https.get(url + consumerKey, function (res) {
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

// ローカルキャッシュ月のAPI呼び出し
function callMetroAPICached(url, apiKey) {
    var s = reg.exec(url);
    var dir = './data/' + s[1];
    var path = (dir + '/' + encodeURIComponent(s[2]) + '.json');
    console.log(path);
    // まずキャッシュファイルの返却を試みる
    return q.nfcall(fs.readFile, path, 'utf-8')
    // エラー発生時の処理
    .catch(function (err) {
        if (err.code === 'ENOENT') {
            // キャッシュファイルがない場合はAPIで取得
            return q.delay(100) // ディレイをかます
            .then(function () { return callMetroAPI(url, apiKey); })
            .then(function (json) {
                q.nfcall(fs.mkdir, dir)// ディレクトリを作る
                .then(q.nfbind(fs.writeFile, path, json, 'utf-8')// ファイルを書き込む
                , function (err)
                {
                    // ディレクトリ作成失敗
                    if (err.code === 'EEXIST') {
                        // ディレクトリがある場合はリカバリ
                        return q.nfcall(fs.writeFile, path, json, 'utf-8');
                    }
                    throw err;
                });
                return json;
            });
        };
        throw err;
    });

}