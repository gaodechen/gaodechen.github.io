$(document).ready(function () {
  var $grid = $(".grid").masonry({
    gutter: 10,
    horizontalOrder: true,
    itemSelector: ".grid-item",
  });

  $grid.imagesLoaded().progress(function () {
    $grid.masonry("layout");
  });
});
