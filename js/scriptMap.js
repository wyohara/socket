var resposta;
var socket;
var host= 'ws://187.14.231.115:8889';
var samp= document.createElement('samp');

//NOTE o primeiro momento ao carregar a pagina é criado o mapa:
(function() {
  window.onload = function() {
    // Geracao do mapa
    newMap(-22.6086,-43.7128,10);
    //NOTE envia o sinal com a localização e é gerado a resposta para mostrar os pontos proximos
    sendLocal(-22.6086,-43.7128);
    //NOTE é gerado a geolocalização verdadeira e criado um novo mapa e novos marcadores
    getLocation()
  };
})();


function sendLocal(lat,lon){
  socket = null;
  var print  = function (message) {
    samp.innerHTML = message + '\n';
    output.appendChild(samp);
    return;
  };
  socket = new WebSocket(host);
  socket.onopen = function () {
    //console.log('connection is opened');
    //var envio='{"action": "createMap","latitude": '+lat+',"longitude": '+lon+'}';
    //console.log("Sinal Enviado"+envio);
    var envio='{"action": "getMarkers","latitude": '+lat+',"longitude": '+lon+'}';
    console.log("Sinal Enviado"+envio);
    socket.send(envio);
    return;
  };
  socket.onmessage = function (msg) {
    document.getElementById("resp").innerHTML=msg.data;
    resposta=JSON.parse(msg.data);
    console.log("resposta"+msg.data);
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
      newMap(lat,lon,15);
      sendLocal(lat,lon);
	}
}

function newMap(lat,lon,zoom){
  var map = new google.maps.Map(document.getElementById("map"), {
    center: new google.maps.LatLng(lat,lon),
    zoom:zoom,
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
    visible:true,
  });
  var infowindow = new google.maps.InfoWindow({
    content: "Estou aqui",
  });
    infowindow.open(map, marker);
}
