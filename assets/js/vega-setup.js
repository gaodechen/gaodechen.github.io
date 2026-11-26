let vegaTheme = determineComputedTheme();

document.addEventListener("readystatechange", () => {
  if (document.readyState === "complete") {
    document.querySelectorAll("pre>code.language-vega_lite").forEach((elem) => {
      const jsonData = elem.textContent;
      const backup = elem.parentElement;
      backup.classList.add("unloaded");

      let chartElement = document.createElement("div");
      chartElement.classList.add("vega-lite");
      backup.after(chartElement);

      if (vegaTheme === "dark") {
        vegaEmbed(chartElement, JSON.parse(jsonData), { theme: "dark" });
      } else {
        vegaEmbed(chartElement, JSON.parse(jsonData));
      }
    });
  }
});
