
// inicializando os sockets
var Socket = (function () {
  var _socketW = null;
  var _resp = null;
  var _respFn = function (data) {
    // console.log('Exibindo a resposta do servidor: '+data)
    return data;
  };

  function initFn () {
    _socketW = new Worker('js/socket.js');

    _socketW.onmessage = function (e) {
      _resp = (e.data);
      _respFn(e.data);
    };

    return;
  }

  return {
    init: initFn,
    send: function (data) {
      if (_socketW !== null) {
        _socketW.postMessage(data);
      }
    },
    socketResponse: function (cb) {
      if (typeof cb === 'function') {
        _respFn = cb;
      }
    },
    resp: function () {
      return _resp;
    }

  };
})();

//       Map module

var Map = (function () {
  var _m = null;
  var marksData=[];
  var _center = {
    'lat': -22.9410272,
    'lng': -43.554638
  };
  var newMarker;
  var _zoom = 10;
  var _mapElement = document.getElementById('map');
  var _updateMap = function () {};
  var _ControlCentralize=null;
  var _myLocal;
  var _clusterOptions = {
    gridSize: 50,
    //maxZoom: 14,
    styles: [{
      height: 46,
      url: "imagem/cluster2.png",
      width: 46,
      textColor:'#ffffff',
    },
    {
      height: 46,
      url: "imagem/cluster2.png",
      width: 46,
      textColor:'#ffffff'
    }]
  };
  var _makeCluster;
  var _signalCreateLocal=false;
  var _geolocation;
  var _inputSearch;
  var _searchBox;
  var _bounds;
  var _resp=document.getElementById('resp');
  var _map=document.getElementById('map');
  var _mediaCel= window.matchMedia( "(max-width: 500px)" );
  var _leftBar=document.getElementById('infoLocal');
  var _informationShowed;
  var _infoToString;

  function initFn () {
    _m = new google.maps.Map(_mapElement, {
      center: _center,
      zoom: _zoom,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DEFAULT,
        position: google.maps.ControlPosition.TOP_LEFT
      },

      streetViewControl: true,
      streetViewControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT,
      },

      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER,
        style: google.maps.ZoomControlStyle.DEFAULT,
      },
    });

    //criando o botao de geolocation
    _geolocation = document.getElementById('buttonGeolocation');
    _m.controls[google.maps.ControlPosition.RIGHT_TOP].push(_geolocation);
    _geolocation.style.marginLeft="10px";
    _geolocation.index = 1;
    _ControlCentralize = document.getElementById('buttonCentralize');

    _m.controls[google.maps.ControlPosition.TOP_RIGHT].push(_ControlCentralize);
    _ControlCentralize.index = 1;

    google.maps.event.addDomListener(_geolocation, 'click', function() {
      //verificando se a golocation esta ativa
        if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(function (position) {
          _center = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          _ControlCentralize.style.display="block";

          if(_signalCreateLocal===false){
            _signalCreateLocal=true;

            _myLocal = new google.maps.Marker({
              position: _center,
              map: _m,
              icon: 'imagem/point2.png',
              animation: google.maps.Animation.DROP,
              title: 'Estou Aqui',
            });

            _updateMap('update');
            _m.setZoom(15);
          }else{
            _myLocal.setPosition(_center);
        }

        });
        _m.setCenter(_center);
      }

      google.maps.event.addDomListener(_ControlCentralize, 'click', function() {
        _m.setCenter(_center);
        _m.setZoom(15);
      });
      _updateMap('update');
    });

    //criando a caixa de busca
  _inputSearch = document.getElementById('searchPlace');
  _searchBox= new google.maps.places.SearchBox(_inputSearch);
  _searchBox.addListener('places_changed', function() {
      var places = _searchBox.getPlaces();

      //verificando valores da searchbox
      if (places.length === 0) {
        return;
      }

      //capturando bounds
      _bounds = new google.maps.LatLngBounds();

      //gerando a posição do resultado
      places.forEach(function(place) {
        if (place.geometry.viewport) {
          // Only geocodes have viewport.
          _bounds.union(place.geometry.viewport);
        } else {
          _bounds.extend(place.geometry.location);
        }
      });
      _m.fitBounds(_bounds);
      _m.setZoom(13);
      _updateMap('update');
    });

    _m.addListener(
      'dragend',
      function () {
        var _zoomChange=_m.getZoom();
        if(_zoomChange>=10){
          _updateMap('update');
        }
      }
    );
    //adicionado condicional:
    //para nao fazer requisição se estiver com zoom dentro da area de zoom anterior
    _m.addListener(
      'zoom_changed',
      function () {
        var _zoomChange=_m.getZoom();
        if(_zoomChange>=10){
          _updateMap('update');
      }
      }
    );
  }

  function addMarker (marker) {
    newMarker = new google.maps.Marker({
      position: new google.maps.LatLng(marker.lat, marker.lon),
      icon: 'imagem/local.png',
      title: marker.nome,
      map: _m
    });
    marksData.push(newMarker);
    newMarker.addListener(
      'click',
      function () {
        _updateMap('showInfo',marker.nome);
      }

    );
  }

  return {
    //   Inicializa o mapa
    init: initFn,

    // gerando o callback para o update do mapa
    updateMap: function (cb) {
      _updateMap = cb;
    },

    actionMap: function (cb) {
      _actionMap = cb;
    },

    //  parametros do updateMap, zoom, centro, markers
    zoom: function (z) {
      // obtendo o zoom para o updateMap
      if (typeof z === 'undefined') {
        if (_m === null) {
          return false;
        }
        return _m.getZoom();
      }
      _m.setZoom(z);
    },

    center: function (c) {
      // obtendo o centro para o updateMap
      if (typeof c === 'undefined') {
        return _m.getCenter();
      }
      _m.setCenter(c);
    },

    raio: function (r) {
      // obtendo o centro para o updateMap
      if (typeof r === 'undefined') {
        _mCenter = _m.getCenter();
        _mCorner = _m.getBounds().getNorthEast();

        if (Math.abs(_mCorner.lng()) > Math.abs(_mCenter.lng())) {
          Raio = (Math.abs(_mCorner.lng()) - Math.abs(_mCenter.lng()));
          return Raio;
        } else {
          Raio = (Math.abs(_mCenter.lng()) - Math.abs(_mCorner.lng()));
          return Raio;
        }
      }
    },

    //   Add um ou mais novos marcadores //  TODO: Remover marcadores
    marker: function (mark) {
      marksData=[];
      if (Array.isArray(mark)) {
        for (var i = 0; i < mark.length; i++) {
          addMarker(mark[i]);
        }
        var _makeCluster = new MarkerClusterer(_m, marksData, _clusterOptions,{
          averageCenter: true
        });
        return true;
      }
    },
    //barra lateral contendo todos os marcadores
    leftBar: function(local, sendMarkResp){
      var infoLocal= document.getElementById(local);
        var response='';
        var showData='';
        var cal='0';
        for (var i=0; i<sendMarkResp.length; i++){
          response='<div class="blockInfo" onclick="Map.infoMouseClick('+i+')">';
          response=response+'nome:<div class="'+i+'" >'+sendMarkResp[i].nome+'</div>';
          response=response+"local:"+sendMarkResp[i].lat+"</div>";
          showData=showData+response;
        }
        infoLocal.innerHTML =showData;
      },

    //evento que ocorre quando clicar em um elemento na leftbar
    infoMouseClick: function (i){
      //usando map.call para retornar os valores da string obtida do html
      var objectHTML = document.getElementsByClassName(i),

      string = [].map.call(objectHTML, function(node){
        _infoToString= node.textContent || node.innerText || "";
      }).join("");

      _updateMap('showInfo', _infoToString);
    },

    //exibição dos dados na nova janela fluutuante
    infoBar: function(value){
      _resp=document.getElementById('resp');
      _resp.style.display='block';
      _resp.style.zIndex='110';

      _map=document.getElementById('map');
      _map.style.height='30vh';
      //verificando o tamanho da tela para posicionar a infobar;

      if(_mediaCel.matches){
        _resp.style.top="50vh";
        _resp.style.left='0%';
      }else{
        _resp.style.top='30vh';
    }

    _informationSowed=
      '<div class="explain">'+
        '<img class="closeImage" onclick=Map.close'+'("information")'+' src="imagem/close.png" />'+
        '<div class="contentExplain">'+
          '<img class="imgExplain" src="'+value[0].img+'"/>'+
          '<div>nome:'+value[0].nome+'</div>'+
          '<div>endereço:'+value[0].end+'</div>'+
          '<div>sobre:'+value[0].sobre+
          '</div>'+
        '</div>'+
      '</div>';
      _resp.innerHTML=_informationSowed;
    },

    close:function(option){
      _resp=document.getElementById('resp');
      _map=document.getElementById('map');

      if(option==='information'){
        resp.style.display='none';
        resp.innerHTML='';
        map.style.height="90vh";
      }else{
        if(option==='insertion'){
          resp.style.display='none';
          resp.innerHTML='';
          map.style.height="90vh";
          map.style.width='100%';
        }
      }

    },

    contribution: function(){
      //verificando o tamanho da tela
      if(_mediaCel.matches){
        _map.style.height='30vh';
        _resp.innerHTML='';
        _resp.style.display='block';
        _resp.style.height='90vh';
        _resp.style.zIndex='110';
        _leftBar.innerHTML='<h3>Inserir algum dado extra como cadastro do usuario</h3>';

      }else{
        _leftBar.innerHTML='<h3>Inserir algum dado extra como cadastro do usuario</h3>';
        _map.style.width='50%';
        _map.style.height='40vh';
        _resp.style.top='0vh';
        _resp.style.display='block';
        _resp.style.width='60%';
        _resp.style.zIndex='90';
      }
      _resp.innerHTML='';
    },
  };
})();

