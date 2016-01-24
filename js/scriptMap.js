var resposta='';
var host= 'ws://187.14.231.115:8889';
var socket;
var samp= document.createElement('samp');

//NOTE o primeiro momento ao carregar a pagina é criado o mapa:
(function() {
  window.onload = function() {
    // Geracao do mapa
    //NOTE envia o sinal com a localização e é gerado a resposta para mostrar os pontos proximos

      sendLocal(-22.6086,-43.7128,10);


    //NOTE é gerado a geolocalização verdadeira e criado um novo mapa e novos marcadores
    getLocation(15)
  };
})();


function sendLocal(lat,lon,zoom){
  var print  = function (message) {
    samp.innerHTML = message + '\n';
    output.appendChild(samp);
    return;
  };
  socket = new WebSocket(host);
  socket.onopen = function () {
    var envio='{"action": "getMarkers","latitude": '+lat+',"longitude": '+lon+'}';
    socket.send(envio);
    console.log("Sinal Enviado: "+envio);
    return;
  };
  //NOTE resposta da conexao
  socket.onmessage = function (msg) {
    document.getElementById("resp").innerHTML=msg.data;
    resposta=JSON.parse(msg.data);
    console.log("Resposta Original "+ msg.data);
    console.log("Resposta parsed "+ resposta.markers.length);
    return;
  };
  newMap(lat,lon,zoom);
}


function getLocation(zoom) {
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
      sendLocal(lat,lon,zoom);
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

  if(resposta.action=="sendMarkers"){
    for (var i = 0, length = resposta.markers.length; i < length; i++) {
      var data = resposta.markers[i];
      latLng = new google.maps.LatLng(data.p_lat,data.p_lon);
      // inserindo marcador no mapa
      var marker = new google.maps.Marker({
        position: latLng,
        map: map,
        animation: google.maps.Animation.DROP,
        icon:"imagem/local.png",
        title: 'ponto',
      });
    }
  }

  /* NOTE infowindow indicando a localização
  var infowindow = new google.maps.InfoWindow({
    content: "Estou aqui",
  });
    infowindow.open(map, marker);*/
    //NOTE criando event quando mudara  posição do center usando drag
    map.addListener('dragend', function() {
       window.setTimeout(function() {
         var position=String(map.getCenter());
         position=position.replace("(","").replace(")","").split(",");
         //console.log('local:'+map.getCenter());
         sendLocal(position[0],position[1]);
         return;
       }, 500);
     });
   }
