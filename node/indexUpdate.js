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

//process.setuid && process.setuid('sfpg');


var fs = require('fs');
var https = require('https');
var serializer = require('xmldom').XMLSerializer;
var q = require('q');
var jsdom = require('jsdom').jsdom;
var domtohtml = require('jsdom/lib/jsdom/browser/domtohtml').domToHtml;
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
    //d3.ns.prefix.sf = 'http://www.enoie.net/';
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
            stationGeoJsons[st['dc:title']] = { stationData: st, geometry: gj };
        });
    });
    
    // 
    return result;
})
// 東京との境界図,鉄道路線情報をロードする
.then(function (){
    return q.all([
        q.nfcall(fs.readFile , 'data/tokyo-to.json', 'utf-8'),
        q.nfcall(fs.readFile , 'data/railroad.geojson', 'utf-8'),
        q.nfcall(fs.readFile , 'data/station.geojson', 'utf-8')
    ]);
})
.spread(function (tokyoTo,railroad,station) {
    tokyoTo = JSON.parse(tokyoTo);
    railroad = JSON.parse(railroad);
    station = JSON.parse(station);
        
    railroad.features.forEach(function (d) {
        if (d.properties['開始'] == '麹町') {
            d.properties['開始'] = '麴町';
        }
        if (d.properties['終了'] == '麹町') {
            d.properties['終了'] = '麴町';
        }

        stations.forEach(function (s) {
            if (d.properties['開始'] == s['dc:title'] && (lineInfos[d.properties['N02_003']]['owl:sameAs'] == s['odpt:railway'])) {
                d.properties['odpt:fromStation'] = s['owl:sameAs'];;
            }
            if (d.properties['終了'] == s['dc:title'] && lineInfos[d.properties['N02_003']]['owl:sameAs'] == s['odpt:railway']) {
                d.properties['odpt:toStation'] = s['owl:sameAs'];
            }
        });
        if (d.properties['開始'] == '中野坂上') {
            d.properties['odpt:fromStation'] = 'odpt.Station:TokyoMetro.Marunouchi.NakanoSakaue';
        }
        if (d.properties['終了'] == '中野坂上') {
            d.properties['odpt:toStation'] = 'odpt.Station:TokyoMetro.Marunouchi.NakanoSakaue';
        }
    });
    
    station.features.forEach(function (s) {
      if (s.properties['N02_005'] == '麹町') {
        s.properties['N02_005'] = '麴町';
      }
      if (s.properties['N02_005'] == '中野坂上') {
        var ss = null;
        for (var i = 0, e = stations.length; i < e; ++i) {
          if (stations[i]['owl:sameAs'] == 'odpt.Station:TokyoMetro.Marunouchi.NakanoSakaue') {
            ss = stations[i];
            break;
          }
        }
        s.properties['station'] = ss;
        
      } else {
        for (var i = 0, e = stations.length; i < e; ++i) {
          var ss = stations[i];
          if (s.properties['N02_005'] == ss['dc:title'] && lineInfos[s.properties['N02_003']]['owl:sameAs'] == ss['odpt:railway']) {
            s.properties['station'] = ss;
            break;
          }
        }
      }
    });

    console.log('路線図');
    railways.forEach(function (railway) {
        // 路線図
        var rail = railway['rail'] = { "type": "FeatureCollection", "features": [] };
        rail.features = 
        railroad.features.filter(function (d) {
            return lineInfos[d.properties['N02_003']]['owl:sameAs'] == railway['owl:sameAs'];
        }).sort(function (a, b) {
            return a.properties['順序'] - b.properties['順序'];
        })
    });
    //    document = jsdom.jsdom(htmlFile);
    //    window = document.parentWindow;
    var width = 1920,
        height = 1080;
    var svg = d3.select('body').append('svg')
  //      .attr('xmlns:sf', 'http://www.enoie.net/')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('id', 'metroMap')
        .append('g').append('g');
    var projection = 
        d3.geo.mercator()
        .scale(200000)
        .center([139.845,35.65]);
    
    var path = d3.geo.path().projection(projection);
    
    // 東京都地図の表示
    svg.append('g')
    .attr('id', 'tokyoMap')
    .selectAll('path')
    .data(tokyoTo.features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('fill', function (d) {
        return 'none';
      })
    .attr('stroke', 'black');

    // 路線図の表示
    var railroadMap = svg.append('g')
    .attr('id', 'RailroadMap');
    console.log(d3.ns.qualify('data-class'));
    railways.forEach(function (r) {
        var id = r['owl:sameAs'].replace(/[\:\.]/ig, '-');
        var t = railroadMap.append('g')
        .attr('id', id)
        .attr('data-title', r['dc:title'])
        .attr('data-direction', railwayInfos[r['owl:sameAs']].direction)
        .selectAll('path')
        .data(r.rail.features)
        .enter()
        .append('path')
        .attr('id', function (d) { return id + '-' + d.properties['順序']; })
        .attr('data-class', 'railroad')
        .attr('data-no', function (d) { return d.properties['順序']; })
        .attr('data-from', function (d) { return d.properties['odpt:fromStation']; })
        .attr('data-to', function (d) { return d.properties['odpt:toStation']; })
        .attr('data-flg', function (d) { return d.properties['フラグ']; })
        .attr('data-reverse', function (d) { return d.properties['reverse'] == '1'?1:0; })
        .attr('data-railway', r['owl:sameAs'])
        .attr('d', function (d) { return path(d.geometry);})
        .attr('fill', 'none')
        .attr('stroke', function (d) { return lineInfos[d.properties['N02_003']]['color']; })
        .attr('stroke-width', '5')
        .attr('stroke-linecap', 'round');

    });

    // 駅位置の表示
    svg.append('g')
    .attr('id', 'stationHome')
    .selectAll('path')
    .data(station.features)
    .enter()
    .append('g')
    .attr('data-title', function (d) { return d.properties['N02_005']; })
    .attr('data-railway', function (d) { return d.properties['station']['odpt:railway']; })
    .attr('data-stationId', function (d) {
        return d.properties['station']['owl:sameAs'];
      })
    .append('path')
    .attr('d', function (d) {
        return path(d.geometry);
      })
    .classed('station-marker', true);
    //.attr('fill', 'none')
    //.attr('stroke', 'white')
    //.attr('stroke-width', '4')
    //.attr('stroke-linecap', 'round');

    svg.append('g')
    .attr('id', 'train');

    var gst = svg.append('g');
    for (var s in stationGeoJsons) {
        var gj = stationGeoJsons[s];
        //console.log(gj.stationData['dc:title']);
        var ppos = projection(gj.geometry.coordinates);
        var px = ppos[0];
        var py = ppos[1];
        //gst.append('circle')
        //.attr('cx', px)
        //.attr('cy', py)
        //.attr('r' , '2')
        //.attr('fill', 'white');
        
        gst.append('text')
        .attr('x', px)
        .attr('y', py)
        .style('font-size', '4px')
        .style('text-anchor', 'left')
        .text(s);
    }
    
    //
   
     function serializeXML(node, output) {
      var nodeType = node.nodeType;
      if (nodeType == 3)
      {
 // TEXT nodes.
        // Replace special XML characters with their entities.
        output.push(node.textContent.replace(/&/, '&amp;').replace(/</, '&lt;').replace('>', '&gt;'));
      } else if (nodeType == 1)
      {
 // ELEMENT nodes.
        // Serialize Element nodes.
        var prefix = '';
        if (node.namespaceURI == 'http://www.enoie.net/') {
          prefix = 'sf:';
        }
        output.push('<' ,  prefix , node.tagName.toLowerCase());
        if (node.hasAttributes()) {
          var attrMap = node.attributes;
          for (var i = 0, len = attrMap.length; i < len; ++i) {
            var attrNode = attrMap.item(i);
            var attrPrefix = '';
            if (attrNode.namespaceURI == 'http://www.enoie.net/') {
              attrPrefix = 'sf:';
            }
            var name = '';
            if (attrNode.name == 'sf') {
              name = 'xmlns:sf';
            } else {
              name = attrNode.name;
            }
            output.push(' ' , attrPrefix , name , '=\"' , attrNode.value , '\"');
          }
        }
        if (node.hasChildNodes()) {
          output.push('>');
          var childNodes = node.childNodes;
          for (var i = 0, len = childNodes.length; i < len; ++i) {
            serializeXML(childNodes.item(i), output);
          }
          output.push('</' , prefix , node.tagName.toLowerCase() , '>');
        } else {
          output.push('/>');
        }
      } else if (nodeType == 8) {
        // TODO(codedread): Replace special characters with XML entities?
        output.push('<!--' , node.nodeValue , '-->');
      } else {
        // TODO: Handle CDATA nodes.
        // TODO: Handle ENTITY nodes.
        // TODO: Handle DOCUMENT nodes.
        throw 'Error serializing XML. Unhandled node of type: ' + nodeType;
      }
     return output;
    }

    var svgData = d3.select('body').node().innerHTML;
    
    //var svgData = s.serializeToString(d3.select('body').node());//domtohtml(d3.select('body').node());
    //var t = [];
    //serializeXML(d3.select('body > svg').node(), t);
    //var svgData = t.join('');
    //console.log(svgData);
    var renderer = ect({ root : './' });
    var data = {
        title : 'Metro Info.',
        description: '東京メトロオープンデータ',
        keywords : '東京メトロオープンデータ q.js d3.js',
        author:'sfpgmr',
        articleBody: svgData
    };
    
    var dataManual = {
      title : 'Metro Info. マニュアル',
      description: '東京メトロオープンデータ',
      keywords : '東京メトロオープンデータ q.js d3.js',
      author: 'sfpgmr'
    };
    
    return q.all([
      writeFile(outputDir + '/index.html', renderer.render('template_0002.html', data), 'utf-8')
      .then(compressGzip.bind(null, outputDir + '/index.html')),
      writeFile(outputDir + '/manual.html', renderer.render('template_0003.html', dataManual), 'utf-8')
      .then(compressGzip.bind(null, outputDir + '/manual.html'))
    ]);
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