/*    Usando os modulos   */

window.onload = function () {
  if (window.Worker) {
    Map.init();
    Socket.init();

    Socket.socketResponse(function (resp) {
      var dados = JSON.parse(resp);

      if (dados.action==='sendMarkers'){
        Map.marker(dados.markers);
      }

      if (dados.action==='sendMarkers'){
        Map.leftBar("infoLocal", dados.markers);
      }

      if (dados.action==='sendInfo'){
        Map.infoBar(dados.info);
      }
    });

    // Obtendo os valores sempre que o mapa é atualizado
    Map.updateMap(function (type,otherData) {
      var requestMsg;
      var requestSignal;

      if(type==='update'){
      var center = Map.center();
      var zoom = Map.zoom();
      var raio = Map.raio();

      requestMsg = {
        action: 'getMarkers',
        lat: Map.center().lat(),
        lon: Map.center().lng(),
        raio: raio
      };
    }else{
      if(type=='showInfo'){
        requestMsg= {
          action: 'showInfo',
          nome: otherData,
        };
      }
    }

    requestSignal = (JSON.stringify(requestMsg));
    Socket.send(requestSignal);

    var dados = Socket.resp();
    dados = JSON.parse(dados);
    });

  }else {
    alert('Navegador velho demais, vai fazer uma meia de tricô...');
    window.location.href = 'https:// www.google.com.br/?gws_rd = ssl#newwindow = 1&q = como+fazer+meia+de+trico';
    return false;
  }
};
