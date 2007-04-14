

function WidgetFactory() {
	
}

WidgetFactory.create = function(rdfSymbol, xhtmlContainer, providedFunctions) {
	var result;
	xhtmlContainer.style.border = "dashed";
	xhtmlContainer.style.borderWidth = "1px 1px 0px 0px";
	var controlArea = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
	controlArea.className = "controlArea";
	
	var viewSourceLink = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
	viewSourceLink.appendChild(document.createTextNode("RDF"));
	viewSourceLink.onclick = function() {
		alert(new XMLSerializer().serializeToString(RDFXMLSerializer.serialize(result.getStore(), rdfSymbol.uri)));
		return false;
	}
	viewSourceLink.href = "#";
	controlArea.appendChild(viewSourceLink);
	controlArea.appendChild(document.createTextNode(" "));
	var viewURILink = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
	viewURILink.appendChild(document.createTextNode("URI"));
	viewURILink.onclick = function() {
		alert(rdfSymbol.uri);
		return false;
	}
	viewURILink.href = "#";
	controlArea.appendChild(viewURILink);
	controlArea.appendChild(document.createTextNode(" "));
	var contextFunctionContainer = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
	controlArea.appendChild(contextFunctionContainer);
	var fillContextControler = function(contextFunctions) {		
		while (contextFunctionContainer.firstChild) {
			contextFunctionContainer.removeChild(contextFunctionContainer.firstChild);
		}
		for (var i = 0; i < contextFunctions.length; i++) {
			var controlFunction = contextFunctions[i];
			var functionLinkElement = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
			if (controlFunction.icon) {
				var functIcon = document.createElementNS("http://www.w3.org/1999/xhtml", "img");
				functionLinkElement.appendChild(functIcon);
				functIcon.src = controlFunction.icon;
				functIcon.alt = controlFunction.label;
			} else {
				functionLinkElement.appendChild(document.createTextNode(controlFunction.label));			
				
			}
			functionLinkElement.href = "#";
			contextFunctionContainer.appendChild(functionLinkElement);
			
			functionLinkElement.onclick = WidgetFactory.createOnClickFromPerform(controlFunction.perform);
			contextFunctionContainer.appendChild(document.createTextNode(" "));
		}
	}

	if (providedFunctions) {
		
		fillContextControler(providedFunctions);
		
	}
	var saveLink = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
	saveLink.style.visibility ="hidden";
	//saveLink.appendChild(document.createTextNode("Save"));
	var saveIcon = document.createElementNS("http://www.w3.org/1999/xhtml", "img");
	saveLink.appendChild(saveIcon);
	saveIcon.src = WidgetFactory.root+"mozile/images/silk/page_save.png";
	;
	saveLink.onclick = function() {
		result.save();
	}
	controlArea.appendChild(saveLink);
	xhtmlContainer.appendChild(controlArea);	
	var typeWidget = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
	typeWidget.className = "typeWidget";
	xhtmlContainer.appendChild(typeWidget);
	var controller = new Object();
	controller.modifiedStateChanged = function(newState) {
		if (newState) {
			saveLink.style.visibility ="";
		} else {
			saveLink.style.visibility ="hidden";
		}
	} 
	
	//	alert("hasType "+WidgetFactory.hasType(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#XHTMLInfoDB")));
	WidgetFactory.ensureDicoBitLoaded(rdfSymbol);
	if(WidgetFactory.hasType(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#XHTMLInfoDB"))) {
		result = new XHTMLInfoDBWidget(rdfSymbol, typeWidget, controller);
	} else {
		if (WidgetFactory.hasType(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#OrderedContent"))) {
			result = new OrderedContentWidget(rdfSymbol, typeWidget, controller);
		}	else {			
			if(WidgetFactory.hasType(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#TitledContent"))) {
				result = new TitledContentWidget(rdfSymbol, typeWidget);
			} else {
				throw new Error(rdfSymbol+" no good");
			}
		}
	}
	result.fillContextControler = fillContextControler;
	result.xhtmlContainer = xhtmlContainer
	result.rdfSymbol = rdfSymbol;
	if (result.getStore) {
		result.lastSavedContent = result.getStore();
		result.save = function() {
			var store = result.getStore();
			WidgetFactory.putData(result.rdfSymbol, store, result.lastSavedContent);
			result.lastSavedContent = store;
			result.controller.modifiedStateChanged(false);
		}
	}
	//alert(new XMLSerializer().serializeToString(RDFXMLSerializer.serialize(result.getStore(), rdfSymbol.uri)));
	return result;
}

WidgetFactory.createOnClickFromPerform = function(perform) {
	return function() {
		perform();
		return false;
	}
}


//mozile.debug.logLevel = "debug";

{
	var found = false;
	for(var i=0; i < mozile.edit.commands._commands.length; i++) {
		if(mozile.edit.commands._commands[i] == mozile.edit.save);
		//delete(mozile.edit.commands._commands[i]);
		found = true;
		if (found) {
			mozile.edit.commands._commands[i] = mozile.edit.commands._commands[i+1];
		}
	}
	mozile.edit.commands._commands.pop();
}

	
function XHTMLInfoDBWidget(rdfSymbol, xhtmlContainer, controller) {
	// Configure Mozile Basics
	mozile.root = WidgetFactory.root+"mozile/";
	mozile.useSchema("lib/xhtml.rng");
	this.rdfSymbol = rdfSymbol;
	this.controller = controller;
	
	var infobitProperty = WidgetFactory.store.anyStatementMatching(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#infoBit"), undefined);
	var objectElement = infobitProperty.object.elementValue;
	//var editableParagraph = document.createElementNS("http://www.w3.org/1999/xhtml", "p");
	//xhtmlContainer.appendChild(editableParagraph);
	WidgetFactory.appendChildrenInDiv(objectElement, xhtmlContainer);
	this.editableArea = xhtmlContainer.childNodes[0];
	mozile.editElement(this.editableArea);
	var modifiedTrue = function() {
		controller.modifiedStateChanged(true);
	}
	this.editableArea.addEventListener("change", modifiedTrue, false);
}

XHTMLInfoDBWidget.prototype.getStore = function() {
	var store = new RDFIndexedFormula();
	store.add(this.rdfSymbol, new RDFSymbol("http://discobits.org/ontology#infoBit"), new RDFLiteral(this.editableArea));
	store.add(this.rdfSymbol, 
		new RDFSymbol('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), 
		new RDFSymbol("http://discobits.org/ontology#XHTMLInfoDB"));
	return store;
}





function OrderedContentWidget(rdfSymbol, xhtmlContainer, controller) {
	this.controller = controller;
	this.rdfSymbol = rdfSymbol;
	this.load(rdfSymbol, xhtmlContainer);	
}

OrderedContentWidget.prototype.load = function(rdfSymbol, xhtmlContainer) {
	
    // there is a shorthand
	//var rdfType = new RDFSymbol("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")

	//var orderedContentStatement = WidgetFactory.store.statementsMatching(rdfSymbol, rdfType, new RDFSymbol("http://discobits.org/ontology#OrderedContent"));
    
    var containsStatements = WidgetFactory.store.statementsMatching(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#contains"), undefined);
    /*if (typeof(console) !=  'undefined') {
    	console.debug("containsStatements.length",containsStatements.length);
    }*/
    
    var dbDiv = document.createElementNS("http://www.w3.org/1999/xhtml", "ol");
    dbDiv.className = this.getDbDivClassName();
    
    
    var children = new Array();//the rdfSymbolS of the children, will accessible by childWidgets[i].rdfSymbol
    
    for(var i=0;i<containsStatements.length;i++) {
        var entry = containsStatements[i].object;
        var pos = WidgetFactory.store.statementsMatching(entry, new RDFSymbol("http://discobits.org/ontology#pos"), undefined);
        // alert("pos = "+pos);
   //     console.debug('pos',pos);
   		/*if (typeof(console) !=  'undefined') {
        	console.debug('pos[0].object',pos[0].object);
        }*/
        var holdsStatements = WidgetFactory.store.statementsMatching(entry, new RDFSymbol("http://discobits.org/ontology#holds"), undefined);
//        alert("holdsStatements = "+holdsStatements+" length="+holdsStatements.length);
		/*if (typeof(console) !=  'undefined') {
			console.debug('holdsStatements',holdsStatements);
		}*/
        children[pos[0].object] = holdsStatements[0].object; // 
    }
    this.childWidgets = new Array(children.length);
    for(var j=0;j<children.length;j++) {  
    	this.addChild(dbDiv, children[j], j);
    	
    }
    xhtmlContainer.appendChild(dbDiv);
    	
}

OrderedContentWidget.prototype.addChild = function(dbDiv,child, pos) {
	/*if (typeof(console) !=  'undefined') {
   		console.debug("recursing on "+child; 	
   	}*/
   	var li = document.createElementNS("http://www.w3.org/1999/xhtml", "li");
   	var div = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
   	this.positionHandling(pos, div);
   	var controlFunctions = this.getControlFunctions(li, pos);
   	
   	this.childWidgets[pos] = WidgetFactory.create(child, div, controlFunctions);
   	li.appendChild(div);
   	dbDiv.appendChild(li);
}

OrderedContentWidget.prototype.getControlFunctions = function(li, pos) {
	var controlFunctions = new Array();
	var allWidgets = this.childWidgets;
	var containerWidget = this;
	
	if (pos > 0) {
	   	var moveUpControl = new Object();
	   	moveUpControl.label = "UP";
	   	moveUpControl.perform = function() {
	   		if (!li.previousSibling) {
	   			alert("no previous element");
	   			return;
	   		}
	   		var previousLiElem = li.previousSibling;
	   		var ulElem = li.parentNode;
	   		ulElem.removeChild(li);
	   		ulElem.insertBefore(li, previousLiElem);
	   		var previousWidget = allWidgets[pos -1];
	   		allWidgets[pos -1] = allWidgets[pos];
	   		allWidgets[pos] = previousWidget;
	   		for (var i = 0; i < allWidgets.length; i++) {
	   			allWidgets[i].fillContextControler(containerWidget.getControlFunctions(ulElem.childNodes[i], i));
	   		}
	   		containerWidget.controller.modifiedStateChanged(true);
	   	}
	   	controlFunctions[controlFunctions.length] = moveUpControl;
	   	
   	}
   	if (pos < (this.childWidgets.length -1)) {
	   	var moveDownControl = new Object();
	   	moveDownControl.label = "DOWN";
	   	moveDownControl.perform = function() {
	   		if (!li.nextSibling) {
	   			alert("no next element");
	   			return;
	   		}
	   		var nextLiElem = li.nextSibling;
	   		var ulElem = li.parentNode;
	   		ulElem.removeChild(nextLiElem);
	   		ulElem.insertBefore(nextLiElem, li);
	   		var nextWidget = allWidgets[pos +1];
	   		allWidgets[pos +1] = allWidgets[pos];
	   		allWidgets[pos] = nextWidget;
	   		for (var i = 0; i < allWidgets.length; i++) {
	   			allWidgets[i].fillContextControler(containerWidget.getControlFunctions(ulElem.childNodes[i], i));
	   		}
	   		containerWidget.controller.modifiedStateChanged(true);
	   	}
	   	controlFunctions[controlFunctions.length] = moveDownControl;
   	}
   	
   	
   	var removeControl = new Object();
   	removeControl.label = "REMOVE"
   	removeControl.perform = function() {
   		var ulElem = li.parentNode;
   		ulElem.removeChild(li);
   		containerWidget.controller.modifiedStateChanged(true);
   		var j = 0;
   		for (var i = 0; i < allWidgets.length; i++) {
   			if (i != pos) {
	   			allWidgets[j] = allWidgets[i];
	   			j++;
	   		}
	   	}
	   	allWidgets.length = allWidgets.length-1;
	   	for (var i = 0; i < allWidgets.length; i++) {
		   	allWidgets[i].fillContextControler(containerWidget.getControlFunctions(ulElem.childNodes[i], i));
		}
   	}
   	controlFunctions[controlFunctions.length] = removeControl;
   	
   	return controlFunctions;
}

OrderedContentWidget.prototype.getDbDivClassName = function() {
	return "orderedContent";
}

OrderedContentWidget.prototype.positionHandling = function(pos, div) {
	//div.appendChild(document.createTextNode("regular: "));
}
OrderedContentWidget.prototype.getStore = function() {
	var store = new RDFIndexedFormula();
	store.add(this.rdfSymbol, 
		new RDFSymbol('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), 
		new RDFSymbol('http://discobits.org/ontology#OrderedContent'));
	for (var i = 0; i < this.childWidgets.length; i++) {
		var entry = this.getEntryForChild(store, i);
		store.add(this.rdfSymbol,  
		new RDFSymbol('http://discobits.org/ontology#contains'),
		entry);
	}
	return store;
}

OrderedContentWidget.prototype.getEntryForChild = function(store, entryPos) {
	var result = new RDFBlankNode();
	store.add(result, 
		new RDFSymbol('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), 
		new RDFSymbol('http://discobits.org/ontology#Entry'));
	store.add(result,  
		new RDFSymbol('http://discobits.org/ontology#pos'),
		new RDFLiteral(entryPos));
	store.add(result,  
		new RDFSymbol('http://discobits.org/ontology#holds'),
		this.childWidgets[entryPos].rdfSymbol);
	return result;
}


function TitledContentWidget(rdfSymbol, xhtmlContainer) {
	this.load(rdfSymbol, xhtmlContainer);
}
TitledContentWidget.prototype.load = OrderedContentWidget.prototype.load;
TitledContentWidget.prototype.addChild = OrderedContentWidget.prototype.addChild;
TitledContentWidget.prototype.getControlFunctions = function(li, pos) {
	controlFunctions = new Array();
	return controlFunctions;
}

TitledContentWidget.prototype.getDbDivClassName = function() {
	return "titledContent";
}

TitledContentWidget.prototype.positionHandling = function(pos, div) {
	if (pos == 0) {
		WidgetFactory.addClass(div, "title");
	}
	
	if (pos == 1) {
		WidgetFactory.addClass(div, "content");
	}
}

// helpers ////////////
WidgetFactory.addClass = function(elem, className) {
	//elem.className += "foo bar ";
	elem.className += " "+className;
	
}
WidgetFactory.hasType = function(rdfSymbol, type) {
 	//alert("anyStatementMatching for "+rdfSymbol+WidgetFactory.store.anyStatementMatching(rdfSymbol, undefined, undefined));
	//return (typeof(WidgetFactory.store.anyStatementMatching(rdfSymbol, undefined, type)) != 'undefined')
	return (typeof(WidgetFactory.store.anyStatementMatching(rdfSymbol, new RDFSymbol('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), type)) != 'undefined')
}

WidgetFactory.appendChildrenInDiv = function(objectElement, xhtmlContainer) {
		var div = document.createElementNS("http://www.w3.org/1999/xhtml", "p");
		/*if (typeof(console) !=  'undefined') {
			console.debug(objectElement);
		}*/
		for( var i=0; i< objectElement.childNodes.length; i++ ){
			/*if (typeof(console) !=  'undefined') {
				console.debug("adding node "+i+" "+objectElement.childNodes[i]);
			}*/
			div.appendChild(objectElement.childNodes[i].cloneNode(true));		
		}
		xhtmlContainer.appendChild(div);	
	}
WidgetFactory.putData = function(rdfSymbol, store, previousStore) {
	var url = rdfSymbol.uri;
	var xhr = Util.XMLHTTPFactory();
	var collectionURL = url.substring(0, url.lastIndexOf('/')+1);
	xhr.open("CHECKOUT", collectionURL, false);
	xhr.setRequestHeader("Content-Type", "textxml");
	xhr.send("<D:checkout xmlns:D=\"DAV:\"/>");
	xhr = Util.XMLHTTPFactory();
	xhr.open("PUT", url, false);
	xhr.setRequestHeader("Content-Type", "appication/rdf+xml");
	xhr.send(new XMLSerializer().serializeToString(RDFXMLSerializer.serialize(store, rdfSymbol.uri)));
	//alert(xhr.responseText);
	xhr.open("CHECKIN", collectionURL, false);
	xhr.send("");
	xhr = Util.XMLHTTPFactory();
}

WidgetFactory.ensureDicoBitLoaded = function(rdfSymbol) {
	if (typeof(WidgetFactory.store.anyStatementMatching(rdfSymbol)) == 'undefined') {
		WidgetFactory.load(rdfSymbol.uri, WidgetFactory.store);
	}
}

WidgetFactory.createURIderefURL = function(uri) {
	return uri;
}
WidgetFactory.load = function(url, pStore) {
	var store;
	if (pStore) {
		store = pStore;
	} else {
		store = new RDFIndexedFormula();
	}
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
	xhr.open("GET", WidgetFactory.createURIderefURL(url), false);
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
	if (typeof(console) !=  'undefined') {
		console.debug('store',store);
	}
	
	return store;
}
WidgetFactory.store = new RDFIndexedFormula();//WidgetFactory.load(document.location.toString().substring(0, document.location.toString().lastIndexOf('/')+1)+'sample1b.rdf');



//////////////////




