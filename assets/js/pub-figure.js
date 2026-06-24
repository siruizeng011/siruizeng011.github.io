(function () {
  "use strict";

  var figures = document.querySelectorAll(".pub-card__figure[data-pdf-src]");
  if (!figures.length) {
    return;
  }

  var PDFJS_VERSION = "3.11.174";
  var PDFJS_BASE = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/" + PDFJS_VERSION;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function renderFigure(figure) {
    var url = figure.getAttribute("data-pdf-src");
    var canvas = figure.querySelector("canvas");
    if (!url || !canvas || !window.pdfjsLib) {
      return Promise.resolve();
    }

    return window.pdfjsLib.getDocument(url).promise
      .then(function (pdf) {
        return pdf.getPage(1);
      })
      .then(function (page) {
        var containerWidth = figure.clientWidth || 280;
        var viewport = page.getViewport({ scale: 1 });
        var scale = containerWidth / viewport.width;
        var scaled = page.getViewport({ scale: scale });
        var context = canvas.getContext("2d");

        canvas.width = scaled.width;
        canvas.height = scaled.height;

        return page.render({
          canvasContext: context,
          viewport: scaled
        }).promise;
      })
      .then(function () {
        figure.classList.remove("pub-card__figure--loading");
        figure.classList.add("pub-card__figure--ready");
      })
      .catch(function () {
        figure.classList.remove("pub-card__figure--loading");
        figure.classList.add("pub-card__figure--error");
      });
  }

  function renderAll() {
    return Promise.all(Array.prototype.map.call(figures, renderFigure));
  }

  loadScript(PDFJS_BASE + "/pdf.min.js")
    .then(function () {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_BASE + "/pdf.worker.min.js";
      return renderAll();
    })
    .catch(function () {
      Array.prototype.forEach.call(figures, function (figure) {
        figure.classList.remove("pub-card__figure--loading");
        figure.classList.add("pub-card__figure--error");
      });
    });

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!window.pdfjsLib) {
        return;
      }
      renderAll();
    }, 200);
  });
})();
