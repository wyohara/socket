//NOTE Variaveis globais usadas
var resposta='';
var cont=0;
var host= 'ws://138.204.212.65:8889';
//var host= 'ws://127.0.0.1:8889';
var socket = null;
var map = null;
var lat, lon;

//NOTE função usada ao carregar a pagina
window.onload = function() {
  getLocation()
  mapper(-22.6086,-43.7128,10);
};


//NOTE função para obter a localização central do ponto
function obter(){
  var position=String(map.getCenter());
  position=position.replace("(","").replace(")","").split(",");
  socket.send('{"action": "getMarkers","latitude": '+position[0]+',"longitude": '+position[1]+'}');
  console.log("Enviando conexão: "+'{"action": "getMarkers","latitude": '+position[0]+',"longitude": '+position[1]+'}');

  //NOTE função para gerar os marcadores recebidos pelo websocket
  socket.onmessage = function (msg) {
    resposta=JSON.parse(msg.data);
    console.log("Recebida a resposta da conexão: "+cont);
    if(resposta.action=="sendMarkers"){
        for (var i = 0, length = resposta.markers.length; i < length; i++) {
          var data = resposta.markers[i];
          latLng = new google.maps.LatLng(data.lat,data.lon);
          // inserindo marcador no mapa
          var marker = new google.maps.Marker({
            position: latLng,
            map: map,
            icon:"imagem/local.png",
            title: data.nome,
          });
        }
      }
    };
  }

//NOTE função para obter a localização do usuario
  function getLocation() {
    function showPosition(position) {
      lat = position.coords.latitude,
      lon = position.coords.longitude;
      mapper(lat,lon,15);
    }

		if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(showPosition);
		} else {
				console.log('O navegador não suporta Geolocalização');
		}
	}

  //NOTE função para geração do mapa completo
  function mapper(lat,lon,zoom){
    console.log("conectando");
    socket = new WebSocket(host);
    socket.onopen = function () {
      console.log("Conectado.");
      return;
    };

    //criando mapa
    console.log("gerar mapa");
    map = new google.maps.Map(document.getElementById("map"),{
      center: new google.maps.LatLng(lat,lon),
      zoom:zoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    });

    buscaEndereco();
    //Botao para retornar ao centro
    botaoCentralizar(lat,lon);

    //criando o marcador da sua localização atual
    var latLng = new google.maps.LatLng(lat,lon);
    console.log("gerar centro");
    var marker = new google.maps.Marker({
      position: latLng,
      map: map,
      icon:"imagem/point2.png",
      animation: google.maps.Animation.DROP,
      title: "Estou Aqui",
      visible:true,
    });

    //obtendo os pontos pelos websockets
    socket.onopen = function () {
      obter();
      return;
    };

    //criando event quando arrastar o mapa
    map.addListener('dragend', function() {
      cont=cont+1;
      console.log("Dragened, enviando conexão: "+cont);
      obter();
    });
  }

//criando a função para gerar o botao de centralizar
function botaoCentralizar(latitude, longitude){
  var Centralizar= {lat: latitude, lng: longitude};

  //criando a div que contera o botao
  var DIVBotaoCentralizar = document.createElement('div');
  //criando a variavel que conterá o objeto botaoCentralizar
  var botaoCentralizar= new botaoCentralizar(DIVBotaoCentralizar, map);

  DIVBotaoCentralizar.index = 1;
  //inserindo no mapa a div DIVBotaoCentralizar
  map.controls[google.maps.ControlPosition.RIGHT_TOP].push(DIVBotaoCentralizar);

  //Metodos do objeto botaoCentralizar
  function botaoCentralizar(corpoBotao, map) {
    //Criando CSS do botao
    var estiloBotao = document.createElement('div');
    estiloBotao.style.backgroundColor = '#fff';
    estiloBotao.style.margin= '2px solid #fff';
    estiloBotao.style.border = '2px solid #fff';
    estiloBotao.style.borderRadius = '3px';
    estiloBotao.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    estiloBotao.style.cursor = 'pointer';
    estiloBotao.style.marginBottom = '22px';
    estiloBotao.style.textAlign = 'center';
    estiloBotao.title = 'Click to recenter the map';
    corpoBotao.appendChild(estiloBotao);

    // Criando CSS do texto do Botao
    var estiloTexto = document.createElement('div');
    estiloTexto.style.color = 'rgb(25,25,25)';
    estiloTexto.style.fontFamily = 'Roboto,Arial,sans-serif';
    estiloTexto.style.fontSize = '16px';
    estiloTexto.style.lineHeight = '38px';
    estiloTexto.style.paddingLeft = '5px';
    estiloTexto.style.paddingRight = '5px';

    estiloTexto.innerHTML = 'Retornar ao Centro';
    estiloBotao.appendChild(estiloTexto);

    //Criando evento ao clicar no botao
    estiloBotao.addEventListener('click', function() {
      map.setCenter(Centralizar);
      map.setZoom(15);
      cont=cont+1;
      obter();
    });
  }
}


function buscaEndereco(){
  //capturando a variavel input para adicionar no mapa
  var input=document.getElementById('pesquisa');
  //Criando o elemento input, onde sera inserido o endereço :var input =document.createElement('input');
  //Criando a caixa de busca do google maps
  var searchBox = new google.maps.places.SearchBox(input);
  //Posicionando a caixa de busca dentro do google maps
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);


  var markers_busca = [];
  //criando o evento para quando mudarem a caixa de busca(place), digitando um endereço
  searchBox.addListener('places_changed', function() {
    //capura o conteúdo
    var places = searchBox.getPlaces();
    if (places.length == 0) {
      return;
    }

    //apaga todos os marcadores de busca anteriores
    markers_busca.forEach(function(marker) {
      marker.setMap(null);
    });
    markers_busca = [];


    //criando uma bound para mover a tela
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(place) {
      //Cria o marcador do resultado da busca
      markers_busca.push(new google.maps.Marker({
        map: map,
        title: place.name,
        position: place.geometry.location
      }));

      //posiciona a visualizaçao no centro da busca
      if (place.geometry.viewport) {
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    //Centraliza a imagem no viewport salvo em bounds
    map.fitBounds(bounds);
    //envia os dados do centro por sockets
    obter();
  });
}
