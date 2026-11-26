(() => {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const media = [...document.querySelectorAll("img[data-still], video.paper-media")];
  const visibility = new WeakMap();
  let pageVisible = !document.hidden;

  media.forEach((element) => {
    if (element.tagName === "IMG") element.dataset.animated = element.getAttribute("src");
    visibility.set(element, false);
  });

  function updateMedia(element) {
    const play = !preference.matches && pageVisible && visibility.get(element);
    if (element.tagName === "VIDEO") {
      if (play) element.play().catch(() => {});
      else element.pause();
    } else {
      const source = play ? element.dataset.animated : element.dataset.still;
      if (element.getAttribute("src") !== source) element.setAttribute("src", source);
    }
  }

  function updateAllMedia() {
    media.forEach(updateMedia);
  }

  if ("IntersectionObserver" in window) {
    const mediaObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          visibility.set(target, isIntersecting);
          updateMedia(target);
        });
      },
      { threshold: 0.01 }
    );
    media.forEach((element) => mediaObserver.observe(element));
  } else {
    media.forEach((element) => visibility.set(element, true));
  }
  updateAllMedia();

  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;
    updateAllMedia();
  });
  preference.addEventListener("change", updateAllMedia);
})();
