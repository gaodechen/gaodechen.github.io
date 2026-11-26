$(document).ready(function () {
  let jupyterNotebooks = $(".jupyter-notebook-iframe-container");
  jupyterNotebooks.each(function () {
    let iframeBody = $(this).find("iframe").get(0).contentWindow.document.body;

    let links = $(iframeBody).find("a");

    links.each(function () {
      if ($(this).attr("href")) {
        $(this).attr("target", "_blank");
      }
    });
  });
});
