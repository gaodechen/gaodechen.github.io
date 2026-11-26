(() => {
  const grid = document.querySelector(".gallery-grid");
  const dialog = document.querySelector("#gallery-dialog");
  if (!grid || !dialog) return;

  const tiles = [...grid.querySelectorAll("[data-gallery-item]")];
  if (!tiles.length) return;

  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  const fragment = document.createDocumentFragment();
  tiles.forEach((tile) => fragment.append(tile));
  grid.append(fragment);
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const easing = "cubic-bezier(0.22, 1, 0.36, 1)";
  const previewLimit = 12;
  let expanded = false;
  let visibleTiles = tiles.slice(0, previewLimit);
  const toggle = document.querySelector(".gallery-toggle");
  function updateVisible() {
    visibleTiles = expanded ? tiles : tiles.slice(0, previewLimit);
    tiles.forEach((tile, i) => {
      tile.hidden = !expanded && i >= previewLimit;
      tile.setAttribute("aria-label", `Open photograph: ${tile.querySelector("img").alt}`);
    });
    toggle.hidden = tiles.length <= previewLimit;
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.innerHTML = expanded ? 'Show fewer <span aria-hidden="true">↑</span>' : 'Show all photos <span aria-hidden="true">↓</span>';
    arrange();
  }
  toggle.addEventListener("click", () => {
    tiles.forEach((tile) => tile.getAnimations().forEach((animation) => animation.cancel()));
    const previous = new Map(visibleTiles.map((tile) => [tile, tile.getBoundingClientRect()]));
    expanded = !expanded;
    updateVisible();
    if (!preference.matches) {
      visibleTiles.forEach((tile) => {
        const next = tile.getBoundingClientRect();
        if (next.bottom < 0 || next.top > innerHeight) return;
        const before = previous.get(tile);
        const from = before
          ? {
              transform: `translate(${before.left - next.left}px, ${before.top - next.top}px) scale(${before.width / next.width}, ${
                before.height / next.height
              })`,
            }
          : { opacity: 0, transform: "translateY(12px)" };
        tile.animate([from, { opacity: 1, transform: "none" }], { duration: 380, easing });
      });
    }
    if (expanded) {
      tiles[previewLimit]?.focus({ preventScroll: true });
    } else {
      toggle.focus({ preventScroll: true });
      section.scrollIntoView({ block: "start", behavior: preference.matches ? "instant" : "smooth" });
    }
  });
  const section = grid.closest(".gallery-section");
  function tint(tile, target) {
    const color = tile.dataset.color;
    if (!color) return;
    target.style.setProperty("--gallery-rgb", color);
    if (target === dialog) {
      const dark = color.split(",").map((value) => Math.round(Number(value) * 0.13 + 10));
      dialog.style.backgroundColor = `rgb(${dark.join(",")})`;
    }
  }
  tiles.forEach((tile) => {
    tile.addEventListener("pointerenter", () => tint(tile, section));
    tile.addEventListener("focus", () => tint(tile, section));
  });
  tint(tiles[0], section);

  function arrange() {
    const style = getComputedStyle(grid);
    const gap = parseFloat(style.getPropertyValue("--gallery-gap")) || 16;
    const width = grid.clientWidth;
    if (!width || !visibleTiles.length) return;
    const ratios = visibleTiles.map((tile) => Number(tile.dataset.width) / Number(tile.dataset.height));
    const targetHeight = width < 550 ? 210 : 250;
    const count = ratios.length;
    const costs = Array(count + 1).fill(Infinity);
    const breaks = Array(count).fill(count);
    costs[count] = 0;
    for (let start = count - 1; start >= 0; start--) {
      let ratioSum = 0;
      for (let end = start; end < Math.min(count, start + 6); end++) {
        ratioSum += ratios[end];
        const height = (width - gap * (end - start)) / ratioSum;
        if (height <= 0) continue;
        const deviation = (height - targetHeight) / targetHeight;
        const cost = deviation * deviation + costs[end + 1];
        if (cost < costs[start]) {
          costs[start] = cost;
          breaks[start] = end + 1;
        }
      }
    }
    let top = 0;
    for (let start = 0; start < count; ) {
      const end = breaks[start];
      const ratioSum = ratios.slice(start, end).reduce((sum, ratio) => sum + ratio, 0);
      const height = (width - gap * (end - start - 1)) / ratioSum;
      let left = 0;
      for (let i = start; i < end; i++) {
        const tileWidth = height * ratios[i];
        Object.assign(visibleTiles[i].style, {
          width: `${tileWidth}px`,
          height: `${height}px`,
          left: `${left}px`,
          top: `${top}px`,
        });
        left += tileWidth + gap;
      }
      top += height + gap;
      start = end;
    }
    grid.style.height = `${top - gap}px`;
    grid.dataset.layout = "justified";
  }
  let lastWidth = 0;
  const observer = new ResizeObserver(([entry]) => {
    if (entry.contentRect.width !== lastWidth) {
      lastWidth = entry.contentRect.width;
      arrange();
    }
  });
  observer.observe(grid);
  updateVisible();

  if (typeof dialog.showModal !== "function") return;
  const image = dialog.querySelector(".gallery-lightbox-image");
  const error = dialog.querySelector(".gallery-image-error");
  const status = dialog.querySelector(".gallery-status");
  let index = 0;
  let opener;
  let touchStart;
  let direction = 1;
  let imageReady = false;
  let openingBounds;
  let closing = false;
  function thumbnailTransform(bounds) {
    const frame = image.getBoundingClientRect();
    const fit = Math.min(frame.width / image.naturalWidth, frame.height / image.naturalHeight);
    const scale = bounds.width / (image.naturalWidth * fit);
    const x = bounds.left + bounds.width / 2 - frame.left - frame.width / 2;
    const y = bounds.top + bounds.height / 2 - frame.top - frame.height / 2;
    return `translate(${x}px, ${y}px) scale(${scale})`;
  }
  function animateImage() {
    if (imageReady || !image.complete || !image.naturalWidth || !dialog.open) return;
    imageReady = true;
    const source = openingBounds;
    openingBounds = null;
    if (preference.matches) return;
    image.animate(
      [
        { opacity: source ? 0.8 : 0.35, transform: source ? thumbnailTransform(source) : `translateX(${direction * 12}px) scale(.99)` },
        { opacity: 1, transform: "none" },
      ],
      { duration: source ? 420 : 300, easing }
    );
  }
  preference.addEventListener("change", () => {
    if (!preference.matches) return;
    [...tiles, image, dialog].forEach((element) => element.getAnimations().forEach((animation) => animation.cancel()));
  });
  function show(nextIndex) {
    if (closing) return;
    if (dialog.open) openingBounds = null;
    direction = nextIndex < index ? -1 : 1;
    imageReady = false;
    image.getAnimations().forEach((animation) => animation.cancel());
    index = (nextIndex + visibleTiles.length) % visibleTiles.length;
    const thumbnail = visibleTiles[index].querySelector("img");
    tint(visibleTiles[index], dialog);
    tint(visibleTiles[index], section);
    error.hidden = true;
    image.hidden = false;
    image.alt = thumbnail.alt;
    image.width = Number(visibleTiles[index].dataset.width);
    image.height = Number(visibleTiles[index].dataset.height);
    image.src = visibleTiles[index].href;
    animateImage();
    status.textContent = thumbnail.alt;

    for (const offset of [-1, 1]) {
      const preload = new Image();
      preload.src = visibleTiles[(index + offset + visibleTiles.length) % visibleTiles.length].href;
    }
  }
  tiles.forEach((tile, tileIndex) => {
    tile.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      opener = tile;
      openingBounds = tile.getBoundingClientRect();
      show(tileIndex);
      dialog.showModal();
      animateImage();
      document.documentElement.classList.add("gallery-open");
    });
  });
  image.addEventListener("error", () => {
    image.hidden = true;
    error.hidden = false;
  });
  image.addEventListener("load", () => {
    image.hidden = false;
    error.hidden = true;
    animateImage();
  });
  async function closeGallery() {
    if (closing || !dialog.open) return;
    closing = true;
    if (!preference.matches) {
      image.getAnimations().forEach((animation) => animation.cancel());
      const bounds = visibleTiles[index].getBoundingClientRect();
      const inView = bounds.top >= 0 && bounds.bottom <= innerHeight && image.naturalWidth > 0 && !image.hidden;
      const fade = dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-in", fill: "forwards" });
      const zoom = image.animate([{ transform: "none" }, { transform: inView ? thumbnailTransform(bounds) : "scale(.97)" }], {
        duration: 220,
        easing: "ease-in",
        fill: "forwards",
      });
      await fade.finished.catch(() => {});
      dialog.close();
      fade.cancel();
      zoom.cancel();
    } else dialog.close();
    closing = false;
  }
  dialog.querySelector(".gallery-close").addEventListener("click", closeGallery);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeGallery();
  });
  dialog.querySelector(".gallery-previous").addEventListener("click", () => show(index - 1));
  dialog.querySelector(".gallery-next").addEventListener("click", () => show(index + 1));
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target.classList.contains("gallery-stage") || event.target.classList.contains("gallery-photo-frame"))
      closeGallery();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      const controls = [...dialog.querySelectorAll("button")];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    if (["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "Home") show(0);
      else if (event.key === "End") show(visibleTiles.length - 1);
      else show(index + (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1));
    }
  });
  dialog.addEventListener("close", () => {
    document.documentElement.classList.remove("gallery-open");
    touchStart = null;
    openingBounds = null;
    opener?.focus({ preventScroll: true });
  });
  image.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch" && event.isPrimary) {
      touchStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
      image.setPointerCapture(event.pointerId);
    } else touchStart = null;
  });
  image.addEventListener("pointercancel", () => {
    touchStart = null;
  });
  image.addEventListener("pointerup", (event) => {
    if (!touchStart || event.pointerId !== touchStart.id) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
    touchStart = null;
  });
})();
