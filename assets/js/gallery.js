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
    expanded = !expanded;
    updateVisible();
    if (expanded) {
      tiles[previewLimit]?.focus({ preventScroll: true });
    } else {
      toggle.focus({ preventScroll: true });
      section.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
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
  function show(nextIndex) {
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
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      image.getAnimations().forEach((animation) => animation.cancel());
      image.animate(
        [
          { opacity: 0.45, transform: "translateY(5px) scale(.99)" },
          { opacity: 1, transform: "none" },
        ],
        {
          duration: 260,
          easing: "ease-out",
        }
      );
    }
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
      show(tileIndex);
      dialog.showModal();
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
  });
  dialog.querySelector(".gallery-close").addEventListener("click", () => dialog.close());
  dialog.querySelector(".gallery-previous").addEventListener("click", () => show(index - 1));
  dialog.querySelector(".gallery-next").addEventListener("click", () => show(index + 1));
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target.classList.contains("gallery-stage") || event.target.classList.contains("gallery-photo-frame"))
      dialog.close();
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
