
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
var stationGeoJsons = [];
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
    // 路線描画 geoJsonデータの取得
    var railWays = d[0];
    var result = q(0);
    railWays.forEach(function (railWay) {
        result = result
        .then(function () { return callMetroAPICached(railWay['ug:region'], apiKey); })
        .then(function (json) {
            railWayGeoJsons.push({ title: railWay['dc:title'],railWayData:railWay, geometry: JSON.parse(json) });
        });
    });
    // 駅位置データ取得
    var stations = d[1];
    stations.forEach(function (st) {
        result = result
        .then(q.fbind(callMetroAPICached, st['ug:region'], apiKey))
        .then(function (json) {
            stationGeoJsons.push({ title: st['dc:title'], stationData: st, geometry: JSON.parse(json) });
        });
    });
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
        .attr('id', 'metroMap');
    
    var projection = d3.geo.mercator()
            .scale(150000)
            .center([139.76,35.67]);
//            .center(d3.geo.centroid(json))
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
    .append('path')
    .attr('d', function (d) {
        return path(d.geometry);
    })
    .attr('fill', 'none')
    .attr('stroke', function (d) { return lineColor[d.railWayData['odpt:lineCode']]; })
    .attr('stroke-width', '5');

    
    // 駅位置の表示
    stationGeoJsons.forEach(function (gj) {
        
        //console.log(gj.stationData['dc:title']);
        var ppos = projection(gj.geometry.coordinates);
        var px = ppos[0];
        var py = ppos[1];
        svg.append('circle')
        .attr('cx', px)
        .attr('cy', py)
        .attr('r' , '2')
        .attr('fill', 'white');

        svg.append('text')
        .attr('x',px)
        .attr('y', py)
        .style('font-size', '4px')
        .style('text-anchor', 'left')
        .text(gj.stationData['dc:title']);
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

// ローカルキャッシュ付きのAPI呼び出し
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