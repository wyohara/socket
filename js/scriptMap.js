/**
 *  Iniciando variaveis
 */
var resposta='';
//var host= 'ws://138.204.212.65:8889';
var host= 'ws://127.0.0.1:8889';
var socket = null;
var map = null;


/**
 *    Criando funções
 */
function conectar(){  //função para conectar ao socket
  socket = new WebSocket(host);
  socket.onopen = function () {
    console.log("Conectado.");
    return;
  };

  socket.onmessage = function (msg) {
    console.log("recebido: "+msg.data);
    resposta=JSON.parse(msg.data);

    //Identifica mensagem recebida
    switch (resposta.action) {
      case 'sendMarkers':
        for (var i = 0; i < resposta.markers.length; i++) {
          var respM = resposta.markers[i];
          var latLng = new google.maps.LatLng(respM.lat,respM.lat);
          // inserindo marcador no mapa
          var marker = new google.maps.Marker({
            position: latLng,
            map: map,
            icon:"imagem/local.png",
            title: data.p_nome,
          });
        }
        break;
      default:
        console.log('Mensagem não identificada:');
        console.log(resposta);
    }
  };
}

function enviar(mensagem){  //função de envio de resposta
  socket.send(mensagem);
  console.log("Sinal Enviado: "+mensagem);
}

function newMap(lat,lon,zoom){  //função de criação de mapa
  map = new google.maps.Map(document.getElementById("map"),{
    center: new google.maps.LatLng(lat,lon),
    zoom:zoom,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  var latLng = new google.maps.LatLng(lat,lon);

  var marker = new google.maps.Marker({
    position: latLng,
    map: map,
    icon:"imagem/point2.png",
    animation: google.maps.Animation.DROP,
    title: "Estou Aqui",
    visible:true,
  });

  //NOTE criando event quando mudara  posição do center usando drag
  map.addListener('dragend', function() {
    //obtem novo center apos o frag
    var position=String(map.getCenter());
    position=position.replace("(","").replace(")","").split(",");
    //Envia para o socket a nova pos
    enviar('{"action": "getMarkers","latitude": '+position[0]+',"longitude": '+position[1]+'}');
  });
}



//NOTE Funcção para ser chamada ao fim do carregamento da página
window.onload = function() {
  //NOTE conecta com o servidor websocket
  conectar();

  // NOTE: Envia uma mensagem
  enviar('{"action": "getMarkers","latitude": '+-22.6086+',"longitude": '+-43.7128+'}');

  // NOTE: Gera mapa
  newMap(-22.6086,-43.7128,10);
};
