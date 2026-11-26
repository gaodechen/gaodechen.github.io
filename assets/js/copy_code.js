var codeBlocks = document.querySelectorAll("pre");
codeBlocks.forEach(function (codeBlock) {
  if (
    (codeBlock.querySelector("pre:not(.lineno)") || codeBlock.querySelector("code")) &&
    codeBlock.querySelector("code:not(.language-chartjs)") &&
    codeBlock.querySelector("code:not(.language-diff2html)") &&
    codeBlock.querySelector("code:not(.language-echarts)") &&
    codeBlock.querySelector("code:not(.language-geojson)") &&
    codeBlock.querySelector("code:not(.language-mermaid)") &&
    codeBlock.querySelector("code:not(.language-vega_lite)")
  ) {
    var copyButton = document.createElement("button");
    copyButton.className = "copy";
    copyButton.type = "button";
    copyButton.ariaLabel = "Copy code to clipboard";
    copyButton.innerText = "Copy";
    copyButton.innerHTML = '<i class="fa-solid fa-clipboard"></i>';

    copyButton.addEventListener("click", function () {
      if (codeBlock.querySelector("pre:not(.lineno)")) {
        var code = codeBlock.querySelector("pre:not(.lineno)").innerText.trim();
      } else {
        var code = codeBlock.querySelector("code").innerText.trim();
      }
      window.navigator.clipboard.writeText(code);
      copyButton.innerText = "Copied";
      copyButton.innerHTML = '<i class="fa-solid fa-clipboard-check"></i>';
      var waitFor = 3000;

      setTimeout(function () {
        copyButton.innerText = "Copy";
        copyButton.innerHTML = '<i class="fa-solid fa-clipboard"></i>';
      }, waitFor);
    });

    var wrapper = document.createElement("div");
    wrapper.className = "code-display-wrapper";

    const parent = codeBlock.parentElement;
    parent.insertBefore(wrapper, codeBlock);
    wrapper.append(codeBlock);
    wrapper.append(copyButton);
  }
});
