export default async function ({ addon }) {
  var script = document.createElement('script'); 
  script.src="//cdn.jsdelivr.net/npm/eruda"; 
  
  let accountNavDropdownButton = document.querySelector(".account-nsv > a"); 
  let signOutButton = document.querySelector(".account-nav > li.divider > a");
  // hopefully these are the only anchor elements that aren't proper links because react breaks stuff on www
  // it doesn't work anyway
  
  // adapted from https://github.com/DerDer56/defresh/blob/master/defresh.js
var d = document,
  x,
  ActiveXObject,
  p = {};
window.addEventListener("keyup", function(e) {
  delete p[e.key];
});
window.addEventListener("keydown", function(e) {
  p[e.key] = true;
});  
function defresh(r, a) {
  alert(r + "\n" + a);
  if (window.XMLHttpRequest && window.history) {
    x = new XMLHttpRequest();
  }
  x.onreadystatechange = function() {
    if (
      this.readyState == 4 &&
      r != window.location.pathame
    ) {
      if (a.toLowerCase() == "push") {
        window.history.pushState({ page: r }, "", r);
      }
      if (a.toLowerCase() == "replace") {
        window.history.replaceState({ page: r }, "", r);
      }
      o(this.responseText);
    }
    if (
      (this.readyState == 4 && this.responseText.indexOf("defresh.js") < 0) ||
      !window.XMLHttpRequest ||
      !window.history
    ) {
      if (a.toLowerCase() == "replace") {
        window.location.replace(r);
      }
      if (a.toLowerCase() == "push") {
        window.location.href = r;
      } else {
        o(this.responseText);
      }
    }
    function o(e) {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
      d.open();
      d.write(e);
      d.close();
    }
  };
  x.open("GET", r + "#" + Date.now(), true);
  x.send();
}
window.addEventListener("popstate", () => {
  defresh(window.location.pathname, "none");
});
while (true) {
    let l = await addon.tab.waitForElement("a[href]", {markAsSeen: true});
    
    if (l.isSameNode(accountNavDropdownButton) || l.isSameNode(signOutButton)) return;
    if (
      l.target != "_blank" &&
      l.target != "_parent" &&
      !l.hasAttribute("download") &&
      l.pathname.indexOf(".") < 0 &&
      l.hostname === "scratch.mit.edu" &&
      (
        l.hash || window.location.hash ?
        l.pathname === window.location.pathname
        : true
        )
    ) {
      let href = l.href;
      l.addEventListener("click",  function(e) {
        if (
          p.Control != true &&
          p.Shift != true &&
          p.Meta != true
        ) {
          e.preventDefault();
          defresh(href, "push");
          //alert("moo");
        }
      });
    }// else alert(l.href);
  }
}
