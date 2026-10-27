/* Saneamento Sinop: página e mapa.
   Regras do projeto: nenhum percentual por bairro é inventado e nenhum ponto de mapa é chutado. */
(function () {
  "use strict";

  var D = window.DADOS, Geo = window.Geo;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var fmt = new Intl.NumberFormat("pt-BR");
  var fmt1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  var IND = {};
  D.indicadores.forEach(function (i) { IND[i.id] = i; });
  var v = function (id) { return IND[id].valor; };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function url(u) { return /^https?:\/\//.test(u) ? u : "#"; }
  function lerLS(k, padrao) { try { return JSON.parse(localStorage.getItem(k)) || padrao; } catch (e) { return padrao; } }
  function gravarLS(k, val) { try { localStorage.setItem(k, JSON.stringify(val)); } catch (e) { /* sem armazenamento */ } }
  function pct(n) { return fmt1.format(n) + "%"; }
  function link(i) {
    return '<a href="' + esc(url(i.url)) + '" target="_blank" rel="noopener">' + esc(i.fonte) + ", " + esc(i.ref) + "</a>";
  }

  function valorFormatado(i) {
    var n = i.valor;
    if (i.unidade === "%") return pct(n);
    if (n >= 1e6) return fmt1.format(n / 1e6) + " milhões <small>" + esc(i.unidade) + "</small>";
    return fmt.format(n) + " <small>" + esc(i.unidade) + "</small>";
  }
  function fatos(ids) {
    return '<ul class="fatos">' + ids.map(function (id) {
      var i = IND[id];
      return '<li><span class="rot">' + esc(i.descricao) + '</span><span class="num">' + valorFormatado(i) +
        '</span><span class="fonte">' + link(i) + "</span></li>";
    }).join("") + "</ul>";
  }

  /* ---------- Abertura e régua ---------- */
  $("#abertura-texto").innerHTML =
    "O Censo 2022 do IBGE conta quem mora em casa ligada à rede: <strong>" + pct(v("esgoto_rede_pct")) + "</strong>. " +
    "A SINISA 2024 conta quem tem acesso a serviço público: <strong>" + pct(v("esgoto_sinisa_pct")) + "</strong>. " +
    "A concessionária informa cobertura de <strong>" + pct(v("esgoto_as_pct")) + "</strong> em 2025 e promete chegar a <strong>" +
    pct(v("meta_2032_pct")) + " em 2032</strong>. Os números não estão errados: medem coisas diferentes.";

  var marcas = [
    { id: "esgoto_rede_pct", nome: "Censo 2022", desc: "esgoto por rede", tipo: "dado", pos: "cima" },
    { id: "esgoto_sinisa_pct", nome: "SINISA 2024", desc: "serviço público", tipo: "dado", pos: "baixo" },
    { id: "esgoto_as_pct", nome: "Concessionária 2025", desc: "informada pela empresa", tipo: "dado", pos: "cima" },
    { id: "meta_2026_pct", nome: "Meta 2026", desc: "após as obras do ano", tipo: "meta", pos: "baixo" },
    { id: "meta_2032_pct", nome: "Meta 2032", desc: "cobertura prevista", tipo: "meta", pos: "cima" }
  ];

  function desenharRegua() {
    var X = function (p) { return 20 + p * 9.6; };
    var aria = marcas.map(function (m) { return m.nome + ": " + pct(v(m.id)); }).join(". ");
    var s = '<svg class="regua-svg" viewBox="0 0 1000 240" role="img" aria-label="' + esc(aria) + '">' +
      '<line class="trilho" x1="20" y1="115" x2="980" y2="115"/>' +
      '<text class="eixo" x="20" y="142">0%</text><text class="eixo" x="980" y="142" text-anchor="end">100%</text>';
    marcas.forEach(function (m) {
      var p = v(m.id), x = X(p), fim = p > 90, anc = fim ? "end" : "middle", tx = fim ? 985 : x;
      var cima = m.pos === "cima";
      s += '<line class="haste" x1="' + x + '" x2="' + x + '" y1="' + (cima ? 92 : 122) + '" y2="' + (cima ? 108 : 152) + '"/>';
      s += '<circle class="p-' + m.tipo + '" cx="' + x + '" cy="115" r="10"/>';
      var y0 = cima ? 45 : 185;
      s += '<text class="v" x="' + tx + '" y="' + y0 + '" text-anchor="' + anc + '">' + pct(p) + "</text>" +
        '<text class="n" x="' + tx + '" y="' + (y0 + 22) + '" text-anchor="' + anc + '">' + esc(m.nome) + "</text>" +
        '<text class="d" x="' + tx + '" y="' + (y0 + 40) + '" text-anchor="' + anc + '">' + esc(m.desc) + "</text>";
    });
    s += "</svg>";
    s += '<ul class="regua-lista">' + marcas.map(function (m) {
      var p = v(m.id);
      return '<li><div class="linha"><span>' + esc(m.nome) + "</span><span>" + pct(p) + "</span></div><small>" + esc(m.desc) +
        '</small><div class="barra"><i class="' + (m.tipo === "meta" ? "meta" : "") + '" style="width:' + p + '%"></i></div></li>';
    }).join("") + "</ul>";
    $("#regua").innerHTML = s;
  }
  desenharRegua();

  /* ---------- Panorama ---------- */
  var crescimento = v("pop_2026") / v("pop_2022") - 1;
  $("#colunas").innerHTML =
    '<div class="coluna"><h3>População</h3>' + fatos(["pop_2026", "pop_2025", "pop_2022"]) +
    '<p class="mini">De 2022 a 2026 a estimativa cresceu ' + pct(crescimento * 100) + ".</p></div>" +
    '<div class="coluna"><h3>Água</h3>' + fatos(["agua_rede_pct", "agua_sinisa_pct", "agua_poco_pct"]) + "</div>" +
    '<div class="coluna"><h3>Esgoto</h3>' + fatos(["esgoto_rede_pct", "esgoto_sinisa_pct", "esgoto_as_pct", "fossa_rud_pct"]) + "</div>" +
    '<div class="coluna"><h3>Lixo e banheiro</h3>' + fatos(["lixo_pct", "lixo_sinisa_pct", "sem_banheiro"]) + "</div>";

  (function composicao() {
    var a = v("esgoto_rede_pct"), b = v("fossa_sep_pct"), c = v("fossa_rud_pct");
    var outras = Math.round((100 - a - b - c) * 10) / 10;
    $("#composicao").innerHTML =
      "<h3>Como o esgoto das casas é destinado (Censo 2022)</h3>" +
      "<p>Mais da metade dos moradores usa fossa rudimentar ou buraco. Fonte: " + link(IND.esgoto_rede_pct) + ".</p>" +
      '<div class="empilhada" role="img" aria-label="Rede ' + pct(a) + ", fossa séptica " + pct(b) + ", fossa rudimentar " + pct(c) + '">' +
      '<div class="seg-rede" style="width:' + a + '%">' + pct(a) + "</div>" +
      '<div class="seg-sep" style="width:' + b + '%">' + pct(b) + "</div>" +
      '<div class="seg-rud" style="width:' + c + '%">' + pct(c) + "</div></div>" +
      '<ul class="empilhada-leg">' +
      '<li><i style="background:var(--water)"></i><b>' + pct(a) + "</b> rede geral, pluvial ou fossa ligada à rede</li>" +
      '<li><i style="background:var(--water-soft)"></i><b>' + pct(b) + "</b> fossa séptica ou filtro, sem ligação à rede</li>" +
      '<li><i style="background:var(--gray)"></i><b>' + pct(c) + "</b> fossa rudimentar ou buraco</li>" +
      "</ul>" + (outras > 0 ? '<p class="mini">Outras formas (vala, rio etc.): ' + pct(outras) + ".</p>" : "");
  })();

  /* ---------- Metas ---------- */
  (function metas() {
    var base = v("esgoto_as_pct"), m26 = v("meta_2026_pct"), m32 = v("meta_2032_pct");
    var ANO_BASE = 2025, ANO_META = 2032; // premissas da aba Análises da planilha
    var falta32 = m32 - base, ritmo = falta32 / (ANO_META - ANO_BASE);
    var semRede = v("pop_2025") * (1 - base / 100);
    var oper = v("rede_oper_km") / v("rede_km");
    var alc = v("bairros_rede") / v("bairros_total");
    var itens = [
      ["Faltam <strong>" + fmt1.format(falta32) + " pontos percentuais</strong> para a meta de " + pct(m32) + " em " + ANO_META +
        ", partindo dos " + pct(base) + " de " + ANO_BASE + ". Dá <strong>" + fmt1.format(ritmo) + " pontos por ano</strong> em média.",
        "Conta: " + m32 + " − " + base + " = " + fmt1.format(falta32) + ", dividido por " + (ANO_META - ANO_BASE) + " anos."],
      ["Para a meta de " + pct(m26) + " ao fim de 2026 faltam <strong>" + fmt1.format(m26 - base) + " pontos percentuais</strong>.",
        "Conta: " + m26 + " − " + base + ". Meta e cobertura vêm da concessionária."],
      ["Com 40% de cobertura, cerca de <strong>" + fmt.format(Math.round(semRede / 1000)) + " mil moradores</strong> ainda estariam sem rede.",
        "Estimativa: " + fmt.format(v("pop_2025")) + " moradores em 2025 × 60%. Usa a cobertura informada pela própria empresa."],
      ["Dos " + v("rede_km") + " km de rede instalados, <strong>" + v("rede_oper_km") + " km (" + pct(oper * 100) + ")</strong> estavam em operação.",
        "Conta: " + v("rede_oper_km") + " ÷ " + v("rede_km") + ". Dados de fev/2026."],
      ["A rede alcançava <strong>" + v("bairros_rede") + " dos " + v("bairros_total") + " bairros</strong> legalizados (" + pct(alc * 100) + ").",
        "Conta: " + v("bairros_rede") + " (dez/2025) ÷ " + v("bairros_total") + " (fev/2026). “Alcançado” pode incluir bairro só em parte."]
    ];
    $("#contas").innerHTML = itens.map(function (i) { return "<li>" + i[0] + "<small>" + i[1] + "</small></li>"; }).join("");
    $("#rede-obras").innerHTML = "<h3 class=\"titulo-secao\" style=\"font-size:1.125rem\">Rede, obras e tratamento</h3>" +
      fatos(["rede_km", "rede_oper_km", "rede_km_abr26", "rede_2025_km", "obras_2026_km", "moradores_2025", "moradores_2026",
        "meta_2026_moradores", "bairros_trat", "ete_l_dia"]);
    $("#cuidados").innerHTML = "<h3>Antes de comparar números</h3><ul>" +
      "<li>Os três números de esgoto medem coisas diferentes: moradores com rede (Censo 2022), população com serviço público (SINISA 2024) e cobertura informada pela empresa (2025). Não use um como se fosse o outro.</li>" +
      "<li>A extensão da rede muda conforme a fonte e a data: 589 km (fev/2026), 650 km (abr/2026). Um informe publicitário da empresa cita “mais de 800 km” e não foi usado aqui.</li>" +
      "<li>“23 mil moradores” são os novos atendidos pelas obras de 2026. “110 mil” é o total esperado com coleta ao fim de 2026, metade da cidade. São números diferentes, não uma contradição.</li>" +
      "<li>Seis bairros vêm de uma notícia de 2025 que previa fim das obras em dez/2025: Jardim Itália III, Boa Esperança, Araguaia II, Novo Horizonte, Jardim São Paulo II e Nossa Senhora Aparecida. A conclusão não foi confirmada, por isso aparecem como “rede implantada”.</li>" +
      "<li>Datas com “c.” são aproximadas.</li></ul>";
  })();

  /* ---------- Fontes ---------- */
  $("#fontes-lista").innerHTML = D.fontes.map(function (f) {
    return '<li><a href="' + esc(url(f.url)) + '" target="_blank" rel="noopener">' + esc(f.nome) + "</a> <span class=\"mini\">" + esc(f.data) + "</span></li>";
  }).join("");
  $("#tabela-indicadores").innerHTML = D.indicadores.map(function (i) {
    return "<tr><td>" + esc(i.descricao) + '</td><td class="n">' + (i.unidade === "%" ? pct(i.valor) : fmt.format(i.valor) + " " + esc(i.unidade)) +
      "</td><td>" + esc(i.ref) + '</td><td><a href="' + esc(url(i.url)) + '" target="_blank" rel="noopener">' + esc(i.fonte) + "</a></td></tr>";
  }).join("");

  /* ---------- Mapa ---------- */
  var STATUS = {
    operacao: { rot: "Rede em operação", cls: "s-operacao" },
    implantada: { rot: "Rede implantada, ligação às casas não confirmada", cls: "s-implantada" },
    obras: { rot: "Obras em andamento", cls: "s-obras" }
  };
  var FILTROS = [
    { k: "todos", rot: "Todos", f: function () { return true; } },
    { k: "operacao", rot: "Em operação", f: function (b) { return b.esgoto === "operacao"; } },
    { k: "implantada", rot: "Implantada", f: function (b) { return b.esgoto === "implantada"; } },
    { k: "obras", rot: "Em obras", f: function (b) { return b.esgoto === "obras"; } },
    { k: "obras2026", rot: "Obras em 2026", f: function (b) { return b.obras2026; } }
  ];
  var ORIGEM = { verificada: "verificada pela equipe", osm: "do OpenStreetMap, automática: confira", manual: "marcada por você neste navegador" };

  var bairros = D.bairros.slice().sort(function (a, b) { return a.bairro.localeCompare(b.bairro, "pt-BR"); });
  var total = bairros.length;
  var estado = { filtro: "todos", busca: "", mostrar: 10, sel: null, ajuste: false, marcando: null, cancelar: false, buscando: false };
  var pos = {};
  var map = null, camada = null, bases = {};

  $("#aviso-escopo").innerHTML = "<strong>" + total + " bairros de " + v("bairros_total") + "</strong> aparecem aqui: são os que as fontes citam. " +
    "Bairro fora do mapa significa sem informação, não sem rede.";

  function resolverPosicoes() {
    var ver = window.COORDENADAS || {}, auto = lerLS("ss_auto_v1", {}), man = lerLS("ss_manual_v1", {});
    pos = {};
    bairros.forEach(function (b) {
      var n = b.bairro, p = null;
      if (man[n]) p = { lat: man[n].lat, lon: man[n].lon, fonte: "manual" };
      else if (ver[n] && typeof ver[n].lat === "number") p = { lat: ver[n].lat, lon: ver[n].lon, fonte: "verificada" };
      else if (auto[n] && Geo.dentro(auto[n].lat, auto[n].lon)) p = { lat: auto[n].lat, lon: auto[n].lon, fonte: "osm" };
      if (p) pos[n] = p;
    });
  }
  function guardarAuto(nome, p) { var a = lerLS("ss_auto_v1", {}); a[nome] = { lat: p.lat, lon: p.lon }; gravarLS("ss_auto_v1", a); }
  function guardarManual(nome, lat, lon) {
    var m = lerLS("ss_manual_v1", {});
    m[nome] = { lat: Math.round(lat * 1e5) / 1e5, lon: Math.round(lon * 1e5) / 1e5 };
    gravarLS("ss_manual_v1", m);
  }

  function visiveis() {
    var fil = FILTROS.filter(function (f) { return f.k === estado.filtro; })[0].f;
    var q = Geo.norm(estado.busca);
    return bairros.filter(function (b) { return fil(b) && (!q || Geo.norm(b.bairro).indexOf(q) !== -1); });
  }

  function textoEstado() {
    var cont = { verificada: 0, osm: 0, manual: 0 }, n = 0;
    bairros.forEach(function (b) { var p = pos[b.bairro]; if (p) { n++; cont[p.fonte]++; } });
    var t = n + " de " + total + " bairros têm posição no mapa";
    var partes = [];
    if (cont.verificada) partes.push(cont.verificada + " verificadas");
    if (cont.osm) partes.push(cont.osm + " do OpenStreetMap");
    if (cont.manual) partes.push(cont.manual + " marcadas por você");
    if (partes.length) t += " (" + partes.join(", ") + ")";
    t += ".";
    if (n < total) t += " Os outros aparecem na lista com a etiqueta “sem posição”.";
    if (cont.osm) t += " Posições automáticas podem errar: confira antes de apresentar.";
    return t;
  }
  function atualizarEstado(extra) { $("#mapa-estado").textContent = (extra ? extra + " " : "") + textoEstado(); }

  function iconeDe(b, sel) {
    return L.divIcon({
      className: "pin-wrap" + (sel ? " sel" : ""), iconSize: [18, 18], iconAnchor: [9, 9],
      html: '<span class="pin ' + STATUS[b.esgoto].cls + (b.obras2026 ? " m-obras26" : "") + '"></span>'
    });
  }

  function desenharMarcadores(ajustar) {
    if (!map) return;
    camada.clearLayers();
    var pts = [];
    visiveis().forEach(function (b) {
      var p = pos[b.bairro];
      if (!p) return;
      var m = L.marker([p.lat, p.lon], { icon: iconeDe(b, estado.sel === b.bairro), title: b.bairro, alt: b.bairro, draggable: estado.ajuste });
      m.on("click", function () { selecionar(b.bairro, false); });
      m.on("dragend", function () {
        var ll = m.getLatLng();
        guardarManual(b.bairro, ll.lat, ll.lng);
        resolverPosicoes();
        atualizarEstado("Posição de " + b.bairro + " salva neste navegador.");
        renderDetalhe();
        renderLista();
      });
      m.addTo(camada);
      pts.push([p.lat, p.lon]);
    });
    if (ajustar && pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.15), { maxZoom: 15 });
  }

  function renderFiltros() {
    $("#filtros").innerHTML = FILTROS.map(function (f) {
      var n = bairros.filter(f.f).length;
      return '<button type="button" data-k="' + f.k + '" aria-pressed="' + (estado.filtro === f.k) + '">' + f.rot + " (" + n + ")</button>";
    }).join("");
  }

  function renderLista() {
    var vis = visiveis();
    $("#contagem").textContent = vis.length + (vis.length === 1 ? " bairro" : " bairros");
    var parte = vis.slice(0, estado.mostrar);
    $("#lista").innerHTML = parte.map(function (b) {
      var p = pos[b.bairro];
      return '<li><button type="button" data-n="' + esc(b.bairro) + '"' + (estado.sel === b.bairro ? ' aria-current="true"' : "") + ">" +
        '<span class="pin ' + STATUS[b.esgoto].cls + (b.obras2026 ? " m-obras26" : "") + '"></span>' +
        '<span class="nome">' + esc(b.bairro) + '<span class="sub">' + esc(STATUS[b.esgoto].rot) + (b.obras2026 ? ", obras em 2026" : "") + "</span></span>" +
        (p ? "" : '<span class="semgeo">sem posição</span>') + "</button></li>";
    }).join("");
    var mais = $("#mais");
    mais.hidden = vis.length <= estado.mostrar;
    mais.textContent = "Mostrar mais bairros (" + (vis.length - estado.mostrar) + ")";
  }

  function renderDetalhe() {
    var box = $("#detalhe");
    var b = bairros.filter(function (x) { return x.bairro === estado.sel; })[0];
    if (!b) { box.hidden = true; box.innerHTML = ""; return; }
    var p = pos[b.bairro];
    var h = "<h4>" + esc(b.bairro) + "</h4>" +
      '<span class="etiqueta">' + esc(STATUS[b.esgoto].rot) + "</span>" +
      (b.obras2026 ? '<span class="etiqueta obra">Obras em 2026</span>' : "");
    if (b.obs && b.obs.length > 4) h += '<p class="obs">' + esc(b.obs.charAt(0).toUpperCase() + b.obs.slice(1)) + "</p>";
    h += "<p><strong>Fontes</strong></p><ul>" + b.fontes.map(function (f) {
      return '<li><a href="' + esc(url(f.url)) + '" target="_blank" rel="noopener">' + esc(f.nome) + '</a><br><span class="mini">' + esc(f.data) + "</span></li>";
    }).join("") + "</ul>";
    if (b.agua_pct != null || b.esgoto_pct != null || b.lixo_pct != null) {
      h += "<p><strong>Percentuais</strong> (" + esc(b.pct_fonte || "fonte não informada") + (b.pct_ano ? ", " + esc(b.pct_ano) : "") + "): " +
        [["água", b.agua_pct], ["esgoto", b.esgoto_pct], ["lixo", b.lixo_pct]].filter(function (x) { return x[1] != null; })
          .map(function (x) { return x[0] + " " + pct(x[1]); }).join(", ") + ".</p>";
    }
    h += '<p class="mini">' + (p ? "Posição " + ORIGEM[p.fonte] + "." : "Este bairro ainda não tem posição no mapa.") + "</p>";
    h += '<div class="acoes"><button class="btn sec" type="button" id="marcar">' + (p ? "Mudar posição" : "Marcar no mapa") + "</button></div>";
    box.innerHTML = h;
    box.hidden = false;
  }

  function selecionar(nome, voar) {
    estado.sel = nome;
    renderLista();
    renderDetalhe();
    desenharMarcadores(false);
    var p = pos[nome];
    if (map && p && voar) map.flyTo([p.lat, p.lon], Math.max(map.getZoom(), 15), { duration: 0.6 });
    if (!p) atualizarEstado(nome + " ainda não tem posição. Use “Marcar no mapa”.");
  }

  /* Procura de posições: Overpass (uma consulta) e depois Nominatim (uma por bairro, 1 por segundo). */
  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function faltam() { return bairros.filter(function (b) { return !pos[b.bairro]; }); }
  function progresso(f) {
    var p = $("#progresso");
    p.hidden = f == null;
    if (f != null) $("#progresso-barra").style.width = Math.round(f * 100) + "%";
  }

  function buscarOverpass() {
    return fetch("https://overpass-api.de/api/interpreter", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(Geo.consultaOverpass())
    }).then(function (r) { if (!r.ok) throw new Error("Overpass " + r.status); return r.json(); })
      .then(function (j) {
        var ix = Geo.indexar(j.elements), achou = 0;
        faltam().forEach(function (b) {
          var p = Geo.acharNoIndice(b, ix);
          if (p) { guardarAuto(b.bairro, p); achou++; }
        });
        gravarLS("ss_overpass_em", Date.now());
        resolverPosicoes();
        return achou;
      });
  }

  function buscarNominatim() {
    var lista = faltam(), i = 0, achou = 0;
    return lista.reduce(function (cadeia, b) {
      return cadeia.then(function () {
        if (estado.cancelar) return;
        var vs = Geo.variantes(b);
        return vs.reduce(function (c2, nome) {
          return c2.then(function (ok) {
            if (ok || estado.cancelar) return ok;
            return esperar(1100).then(function () {
              return fetch(Geo.urlNominatim(nome), { headers: { Accept: "application/json" } });
            }).then(function (r) { return r.ok ? r.json() : []; }).then(function (j) {
              var p = Geo.escolherNominatim(j);
              if (p) { guardarAuto(b.bairro, p); achou++; return true; }
              return false;
            }).catch(function () { return false; });
          });
        }, Promise.resolve(false)).then(function () {
          i++;
          progresso(i / lista.length);
          resolverPosicoes();
          atualizarEstado("Procurando… " + i + " de " + lista.length + " bairros consultados.");
          desenharMarcadores(false);
          renderLista();
        });
      });
    }, Promise.resolve()).then(function () { return achou; });
  }

  function procurarPosicoes() {
    if (estado.buscando) { estado.cancelar = true; return; }
    estado.buscando = true; estado.cancelar = false;
    var btn = $("#btn-procurar");
    btn.textContent = "Parar a busca";
    atualizarEstado("Consultando o OpenStreetMap…");
    buscarOverpass().catch(function () { return 0; })
      .then(function () { desenharMarcadores(false); renderLista(); return buscarNominatim(); })
      .catch(function () { return 0; })
      .then(function () {
        estado.buscando = false; btn.textContent = "Procurar posições"; progresso(null);
        desenharMarcadores(true); renderLista(); renderDetalhe();
        atualizarEstado(estado.cancelar ? "Busca interrompida." : "Busca concluída.");
      });
  }

  /* Ferramentas */
  function baixar(nome, texto, mime) {
    var blob = new Blob([texto], { type: mime + ";charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = nome;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function csv(linhas) {
    return "\ufeff" + linhas.map(function (l) {
      return l.map(function (c) { return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(";");
    }).join("\r\n");
  }
  function baixarCoordenadas() {
    var obj = {};
    bairros.forEach(function (b) { var p = pos[b.bairro]; if (p) obj[b.bairro] = { lat: p.lat, lon: p.lon }; });
    var n = Object.keys(obj).length;
    if (!n) { atualizarEstado("Nenhum bairro tem posição ainda, não há o que baixar."); return; }
    var txt = "/* Posições dos bairros, gerado em " + new Date().toISOString().slice(0, 10) + ". Confira cada ponto antes de publicar. */\n" +
      "window.COORDENADAS = " + JSON.stringify(obj, null, 1) + ";\n";
    baixar("coordenadas.js", txt, "text/javascript");
    atualizarEstado(n + " posições baixadas. Substitua o arquivo js/coordenadas.js do projeto por ele.");
  }
  function baixarBairros() {
    var linhas = [["bairro", "situacao_esgoto", "obras_2026", "latitude", "longitude", "origem_posicao", "observacao", "fontes"]];
    bairros.forEach(function (b) {
      var p = pos[b.bairro] || {};
      linhas.push([b.bairro, STATUS[b.esgoto].rot, b.obras2026 ? "sim" : "", p.lat, p.lon, p.fonte, b.obs,
        b.fontes.map(function (f) { return f.nome + " (" + f.data + ") " + f.url; }).join(" | ")]);
    });
    baixar("bairros_saneamento_sinop.csv", csv(linhas), "text/csv");
  }
  function baixarIndicadores() {
    var linhas = [["id", "descricao", "valor", "unidade", "referencia", "fonte", "link"]];
    D.indicadores.forEach(function (i) { linhas.push([i.id, i.descricao, i.valor, i.unidade, i.ref, i.fonte, i.url]); });
    baixar("indicadores_municipais_sinop.csv", csv(linhas), "text/csv");
  }

  $("#ferramentas-mapa").innerHTML =
    '<button class="btn" type="button" id="btn-procurar">Procurar posições</button>' +
    '<button class="btn sec" type="button" id="btn-ajuste" aria-pressed="false">Ajustar posições</button>' +
    '<button class="btn sec" type="button" id="btn-coords">Baixar coordenadas</button>' +
    '<button class="btn sec" type="button" id="btn-limpar">Apagar ajustes deste navegador</button>';
  $("#downloads").innerHTML =
    '<button class="btn sec" type="button" id="dl-bairros">Baixar bairros (CSV)</button>' +
    '<button class="btn sec" type="button" id="dl-ind">Baixar indicadores (CSV)</button>' +
    '<a class="btn sec" style="text-decoration:none" href="dados/Saneamento_Sinop_dados_ORIGINAL.xlsx" download>Baixar a planilha completa (XLSX)</a>';

  $("#legenda").innerHTML =
    '<span><i class="pin-leg s-operacao"></i>Em operação</span><span><i class="pin-leg s-implantada"></i>Implantada, não confirmada</span>' +
    '<span><i class="pin-leg s-obras"></i>Em obras</span><span><i class="pin-leg s-operacao m-obras26"></i>Anel: obras também em 2026</span>';

  /* Eventos */
  $("#filtros").addEventListener("click", function (e) {
    var k = e.target.getAttribute && e.target.getAttribute("data-k");
    if (!k) return;
    estado.filtro = k; estado.mostrar = 10;
    renderFiltros(); renderLista(); desenharMarcadores(true);
  });
  $("#busca").addEventListener("input", function (e) {
    estado.busca = e.target.value; estado.mostrar = 10; renderLista(); desenharMarcadores(false);
  });
  $("#lista").addEventListener("click", function (e) {
    var bt = e.target.closest("button[data-n]");
    if (bt) selecionar(bt.getAttribute("data-n"), true);
  });
  $("#mais").addEventListener("click", function () { estado.mostrar += 10; renderLista(); });
  $("#detalhe").addEventListener("click", function (e) {
    if (e.target.id !== "marcar") return;
    if (!map) { atualizarEstado("O mapa não carregou, então não dá para marcar posição."); return; }
    estado.marcando = estado.sel;
    $("#mapa-el").classList.add("marcando");
    atualizarEstado("Clique no mapa onde fica " + estado.sel + ".");
    $("#mapa-el").scrollIntoView({ block: "center", behavior: "smooth" });
  });
  $("#btn-procurar").addEventListener("click", procurarPosicoes);
  $("#btn-coords").addEventListener("click", baixarCoordenadas);
  $("#btn-ajuste").addEventListener("click", function (e) {
    estado.ajuste = !estado.ajuste;
    e.currentTarget.setAttribute("aria-pressed", String(estado.ajuste));
    atualizarEstado(estado.ajuste ? "Modo ajuste ligado: arraste os pontos para o lugar certo." : "Modo ajuste desligado.");
    desenharMarcadores(false);
  });
  $("#btn-limpar").addEventListener("click", function () {
    try { localStorage.removeItem("ss_manual_v1"); localStorage.removeItem("ss_auto_v1"); localStorage.removeItem("ss_overpass_em"); } catch (err) { /* ok */ }
    resolverPosicoes(); desenharMarcadores(true); renderLista(); renderDetalhe();
    atualizarEstado("Ajustes e posições automáticas deste navegador foram apagados.");
  });
  $("#dl-bairros").addEventListener("click", baixarBairros);
  $("#dl-ind").addEventListener("click", baixarIndicadores);
  $("#base").addEventListener("click", function (e) {
    var k = e.target.getAttribute && e.target.getAttribute("data-base");
    if (!k || !map) return;
    Object.keys(bases).forEach(function (n) { if (map.hasLayer(bases[n])) map.removeLayer(bases[n]); });
    bases[k].addTo(map);
    [].forEach.call($("#base").querySelectorAll("button"), function (b) { b.setAttribute("aria-pressed", String(b === e.target)); });
  });

  /* Tema */
  (function tema() {
    var btn = $("#tema"), raiz = document.documentElement;
    function escuro() {
      var t = raiz.getAttribute("data-theme");
      return t ? t === "dark" : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    function rotular() { btn.textContent = escuro() ? "Claro" : "Escuro"; btn.setAttribute("aria-label", escuro() ? "Mudar para o tema claro" : "Mudar para o tema escuro"); btn.setAttribute("aria-pressed", String(escuro())); }
    btn.addEventListener("click", function () {
      var novo = escuro() ? "light" : "dark";
      raiz.setAttribute("data-theme", novo);
      try { localStorage.setItem("ss_tema", novo); } catch (e) { /* ok */ }
      rotular();
    });
    rotular();
  })();

  /* Início do mapa */
  resolverPosicoes();
  renderFiltros(); renderLista(); atualizarEstado();

  if (typeof L === "undefined") {
    $("#mapa-falha").classList.add("on");
    return;
  }
  map = L.map("mapa-el", { scrollWheelZoom: false, zoomControl: true }).setView([-11.8642, -55.5025], 12);
  bases.osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© colaboradores do OpenStreetMap" });
  bases.sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Imagens © Esri" });
  bases.osm.addTo(map);
  camada = L.layerGroup().addTo(map);
  map.on("focus", function () { map.scrollWheelZoom.enable(); });
  map.on("blur", function () { map.scrollWheelZoom.disable(); });
  map.on("click", function (e) {
    if (!estado.marcando) return;
    guardarManual(estado.marcando, e.latlng.lat, e.latlng.lng);
    var nome = estado.marcando;
    estado.marcando = null;
    $("#mapa-el").classList.remove("marcando");
    resolverPosicoes(); desenharMarcadores(false); renderLista(); renderDetalhe();
    atualizarEstado("Posição de " + nome + " salva neste navegador. Use “Baixar coordenadas” para guardar no projeto.");
  });
  desenharMarcadores(true);

  // Uma consulta ao Overpass na primeira visita (no máximo 1 vez por semana) quando faltam posições.
  var ultima = lerLS("ss_overpass_em", 0);
  if (faltam().length && Date.now() - ultima > 7 * 864e5) {
    atualizarEstado("Consultando o OpenStreetMap…");
    buscarOverpass().catch(function () { return 0; }).then(function () {
      desenharMarcadores(true); renderLista(); renderDetalhe(); atualizarEstado();
    });
  }
})();
