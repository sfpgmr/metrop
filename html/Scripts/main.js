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
    },
    'Detector': {
      deps: ['Three']
    }
  }

});

require(["q", "jquery", "bootstrap", "d3"],
function (q, jq) {
  (function (q, jq) {
    var jsonBase = './data/datapoints';
    var json = q.nfbind(d3.json);
    var jsons = [
      json(jsonBase + '/Railway.json')
      , json(jsonBase + '/Station.json')];
    q.all(jsons)
    .spread(function (railways, stations) {
      console.log(railways);
      var svg = d3.select('#metroMap')
      var rect = svg.node().getBBox();
      var rectC = svg.node().getBoundingClientRect();
      var sx = (rectC.width - rect.width) / 2 - rect.x;
      var sy = (rectC.height - rect.height) / 2 - rect.y;
      svg
      .attr('viewBox', '' + -sx + ' ' + -sy + ' ' + (rectC.width) + ' ' + (rectC.height))
      .attr('preserveAspectRatio', 'xMinYMin slice');
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
        //     d3.event.stopPropagation();
        //      console.log(d3.event.translate);
      }

      function stopped() {
        if (d3.event.defaultPrevented) d3.event.stopPropagation();
      }
    });
  })(q,jq);
}
 ,
// Error //
function (err) {
  var elm = document.getElementById('#loading');
  if (!elm) {
    elm = document.createElement('div');
    document.body.appendChild(elm);
  }

  elm.classList.add('alert');
  elm.classList.add('alert-danger');
  elm.innerText = "エラー:" + err.description();
}
);
