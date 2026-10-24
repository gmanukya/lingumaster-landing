setTimeout(function () {
  var node = document.getElementById("lm-runtime");
  if (!node || !node.textContent) return;
  var items;
  try {
    items = JSON.parse(node.textContent);
  } catch (error) {
    return;
  }
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var script = document.createElement("script");
    script.src = item.src;
    script.async = false;
    if (item.noModule) script.noModule = true;
    document.body.appendChild(script);
  }
}, 150);
