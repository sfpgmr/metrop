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
require(["q","jquery","bootstrap","d3"],
function (q, jq) {
  var svg = d3.select('#metroMap');
  var rect = svg.node().getBBox();
  var rectC = svg.node().getBoundingClientRect();
  console.log(rect);
  console.log(rectC);
  var baseWidth = rect.width;
  var baseHeight = rect.height;

  svg
  .attr('viewBox', '0 0 ' + (rectC.width/2) + ' ' + (rectC.height/2) )
  .attr('preserveAspectRatio', 'xMinYMin slice');
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
