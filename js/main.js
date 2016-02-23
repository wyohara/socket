
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
  //captura de elementos do html
  var _mapElement = document.getElementById('map');
  var _leftBarElement=document.getElementById('infoLocal');
  var _respElement=document.getElementById('resp');
  var _geolocation = document.getElementById('buttonGeolocation');
  var _inputSearch = document.getElementById('searchPlace');
  var _ControlCentralize = document.getElementById('buttonCentralize');

  //variaveis para criar o mapa
  var _m = null;
  var marksData=[];
  var _zoom = 13;
  var _myLocal = null;
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

  var _center = {
    'lat': -22.9410272,
    'lng': -43.554638
  };

  //elementos para criar outros botoes e icones
  var _searchBox;
  var _informationShowed = '';
  var _bounds;
  var _places;
  var _newMarker;
  var _updateMap = function () {};
  //verificando tela do dispositivo
  var _mediaCel= window.matchMedia( "(max-width: 500px)" );
  var _infoToString;


  function initFn () {
    _m = new google.maps.Map(_mapElement, {
      center: _center,
      zoom: _zoom,
      mapTypeControl: true,
      //posicionando elementos nativos do mapa
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
    _m.controls[google.maps.ControlPosition.RIGHT_TOP].push(_geolocation);
    _geolocation.style.marginLeft="10px";
    _geolocation.index = 1;

    _m.controls[google.maps.ControlPosition.TOP_CENTER].push(_ControlCentralize);
    _ControlCentralize.index = 1;

    google.maps.event.addDomListener(_geolocation, 'click', function() {
          if(_myLocal === null){
            //verificando se a golocation esta ativa
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                  _center = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                  };

                _ControlCentralize.style.display="block";
                _myLocal = new google.maps.Marker({
                  position: _center,
                  map: _m,
                  icon: 'imagem/point2.png',
                  animation: google.maps.Animation.DROP,
                  title: 'Estou Aqui',
                });
                _updateMap('update');
                _m.setCenter(_center);
                _m.setZoom(15);
              });
            }else{
              _myLocal.setPosition(_center);
            }
      }else{
        //algo para parar de verificar posiçao
      }
    });

    //criando a funcionalidade do botao centralizar
    google.maps.event.addDomListener(_ControlCentralize, 'click', function() {
      _m.setCenter(_center);
      _m.setZoom(15);
      _updateMap('update');
    });

    //criando a caixa de busca
  _searchBox= new google.maps.places.SearchBox(_inputSearch);
  _searchBox.addListener('places_changed', function() {
      _places = _searchBox.getPlaces();
      //verificando valores da searchbox
      if (_places.length === 0) {
        return;
      }

      //gerando a posição do resultado
      _bounds= new google.maps.LatLngBounds();
      _places.forEach(function(place) {
        if (place.geometry.viewport) {
          // capturando o viewport
          _bounds.union(place.geometry.viewport);
        } else {
          _bounds.extend(place.geometry.location);
        }
      });
      _m.fitBounds(_bounds);
      _m.setZoom(13);
      _updateMap('update');
    });

    //NOTE Eventos:

    _m.addListener(
      'dragend',
      function () {
        _updateMap('update');
      }
    );

    _m.addListener(
      'zoom_changed',
      function () {
        _updateMap('update');
      }
    );
  }

  function addMarker (marker) {
    for(var i=0; i<marker.length;i++){
      _newMarker = new google.maps.Marker({
        position: new google.maps.LatLng(marker[i].lat, marker[i].lon),
        icon: 'imagem/local.png',
        title: marker[i].nome,
        map: _m,
        id: marker[i].id
      });
    }
    marksData.push(_newMarker);
    //NOTE adcionando evento para mostrar detalhes do mark ao clicar
    _newMarker.addListener('click',
      function () {
        _updateMap('showInfo',marker.id);
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
        _mCenter = _m.getCenter();
        _mCorner = _m.getBounds().getNorthEast();
        if (Math.abs(_mCorner.lng()) > Math.abs(_mCenter.lng())) {
          Raio = (Math.abs(_mCorner.lng()) - Math.abs(_mCenter.lng()));
          return Raio;
        } else {
          Raio = (Math.abs(_mCenter.lng()) - Math.abs(_mCorner.lng()));
          return Raio;
      }
    },

    //   Add um ou mais novos marcadores
    marker: function (mark) {
      marksData=[];
      if (Array.isArray(mark)) {
        addMarker(mark);

        var makeCluster = new MarkerClusterer(_m, marksData, _clusterOptions,{
          averageCenter: true
        });

        return true;
      }
    },

    //barra lateral contendo todos os marcadores
    leftBar: function(local, sendMarkResp){
      _leftBarElement= document.getElementById(local);

        for (var i=0; i<sendMarkResp.length; i++){
          var text =
          '<div class="blockInfo" onclick="Map.infoClick('+i+')">'+
            'nome:<div class="'+i+'" >' + sendMarkResp[i].nome+'</div>'+
            'local:'+sendMarkResp[i].lat +
          '</div>';
          _informationSowed = _informationSowed + text;
        }
        _leftBarElement.innerHTML =_informationSowed;
      },

    //evento que ocorre quando clicar em um elemento na leftbar
    infoClick: function (i){
      //usando map.call para retornar os valores da string obtida do html
      var objectHTML = document.getElementsByClassName(i),

      string = [].map.call(objectHTML, function(node){
        _infoToString= node.textContent || node.innerText || "";
      }).join("");

      _updateMap('showInfo', _infoToString);
    },

    //exibição dos dados na nova janela fluutuante
    infoBar: function(value){
      _respElement.style.display='block';
      _respElement.style.zIndex='110';
      _mapElement.style.height='30vh';
      //verificando o tamanho da tela para posicionar a infobar;

      if(_mediaCel.matches){
        _respElement.style.top="50vh";
        _respElement.style.left='0%';
      }else{
        _respElement.style.top='30vh';
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
      _respElement.innerHTML=_informationSowed;
    },

    close:function(option){
      switch (option){
        case 'information':
          _respElement.style.display='none';
          _respElement.innerHTML='';
          _mapElement.style.height="90vh";
          break;

        case 'insertion':
          _respElement.style.display='none';
          _respElement.innerHTML='';
          _mapElement.style.height="90vh";
          _mapElement.style.width='100%';
          break;
        }
      },

    contribution: function(){
      //verificando o tamanho da tela
      if(_mediaCel.matches){
        _mapElement.style.height='30vh';
        _respElement.innerHTML='';
        _respElement.style.display='block';
        _respElement.style.height='90vh';
        _respElement.style.zIndex='110';
        _leftBarElement.innerHTML='<h3>Inserir algum dado extra como cadastro do usuario</h3>';

      }else{
        _leftBarElement.innerHTML='<h3>Inserir algum dado extra como cadastro do usuario</h3>';
        _mapElement.style.width='50%';
        _mapElement.style.height='40vh';
        _respElement.style.top='0vh';
        _respElement.style.display='block';
        _respElement.style.width='60%';
        _respElement.style.zIndex='90';
      }

      _informationSowed =
        '<div class="explain">'+
          '<img class="closeImage" onclick=Map.close'+'("insertion")'+' src="imagem/close.png" />'+
          '<div class="contentExplain">'+
            '<div>nome: alguma coisa</div>'+
            '<div>endereço: testando</div>'+
            '<div>sobre: nada mais</div>'+
          '</div>'+
        '</div>';
      _respElement.innerHTML = _informationSowed;
    },
  };
})();

