<!DOCTYPE html>
<html>
<head>
  <meta charset=utf-8>
  <title>Break Check</title>
  <meta name=viewport content="width=device-width, initial-scale=1">
  <script type="text/javascript" src=js/markerClusterer.js></script>
  <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBJ4goAFEbjKYg-nP6l4PNnRQzB65CC1B0&libraries=places"async defer></script>
  <link rel=stylesheet href=css/normalize.css>
  <link rel=stylesheet href=css/skeleton.css>
  <link rel=stylesheet href=css/style.css>
</head>
<body >
  <div class="section">
    <div id="topBar">
      <button id="buttonGeolocation"></button>
      <input id="searchPlace" type="text" placeholder="Encontre aqui"/>
      <button id="contribution" onclick="Map.contribution()">Contribua</button>
    </div>

    <div class=container>
      <div class="row">
        <div class="four columns">
          <div id="infoLocal">
          </div>
        </div>

        <div class="eight columns">
          <div id="map">
          </div>
          <button id="buttonCentralize">Centro</button>
          <div id="resp">
          </div>
        </div>



    </div>
  </div>
</div>
  <script src="js/code.js" charset="utf-8"></script>
</body>
</html>
