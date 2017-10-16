var NavNode = function(root, parentTitle, parentURL, childURL) {
    this.type = "nav";
    this.root = root;
    this.parentTitle = parentTitle;
    this.parentURL = parentURL;
    this.childURL = childURL;
    this.visitTime = new Date();
}

function blacklistCheck(url) {
    if (!url) return false;
    if (blacklistComplete.indexOf(url) != -1) return false;
    for (var i = 0; i < blackListIncomplete.length; i++) {
        if (url.includes(blackListIncomplete[i])) return false;
    }
    return true;
}

function wasClicked(element) {
    console.log("Navigating to page: " + element.href.split("#")[0]);

    chrome.runtime.sendMessage(
        new NavNode("all-browsing", parentWindowTitle, parentWindowURL, element.href.split("#")[0]);,
        function(response) {
            console.log(response);
        }
    );

    if (rootNode) {
        chrome.runtime.sendMessage(
            new NavNode("all-browsing", rootNode, parentWindowURL, element.href.split("#")[0]);,
            function(response) {
                console.log(response);
            }
        );
    }
}

// The code below is run
var blacklistComplete = ["#", "about:blank", "AddThis Utility Frame", "javascript:void(0)"];
var blackListIncomplete = ["googleads", "doubleclick.net", "googlesyndication"];
var rootNode = null;
var parentWindowURL, parentWindowTitle;

try {
    parentWindowURL = top.document.URL.split("#")[0];
    parentWindowTitle = (top.document.title ? top.document.title : top.document.URL.split("/")[2]);
    // Sets parentWindowTitle to the document title if it exists or the URL excluding any 'http(s)://'

    if (blacklistCheck(parentWindowURL)) {
        var links = document.links;
        var count = 0;
        for (var i = 0; i < links.length; i++) { // Injects function into each link
            if (links[i].href && blacklistCheck(links[i].href)) {
                links[i].addEventListener("click", function() {
                    wasClicked(this);
                });
                count++;
            }
        }
        safari.self.addEventListener("message", handleMessage, false);
    }
    console.log("Accessing higher page");
    console.log("Injected " + count + " listeners");
    if (rootNode) console.log("root is " + rootNode);
    else console.log("No root");
} catch (e) {
    parentWindowURL = document.URL.split("#")[0];
    parentWindowTitle = (document.title ? document.title : document.URL.split("/")[2]);

    if (blacklistCheck(parentWindowURL)) {
        var links = document.links;
        for (var i = 0; i < links.length; i++) { // Injects function into each link
            if (links[i].href && blacklistCheck(links[i].href)) {
                links[i].addEventListener("click", function() {
                    wasClicked(this);
                });
            }
        }
        safari.self.addEventListener("message", handleMessage, false);
    }
    console.log("Sticking to this page");
}
