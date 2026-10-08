const motionButton = document.querySelector(".motion-toggle");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const previews = [...document.querySelectorAll("img[data-still]")];
const videos = [...document.querySelectorAll(".paper-media:is(video)")];
previews.forEach((image) => {
  image.dataset.animated = image.getAttribute("src");
});
function setMotion(paused) {
  previews.forEach((image) => {
    image.src = paused ? image.dataset.still : image.dataset.animated;
  });
  videos.forEach((video) => {
    if (paused) video.pause();
    else video.play().catch(() => {});
  });
  if (!motionButton) return;
  motionButton.setAttribute("aria-pressed", String(paused));
  motionButton.innerHTML = paused ? 'Play motion <span aria-hidden="true">▷</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
}
if (motionButton) {
  motionButton.hidden = false;
  motionButton.addEventListener("click", () => setMotion(motionButton.getAttribute("aria-pressed") !== "true"));
}

setMotion(motionPreference.matches);
motionPreference.addEventListener("change", (event) => setMotion(event.matches));
