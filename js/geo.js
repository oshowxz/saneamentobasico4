/* Funções puras para localizar bairros no mapa.
   Nenhum ponto é inventado: se um bairro não for encontrado, ele fica sem posição. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.Geo = fabrica();
})(this, function () {
  "use strict";

  // Área urbana de Sinop e arredores. Qualquer resultado fora dela é descartado.
  var CAIXA = { sul: -12.0, norte: -11.74, oeste: -55.66, leste: -55.36 };

  function dentro(lat, lon) {
    return typeof lat === "number" && typeof lon === "number" &&
      lat >= CAIXA.sul && lat <= CAIXA.norte && lon >= CAIXA.oeste && lon <= CAIXA.leste;
  }

  function norm(s) {
    return String(s || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  }

  var PREFIXOS = /^(jardim|jd|residencial|res|setor|loteamento|parque|bairro|conjunto)\s+/;
  var ARTIGOS = /^(de|da|das|do|dos)\s+/;

  // "Jardim das Violetas" -> "violetas"
  function nucleo(s) {
    var n = norm(s);
    var t = n.replace(PREFIXOS, "").replace(ARTIGOS, "");
    return t;
  }

  function variantes(b) {
    var todas = [b.bairro].concat(b.busca || []);
    var vistos = {}, saida = [];
    todas.forEach(function (v) {
      var k = norm(v);
      if (k && !vistos[k]) { vistos[k] = 1; saida.push(v); }
    });
    return saida;
  }

  // Constrói um índice com os lugares nomeados devolvidos pelo Overpass.
  function indexar(elementos) {
    var lista = [];
    (elementos || []).forEach(function (e) {
      var nome = e.tags && e.tags.name;
      var lat = e.lat != null ? e.lat : e.center && e.center.lat;
      var lon = e.lon != null ? e.lon : e.center && e.center.lon;
      if (!nome || !dentro(lat, lon)) return;
      lista.push({ nome: nome, chave: norm(nome), nucleo: nucleo(nome), lat: lat, lon: lon });
    });
    return lista;
  }

  // 1) nome completo igual; 2) mesmo núcleo, só se for único (evita trocar "Jardim Itália III" por "Jardim Itália").
  function acharNoIndice(b, indice) {
    var vs = variantes(b);
    var chaves = vs.map(norm);
    var i, j;
    for (i = 0; i < indice.length; i++) {
      if (chaves.indexOf(indice[i].chave) !== -1) return pegar(indice[i], "osm");
    }
    for (j = 0; j < vs.length; j++) {
      var n = nucleo(vs[j]);
      if (n.length < 4) continue;
      var achados = indice.filter(function (x) { return x.nucleo === n; });
      if (achados.length === 1) return pegar(achados[0], "osm");
    }
    return null;
  }

  function pegar(x, fonte) {
    return { lat: round(x.lat), lon: round(x.lon), fonte: fonte };
  }

  function round(v) { return Math.round(v * 1e5) / 1e5; }

  // Nominatim: só aceita tipos que representam bairro/área, nunca rua ou comércio.
  var CLASSES_OK = { place: 1, boundary: 1, landuse: 1 };
  function escolherNominatim(resultados) {
    for (var i = 0; i < (resultados || []).length; i++) {
      var r = resultados[i];
      var lat = parseFloat(r.lat), lon = parseFloat(r.lon);
      var classe = r.category || r.class;
      if (CLASSES_OK[classe] && dentro(lat, lon)) return { lat: round(lat), lon: round(lon), fonte: "osm" };
    }
    return null;
  }

  function consultaOverpass() {
    var c = CAIXA, bb = "(" + c.sul + "," + c.oeste + "," + c.norte + "," + c.leste + ")";
    return "[out:json][timeout:30];(" +
      'nwr["place"~"^(suburb|neighbourhood|quarter|village|hamlet|locality)$"]["name"]' + bb + ";" +
      'nwr["landuse"="residential"]["name"]' + bb + ";" +
      'nwr["boundary"]["name"]' + bb + ";" +
      ");out center tags;";
  }

  function urlNominatim(texto) {
    var c = CAIXA;
    return "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=br" +
      "&viewbox=" + c.oeste + "," + c.norte + "," + c.leste + "," + c.sul + "&bounded=1" +
      "&q=" + encodeURIComponent(texto + ", Sinop, Mato Grosso");
  }

  return {
    CAIXA: CAIXA, dentro: dentro, norm: norm, nucleo: nucleo, variantes: variantes,
    indexar: indexar, acharNoIndice: acharNoIndice, escolherNominatim: escolherNominatim,
    consultaOverpass: consultaOverpass, urlNominatim: urlNominatim
  };
});
