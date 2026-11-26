let diff2HtmlTheme = determineComputedTheme();

document.addEventListener("readystatechange", () => {
  if (document.readyState === "complete") {
    document.querySelectorAll("pre>code.language-diff2html").forEach((elem) => {
      const textData = elem.textContent;
      const backup = elem.parentElement;
      backup.classList.add("unloaded");

      let diffElement = document.createElement("div");
      diffElement.classList.add("diff2html");
      backup.after(diffElement);
      const configuration = { colorScheme: diff2HtmlTheme, drawFileList: true, highlight: true, matching: "lines" };
      const diff2htmlUi = new Diff2HtmlUI(diffElement, textData, configuration);
      diff2htmlUi.draw();
    });
  }
});
