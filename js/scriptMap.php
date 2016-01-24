var resposta;
var socket;
var host;
var samp;

function sendLocal(lat,lon){
  host   = 'ws://187.14.231.115:8889';
  socket = null;
  var print  = function (message) {
    samp = document.createElement('samp');
    samp.innerHTML = message + '\n';
    output.appendChild(samp);
    return;
  };
  socket = new WebSocket(host);
  socket.onopen = function () {
    //console.log('connection is opened');
    var envio='{"action": "createMap","latitude": '+lat+',"longitude": '+lon+'}';
    console.log("Sinal Enviado"+envio);
    socket.send(envio);
    return;
  };
}


function getLocation() {
  var lat, lon;

		if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(showPosition);
		} else {
				console.log('Navegar não suporta Geolocalização');
		}

    //NOTE segunda parte da função, onde se obtem a coordenada
    function showPosition(position) {
      lat = position.coords.latitude,
      lon = position.coords.longitude;
      newMap(lat,lon);
      //enviando a localização por websocket
      sendLocal(lat,lon);
      //NOTE aqui é onde se obtem o resultado da requisição.
      socket.onmessage = function (msg) {
        //console.log('Socket: \n', msg.data);
        //alerta de resposta
        document.getElementById("resp").innerHTML=msg.data;
        resposta=JSON.parse(msg.data);
        //alert(resposta.names[1]);
        return;
      };
      socket=NULL;
    }
	}

function newMap(lat,lon){
  var map = new google.maps.Map(document.getElementById("map"), {
    center: new google.maps.LatLng(lat,lon),
    zoom: 10,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  latLng = new google.maps.LatLng(lat,lon);
  // inserindo marcador no mapa
  var marker = new google.maps.Marker({
    position: latLng,
    map: map,
    icon:"imagem/point2.png",
    animation: google.maps.Animation.DROP,
    title: "Estou Aqui",
  });
}

(function() {
  window.onload = function() {
    // Geracao do mapa
    <?php
    $data = file_get_contents('http://ip-api.com/json/208.80.152.201');?>
    var obj = JSON.parse('<?php echo($data);?>');
    newMap(obj.lat, obj.lon);
    sendLocal(obj.lat, obj.lon);
    socket.onmessage = function (msg) {
      document.getElementById("resp").innerHTML=msg.data;
      resposta=JSON.parse(msg.data);
      return;
    };
    getLocation()
  };
})();
