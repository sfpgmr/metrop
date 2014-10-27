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

requirejs.config({
  baseUrl: './Scripts/',
  paths: {
    "q": "http://cdnjs.cloudflare.com/ajax/libs/q.js/1.0.1/q",
    "jquery": "http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min",
    "bootstrap": "http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min",
    "d3": "http://cdnjs.cloudflare.com/ajax/libs/d3/3.4.11/d3.min"
  },
  shim: {
    'bootstrap': {
      deps: ['jquery']
    }
  }

});

// 方面データ
//路線名	方面1	方面2
var directionInfos = {
    'odpt.Railway:TokyoMetro.MarunouchiBranch' : {'odpt.RailDirection:TokyoMetro.Honancho' : false,'odpt.RailDirection:TokyoMetro.NakanoSakaue':true },
    'odpt.Railway:TokyoMetro.Marunouchi' :{ 'odpt.RailDirection:TokyoMetro.Ikebukuro' : true,'odpt.RailDirection:TokyoMetro.Ogikubo': false },
    'odpt.Railway:TokyoMetro.Ginza' : {'odpt.RailDirection:TokyoMetro.Asakusa':true,'odpt.RailDirection:TokyoMetro.Shibuya':false },
    'odpt.Railway:TokyoMetro.Hanzomon' : {'odpt.RailDirection:TokyoMetro.Shibuya':false,'odpt.RailDirection:TokyoMetro.Oshiage':true },
    'odpt.Railway:TokyoMetro.Tozai': {'odpt.RailDirection:TokyoMetro.Nakano':true,'odpt.RailDirection:TokyoMetro.NishiFunabashi':false},
    'odpt.Railway:TokyoMetro.Hibiya' : { 'odpt.RailDirection:TokyoMetro.KitaSenju':true,'odpt.RailDirection:TokyoMetro.NakaMeguro':false },
    'odpt.Railway:TokyoMetro.Namboku':{ 'odpt.RailDirection:TokyoMetro.Meguro' : true,'odpt.RailDirection:TokyoMetro.AkabaneIwabuchi':false },
    'odpt.Railway:TokyoMetro.Fukutoshin':{ 'odpt.RailDirection:TokyoMetro.Wakoshi':true,	'odpt.RailDirection:TokyoMetro.Shibuya': false },
    'odpt.Railway:TokyoMetro.Yurakucho' :{ 'odpt.RailDirection:TokyoMetro.Wakoshi':true,	'odpt.RailDirection:TokyoMetro.ShinKiba':false },
    'odpt.Railway:TokyoMetro.Chiyoda' :{'odpt.RailDirection:TokyoMetro.KitaAyase':false,	'odpt.RailDirection:TokyoMetro.Ayase':true,'odpt.RailDirection:TokyoMetro.YoyogiUehara':false,'odpt.RailDirection:TokyoMetro.Ayase':true}
};


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

