// depends on:
//  dig.csail.mit.edu/2005/ajar/ajaw/rdf/term.js
//  dig.csail.mit.edu/2005/ajar/ajaw/uri.js
//  dig.csail.mit.edu/2005/ajar/ajaw/rdf/rdfparser.js

// TestStore implementation from dig.csail.mit.edu/2005/ajar/ajaw/test/rdf/rdfparser.test.html
// see also RDFIndexedFormula from dig.csail.mit.edu/2005/ajar/ajaw/rdf/identity.js
//  (extends RDFFormula from dig.csail.mit.edu/2005/ajar/ajaw/rdf/term.js no indexing and smushing)
// for the real implementation used by Tabulator which uses indexing and smushing

function load(url) {
var store = new RDFIndexedFormula()
var parser = new RDFParser(store);
parser.reify = parser.forceRDF = true;
// forceRDF isn't used??


// var url = 'http://something.or/other';

// get the XML
var xhr = Util.XMLHTTPFactory(); // returns a new XMLHttpRequest, or ActiveX XMLHTTP object
if (xhr.overrideMimeType) {
    xhr.overrideMimeType("text/xml");
}
// the "data/" path and encoding is just how I store files locally
xhr.open("GET", url, false);
// xhr.open("GET", "data/" + encodeURIComponent(encodeURIComponent(url)), false);
xhr.send("");
var nodeTree = xhr.responseXML;
if (nodeTree === null && xhr.responseText !== null) {
    // Only if the server fails to set Content-Type: text/xml AND xmlhttprequest doesn't have the overrideMimeType method
    console.debug("no responseXML, parsing responseText");
    nodeTree = (new DOMParser()).parseFromString(xhr.responseText, 'text/xml');
}
// must be an XML document node tree
parser.parse(nodeTree,url);

// use FireBug extension to inspect console.debug'd objects
// Using TestStore you can access store.triples
console.debug('store',store);

return store;
}