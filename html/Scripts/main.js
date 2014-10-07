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
    var svg = d3.select('#metroMap')
    var rect = svg.node().getBBox();
    var rectC = svg.node().getBoundingClientRect();
    var sx = (rectC.width - rect.width) / 2 - rect.x;
    var sy = (rectC.height - rect.height) / 2 - rect.y;
    svg
    .attr('viewBox', ''+ -sx +  ' ' + -sy +' '  + (rectC.width) + ' ' + (rectC.height))
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

    //var rect = svg.node().getBBox();
    //var rectC = svg.node().getBoundingClientRect();
    console.log(rect);
    console.log(rectC);
    //var baseWidth = rect.width;
    //var baseHeight = rect.height;
    //var sx = 0;
    //var sy = 0;
    //var zoomBase = 1.0 / 4.0;
    //var scale = 1.0;
    //var zoom = scale * zoomBase;
    //var sw = rectC.width * zoom;
    //var sh = rectC.height * zoom;

    //svg
    //.attr('viewBox', '0 0 ' + sw + ' ' + sh)
    //.attr('preserveAspectRatio', 'xMinYMin slice');

    //var drag = d3.behavior.drag().on("drag", function (d) {
    //  sx -= d3.event.dx * zoom;
    //  sy -= d3.event.dy * zoom;
    //  return svg.attr('viewBox', '' + sx + ' ' + sy + ' ' + sw + ' ' + sh);
    //  //    return svg.attr('translate', "" + sx + " " + sy);
    //});
    //svg.call(drag);

    //zoom = d3.behavior.zoom().on("zoom", function (d) {
    //  console.log(d3.event.scale);
    //  scale = d3.event.scale;
    //  zoom = zoomBase * scale;
    //  bsw = sw;
    //  bsh = sh;
    //  sw = rectC.width * zoom;
    //  sh = rectC.height * zoom;

    //  sx += (bsw - sw)/2;
    //  sy += (bsh - sh)/2;

    //  return svg.attr("viewBox", "" + sx + " " + sy + " " + sw + " " + sh);
    //});

    //svg.call(zoom);

  })();
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
