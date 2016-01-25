var resposta='';
var cont=0;
var host= 'ws://138.204.212.65:8889';
//var host= 'ws://127.0.0.1:8889';
var socket = null;
var map = null;

window.onload = function() {
  console.log("conectando");
  socket = new WebSocket(host);
  socket.onopen = function () {
    console.log("Conectado.");
    return;
  };

  console.log("gerar mapa");
  map = new google.maps.Map(document.getElementById("map"),{
    center: new google.maps.LatLng(-22.6086,-43.7128),
    zoom:10,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  var latLng = new google.maps.LatLng(-22.6086,-43.7128);
  console.log("gerar centro");
  var marker = new google.maps.Marker({
    position: latLng,
    map: map,
    icon:"imagem/point2.png",
    animation: google.maps.Animation.DROP,
    title: "Estou Aqui",
    visible:true,
  });

  socket.onopen = function () {
    obter();
    return;
  };


  //NOTE criando event quando mudara  posição do center usando drag
  map.addListener('dragend', function() {
    cont=cont+1;
    console.log("Dragened, Conexão: "+cont);
    obter();
  });

};

function obter(){
  //obtem novo center apos o frag
  var position=String(map.getCenter());
  position=position.replace("(","").replace(")","").split(",");
    socket.send('{"action": "getMarkers","latitude": '+position[0]+',"longitude": '+position[1]+'}');
    console.log("Enviado conexão: "+cont);
    //console.log('{"action": "getMarkers","latitude": '+position[0]+',"longitude": '+position[1]+'}');
    socket.onmessage = function (msg) {

      resposta=JSON.parse(msg.data);
      console.log("Recebida a resposta da conexão: "+cont);

      if(resposta.action=="sendMarkers"){
        for (var i = 0, length = resposta.markers.length; i < length; i++) {
          var data = resposta.markers[i];
          latLng = new google.maps.LatLng(data.p_lat,data.p_lon);
          // inserindo marcador no mapa
          var marker = new google.maps.Marker({
            position: latLng,
            map: map,
            icon:"imagem/local.png",
            title: data.p_nome,
          });
        }
      };
    }
}
