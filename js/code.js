
// inicializando os sockets
var Socket = (function () {
  var _socketW = null
  var _resp = null
  var _respFn = function (data) {
    // console.log('Exibindo a resposta do servidor: '+data)
    return data
  }

  function initFn () {
    _socketW = new Worker('js/socket.js')

    _socketW.onmessage = function (e) {
      _resp = (e.data)
      _respFn(e.data)
    }

    return
  }

  return {
    init: initFn,
    send: function (data) {
      if (_socketW !== null) {
        _socketW.postMessage(data)
      }
    },
    socketResponse: function (cb) {
      if (typeof cb === 'function') {
        _respFn = cb
      }
    },
    resp: function () {
      return _resp
    }

  }
})()

//       Map module

var Map = (function () {
  var _m = null
  var _center = {
    'lat': -22.9410272,
    'lng': -43.554638
  }
  var _zoom = 9
  var _mapElement = document.getElementById('map')
  var _markersArray = []
  var _updateMap = function () {}
  var _actionMap = _updateMap
  var _divControlCentralize=null;
  var _controlCentralize=null;

  function initFn () {
    _m = new google.maps.Map(_mapElement, {
      center: _center,
      zoom: _zoom,
      zoomControl: false,
      mapTypeControl: true,
    mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DEFAULT,
        position: google.maps.ControlPosition.TOP_LEFT
    },

      streetViewControl: true,
    streetViewControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT,
    },

    })

    var _mLocal = new google.maps.Marker({
      position: _center,
      map: _m,
      icon: 'imagem/point2.png',
      animation: google.maps.Animation.DROP,
      title: 'Estou Aqui',
    })

    //criando a caixa de busca

    if (navigator.geolocation) {
      var setLocationNow=true;
      navigator.geolocation.watchPosition(function (position) {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        if(_controlCentralize!==null){
          //remove o buttonElement (botao de centralizar) e cria um novo com a atual localização a cada rotate do watchPosition
          document.getElementById('buttonElement').remove();
        }
        _divControlCentralize = document.createElement('div');
        _controlCentralize = CenterControl(_divControlCentralize, _m, pos);
        _divControlCentralize.index = 1;
        _m.controls[google.maps.ControlPosition.RIGHT_TOP].push(_divControlCentralize);

        if(setLocationNow===true){
          _m.setCenter(pos)
          _m.setZoom(14)
          setLocationNow=false;
        }
        _mLocal.setPosition(pos)
      })
    }

    _m.addListener(
      'dragend',
      function () {
        _updateMap()
      }
    )

    _m.addListener(
      'zoom_changed',
      function () {
        _updateMap()
      }
    )
  }

  function addMarker (marker) {
    var newMarker = new google.maps.Marker({
      position: new google.maps.LatLng(marker.lat, marker.lon),
      icon: 'imagem/local.png',
      title: marker.nome,
      map: _m
    })
    newMarker.addListener(
      'click',
      function () {
        _actionMap(marker.nome)
      }
    )
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
      _updateMap();
    });
  }

  return {
    //   Inicializa o mapa
    init: initFn,

    // gerando o callback para o update do mapa
    updateMap: function (cb) {
      _updateMap = cb
    },

    actionMap: function (cb) {
      _actionMap = cb
    },

    //  parametros do updateMap, zoom, centro, markers
    zoom: function (z) {
      // obtendo o zoom para o updateMap
      if (typeof z === 'undefined') {
        if (_m === null) {
          return false
        }
        return _m.getZoom()
      }
      _m.setZoom(z)
    },

    center: function (c) {
      // obtendo o centro para o updateMap
      if (typeof c === 'undefined') {
        return _m.getCenter()
      }
      _m.setCenter(c)
    },

    raio: function (r) {
      // obtendo o centro para o updateMap
      if (typeof r === 'undefined') {
        _mCenter = _m.getCenter()
        _mCorner = _m.getBounds().getNorthEast()

        if (Math.abs(_mCorner.lng()) > Math.abs(_mCenter.lng())) {
          _mRaio = (Math.abs(_mCorner.lng()) - Math.abs(_mCenter.lng()))
          return _mRaio
        } else {
          _mRaio = (Math.abs(_mCenter.lng()) - Math.abs(_mCorner.lng()))
          return _mRaio
        }
      }
    },

    //   Add um ou mais novos marcadores //  TODO: Remover marcadores
    marker: function (mark) {
      if (Array.isArray(mark)) {
        for (var i = 0; i < mark.length; i++) {
          addMarker(mark[i])
        }
        return true
      }
    },
  }
})()

/*    Usando os modulos   */

window.onload = function () {
  if (window.Worker) {
    Map.init()
    Socket.init()

    Socket.socketResponse(function (resp) {
      var dados = JSON.parse(resp)
      Map.marker(dados.markers)
    })

    // Obtendo os valores sempre que o mapa é atualizado
    Map.updateMap(function () {
      var center = Map.center()
      var zoom = Map.zoom()
      var raio = Map.raio()

      var requestMsg = {
        action: 'getMarkers',
        lat: Map.center().lat(),
        lon: Map.center().lng(),
        raio: raio
      }
      var requestSignal = (JSON.stringify(requestMsg))

      Socket.send(requestSignal)
    })

    Map.actionMap(function (nome) {
      console.log('NOME: ' + nome)
      requestMsg = {
        action: 'markInfo',
        nome: nome,
      }
      var requestSignal = (JSON.stringify(requestMsg))
      Socket.send(requestSignal)

      var dados = Socket.resp()
      dados = JSON.parse(dados)
      if (dados !== null) {
        console.log('MENSAGEM RECEBIDA')
      }
    })
  }else {
    alert('Navegador velho demais, vai fazer uma meia de tricô...')
    window.location.href = 'https:// www.google.com.br/?gws_rd = ssl#newwindow = 1&q = como+fazer+meia+de+trico'
    return false
  }
}
