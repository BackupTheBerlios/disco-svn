

function WidgetFactory() {
	
}

WidgetFactory.store = load(document.location.toString().substring(0, document.location.toString().lastIndexOf('/')+1)+'sample1b.rdf');
WidgetFactory.create = function(rdfSymbol, xhtmlContainer) {
	var result;
	xhtmlContainer.style.border = "dashed";
	xhtmlContainer.style.borderWidth = "1px 1px 0px 0px";
	var controlArea = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
	controlArea.className = "controlArea";
	var viewSourceLink = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
	viewSourceLink.appendChild(document.createTextNode("RDF"));
	viewSourceLink.onclick = function() {
		alert(new XMLSerializer().serializeToString(RDFXMLSerializer.serialize(result.getStore(), rdfSymbol.uri)));
	}
	viewSourceLink.href = "#";
	controlArea.appendChild(viewSourceLink);
	var saveLink = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
	saveLink.style.visibility ="hidden";
	//saveLink.appendChild(document.createTextNode("Save"));
	var saveIcon = document.createElementNS("http://www.w3.org/1999/xhtml", "img");
	saveLink.appendChild(saveIcon);
	saveIcon.src = "../scripts/mozile/images/silk/page_save.png";
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
		if(WidgetFactory.hasType(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#OrderedContent"))) {
			result = new OrderedContentWidget(rdfSymbol, typeWidget);
		}	else {			
			if(WidgetFactory.hasType(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#TitledContent"))) {
				result = new TitledContentWidget(rdfSymbol, typeWidget);
			}
		}
	}
	return result;
}


// Configure Mozile Basics
mozile.root = "../scripts/mozile/";
mozile.useSchema("lib/xhtml.rng");
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

XHTMLInfoDBWidget.prototype.save = function() {
	var store = this.getStore();
	//alert("saving "+new XMLSerializer().serializeToString(RDFXMLSerializer.serialize(this.getStore())));
	WidgetFactory.putData(this.rdfSymbol, store);
	this.controller.modifiedStateChanged(false);
}



function OrderedContentWidget(rdfSymbol, xhtmlContainer) {
	this.load(rdfSymbol, xhtmlContainer);
}

OrderedContentWidget.prototype.load = function(rdfSymbol, xhtmlContainer) {

    // there is a shorthand
	//var rdfType = new RDFSymbol("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")

	//var orderedContentStatement = WidgetFactory.store.statementsMatching(rdfSymbol, rdfType, new RDFSymbol("http://discobits.org/ontology#OrderedContent"));
    
    var containsStatements = WidgetFactory.store.statementsMatching(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#contains"), undefined);
    if (typeof(console) !=  'undefined') {
    	console.debug("containsStatements.length",containsStatements.length);
    }
    
    var dbDiv = document.createElementNS("http://www.w3.org/1999/xhtml", "ol");
    dbDiv.className = this.getDbDivClassName();
    
    
    var children = new Array();//containsStatements.length);
    
    for(var i=0;i<containsStatements.length;i++) {
        var entry = containsStatements[i].object;
        var pos = WidgetFactory.store.statementsMatching(entry, new RDFSymbol("http://discobits.org/ontology#pos"), undefined);
        // alert("pos = "+pos);
   //     console.debug('pos',pos);
   		if (typeof(console) !=  'undefined') {
        	console.debug('pos[0].object',pos[0].object);
        }
        var holdsStatements = WidgetFactory.store.statementsMatching(entry, new RDFSymbol("http://discobits.org/ontology#holds"), undefined);
//        alert("holdsStatements = "+holdsStatements+" length="+holdsStatements.length);
		if (typeof(console) !=  'undefined') {
			console.debug('holdsStatements',holdsStatements);
		}
        children[pos[0].object] = holdsStatements[0].object; // 
    }
    for(var j=0;j<children.length;j++) {  
    	// recurse  
    	if (typeof(console) !=  'undefined') {
    		console.debug("recursing on "+children[j]); 	
    	}
    	var li = document.createElementNS("http://www.w3.org/1999/xhtml", "li");
    	var div = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    	this.positionHandling(j, div);
    	WidgetFactory.create(children[j], div);
    	li.appendChild(div);
    	dbDiv.appendChild(li);
    }
    xhtmlContainer.appendChild(dbDiv);
    	
}

OrderedContentWidget.prototype.getDbDivClassName = function() {
	return "orderedContent";
}

OrderedContentWidget.prototype.positionHandling = function(pos, div) {
	//div.appendChild(document.createTextNode("regular: "));
}

function TitledContentWidget(rdfSymbol, xhtmlContainer) {
	this.load(rdfSymbol, xhtmlContainer);
}
TitledContentWidget.prototype.load = OrderedContentWidget.prototype.load;

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
		if (typeof(console) !=  'undefined') {
			console.debug(objectElement);
		}
		for( var i=0; i< objectElement.childNodes.length; i++ ){
			if (typeof(console) !=  'undefined') {
				console.debug("adding node "+i+" "+objectElement.childNodes[i]);
			}
			div.appendChild(objectElement.childNodes[i].cloneNode(true));		
		}
		xhtmlContainer.appendChild(div);	
	}
WidgetFactory.putData = function(rdfSymbol, store) {
	var url = rdfSymbol.uri;
	var xhr = Util.XMLHTTPFactory();
	var collectionURL = url.substring(0, url.lastIndexOf('/')+1);
	xhr.open("CHECKOUT", collectionURL, false);
	xhr.setRequestHeader("Content-Type", "appication/rdf+xml");
	xhr.send();
	xhr = Util.XMLHTTPFactory();
	xhr.open("PUT", url, false);
	xhr.setRequestHeader("Content-Type", "appication/rdf+xml");
	xhr.send(new XMLSerializer().serializeToString(RDFXMLSerializer.serialize(store, rdfSymbol.uri)));
	//alert(xhr.responseText);
	xhr.open("CHECKIN", collectionURL, false);
	xhr.setRequestHeader("Content-Type", "appication/rdf+xml");
	xhr.send();
	xhr = Util.XMLHTTPFactory();
}

WidgetFactory.ensureDicoBitLoaded = function(rdfSymbol) {
	if (typeof(WidgetFactory.store.anyStatementMatching(rdfSymbol)) == 'undefined') {
		load(rdfSymbol.uri, WidgetFactory.store);
	}
}



//////////////////