/*    Usando os modulos   */

window.onload = function () {
  if (window.Worker) {
    Map.init();
    Socket.init();

    // Obtendo os valores sempre que o mapa é atualizado
    Map.updateMap(function (type,otherData) {
      var requestMsg;
      var requestSignal;
      var zoom = Map.zoom();

      switch (type) {
        case 'update':
          var center = Map.center();
          var raio = Map.raio();

          requestMsg = {
            action: 'getMarkers',
            lat: Map.center().lat(),
            lon: Map.center().lng(),
            raio: raio
          };
        break;

        case 'showinfo':
          //modificar para algo que possa ser usado corretamente
          requestMsg= {
          action: 'showInfo',
          nome: otherData,
          };
        break;
      }

      //NOTE verificando o zoom para envio da mensagem
      if(zoom >= 13){
        requestSignal = (JSON.stringify(requestMsg));
        Socket.send(requestSignal);
      }
      var dados = Socket.resp();
      dados = JSON.parse(dados);
    });

    //NOTE Resposta do servidor
    Socket.socketResponse(function (resp) {
      var dados = JSON.parse(resp);
      switch (dados.action){
        case 'sendmarkers':
          Map.marker(dados.markers);
          Map.leftBar("infoLocal", dados.markers);
          break;

        case 'sendInfo':
            Map.infoBar(dados.info);
            break;
        }
      });

  }else {
    alert('Navegador velho demais, vai fazer uma meia de tricô...');
    window.location.href = 'https:// www.google.com.br/?gws_rd = ssl#newwindow = 1&q = como+fazer+meia+de+trico';
    return false;
  }
};
