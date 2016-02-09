
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
  var _clusterOptions;
  var _center = {
    'lat': -22.9410272,
    'lng': -43.554638
  };
  var newMarker;
  var _zoom = 10;
  var _mapElement = document.getElementById('map');
  var _updateMap = function () {};
  var _actionMap = _updateMap;
  var _divControlCentralize=null;
  var _controlCentralize=null;

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

    _clusterOptions = {
      gridSize: 50,
      //maxZoom: 14,
      styles: [
        {
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
        }
      ]
    };

    var _mLocal = new google.maps.Marker({
      position: _center,
      map: _m,
      icon: 'imagem/point2.png',
      animation: google.maps.Animation.DROP,
      title: 'Estou Aqui',
    });

    _mLocal.addListener(
      'click',
      function () {
        //_actionMap(marker.nome,'showPoint');
        _actionMap();
      }
    );

    //criando a caixa de busca
    var inputSearch = document.getElementById('searchPlace');
    var searchBox = new google.maps.places.SearchBox(inputSearch);
    _m.controls[google.maps.ControlPosition.TOP_CENTER].push(inputSearch);

    searchBox.addListener('places_changed', function() {
      var places = searchBox.getPlaces();

      //verificando valores da searchbox
      if (places.length === 0) {
        return;
      }

      //capturando bounds
      var bounds = new google.maps.LatLngBounds();

      //gerando a posição do resultado
      places.forEach(function(place) {
        if (place.geometry.viewport) {
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });
      _m.fitBounds(bounds);
      _m.setZoom(13);
      _updateMap('update');
    });

    if (navigator.geolocation) {
      var setLocationNow=true;
      navigator.geolocation.watchPosition(function (position) {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        if(_controlCentralize!==null){
          //remove o buttonElement (botao de centralizar) e cria um novo com a atual localização a cada rotate do watchPosition
          document.getElementById('buttonElement').remove();
        }
        _divControlCentralize = document.createElement('div');
        _controlCentralize = CenterControl(_divControlCentralize, _m, pos);
        _divControlCentralize.index = 1;
        _m.controls[google.maps.ControlPosition.LEFT_CENTER].push(_divControlCentralize);

        if(setLocationNow===true){
          _m.setCenter(pos);
          _m.setZoom(15);
          setLocationNow=false;
        }
        _mLocal.setPosition(pos);
        _updateMap('update');
      });
    }

    //adicionado condicional:
    //para nao fazer requisição se estiver dentro da area de zoom
    //para nao fazer requisição se ainda estiver na area da req anterior
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
        _updateMap('showinfo',marker);
      }
    );
  }

  //aplicando efeito ao botao de centralizar
  function CenterControl(divControl, map, positon){
    var innerElement = document.createElement('div');
    innerElement.style.backgroundColor = '#fff';
    innerElement.style.border = '2px solid #fff';
    innerElement.style.borderRadius = '3px';
    innerElement.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    innerElement.style.cursor = 'pointer';
    innerElement.style.margin = '10px';
    innerElement.style.textAlign = 'center';
    innerElement.title = 'Click to recenter the map';
    //criando uma id para o buttonElement
    innerElement.setAttribute('id', 'buttonElement');
    //aplicando estilo a div interna criada
    divControl.appendChild(innerElement);

    //aplicando efeito ao texto
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = 'Center Map';
    innerElement.appendChild(controlText);

    //criando o evento para o botao
    innerElement.addEventListener('click',function(){
      map.setCenter(positon);
      _updateMap('update');
    });
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
        var mc = new MarkerClusterer(_m, marksData, _clusterOptions,{
          averageCenter: true
        });
        return true;
      }
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
      Map.marker(dados.markers);
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
      if(type=='showinfo'){
        requestMsg= {
          action: 'markInfo',
          nome: otherData.nome,
        };
      }
    }
    requestSignal = (JSON.stringify(requestMsg));
    Socket.send(requestSignal);

    var dados = Socket.resp();
    dados = JSON.parse(dados);
    });

    Map.actionMap(function () {
        var val;
        var client = new XMLHttpRequest();
        client.open('GET', 'imports/addLocalInput.html');
        client.onreadystatechange = function() {
          //adaptando o mapa
          //exibindo a janela de input
          var insertion = document.getElementById("resp");
          insertion.style.display='block';
          insertion.innerHTML = client.responseText;
          console.log('exibindo div');
        };
        client.send();
    });
  }else {
    alert('Navegador velho demais, vai fazer uma meia de tricô...');
    window.location.href = 'https:// www.google.com.br/?gws_rd = ssl#newwindow = 1&q = como+fazer+meia+de+trico';
    return false;
  }
};
