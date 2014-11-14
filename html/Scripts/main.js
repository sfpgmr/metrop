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
 //   "knockout" : "http://cdnjs.cloudflare.com/ajax/libs/knockout/3.2.0/knockout-min",
    "d3": "http://cdnjs.cloudflare.com/ajax/libs/d3/3.4.11/d3.min",
    "domReady" : "http://cdnjs.cloudflare.com/ajax/libs/require-domReady/2.0.1/domReady",
    "bootstrap": "http://maxcdn.bootstrapcdn.com/bootstrap/3.3.0/js/bootstrap.min",
    "bootstrap-submenu" : "bootstrap-submenu.min"
  },
  shim: {
    'bootstrap': {
      deps: ['jquery']
    },
    'bootstrap-submenu':{
      deps: ['bootstrap']
    }
  }

});

// 方面データ
//路線名	方面1	方面2
var lineInfos = {
    'odpt.Railway:TokyoMetro.MarunouchiBranch' : {'title':'丸ノ内線分岐線',color: '#e60012','odpt.RailDirection:TokyoMetro.Honancho' : false,'odpt.RailDirection:TokyoMetro.NakanoSakaue':true },
    'odpt.Railway:TokyoMetro.Marunouchi' :{'title':'丸ノ内線',color : '#e60012', 'odpt.RailDirection:TokyoMetro.Ikebukuro' : true,'odpt.RailDirection:TokyoMetro.Ogikubo': false,'odpt.RailDirection:TokyoMetro.NakanoSakaue':true },
    'odpt.Railway:TokyoMetro.Ginza' : {'title':'銀座線',color:'#f39700','odpt.RailDirection:TokyoMetro.Asakusa':true,'odpt.RailDirection:TokyoMetro.Shibuya':false },
    'odpt.Railway:TokyoMetro.Hanzomon' : {'title':'半蔵門線',color: '#9b7cb6','odpt.RailDirection:TokyoMetro.Shibuya':false,'odpt.RailDirection:TokyoMetro.Oshiage':true },
    'odpt.Railway:TokyoMetro.Tozai': {'title':'東西線',color:'#00a7db','odpt.RailDirection:TokyoMetro.Nakano':true,'odpt.RailDirection:TokyoMetro.NishiFunabashi':false},
    'odpt.Railway:TokyoMetro.Hibiya' : {'title':'日比谷線', color:'#9caeb7', 'odpt.RailDirection:TokyoMetro.KitaSenju':true,'odpt.RailDirection:TokyoMetro.NakaMeguro':false },
    'odpt.Railway:TokyoMetro.Namboku':{ 'title':'南北線',color : '#00ada9','odpt.RailDirection:TokyoMetro.Meguro' : true,'odpt.RailDirection:TokyoMetro.AkabaneIwabuchi':false,'odpt.RailDirection:TokyoMetro.ShirokaneTakanawa':false },
    'odpt.Railway:TokyoMetro.Fukutoshin':{'title':'副都心線',color : '#bb641d', 'odpt.RailDirection:TokyoMetro.Wakoshi':true,'odpt.RailDirection:TokyoMetro.KotakeMukaihara':true,	'odpt.RailDirection:TokyoMetro.Shibuya': false },
    'odpt.Railway:TokyoMetro.Yurakucho' :{ 'title':'有楽町線',color : '#d7c447','odpt.RailDirection:TokyoMetro.Wakoshi':true,	'odpt.RailDirection:TokyoMetro.KotakeMukaihara':true,'odpt.RailDirection:TokyoMetro.ShinKiba':false },
    'odpt.Railway:TokyoMetro.Chiyoda' :{'title':'千代田線',color : '#009944','odpt.RailDirection:TokyoMetro.KitaAyase':false,	'odpt.RailDirection:TokyoMetro.Ayase':true,'odpt.RailDirection:TokyoMetro.YoyogiUehara':false,'odpt.RailDirection:TokyoMetro.Ayase':true}
};


