//this is dual licensed CC-BY-SA and GPL2.0 or later by velocifyer with the exception that velocifyer gets to use this under the CC-0 license

document.addEventListener("mousemove", (weridJSStuff) => {
  const ghost = document.createElement("div");
  ghost.setAttribute("class", "cursorghost");
  ghost.setAttribute("timecreated", Date.now());
  ghost.style.position = "absolute";
  ghost.style.left = weridJSStuff.pageX +'px';
  ghost.style.top = weridJSStuff.pageY + 'px';
  const body = document.body;
  document.body.appendChild(ghost, body);
})
setInterval(function () {
  var elements = document.getElementsByClassName("cursorghost");
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].getAttribute("timecreated") < (Date.now() - 2000)) {
      elements[i].remove();
    }
  }

}, 3)
