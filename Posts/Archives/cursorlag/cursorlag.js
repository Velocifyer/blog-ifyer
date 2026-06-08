//this is dual licensed CC-BY-SA and GPL2.0 or later and Apache 2.0 by velocifyer with the exception that velocifyer gets to use this under the CC-0 license
// If you modify this file remember to update the copyright notice

document.addEventListener("mousemove", (weridJSStuff) => {
  const ghost = document.createElement("div");
  ghost.setAttribute("class", "cursorghost");
  ghost.setAttribute("timecreated", Date.now());
  ghost.style.position = "absolute";
  ghost.style.left = (weridJSStuff.pageX - 4/* adjust this based on your cursor offset*/) + 'px';
  ghost.style.top  = (weridJSStuff.pageY - 4/* adjust this based on your cursor offset*/) + 'px';
  const body = document.body;
  document.body.appendChild(ghost, body);
})

//legacy garbage collector for older browsers
setInterval(function () {
  var elements = document.getElementsByClassName("cursorghost");
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].getAttribute("timecreated") < (Date.now() - 1337/* Adjust this based on your CSS animation duration. (set this to the time until it disapears in ms plus a little extra.)*/)) {
      elements[i].remove();
      i--;
    }
  }
}, 1000)//This adjusts the priority between CPU usage and RAM usage(higher means less CPU usage but more RAM usage) on browsers that do not use the modern garbage collocter, but on browsers that use the newer garbage collector it only changes CPU usage. I reccomend that you set it to 1hz (1000) if most browsers will support the modern garbage collector to avoid wasting CPU cycles on newer browsers.
