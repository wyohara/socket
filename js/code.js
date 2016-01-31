//NOTE Variaveis globais usadas
//var host= 'ws://138.204.212.65:8889';
var host= 'ws://127.0.0.1:8889';
var socket = null;
var map = null;
var marcadores=[];
var validador=[];

//NOTE função usada ao carregar a pagina
window.onload = function() {
  gerarMapa(latitude,longitude,13);
};

//NOTE função para geração do mapa completo
function gerarMapa(lat,lon,zoom){

  socket = new WebSocket(host);
  socket.onopen = function () {return;};

  //criando mapa
  map = new google.maps.Map(document.getElementById("map"),{
    center: new google.maps.LatLng(lat,lon),
    zoom:zoom,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  });

  //NOTE criando botao de busca de endereço
  buscaEndereco();

  //criando o marcador da sua localização atual
  var meuLocal = new google.maps.Marker({
    position: new google.maps.LatLng(lat,lon),
    map: map,
    icon:"imagem/point2.png",
    animation: google.maps.Animation.DROP,
    title: "Estou Aqui",
  });

  //NOTE gerando a geolocalização
  function showPosition(position) {
    centerGeocode=new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
    map.setCenter(centerGeocode);
    map.setZoom(15);
    meuLocal.setPosition(centerGeocode);
    obterMarcadores();
    botaoCentralizador(lat,lon);
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    console.log("O seu navegador não suporta Geolocalização");
  }

  //obtendo os pontos pelos websockets
  socket.onopen = function () {
    obterMarcadores();
    return;
  };

  //criando event quando arrastar o mapa
  map.addListener('dragend', function() { obterMarcadores(); });

  map.addListener('zoom_changed', function() { obterMarcadores(); });

}


//criando a função para gerar o botao de centralizar
function botaoCentralizador(latitude, longitude){
  var Centralizar= {lat: latitude, lng: longitude};

  //criando a div que contera o botao
  var DIVBotaoCentralizar = document.createElement('div');
  //criando a variavel que conterá o objeto botaoCentralizar
  var botaoCentralizar= new estiloBotaoCentralizar(DIVBotaoCentralizar, map);
  DIVBotaoCentralizar.index = 1;
  //inserindo no mapa a div DIVBotaoCentralizar
  map.controls[google.maps.ControlPosition.RIGHT_TOP].push(DIVBotaoCentralizar);

  //Metodos do objeto botaoCentralizar
  function estiloBotaoCentralizar(corpoBotao, map) {
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
      //obterMarcadores();
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
    if (places.length === 0) {
      return;
    }

    //apaga todos os marcadores de busca anteriores
    markers_busca.forEach(function(marker) {
      marker.setMap(null);
    });

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
    obterMarcadores();
  });
}


//NOTE função para obter a localização central do ponto
function obterMarcadores(){
  //NOTE enviando sinal
  if(map.getZoom()>=13){
    console.log('Zoom usado: '+map.getZoom());
    var position=map.getCenter();
    var corner=map.getBounds().getNorthEast();

    //Descobrindo o raio absoluto
    if(Math.abs(corner.lng())>Math.abs(position.lng())){
      raio=(Math.abs(corner.lng())-Math.abs(position.lng()));
    }else{
      raio=(Math.abs(position.lng())-Math.abs(corner.lng()));
    }
    //enviando socket
    socket.send('{"action": "getMarkers","latitude": '+position.lat()+',"longitude": '+position.lng()+',"raio":'+raio+'}');
    console.log('Enviado: {"action": "getMarkers","latitude": '+position.lat()+',"longitude": '+position.lng()+',"raio":'+raio+'}');

    //NOTE obtendo resposta e gerando marcadores
    socket.onmessage = function (msg) {
      resposta=JSON.parse(msg.data);
      data=resposta.markers;
      var j=marcadores.length;

      //gerando os marcadores por meio do array
      if(resposta.action=="sendMarkers"){
        for (var i = 0, length = data.length; i < length; i++) {
          //verificando se o elemento ja esta no array de elementos usados
          if(validador.indexOf(data[i].lat)===-1){
            validador.push(resposta.markers[i].lat);
            console.log(validador);
            marcadores.push(data[i]);
          }
        }

        //NOTE adicionar ao vetor os dados obtidos
        for (i=j, length = marcadores.length; i < length; i++) {
          console.log("GERANDO MARCADOR: "+marcadores[i].lat);
          gerandoMarcadores(marcadores[i]);
        }
      }
    };
  }else{
    console.log("Zoom muito baixo");
  }

  function gerandoMarcadores(pontoUsado){
    // inserindo marcador no mapa
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(pontoUsado.lat,pontoUsado.lon),
      map: map,
      icon:"imagem/local.png",
      title: pontoUsado.nome,
      animation: google.maps.Animation.DROP,
    });
    google.maps.event.addListener(marker, "click", function(e) {
      //alert(pontoUsado.nome);
      mostrarInformacao(pontoUsado);
    });
  }

}


function mostrarInformacao(pontoUsado){
  var janela=document.getElementById('resp');

  janela.style.display='block';
  janela.style.backgroundColor='#ccc';
  janela.style.width='100%';
  janela.style.height='100%';
  janela.style.textAlign='left';
  janela.innerHTML=('<p>Div selecionada: '+pontoUsado.nome+'</p><p>Latitude: '+pontoUsado.lat+'</p><p>Longitude: '+pontoUsado.lon+'</p>');

}

/*
//Função para abrir o arquivo
function AbreArquivo(arquivo,pontoUsado){
  var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        document.getElementById("resp").innerHTML = xhttp.responseText;
      }
    };
    xhttp.open("POST", arquivo, true);
    xhttp.send();
}
*/