// 各線の色情報
var lineInfos2 = {
    '4号線丸ノ内線分岐線' : { color: '#e60012', 'owl:sameAs': 'odpt.Railway:TokyoMetro.MarunouchiBranch',direction:'odpt.RailDirection:TokyoMetro.NakanoSakaue' },
    '4号線丸ノ内線' : {color : '#e60012', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Marunouchi', direction: 'odpt.RailDirection:TokyoMetro.Ikebukuro'},
    '3号線銀座線' : {color:'#f39700', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Ginza', direction: 'odpt.RailDirection:TokyoMetro.Asakusa'},
    '11号線半蔵門線' :{color: '#9b7cb6', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Hanzomon', direction: 'odpt.RailDirection:TokyoMetro.Oshiage'},
    '5号線東西線' : {color:'#00a7db', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Tozai',direction: 'odpt.RailDirection:TokyoMetro.NishiFunabashi' },
    '2号線日比谷線' : { color:'#9caeb7', 'owl:sameAs': 'odpt.Railway:TokyoMetro.Hibiya' ,direction: 'odpt.RailDirection:TokyoMetro.KitaSenju'},
    '7号線南北線' : { color : '#00ada9','owl:sameAs': 'odpt.Railway:TokyoMetro.Namboku', direction: 'odpt.RailDirection:TokyoMetro.AkabaneIwabuchi'},
    '13号線副都心線' : { color : '#bb641d','owl:sameAs': 'odpt.Railway:TokyoMetro.Fukutoshin', direction: 'odpt.RailDirection:TokyoMetro.Shibuya'},
    '8号線有楽町線' : { color : '#d7c447','owl:sameAs': 'odpt.Railway:TokyoMetro.Yurakucho', direction: 'odpt.RailDirection:TokyoMetro.ShinKiba'},
    '9号線千代田線' : { color : '#009944','owl:sameAs': 'odpt.Railway:TokyoMetro.Chiyoda', direction: 'odpt.RailDirection:TokyoMetro.Ayase'}
};

var trainOwners = {
 'odpt.TrainOwner:TokyoMetro' : '東京メトロ' ,
 'odpt.TrainOwner:Seibu' : '西武鉄道' ,
 'odpt.TrainOwner:SaitamaRailway' : '埼玉高速鉄道' ,
 'odpt.TrainOwner:Tobu' : '東武鉄道' ,
 'odpt.TrainOwner:ToyoRapidRailway' : '東葉高速鉄道' ,
 'odpt.TrainOwner:Toei' : '都営地下鉄' ,
 'odpt.TrainOwner:Tokyu' : '東急電鉄' ,
 'odpt.TrainOwner:JR-East' : 'JR東日本' ,
 'odpt.TrainOwner:Odakyu' : '小田急電鉄' 
 };

 var trainTypes = {
   'odpt.TrainType:TokyoMetro.Unknown' : { title : '不明' , color:'gray'},
 'odpt.TrainType:TokyoMetro.Local' : { title:'各停',color:'black' },
 'odpt.TrainType:TokyoMetro.Express' : {title:'急行',color:'blue'} ,
 'odpt.TrainType:TokyoMetro.Rapid' : {title:'快速' ,color:'green'},
 'odpt.TrainType:TokyoMetro.SemiExpress': { title: '準急', color: 'green' } ,
 'odpt.TrainType:TokyoMetro.TamaExpress': { title: '多摩急行', color: 'blue' } ,
 'odpt.TrainType:TokyoMetro.HolidayExpress' :{title: '土休急行' , color:'blue'},
 'odpt.TrainType:TokyoMetro.CommuterSemiExpress': { title: '通勤準急', color: 'green' } ,
 'odpt.TrainType:TokyoMetro.Extra' : { title:'臨時' ,color:'red'},
 'odpt.TrainType:TokyoMetro.RomanceCar' : {title:'特急ロマンスカー' ,color:'red'},
 'odpt.TrainType:TokyoMetro.RapidExpress' : {title:'快速急行' ,color:'red'},
 'odpt.TrainType:TokyoMetro.CommuterExpress' : {title:'通勤急行' ,color:'red'},
 'odpt.TrainType:TokyoMetro.LimitedExpress' : {title:'特急' ,color:'red'},
 'odpt.TrainType:TokyoMetro.CommuterLimitedExpress' : {title:'通勤特急' ,color:'red'},
 'odpt.TrainType:TokyoMetro.CommuterRapid' : {title:'通勤快速' ,color:'blue'},
 'odpt.TrainType:TokyoMetro.ToyoRapid': { title: '東葉快速', color: 'blue' }
 };

var railDirections = {
 'odpt.RailDirection:TokyoMetro.Asakusa' : '浅草方面' ,
 'odpt.RailDirection:TokyoMetro.Ogikubo' : '荻窪方面' ,
 'odpt.RailDirection:TokyoMetro.Ikebukuro' : '池袋方面' ,
 'odpt.RailDirection:TokyoMetro.Honancho' : '方南町方面' ,
 'odpt.RailDirection:TokyoMetro.NakanoSakaue' : '中野坂上方面' ,
 'odpt.RailDirection:TokyoMetro.NakaMeguro' : '中目黒方面' ,
 'odpt.RailDirection:TokyoMetro.KitaSenju' : '北千住方面' ,
 'odpt.RailDirection:TokyoMetro.NishiFunabashi' : '西船橋方面' ,
 'odpt.RailDirection:TokyoMetro.Nakano' : '中野方面' ,
 'odpt.RailDirection:TokyoMetro.YoyogiUehara' : '代々木上原方面' ,
 'odpt.RailDirection:TokyoMetro.Ayase' : '綾瀬方面' ,
 'odpt.RailDirection:TokyoMetro.KitaAyase' : '北綾瀬方面' ,
 'odpt.RailDirection:TokyoMetro.ShinKiba' : '新木場方面' ,
 'odpt.RailDirection:TokyoMetro.Ikebukuro' : '池袋方面' ,
 'odpt.RailDirection:TokyoMetro.Oshiage' : '押上方面' ,
 'odpt.RailDirection:TokyoMetro.Shibuya' : '渋谷方面' ,
 'odpt.RailDirection:TokyoMetro.AkabaneIwabuchi' : '赤羽岩淵方面' ,
 'odpt.RailDirection:TokyoMetro.Meguro' : '目黒方面' ,
 'odpt.RailDirection:TokyoMetro.ShirokaneTakanawa' : '白金高輪方面' ,
 'odpt.RailDirection:TokyoMetro.Wakoshi' : '和光市方面' ,
 'odpt.RailDirection:TokyoMetro.KotakeMukaihara' : '小竹向原方面' 
 }

 var otherStations = {
 'odpt.Station:JR-East.Joban.Abiko' : '我孫子' ,
 'odpt.Station:JR-East.Joban.Toride' : '取手' ,
 'odpt.Station:JR-East.Joban.Kashiwa' : '柏' ,
 'odpt.Station:JR-East.Joban.Matsudo' : '松戸' ,
 'odpt.Station:JR-East.Chuo.Mitaka' : '三鷹' ,
 'odpt.Station:JR-East.ChuoChikatetsuTozai.Tsudanuma' : '津田沼' ,
 'odpt.Station:Toei.Mita.Mita' : '三田' ,
 'odpt.Station:Toei.Mita.Shibakoen' : '芝公園' ,
 'odpt.Station:Toei.Mita.Onarimon' : '御成門' ,
 'odpt.Station:Toei.Mita.Uchisaiwaicho' : '内幸町' ,
 'odpt.Station:Toei.Mita.Hibiya' : '日比谷' ,
 'odpt.Station:Toei.Mita.Otemachi' : '大手町' ,
 'odpt.Station:Toei.Mita.Jimbocho' : '神保町' ,
 'odpt.Station:Toei.Mita.Suidobashi' : '水道橋' ,
 'odpt.Station:Toei.Mita.Kasuga' : '春日' ,
 'odpt.Station:Toei.Mita.Hakusan' : '白山' ,
 'odpt.Station:Toei.Mita.Sengoku' : '千石' ,
 'odpt.Station:Toei.Mita.Sugamo' : '巣鴨' ,
 'odpt.Station:Toei.Mita.NishiSugamo' : '西巣鴨' ,
 'odpt.Station:Toei.Mita.ShinItabashi' : '新板橋' ,
 'odpt.Station:Toei.Mita.Itabashikuyakushomae' : '板橋区役所前' ,
 'odpt.Station:Toei.Mita.Itabashihoncho' : '板橋本町' ,
 'odpt.Station:Toei.Mita.Motohasunuma' : '本蓮沼' ,
 'odpt.Station:Toei.Mita.ShimuraSanchome' : '志村坂上' ,
 'odpt.Station:Toei.Mita.Hasune' : '蓮根' ,
 'odpt.Station:Toei.Mita.Nishidai' : '西台' ,
 'odpt.Station:Toei.Mita.Takashimadaira' : '高島平' ,
 'odpt.Station:Toei.Mita.ShinTakashimadaira' : '新高島平' ,
 'odpt.Station:Toei.Mita.NishiTakashimadaira' : '西高島平' ,
 'odpt.Station:SaitamaRailway.SaitamaRailway.UrawaMisono' : '浦和美園' ,
 'odpt.Station:SaitamaRailway.SaitamaRailway.Hatogaya' : '鳩ヶ谷' ,
 'odpt.Station:ToyoRapidRailway.ToyoRapid.ToyoKatsutadai' : '東葉勝田台' ,
 'odpt.Station:ToyoRapidRailway.ToyoRapid.YachiyoMidorigaoka' : '八千代緑ヶ丘' ,
 'odpt.Station:Odakyu.Tama.Karakida' : '唐木田' ,
 'odpt.Station:Odakyu.Odawara.HonAtsugi' : '本厚木' ,
 'odpt.Station:Odakyu.Odawara.HakoneYumoto' : '箱根湯本' ,
 'odpt.Station:Odakyu.Odawara.Ebina' : '海老名' ,
 'odpt.Station:Tobu.Nikko.MinamiKurihashi' : '南栗橋' ,
 'odpt.Station:Tobu.Isesaki.Kuki' : '久喜 　' ,
 'odpt.Station:Tobu.Isesaki.Takenotsuka' : '竹ノ塚' ,
 'odpt.Station:Tobu.Isesaki.KitaKasukabe' : '北春日部' ,
 'odpt.Station:Tobu.Isesaki.KitaKoshigaya' : '北越谷' ,
 'odpt.Station:Tobu.Isesaki.TobuDoubutuKouen' : '東武動物公園' ,
 'odpt.Station:Tobu.Tojo.Kawagoeshi' : '川越市' ,
 'odpt.Station:Tobu.Tojo.Asaka' : '朝霧' ,
 'odpt.Station:Tobu.Tojo.Asakadai' : '朝霧台' ,
 'odpt.Station:Tobu.Tojo.Shiki' : '志木' ,
 'odpt.Station:Tobu.Tojo.Yanasegawa' : '柳瀬川' ,
 'odpt.Station:Tobu.Tojo.Mizuhodai' : 'みずほ台' ,
 'odpt.Station:Tobu.Tojo.Tsuruse' : '鶴瀬' ,
 'odpt.Station:Tobu.Tojo.Fujimino' : 'ふじみ野' ,
 'odpt.Station:Tobu.Tojo.KamiFukuoka' : '上福岡' ,
 'odpt.Station:Tobu.Tojo.Shingashi' : '新河岸' ,
 'odpt.Station:Tobu.Tojo.Kawagoe' : '川越' ,
 'odpt.Station:Tobu.Tojo.Kawagoeshi' : '川越市' ,
 'odpt.Station:Tobu.Tojo.Kasumigaseki' : '霞ヶ関' ,
 'odpt.Station:Tobu.Tojo.Tsurugashima' : '鶴ヶ島' ,
 'odpt.Station:Tobu.Tojo.Wakaba' : '若葉' ,
 'odpt.Station:Tobu.Tojo.Sakado' : '坂戸' ,
 'odpt.Station:Tobu.Tojo.KitaSakado' : '北坂戸' ,
 'odpt.Station:Tobu.Tojo.Takasaka' : '高坂' ,
 'odpt.Station:Tobu.Tojo.HigashiMatsuyama' : '東松山' ,
 'odpt.Station:Tobu.Tojo.ShinrinKoen' : '森林公園' ,
 'odpt.Station:Tokyu.Toyoko.Hiyoshi' : '日吉' ,
 'odpt.Station:Tokyu.Toyoko.MusashiKosugi' : '武蔵小杉' ,
 'odpt.Station:Tokyu.Toyoko.Yokohama' : '横浜' ,
 'odpt.Station:Tokyu.Toyoko.Kikuna' : '菊名' ,
 'odpt.Station:Tokyu.Toyoko.Motosumiyoshi' : '元住吉' ,
 'odpt.Station:Tokyu.Toyoko.Okusawa' : '奥沢' ,
 'odpt.Station:Tokyu.Meguro.Hiyoshi' : '日吉' ,
 'odpt.Station:Tokyu.Meguro.Okusawa' : '奥沢' ,
 'odpt.Station:Tokyu.Meguro.Motosumiyoshi' : '元住吉' ,
 'odpt.Station:Tokyu.Meguro.MusashiKosugi' : '武蔵小杉' ,
 'odpt.Station:Tokyu.DenEnToshi.FutakoTamagawa' : '二子玉川' ,
 'odpt.Station:Tokyu.DenEnToshi.Nagatsuta' : '長津田' ,
 'odpt.Station:Tokyu.DenEnToshi.Saginuma' : '鷺沼' ,
 'odpt.Station:Tokyu.DenEnToshi.ChuoRinkan' : '中央林間' ,
 'odpt.Station:Minatomirai.Minatomirai.MotomachiChukagai' : '元町・中華街' ,
 'odpt.Station:Seibu.Ikebukuro.ShinSakuradai' : '新桜台' ,
 'odpt.Station:Seibu.Ikebukuro.Nerima' : '練馬' ,
 'odpt.Station:Seibu.Ikebukuro.Nakamurabashi' : '中村橋' ,
 'odpt.Station:Seibu.Ikebukuro.Fujimidai' : '富士見台' ,
 'odpt.Station:Seibu.Ikebukuro.NerimaTakanodai' : '練馬高野台' ,
 'odpt.Station:Seibu.Ikebukuro.ShakujiiKoen' : '石神井公園' ,
 'odpt.Station:Seibu.Ikebukuro.OizumiGakuen' : '大泉学園' ,
 'odpt.Station:Seibu.Ikebukuro.Hoya' : '保谷' ,
 'odpt.Station:Seibu.Ikebukuro.Hibarigaoka' : 'ひばりヶ丘' ,
 'odpt.Station:Seibu.Ikebukuro.HigashiKurume' : '東久留米' ,
 'odpt.Station:Seibu.Ikebukuro.Kiyose' : '清瀬' ,
 'odpt.Station:Seibu.Ikebukuro.Akitsu' : '秋津' ,
 'odpt.Station:Seibu.Ikebukuro.Tokorozawa' : '所沢' ,
 'odpt.Station:Seibu.Ikebukuro.NishiTokorozawa' : '西所沢' ,
 'odpt.Station:Seibu.Ikebukuro.Kotesashi' : '小手指' ,
 'odpt.Station:Seibu.Ikebukuro.Sayamagaoka' : '狭山ヶ丘' ,
 'odpt.Station:Seibu.Ikebukuro.MusashiFujisawa' : '武蔵藤沢' ,
 'odpt.Station:Seibu.Ikebukuro.InariyamaKoen' : '稲荷山公園' ,
 'odpt.Station:Seibu.Ikebukuro.Irumashi' : '入間市' ,
 'odpt.Station:Seibu.Ikebukuro.Bushi' : '仏子' ,
 'odpt.Station:Seibu.Ikebukuro.Motokaji' : '元加治' ,
 'odpt.Station:Seibu.Ikebukuro.Hanno' : '飯能' 
 }

require(["q", "jquery"/*,"knockout"*/,"d3","domReady!","bootstrap","bootstrap-submenu"],
function (q, jq/*,ko*/,d3,dom) {
    d3.ns.prefix.sf = 'http://www.enoie.net/';
    var trainsBackup = null;

    //(function (q,jq,ko){
    //})(); 
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
      , json(jsonBase + '/stationTimeTable/stationTimeTableIndexs.json')
      , json(jsonBase + '/holidays.json')
    ];
    q.all(jsons)
    .spread(function (railways, stations,railroad,station,stationTimeTableIndex,hdays) {
      var stationsIndex = {};
      var holidays = {};

      hdays.feed.entry.forEach(function(d){
        holidays[d['gd$when'][0]['startTime']] = d['title'];
      });
      // 各データ間の関連付け。
      stations.forEach(function(s){
        stationsIndex[s['owl:sameAs']] = s;
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
      
      function getStationTitle(stationId){
        var st = stationsIndex[stationId];
        if(st){
          st = st['dc:title'];
        } else {
          st = otherStations[stationId];
          if(!st){
            st = stationId;
          }
        }
        return st;
      }

      railroad.features.forEach(
      function(d){
        if (d.properties['開始'] == '麹町') {
            d.properties['開始'] = '麴町';
        }
        if (d.properties['終了'] == '麹町') {
            d.properties['終了'] = '麴町';
        }

        stations.forEach(function (s) {
            if (d.properties['開始'] == s['dc:title'] && (lineInfos2[d.properties['N02_003']]['owl:sameAs'] == s['odpt:railway'])) {
                d.properties['odpt:fromStation'] = s;
            }
            if (d.properties['終了'] == s['dc:title'] && lineInfos2[d.properties['N02_003']]['owl:sameAs'] == s['odpt:railway']) {
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
      .attr("width", 0/*rect.width*/)
      .attr("height",0 /*rect.height*/);
      svg
      .call(zoom);

      var g1 = g.select('g');
      g1
      .attr('x', sx)
      .attr('y', sy);
      function zoomed() {
        g1.attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
      }

      // -------- //
      // 駅時刻表 //
      // -------- //

      function replaceIdStr(str){
        return str.replace(/[\:\.]/ig,'-');
      }

      // 時刻表モーダルの表示  
      function makeTimeTableModal (e){
        var this_ = d3.select(this);
        var stationId = this_.attr('stationId');
        var stobj = stationsIndex[stationId];
        // タイトル生成
        d3.select('#stationInfoTitle')
          .html('<img src="img/' + stobj['odpt:stationCode'] + '.png" width="32" height="32" class="metro-image"/>&nbsp;' + this_.attr('title') + '駅 <small>' + stobj['odpt:railway']['dc:title']+ '線</small>');
        // 時刻表タブ作成
        var stationTT = stationTimeTableIndex[stationId];
        var tabSel = d3.select('#stationInfoTab')
          .selectAll('li')
          .data(stationTT,function(d){return stationId + '-' + d.direction;});
        tabSel.exit().remove();

        tabSel.enter()
        .append('li')
        .attr('id',function(d){ return replaceIdStr(d.direction) + '-tab';})
        .attr('role','presentation')
        .classed('active',function(d,i){return i == 0;})
        .append('a')
        .attr('id', function (d) { return replaceIdStr(d.direction) + '-a';})
        .attr('role', 'tab')
        .attr('data-toggle','tab')
        .attr('href', function (d) { return '#' + replaceIdStr(d.direction) + '-body';})
        .classed('tab-small time-table-tab-head',true)
        .text(function (d) {
          return railDirections[d.direction];
        });


        var tabBodySel = d3.select('#stationInfoTabContent').selectAll('div').data(stationTT,function(d){return stationId + '.' + d.direction;});
        tabBodySel.exit().remove();

        tabBodySel.enter()
        .append('div')
        .attr('role','tabpanel')
        .classed('tab-pane time-table-tab-pane',true)
        .classed('active',function(d,i){return i == 0;})
        .attr('id', function (d) { return replaceIdStr(d.direction) + '-body'});


        tabBodySel.each(function(d){
          var this_ = d3.select(this);
          this_.select('table').remove();
          var tbl = this_.append('table').classed('table table-striped table-condensed timeTable',true);
          tbl.append('thead').append('tr').selectAll('th').data(['時', railDirections[d.direction]])
            .enter().append('th').text(function(d){return d;});
          var timetbl = new Array(24);

          json(d.path)
          .then(function (data) {
            var dt = new Date();
            var minute = dt.getMinutes(); 
            var hour = dt.getHours();
            var day = dt.getDay();
            var date = dt.getDate();
            var tt = null;

            function makeTtData(){
              for(var i = 0,e = timetbl.length;i < e;++i ){
                timetbl[i] = [];
              }
              if(holidays[dtfmt(dt)] || day == 0){
                tt = data['odpt:holidays'];
              } else if(day == 6){
                tt = data['odpt:saturdays'];
              } else {
                tt = data['odpt:weekdays'];
              }

              tt.forEach(function(d){
                var ttss = d['odpt:departureTime'].split(':');
                var destTitle = getStationTitle(d['odpt:destinationStation']);
                timetbl[parseInt(ttss[0])].push({hour: ttss[0],minute:ttss[1],dest : destTitle,trainType:trainTypes[d['odpt:trainType']],data : d });
              });

            }
            makeTtData();

            var tbody = tbl.append('tbody');

            function makeTableBody(){
              var dt = new Date();
              var minute = dt.getMinutes(); 
              var hour = dt.getHours();
              var timetblNew = [];
              if(date != dt.getDate()){
                date = dt.getDate();
                makeTtData();
              }
              for(var i = 0,idx = dt.getHours();i < 24;++i,++idx){
                if(idx > 23){
                  idx = 0;
                }
                timetblNew.push({index:idx,data:timetbl[idx]});
              }
              var tr = tbody.selectAll('tr')
                .data(timetblNew);
              var trEnt = tr.enter()
                .append('tr')
                .each(function(d){
                  if(d.index == dt.getHours()){
                    d3.select(this).classed('success',true);
                  } else{
                    d3.select(this).classed('success',false);
                  }
                });
              trEnt.append('td')
                .classed('time-hour-title',true);
              trEnt.append('td').classed('time-min-col',true);

              var f = false;

              //tr.selectAll('.time-hour-title')
              //.text(function (d) { return ('00' + d.index.toString(10)).slice(-2);});
 
              tr.each(function(d,i){
                // 時間列
                d3.select(this).select('.time-hour-title').text(('00' + d.index.toString(10)).slice(-2));

                var data = d.data;
                var divcol = d3.select(this).select('.time-min-col')
                .selectAll('div')
                .data(data);
                // 分列の表示
                divcol.enter()
                .append('div')
                .append('a')
                .attr({href:'#','data-toggle' : 'tooltip', 'data-placement' : 'auto'})
                .attr('title', function (dd) { return dd.trainType.title + ' ' + dd.dest; })
                .style('color',function(dd){
                  return dd.trainType.color;}
                  )
                .text(function (dd) {return dd.minute + ' '; });

                divcol
                .select('a')
                .classed('blink', function (dd) {
                      
                  if((parseInt(dd.hour) == hour && parseInt(dd.minute) >= minute || ((hour > parseInt(dd.hour)) || (hour == 23 && parseInt(dd.hour) == 0))) && !f){
                    f = true;
                    return true;
                  } 
                  return false;
                });
                divcol.exit().remove();
              });
              tr.exit().remove();
            }
            makeTableBody();
            $('.time-min-col div a').tooltip();
            (function (){
              var timerID = null;
              jq('#stationInfo').on('hide.bs.modal',function(e) {
                clearTimeout(timerID);
              });
              (function repeat(){
                makeTableBody();
                timerID = setTimeout(repeat,60000);
              })();
            })();
          });
        });
        jq('#stationInfo').modal('show');
      }

      // マップへのバインド
      var dtfmt = d3.time.format('%Y-%m-%d');
      d3.select('#stationHome')
        .selectAll('g')
        .on('click', makeTimeTableModal);

      // メニューへのバインド
      var ttMenu = d3
      .select('#time-table-dropdown')
      .selectAll('li')
      .data(railways)
      .enter()
      .append('li')
      .classed('dropdown-submenu',true);

      ttMenu.append('a')
      .attr('href','#')
      .classed('dropdown-toggle',true)
      .attr('data-toggle','dropdown')
      .text(function (d) {
        return lineInfos[d['owl:sameAs']].title;
      });

      ttMenu.append('ul')
      .classed('dropdown-menu',true)
      .attr('role','menu')
      .each(function (d) {
        var sto = d['odpt:stationOrder'];
        d3.select(this).selectAll('li')
        .data(sto)
        .enter()
        .append('li')
        .append('a')
        .attr({'href':'#'})
        .text(function (dd) {
          return stationsIndex[dd['odpt:station']]['dc:title'];
        })
        .attr('data-station-id', function (dd) { return dd['odpt:station']; })
        .attr('data-title', function (dd) { return stationsIndex[dd['odpt:station']]['dc:title'];})
        .on('click',makeTimeTableModal);
      });

      $('.dropdown-submenu > a').submenupicker();

      // ------------------------ //
      // マップへの列車位置の表示 //
      // ------------------------ //

      // ライン関数の定義 
      var line = d3.svg.line()
      .x(function(d) {return d[0];})
      .y(function(d) {return d[1];});
      
      // マーカー定義 (青）
      var markerBlue = svg.append("defs").append("marker")
      .attr({
        'id': "train-marker-blue",
        'refX': 0,
        'refY': 2,
        'markerWidth': 4,
        'markerHeight': 4,
        'orient': "auto"
      })
      .append("path")
      .attr({
        d: "M 0,0 V 4 L4,2 Z",
        fill: "blue",
        opacity: '0.75'
      });

      // マーカー定義（赤）
      var markerRed = svg.append("defs").append("marker")
      .attr({
        'id': "train-marker-red",
        'refX': 0,
        'refY': 2,
        'markerWidth': 4,
        'markerHeight': 4,
        'orient': "auto"
      })
      .append("path")
      .attr({
        d: "M 0,0 V 4 L4,2 Z",
        fill: "red",
        opacity: '0.75'
      });

      // 列車位置表示関数
      function trainLocationLoop(){
        var tg = g1.select('g#train');
        return json(jsonBase + '/train.json')
        .then(function (trains) {
          trains.forEach(function(t){
            t['odpt:fromStation'] = stationsIndex[t['odpt:fromStation']];
            t['odpt:toStation'] = stationsIndex[t['odpt:toStation']];
//            t['odpt:startingStation'] = getStation(t['odpt:startingStation']);
//            t['odpt:terminalStation'] = getStation(t['odpt:terminalStation']); 
          });
        
          // 走行中の列車の位置を表示
          var railRoadMap = d3.selectAll('*[sf\\:class="railroad"]')[0];
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
                if(r.attr('sf:from') == d['odpt:fromStation']['owl:sameAs'] && r.attr('sf:to')  == d['odpt:toStation']['owl:sameAs']){
                  cr = r;
                  break;
                } else if(r.attr('sf:from') == d['odpt:toStation']['owl:sameAs'] && r.attr('sf:to')  == d['odpt:fromStation']['owl:sameAs']){
                  cr = r;
//                  reverse = true;
                  break;
                }
              }
              if(!cr){
                console.log( d['odpt:fromStation']['owl:sameAs'] + ':' + d['odpt:toStation']['owl:sameAs']);
                //console.log(cr + ' @ ' + rev);
              }
 
              reverse = lineInfos[d['odpt:railway']][d['odpt:railDirection']];

              //if (cr.attr('sf:reverse') == 1) {
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
                'terminalStationTitle':getStationTitle(d['odpt:terminalStation']),
                'railway':d['odpt:railway'],
                'trainNumber' : d['odpt:trainNumber'],
                'trainType' : trainTypes[d['odpt:trainType']],
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
          var data = trainsSel
            .data(trainsVm
            //.filter(function(d){
            //  return d.data['odpt:railway'] == 'odpt.Railway:TokyoMetro.Ginza';
            //})
              ,function (d) {
                return d.data['owl:sameAs'];// keyは列車番号
              });
          // 子ノードのデータも更新
          tg.selectAll('path.train')
          .data(trainsVm
            //.filter(function(d){
            //  return d.data['odpt:railway'] == 'odpt.Railway:TokyoMetro.Ginza';
            //})
              ,function (d) {
                return d.data['owl:sameAs'];// keyは列車番号
              });


          var trainTrans = data
          .filter(function (d) {
            return (!(!d.transition)); 
          })
          .transition()
          .delay(function (d, i) { return i * 60; })
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
                if (parseInt(tls.path.attr('sf:reverse'),10) == 1) { reverse = !reverse;}
 
                if(reverse){
                  pt = tls.path.node().getPointAtLength(tl - tl * t);
                } else {
                  pt = tls.path.node().getPointAtLength(tl * t + tl);
                }
                return 'translate(' + [pt.x,pt.y]+ ')';
              };
            })();
          });

          var ttst = trainTrans
          .selectAll('path.train')
          .filter(function (d) {
            return (!(!d.transition)); 
          });
          ttst.attrTween('d',function(d){
            return function(t){
              var pts,pte;
              var tls = d.transition;
              var tl = tls.totalLength/2;
              var reverse = tls.reverse ;//tls.interval?tls.reverse:d.reverse;
              if (parseInt(tls.path.attr('sf:reverse'),10) == 1) { reverse = !reverse;}
 
              if(reverse){
                pts = tls.path.node().getPointAtLength(tl - tl * t);
                pte = tls.path.node().getPointAtLength(tl - tl * (t + 0.0001));
              } else {
                pts = tls.path.node().getPointAtLength(tl * t + tl);
                pte = tls.path.node().getPointAtLength(tl * (t + 0.0001) + tl);
              }
              return line([[0,0],[pte.x - pts.x,pte.y - pts.y]]);
            };
          });

          trainTrans
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
                if (parseInt(d.path.attr('sf:reverse'),10) == 1) { reverse = !reverse;}
                if(reverse){
                  pt = d.path.node().getPointAtLength(d.totalLength - tl * t);
                } else {
                  pt = d.path.node().getPointAtLength(tl * t);
                }
                return 'translate(' + [pt.x,pt.y]+ ')';
              };
            })();
          })
          .selectAll('path.train')
          .attrTween('d',function(d){
              return function(t){
                var pts,pte;
                var tl = d.totalLength/2;
                var reverse = d.reverse;//d.interval?d.reverse:d.transition.reverse;
                if (parseInt(d.path.attr('sf:reverse'),10) == 1) { reverse = !reverse;}
                if(reverse){
                  pts = d.path.node().getPointAtLength(d.totalLength - tl * t);
                  pte = d.path.node().getPointAtLength(d.totalLength - tl * (t + 0.0001));
                } else {
                  pts = d.path.node().getPointAtLength(tl * t);
                  pte = d.path.node().getPointAtLength(tl * (t + 0.0001));
                }
                return line([[0,0],[pte.x - pts.x,pte.y - pts.y]]);
              };
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
          .append('path')
          .attr('d', function (d) {
            var pt;
            var tl = d.totalLength/2;
            pts = d.path.node().getPointAtLength(tl);
            var reverse = d.reverse;//d.interval?d.reverse:d.transition.reverse;
            if (parseInt(d.path.attr('sf:reverse'),10) == 1) { reverse = !reverse;}
            if(reverse){
              pte = d.path.node().getPointAtLength(tl - tl * 0.0001);
            } else {
              pte = d.path.node().getPointAtLength(tl * 0.0001 + tl);
            }

            return line([[0,0],[pte.x - pts.x,pte.y - pts.y]]);

          })
          .attr('stroke','red')
          .attr('marker-end',function(d){
            if(d.reverse){
              return 'url(#train-marker-blue)';
            } else {
              return 'url(#train-marker-red)';
            }
          })
//          .classed('train-marker', function (d) { return !d.reverse;})
//          .classed('train-marker-reverse', function (d) { return d.reverse; })
          .classed('train',true);
          //.attr('fill', function(d){
          //  var reverse = d.reverse;
          //  if(reverse){
          //    return 'blue';
          //  } 
          //  return 'orange';
          //});

          trainMarkers.append('text')
          .style('font-size', '3px')
          .style('text-anchor', 'left')
//            .style('fill','green')
          .classed('train-marker', function (d) { return !d.reverse;})
          .classed('train-marker-reverse', function (d) { return d.reverse; })
          .attr('dx','2')
          .attr('dy',function(d){if(d.reverse) return -3;return 4;})
          .text(function (d) {
            return d.trainType.title + ' ' + d.terminalStationTitle + '行';
          });

          //trainMarkers.append('path')
          //.attr({
          //  'd': function (d) { return line([[0, 0], [4, d.reverse?-4:4]]) ;},
          //  'stroke':'black',
          //  'opacity':0.75,
          //  'stroke-width' : 0.25
          //});
          data.exit().remove();

          trainsBackup = trainsVm;
          
          
          var interval = 60000;
          var getTimeStr = d3.time.format("%H時%M分");
          if(trains.length > 0){
            var dt = new Date(Date.parse(trains[0]['dc:date']));
            var dtv = new Date(Date.parse(trains[0]['dct:valid']));
            d3.select('#date')
              .attr('datetime',trains[0]['dc:date'])
              .text(getTimeStr(dt));

            interval = dtv - new Date() + 5000;
            if(interval < 0){
              interval = 10000;
            }
          } else {
            var dateNow = new Date();
            d3.select('#date')
              .attr('datetime',dateNow.toISOString())
              .text(getTimeStr(dateNow));
          }
          return q.delay(interval);
        });
      };

      function doTrainLocationLoop(){
        trainLocationLoop().done(doTrainLocationLoop);
      }
      doTrainLocationLoop();

      // 鉄道運行情報の表示
      var trainInfo = null;
      jq('#trainInfo').on('show.bs.modal',function(e){
        var trainInfoSel = d3.select('#trainInfoBody').selectAll('tr').data(trainInfo);
        var ts = trainInfoSel.enter().append('tr');

        ts.append('td')
          .text(function (d) {return lineInfos[d['odpt:railway']].title;})
          .style('color', 'white')
          .classed('line',true)
          .style('background-color', function (d) { return lineInfos[d['odpt:railway']].color;});
            
        ts.append('td')
          .append('small')
          .classed('text-success',function(d){
            return !d['odpt:trainInformationStatus'];
          })
          .classed('text-danger',function(d){
            return d['odpt:trainInformationStatus'];
          })
          .text(function (d) {
            return d['odpt:trainInformationText'];
          });

        trainInfoSel.exit().remove();
      });

      function trainInfoLoop(){
        return json(jsonBase + '/trainInfo.json')
        .then(function (ti) {
          trainInfo = ti;
          var dt = new Date(Date.parse(trainInfo[0]['dc:date']));
          var dtv =  new Date(Date.parse(trainInfo[0]['dct:valid']));
          var time = d3.time.format("%H時%M分")(dt);
          d3.select('#modelDate')
            .attr('datetime',trainInfo[0]['dc:date'])
            .text(time);


          var trouble = null;

          trainInfo.forEach(function (d) {
            if( d['odpt:trainInformationStatus']){
              trouble = d['odpt:trainInformationStatus'];
              d3.select('#' + d['odpt:railway'].replace(/[\:\.]/ig,'-')).classed('blink-line',true);
            } else{
              d3.select('#' + d['odpt:railway'].replace(/[\:\.]/ig,'-')).classed('blink-line',false);
            }
          });

          var trainInfoBtn = d3.select('#trainInfoBtn');

          if(trouble){
            trainInfoBtn.text(trouble)
              .classed('btn-danger',true)
              .classed('btn-success',false);
          } else {
            trainInfoBtn.text('正常運転')
              .classed('btn-danger',false)
              .classed('btn-success',true);
          }

          var interval = dtv - new Date() + 5000;
          if(interval < 0){
            interval = 10000;
          }
          return q.delay(interval);
        });
      };

      function doTrainInfoLoop(){
        trainInfoLoop().done(doTrainInfoLoop);
      }
      doTrainInfoLoop();


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

      // マニュアル
      //$('#carousel-manual').carousel({interval:false});
    })
    .catch(function(err){
      alert('エラーが発生しました。' + err);
      console.log(err);
    });
}
 ,
// Error //
function (err) {
  alert('エラーが発生しました。' + err);
  console.log(err);
}
);