require(["q", "jquery", "bootstrap", "d3"],
function (q, jq) {
  var trainsBackup = null;
  (function (q, jq) {
    var projection = d3.geo.mercator()
    .scale(200000)
    .center([139.845, 35.65]);
    var path = d3.geo.path().projection(projection);
    var jsonBase = '/data';
    var json = q.nfbind(d3.json);
    var jsons = [
      json(jsonBase + '/railways.json')
      , json(jsonBase + '/stations.json')
      , json(jsonBase + '/railroad.json')
      , json(jsonBase + '/station.json')
    ];
    q.all(jsons)
    .spread(function (railways, stations,railroad,station) {

      // 各データ間の関連付け。
      stations.forEach(function(s){
        railways.forEach(function (railway) {
          if(s['odpt:railway'] == railway['owl:sameAs']){
            s['odpt:railway']  = railway;
          }
          s['odpt:connectingRailway'].forEach(
            function(cr,i){
              if(cr == railway['owl:sameAs']){
              s['odpt:connectingRailway'][i] = railway;
              }
          });
          railway['odpt:stationOrder'].forEach(
            function(d,i){
              if(d['odpt:s'] == s['owl:sameAs']){
                d['odpt:s'] = s;
              }
            }
          );
          railway['odpt:travelTime'].forEach(
            function(d,i){
              if(d['odpt:fromStation'] == s['owl:sameAs']){
                d['odpt:fromStation'] = s;
              }
              if(d['odpt:toStation'] == s['owl:sameAs']){
                d['odpt:toStation'] = s;
              }
            }
          );

        });
      });

      railroad.features.forEach(
      function(d){
        if (d.properties['開始'] == '麹町') {
            d.properties['開始'] = '麴町';
        }
        if (d.properties['終了'] == '麹町') {
            d.properties['終了'] = '麴町';
        }

        stations.forEach(function (s) {
            if (d.properties['開始'] == s['dc:title'] && (lineInfos[d.properties['N02_003']]['owl:sameAs'] == s['odpt:railway'])) {
                d.properties['odpt:fromStation'] = s;
            }
            if (d.properties['終了'] == s['dc:title'] && lineInfos[d.properties['N02_003']]['owl:sameAs'] == s['odpt:railway']) {
                d.properties['odpt:toStation'] = s;
            }
            if (d.properties['開始'] == '中野坂上' && s['dc:title'] == '中野坂上') {
                d.properties['odpt:fromStation'] = s;
            }
            if (d.properties['終了'] == '中野坂上' && s['dc:title'] == '中野坂上') {
                d.properties['odpt:toStation'] = s;
            }

        });
      });

      var svg = d3.select('#metroMap');
      var rect = svg.node().getBBox();
      var rectC = svg.node().getBoundingClientRect();
      var sx = (rectC.width - rect.width) / 2 - rect.x;
      var sy = (rectC.height - rect.height) / 2 - rect.y;
      // 位置補正 (場当たり的な対応)
      svg
      .attr('viewBox', '' + -sx + ' ' + -sy + ' ' + (rectC.width) + ' ' + (rectC.height))
      .attr('preserveAspectRatio', 'xMinYMin slice');
      // 拡大・縮小・移動処理の実装
      var zoom = d3.behavior.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);
      var g = svg.select('g');
      svg.append('rect')
      .attr("class", 'overlay')
      .attr("width", rect.width)
      .attr("height", rect.height);
      svg
      .call(zoom);
      var g1 = g.select('g');
      g1
      .attr('x', sx)
      .attr('y', sy);
      function zoomed() {
        g1.attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
      }

      (function repeat(){
        var tg = g1.select('g#train');
        json('/data/train.json')
        .then(function (trains) {
          trains.forEach(function(t){
            stations.forEach(function (s) {
              if(t['odpt:fromStation'] == s['owl:sameAs']){
                t['odpt:fromStation'] = s;
              }
              if(t['odpt:toStation'] == s['owl:sameAs']){
                t['odpt:toStation'] = s;
              }

              if(t['odpt:startingStation'] == s['owl:sameAs']){
                t['odpt:startingStation'] = s;
              }

              if(t['odpt:terminalStation'] == s['owl:sameAs']){
                t['odpt:terminalStation'] = s;
              }
            });
          });
        
          // 走行中の列車の位置を表示
          var railRoadMap = d3.selectAll('*[data-class="railroad"]')[0];
          var trainsVm = trains.map(function(d){
              var interval = true;
              var reverse = false;
              var transition = null;
              if(!d['odpt:toStation']){
                interval = false;
                d['odpt:toStation'] = d['odpt:fromStation'];
              }
              if(trainsBackup){
                for(var i = 0,e = trainsBackup.length;i < e;++i){
                  var tb = trainsBackup[i];
                  if(tb.trainNumber == d['odpt:trainNumber'] && tb.railway == d['odpt:railway']){
                    if(((tb.from['owl:sameAs'] != d['odpt:fromStation']['owl:sameAs'])) || ((tb.to['owl:sameAs'] != d['odpt:toStation']['owl:sameAs']))){
                      transition = trainsBackup[i];
                      break;
                    }
                  }
                }
              }

              var cr = null;
              for(var i = 0,e = railRoadMap.length;i < e;++i){
                var r = d3.select(railRoadMap[i]);
                var rw = d['odpt:railway'];
                if(r.attr('data-from') == d['odpt:fromStation']['owl:sameAs'] && r.attr('data-to')  == d['odpt:toStation']['owl:sameAs']){
                  cr = r;
                  break;
                } else if(r.attr('data-from') == d['odpt:toStation']['owl:sameAs'] && r.attr('data-to')  == d['odpt:fromStation']['owl:sameAs']){
                  cr = r;
//                  reverse = true;
                  break;
                }
              }
              if(!cr){
                console.log( d['odpt:fromStation']['owl:sameAs'] + ':' + d['odpt:toStation']['owl:sameAs']);
                console.log(cr + ' @ ' + rev);
              }
 
              reverse = directionInfos[d['odpt:railway']][d['odpt:railDirection']];

              //if (cr.attr('data-reverse') == 1) {
              //  reverse = !reverse;
              //};

              //if(!interval && transition){
              //  reverse = transition.reverse;
              //}
              var l = cr.node().getTotalLength();
              var pt = cr.node().getPointAtLength(l/2);
              var result = {
                'data' : d,
                'from' : d['odpt:fromStation'],
                'to' : d['odpt:toStation'],
                'railway':d['odpt:railway'],
                'trainNumber' : d['odpt:trainNumber'],
                'totalLength' : l,
                'center': pt,
                'transition' : transition,
                'reverse' : reverse,
                'interval' : interval,
                'path' : cr
              };
              return result;
          });

          var trainsSel = tg.selectAll('g');
          function drawTrains(trainsSelection)
          {
            var data = trainsSelection
              .data(trainsVm
              //.filter(function(d){
              //  return d.data['odpt:railway'] == 'odpt.Railway:TokyoMetro.Ginza';
              //})
                ,function (d) {
                  return d.trainNumber;// keyは列車番号
                });

            data
            .filter(function (d) {
              return (!(!d.transition)); 
            })
            .transition()
            .delay(function (d, i) { return i * 30; })
            .duration(1500)
            .ease('linear')
            .attrTween('transform',function(data,index){
              return (function(){
                var d = data;
                var i = index;
                return function(t){
                  var pt;
                  var tls = d.transition;
                  var tl = tls.totalLength/2;
                  var reverse = tls.reverse ;//tls.interval?tls.reverse:d.reverse;
                  if (parseInt(tls.path.attr('data-reverse'),10) == 1) { reverse = !reverse;}
 
                  if(reverse){
                    pt = tls.path.node().getPointAtLength(tl - tl * t);
                  } else {
                    pt = tls.path.node().getPointAtLength(tl * t + tl);
                  }
                  return 'translate(' + [pt.x,pt.y]+ ')';
                };
              })();
            })
            .transition()
            .duration(1500)
            .ease('linear')
            .attrTween('transform',function(data,index){
              return (function () {
                var d = data;
                var i = index;
                return function(t){
                  var pt;
                  var tl = d.totalLength/2;
                  var reverse = d.reverse;//d.interval?d.reverse:d.transition.reverse;
                  if (parseInt(d.path.attr('data-reverse'),10) == 1) { reverse = !reverse;}
                  if(reverse){
                    pt = d.path.node().getPointAtLength(d.totalLength - tl * t);
                  } else {
                    pt = d.path.node().getPointAtLength(tl * t);
                  }
                  return 'translate(' + [pt.x,pt.y]+ ')';
                };
              })();
            });

            var trainMarkers = data.enter()
            .append('g')
            .attr('id', function (d) { return d.trainNumber; })
            .attr('transform',function(d){
              var pt;
              var tl = d.totalLength/2;
              pt = d.path.node().getPointAtLength(tl);
             return 'translate(' + [pt.x,pt.y]+ ')';
            });

            trainMarkers
            .append('circle')
            .attr('r' , '2')
            .attr('fill', function(d){
              var reverse = d.reverse;
              if(reverse){
                return 'blue';
              } 
              return 'orange';
            });

            trainMarkers.append('text')
            .style('font-size', '4px')
            .style('text-anchor', 'left')
            .style('fill','green')
            .text(function (d) {
              return d.trainNumber;
            });

            data.exit().remove();
            trainsBackup = trainsVm;
          }
          drawTrains(trainsSel);
        });
        window.setTimeout(repeat,30000);
      })();

      // テスト用
      //function moveTest(){
      //  railways.forEach(function(d){
      //    var marker = g1.select('g#train').append('circle').attr('r' , '2').attr('fill','red');
      //    g1.selectAll('g[id = "' + d['owl:sameAs'] + '"] > path')[0].forEach
      //      (function(n){
      //        marker = marker.transition().duration(500)
      //        .attrTween('transform',function(){
      //              return function(t){
      //                var pt;

      //                var tl = n.getTotalLength();
      //                if(n.dataset['reverse'] == 1){
      //                  pt = n.getPointAtLength(tl - tl * t);

      //                } else {
      //                  pt = n.getPointAtLength(tl * t);
      //                }
      //                return 'translate(' + [pt.x,pt.y]+ ')';
      //              };
      //            });
      //    });

      //  });

      //}
      //moveTest();
    })
    .catch(function(err){
      alert('エラーが発生しました。' + err);
    });
  })(q,jq);
}
 ,
// Error //
function (err) {
  var elm = document.createElement('div');
  document.body.appendChild(elm);
  elm.classList.add('alert');
  elm.classList.add('alert-danger');
  elm.innerText = "エラー:" + err.description();
}
);
