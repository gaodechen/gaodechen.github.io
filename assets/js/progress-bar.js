const progressBar = $("#progress");

window.onload = function () {
  setTimeout(progressBarSetup, 50);
};

function progressBarSetup() {
  if ("max" in document.createElement("progress")) {
    initializeProgressElement();
    $(document).on("scroll", function () {
      progressBar.attr({ value: getCurrentScrollPosition() });
    });
    $(window).on("resize", initializeProgressElement);
  } else {
    resizeProgressBar();
    $(document).on("scroll", resizeProgressBar);
    $(window).on("resize", resizeProgressBar);
  }
}

function getCurrentScrollPosition() {
  return $(window).scrollTop();
}

function initializeProgressElement() {
  let navbarHeight = $("#navbar").outerHeight(true);
  $("body").css({ "padding-top": navbarHeight });
  $("progress-container").css({ "padding-top": navbarHeight });
  progressBar.css({ top: navbarHeight });
  progressBar.attr({
    max: getDistanceToScroll(),
    value: getCurrentScrollPosition(),
  });
}

function getDistanceToScroll() {
  return $(document).height() - $(window).height();
}

function resizeProgressBar() {
  progressBar.css({ width: getWidthPercentage() + "%" });
}

function getWidthPercentage() {
  return (getCurrentScrollPosition() / getDistanceToScroll()) * 100;
}
