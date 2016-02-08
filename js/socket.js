/*
CONNECTING 	0 	The connection is not yet open.
OPEN 	1 	The connection is open and ready to communicate.
CLOSING 	2 	The connection is in the process of closing.
CLOSED 	3 	The connection is closed or couldn't be opened.
*/
var socket = (function(){
  var _ws = null;
  var _host = 'ws://127.0.0.1:8889';
  var _status = 0;
  var _sendCache = [];
  var _resp = [];

  function init(){
    console.log('[trySocket] iniciado o Javascript trySocket.js');
    _ws=new WebSocket(_host);
    _status=2;
    //onopen sinaliza que esta apto para enviar e receber mensagem
    _ws.onopen=function(){
      console.log('[trySocket] canal aberto para comunicação');
      _status=1;
      for (var i = 0; i < _sendCache.length; i++) {
          //.shift remove o primeiro elemento do array
          _ws.send(_sendCache.shift());
          console.log('[trySocket] Enviando websocket');
      }
    };

      //onmessage indica que houve resposta
      _ws.onmessage = function (msg) {
        console.log('[trySocket] Sinal de resposta do servidor: '+msg.data);
        _resp.push(msg);
        postMessage(msg.data);
      };


      //fechando a conexão com o websocket
      _ws.onclose = function () {
        _ws = null;
        _status = 0;
      };
  }
  return{
    init:init,
    //executando os scripts de acordo com o status
    send: function (data) {
      switch (_status) {
        case 1:
          console.log("[trySocket] Ocorrendo case 1 do return - Comunicação aberta");
          _ws.send(data);
          return true;
          //break;
        case 2:
          console.log("[trySocket] Ocorrendo case 2 do return - Comunicaçao fechada, podendo ser encerrada");
          _sendCache.push(data);
          return true;
          //break
        case 0:
        console.log('[trySocket] Ocorrendo case 0');
          return false;
          //break
        default:
        console.log('[trySocket] Ocorrendo o caso padrão defaut');
        return false;
      }
    }
  };
})();

socket.init();

onmessage = function(e) {
  console.log('[trySocket] Valor de "data": '+e.data);
  socket.send(e.data);
};
