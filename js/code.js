var resposta='';
var host= 'ws://138.204.212.65:8889';
var socket;

//NOTE o primeiro momento ao carregar a pagina é criado o mapa:
//Isso não é uma função
window.onload = function() {
  //NOTE criando a conexão websocket
  conectar();
  
  enviar('{"action": "getMarkers","latitude": '+-22.6086+',"longitude": '+-43.7128+'}');
  newMap(-22.6086,-43.7128,10)
  // Geracao do mapa
  //NOTE envia o sinal com a localização e é gerado a resposta para mostrar os pontos proximos
  //sendLocal(-22.6086,-43.7128,10);

  //NOTE é gerado a geolocalização verdadeira e criado um novo mapa e novos marcadores
  //getLocation(15)
};

function conectar(){
  socket = new WebSocket(host);
  
  //Isso não é uma função
  socket.onopen = function () {
    console.log("Conectado.");
    
    return;
  };
  //Isso não é uma função
  //É como se fosse um trigger, acontecerá quando receber mensagem. não precisa ser chamado.
  socket.onmessage = function (msg) {
    document.getElementById("resp").innerHTML=msg.data;
    resposta=JSON.parse(msg.data);
    console.log("Resposta Original "+ msg.data);
    console.log("Resposta parsed "+ resposta.markers.length);
    
    return;
  };
}

//Isso é uma função
function enviar(mensagem){
  socket.send(mensagem);
}

function newMap(lat,lon,zoom){
  var map = new google.maps.Map(document.getElementById("map"), {
    center: new google.maps.LatLng(lat,lon),
    zoom:zoom,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  latLng = new google.maps.LatLng(lat,lon);
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

    //NOTE criando event quando mudara  posição do center usando drag
    map.addListener('dragend', function() {
       window.setTimeout(function() {
         var position=String(map.getCenter());
         position=position.replace("(","").replace(")","").split(",");
         //console.log('local:'+map.getCenter());
         envio('{"action": "getMarkers","latitude": '+position[0]+',"longitude": '+position[1]+'}');
         console.log("outro sinal");
         return;

       }, 500);
     });
   }
