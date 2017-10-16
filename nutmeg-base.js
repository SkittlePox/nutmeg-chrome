// Custom objects
var Node = function(url, title, childrenURLs, firstVisit, lastVisit) {
    this.url = url;
    this.title = title;
    this.nick = title;
    this.childrenURLs = childrenURLs;
    this.firstVisit = firstVisit;
    this.lastVisit = lastVisit;
}

var RecentStoreNode = function(url, root) {
    this.url = url;
    this.root = root;
}

var Tree = function(root, nodes) {
    this.root = root;
    this.nodes = nodes;
}

var QueuedNode = function(url, root) {
    this.url = url;
    this.root = root;
}

// Main functions
function handleNav(navNode) {
    if (db === undefined) {
        console.log("Not connected to database");
        return;
    }
    console.log("Handling navigation node");
    if (!db.objectStoreNames.contains(navNode.root)) {
        newObjStore(NavNode.root, navNode, handleNav);
    } else {
        var rootStore = db.transaction([navNode.root], "readwrite").objectStore(navNode.root); // Access object store
        var fetchParentRequest = rootStore.get(navNode.parentURL);

        fetchParentRequest.onsuccess = function() {
            console.log("Inside store " + navNode.root);
            if (fetchParentRequest.result) { // If the parent already exists in the database
                var fetchedParent = fetchParentRequest.result;
                if (navNode.childURL && fetchedParent.childrenURLs.indexOf(navNode.childURL) == -1) { // If the URL is not already in the fetched node's child URL list
                    fetchedParent.childrenURLs.push(navNode.childURL);
                    console.log("Appending children to " + fetchedParent.url);
                    rootStore.put(fetchedParent);
                    if (navNode.childURL) {
                        var childAdd = rootStore.add(new Node(navNode.childURL, null, [], new Date(), new Date())); // Bounces if the entry already exists
                        childAdd.onsuccess = function() {
                            console.log("Adding child node " + navNode.childURL);
                        }
                    }
                }
            } else { // If the parent does not exist, we need to add it in
                if (navNode.childURL) rootStore.add(new Node(navNode.parentURL, navNode.parentTitle, [navNode.childURL], navNode.visitTime, navNode.visitTime));
                else rootStore.add(new Node(navNode.parentURL, navNode.parentTitle, [], navNode.visitTime, navNode.visitTime));
                console.log("Adding parent node " + navNode.parentURL);
                if (navNode.childURL) {
                    var childAdd = rootStore.add(new Node(navNode.childURL, null, [], navNode.visitTime, navNode.visitTime)); // Bounces if the entry already exists
                    childAdd.onsuccess = function() {
                        console.log("Adding child node " + navNode.childURL);
                    }
                }
            }
            console.log("Finished with store " + navNode.root);
        }
    }
}

// Finished
function linkDB(version, callbackArg, callback) {
    var openRequest;
    if (version === undefined) openRequest = indexedDB.open(databaseName);
    else openRequest = indexedDB.open(databaseName, version);

    openRequest.onupgradeneeded = function(e) {
        var softDB = e.target.result;

        if (!softDB.objectStoreNames.contains("all-browsing")) {
            var objectStore = softDB.createObjectStore("all-browsing", {
                keyPath: "url"
            });
        }

        console.log("Database Updated to Version " + softDB.version);
    }

    openRequest.onsuccess = function(e) {
        db = e.target.result;
        console.log("Successfully connected to database " + databaseName);
        if (callback) callback(callbackArg);
    }

    openRequest.onerror = function(e) {
        console.error("Error connecting to database " + databaseName);
        console.dir(e);
    }
}

// Finished
function newObjStore(storeName, callbackArg, callback) { // Add new root
    if (db === undefined) {
        console.log("Failed to create new object store: " + storeName);
        return;
    }
    if (db.objectStoreNames.contains(storeName)) {
        console.log("Object store " + storeName + " already exists");
        return;
    }
    console.log("Closing database " + databaseName + " to add new object store " + storeName);
    db.close();

    var injectRequest = indexedDB.open(databaseName);

    injectRequest.onsuccess = function(e1) {
        var intermediateDB = e1.target.result;
        var version = parseInt(intermediateDB.version);
        console.log("Version extracted for injection: " + version);
        intermediateDB.close();

        var payloadRequest = indexedDB.open(databaseName, version + 1);

        payloadRequest.onupgradeneeded = function(e2) {
            var softDB = e2.target.result;
            softDB.createObjectStore(storeName, {
                keyPath: "url"
            });
            console.log("Object store inserted: " + storeName);
        }

        payloadRequest.onsuccess = function(e2) {
            db = e2.target.result;
            console.log("Database variable updated to " + db.version);
            if (callback) callback(callbackArg);
        }
    }
}

// Finished
function nukeEverything() {
    if (db === undefined) {
        console.log("Failed to nuke database");
        return;
    }
    db.close();

    var injectRequest = indexedDB.open(databaseName);

    injectRequest.onsuccess = function(e1) {
        var intermediateDB = e1.target.result;
        var version = parseInt(intermediateDB.version);
        console.log("Version Extracted: " + version);
        intermediateDB.close();

        var payloadRequest = indexedDB.open(databaseName, version + 1);

        payloadRequest.onupgradeneeded = function(e2) {
            var softDB = e2.target.result;
            var objStores = softDB.objectStoreNames;
            for (var i = 0; i < objStores.length; i++) {
                softDB.deleteObjectStore(objStores[i]);
                console.log("Deleted object store " + objStores[i]);
            }
            console.log("Finished store deletion");
        }

        payloadRequest.onsuccess = function(e2) {
            db = e2.target.result;
            localStorage.clear(); // Clear localStorage
            console.log("Database Variable Updated");
        }
    }
}

// Finished
function deleteStores(storeNames) {
    if (db === undefined) {
        console.log("Failed to delete object stores: " + storeNames);
        return;
    }
    db.close();

    var injectRequest = indexedDB.open(databaseName);

    injectRequest.onsuccess = function(e1) {
        var intermediateDB = e1.target.result;
        var version = parseInt(intermediateDB.version);
        console.log("Version Extracted: " + version);
        intermediateDB.close();

        var payloadRequest = indexedDB.open(databaseName, version + 1);

        payloadRequest.onupgradeneeded = function(e2) {
            var softDB = e2.target.result;
            for (var i = 0; i < storeNames.length; i++) {
                softDB.deleteObjectStore(storeNames[i]);
            }
            console.log("Store Deletion Successful");
        }

        payloadRequest.onsuccess = function(e2) {
            db = e2.target.result;
            console.log("Database Variable Updated");
        }
    }
}

// Listeners
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        switch (request.type) {
            case "nav":
                handleNav(request);
                break;
        }
        sendResponse("bar");
    }
);

// The code below is run on initialization of extension/browser
var db, databaseName = "nutmeg-stash";
linkDB();
