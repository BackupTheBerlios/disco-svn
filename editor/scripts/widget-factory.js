xhtmlNS  = "http://www.w3.org/1999/xhtml";

function RDF(localName) {
	return new RDFSymbol('http://www.w3.org/1999/02/22-rdf-syntax-ns#'+localName);
}

function RDFS(localName) {
	return new RDFSymbol('http://www.w3.org/2000/01/rdf-schema#'+localName);
}

function WidgetFactory() {
	
}

WidgetFactory.typeWidgets = new Array();


/**
 * Creates a new widget
 * ...
 * @param {RDFIndexedFormula} lastSavedContent the last saved version of the store, if this is provided the save-link is active in the new widget
 * @type String
 */
WidgetFactory.create = function(rdfSymbol, xhtmlContainer, providedFunctions, store, widgetHolder, lastSavedContent) {
	
	//private functions
	var fillController = function(functions, container) {
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}
		for (var i = 0; i < functions.length; i++) {
			var controlFunction = functions[i];
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
			container.appendChild(functionLinkElement);
			
			functionLinkElement.onclick = WidgetFactory.createOnClickFromPerform(controlFunction.perform);
			container.appendChild(document.createTextNode(" "));
		}
	}
	
	var getGenericControls = function() {
		var controlFunctions = new Array();
		var RDFControl = new Object();
	   	RDFControl.label = "RDF"
	   	RDFControl.perform = function() {
	   		mozile.edit.disable();
		   	var div = document.createElementNS(xhtmlNS, "div");
			var textarea = document.createElementNS(xhtmlNS, "textarea");
			div.appendChild(textarea);
			var useButton = document.createElementNS(xhtmlNS, "button");
			useButton.appendChild(document.createTextNode("use"));
			div.appendChild(useButton);
			var discardButton = document.createElementNS(xhtmlNS, "button");
			discardButton.appendChild(document.createTextNode("discard"));
			div.appendChild(discardButton);
			var body = document.getElementsByTagNameNS(xhtmlNS,"body")[0];
			div.className = "sourceEdit";
			textarea.appendChild(document.createTextNode(new XMLSerializer().serializeToString(RDFXMLSerializer.serialize(widget.getStore(), ""))));
	   		body.appendChild(div);
	   		useButton.onclick = function() {
	   			var editedStore = new RDFIndexedFormula();
	   			var nodeTree = (new DOMParser()).parseFromString(textarea.value, 'text/xml');
	   			var parser = new RDFParser(editedStore);
	   			parser.parse(nodeTree,rdfSymbol.uri);
				while (xhtmlContainer.firstChild) {
					xhtmlContainer.removeChild(xhtmlContainer.firstChild);
				}
				WidgetFactory.create(rdfSymbol, xhtmlContainer, providedFunctions, editedStore, widgetHolder, widget.lastSavedContent);
				body.removeChild(div);
				mozile.edit.enable();
	   		}
	   		discardButton.onclick = function() {
				body.removeChild(div);
				mozile.edit.enable();
	   		}
   		}
   		controlFunctions[controlFunctions.length] = RDFControl;
   		
   		/* control to view RDF to be revoked
   		var revRDFControl = new Object();
	   	revRDFControl.label = "REVRDF"
	   	revRDFControl.perform = function() {
	   	
	   		alert(new XMLSerializer().serializeToString(RDFXMLSerializer.serialize(widget.lastSavedContent, "")));
   		}
   		controlFunctions[controlFunctions.length] = revRDFControl;
   		*/
   		var uriControl = new Object();
	   	uriControl.label = "URI"
	   	uriControl.perform = function() {
	   		alert(rdfSymbol.uri);
   		}
   		controlFunctions[controlFunctions.length] = uriControl;
   		
   		var reloadControl = new Object();
	   	reloadControl.label = "RELOAD"
	   	reloadControl.perform = function() {
			var reloadedStore = new RDFIndexedFormula();
			WidgetFactory.load(rdfSymbol.uri, reloadedStore);
			while (xhtmlContainer.firstChild) {
				xhtmlContainer.removeChild(xhtmlContainer.firstChild);
			}
			WidgetFactory.create(rdfSymbol, xhtmlContainer, providedFunctions, reloadedStore, widgetHolder);

   		}
   		controlFunctions[controlFunctions.length] = reloadControl;
   		
	 	return controlFunctions;
	}
	
	var widget;
	xhtmlContainer.style.border = "dashed";
	xhtmlContainer.style.borderWidth = "1px 1px 0px 0px";
	
	var saveLink = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
	saveLink.style.visibility ="hidden";
	//saveLink.appendChild(document.createTextNode("Save"));
	var saveIcon = document.createElementNS("http://www.w3.org/1999/xhtml", "img");
	saveLink.appendChild(saveIcon);
	saveIcon.src = WidgetFactory.root+"mozile/images/silk/page_save.png";
	;
	saveLink.onclick = function() {
		widget.save();
	}
	var controlArea = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
	controlArea.className = "controlArea";
	
	//order: genericControls, widgetControls, contextControls, save
	var genericFunctionContainer = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
	controlArea.appendChild(genericFunctionContainer);
	var widgetFunctionContainer = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
	controlArea.appendChild(widgetFunctionContainer);
	var contextFunctionContainer = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
	controlArea.appendChild(contextFunctionContainer);
	xhtmlContainer.appendChild(controlArea);
	controlArea.appendChild(saveLink);
	
	fillController(getGenericControls(), genericFunctionContainer);
	
	var fillContextControler = function(contextFunctions) {
		fillController(contextFunctions, contextFunctionContainer);
	}

	if (providedFunctions) {
		fillContextControler(providedFunctions);
	}
		
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
	if (!store) {
		var store = WidgetFactory.store;
		WidgetFactory.ensureDicoBitLoaded(rdfSymbol);
	}
	
	//	alert("hasType "+WidgetFactory.hasType(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#XHTMLInfoDB")));
	
	for (var i = 0; i < WidgetFactory.typeWidgets.length; i++) {
		if (WidgetFactory.hasType(rdfSymbol, WidgetFactory.typeWidgets[i].type, store)) {
			widget = new WidgetFactory.typeWidgets[i](store, rdfSymbol, typeWidget, controller);
			break;
		}
	}

	if (widget == null) {
		//throw new Error(rdfSymbol+" no good");
		widget = new TypeSelectionWidget(rdfSymbol, typeWidget, xhtmlContainer, providedFunctions);
	}

	if (widget.getWidgetControls) {
		fillController(widget.getWidgetControls(), widgetFunctionContainer);
	}
	widget.fillContextControler = fillContextControler;
	widget.xhtmlContainer = xhtmlContainer
	widget.rdfSymbol = rdfSymbol;
	widget.controller = controller;
	if (lastSavedContent) {
		widget.lastSavedContent = lastSavedContent;
		widget.controller.modifiedStateChanged(true);
	} else {
		if (widget.getStore) {
			widget.lastSavedContent = widget.getStore();
		}
	}
	if (widget.getStore) {
		widget.save = function() {
			var widgetStore = widget.getStore();
			WidgetFactory.putData(widget.rdfSymbol, widgetStore, widget.lastSavedContent);
			widget.lastSavedContent = widgetStore;
			widget.controller.modifiedStateChanged(false);
		}
	}
	//alert(new XMLSerializer().serializeToString(RDFXMLSerializer.serialize(widget.getStore(), rdfSymbol.uri)));
	if (!widgetHolder) {
		var widgetHolder = new Object();
	}
	widgetHolder.widget = widget;
	return widgetHolder;
}

WidgetFactory.createOnClickFromPerform = function(perform) {
	return function() {
		perform();
		return false;
	}
}

TypeSelectionWidget = function(rdfSymbol, typeWidget, xhtmlContainer, providedFunctions) {
	var select = document.createElementNS("http://www.w3.org/1999/xhtml", "select");
	typeWidget.appendChild(select);
	var selectText = "--- select type ----";
	var option = document.createElementNS("http://www.w3.org/1999/xhtml", "option");
		select.appendChild(option);
		option.appendChild(document.createTextNode(selectText));
	for (var i = 0; i < WidgetFactory.typeWidgets.length; i++) {
		var option = document.createElementNS("http://www.w3.org/1999/xhtml", "option");
		select.appendChild(option);
		option.appendChild(document.createTextNode(WidgetFactory.typeWidgets[i].type.uri));
	}
	var button = document.createElementNS("http://www.w3.org/1999/xhtml", "button");
	button.appendChild(document.createTextNode("set"));
	button.disabled = true;
	typeWidget.appendChild(button);
	select.onchange = function() {
		button.disabled = (this.value == selectText);
	};
	button.onclick = function() {
		WidgetFactory.store.add(rdfSymbol, 
			new RDFSymbol('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), 
			new RDFSymbol(select.value));
		while (xhtmlContainer.firstChild) {
			xhtmlContainer.removeChild(xhtmlContainer.firstChild);
		}
		WidgetFactory.create(rdfSymbol, xhtmlContainer, providedFunctions, undefined, undefined, new RDFIndexedFormula());
		//alert(select.value);
	};
}


//mozile.debug.logLevel = "debug";

{
	
	if (mozile.edit) {
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
}

	
function XHTMLInfoDBWidget(store, rdfSymbol, xhtmlContainer, controller) {
	// Configure Mozile Basics
	mozile.root = WidgetFactory.root+"mozile/";
	mozile.useSchema("lib/xhtml.rng");
	this.rdfSymbol = rdfSymbol;
	this.controller = controller;
	this.xhtmlContainer = xhtmlContainer;
	this.loadData(store);
}

WidgetFactory.typeWidgets.push(XHTMLInfoDBWidget);

XHTMLInfoDBWidget.type = new RDFSymbol("http://discobits.org/ontology#XHTMLInfoDB");


XHTMLInfoDBWidget.prototype.getWidgetControls = function() {
	var controlFunctions = new Array();
	var RDFControl = new Object();
   	RDFControl.label = "XHTML"
   	var widget = this;
   	RDFControl.perform = function() {
   		mozile.edit.disable();
	   	var div = document.createElementNS(xhtmlNS, "div");
		var textarea = document.createElementNS(xhtmlNS, "textarea");
		div.appendChild(textarea);
		var useButton = document.createElementNS(xhtmlNS, "button");
		useButton.appendChild(document.createTextNode("use"));
		div.appendChild(useButton);
		var discardButton = document.createElementNS(xhtmlNS, "button");
		discardButton.appendChild(document.createTextNode("discard"));
		div.appendChild(discardButton);
		var body = document.getElementsByTagNameNS(xhtmlNS,"body")[0];
		div.className = "sourceEdit";
		var serialized = "";
		for (var i = 0; i < widget.editableArea.childNodes.length; i++) {
			serialized += new XMLSerializer().serializeToString(widget.editableArea.childNodes[i]);
		}
		textarea.appendChild(document.createTextNode(serialized));
   		body.appendChild(div);
   		useButton.onclick = function() {
   			var editedStore = new RDFIndexedFormula();
   			var nodeTree = (new DOMParser()).parseFromString("<elem xmlns=\"http://www.w3.org/1999/xhtml\">"+textarea.value+"</elem>", 'text/xml');
   			//alert(new XMLSerializer().serializeToString(nodeTree));
   			while (widget.editableArea.firstChild) {
	   			widget.editableArea.removeChild(widget.editableArea.firstChild);
   			}
   			for (var i = 0; i < nodeTree.documentElement.childNodes.length; i++) {
				widget.editableArea.appendChild(nodeTree.documentElement.childNodes[i].cloneNode(true));
			}
			widget.controller.modifiedStateChanged(true);
   			body.removeChild(div);
			mozile.edit.enable();
   		}
   		discardButton.onclick = function() {
			body.removeChild(div);
			mozile.edit.enable();
   		}
  		}
  		controlFunctions[controlFunctions.length] = RDFControl;
  		return controlFunctions;
}   		

XHTMLInfoDBWidget.prototype.loadData = function(store) {
	var infobitProperty = store.anyStatementMatching(this.rdfSymbol, new RDFSymbol("http://discobits.org/ontology#infoBit"), undefined);
	if (infobitProperty) {
		var objectElement = infobitProperty.object.elementValue;
	} else {
		var objectElement = document.createElementNS("http://discobits.org/ontology#","infoBit");
		objectElement.appendChild(document.createTextNode("empty"));
	}
	//var editableParagraph = document.createElementNS("http://www.w3.org/1999/xhtml", "p");
	//xhtmlContainer.appendChild(editableParagraph);
	WidgetFactory.appendChildrenInDiv(objectElement, this.xhtmlContainer);
	this.editableArea = this.xhtmlContainer.childNodes[0];
	try {
		mozile.editElement(this.editableArea);
	} catch (error) {
		if (!XHTMLInfoDBWidget.allreadyWarnedNoMozile) {
			alert ("mozile isn't working on your browser");
			XHTMLInfoDBWidget.allreadyWarnedNoMozile = true;
		}
	}
	var controller = this.controller;
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





function OrderedContentWidget(store, rdfSymbol, xhtmlContainer, controller) {
	this.controller = controller;
	this.rdfSymbol = rdfSymbol;
	this.load(store, rdfSymbol, xhtmlContainer);	
}



OrderedContentWidget.prototype.load = function(store, rdfSymbol, xhtmlContainer) {
   
    var containsStatements = store.statementsMatching(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#contains"), undefined);
    this.childElemContainer = document.createElementNS("http://www.w3.org/1999/xhtml", "ol");
    this.childElemContainer.className = this.getChildElemContainerClassName();
    
    var children = new Array();//the rdfSymbolS of the children, will accessible by childWidgets[i].rdfSymbol
    
    for(var i=0;i<containsStatements.length;i++) {
        var entry = containsStatements[i].object;
        var pos = store.statementsMatching(entry, new RDFSymbol("http://discobits.org/ontology#pos"), undefined);
        var holdsStatements = store.statementsMatching(entry, new RDFSymbol("http://discobits.org/ontology#holds"), undefined);
        children[pos[0].object] = holdsStatements[0].object; 
    }
    this.childWidgets = new Array(children.length);
    for(var j=0;j<children.length;j++) {  
    	this.addChild(children[j], j);    	
    }
    xhtmlContainer.appendChild(this.childElemContainer);
}

OrderedContentWidget.type = new RDFSymbol("http://discobits.org/ontology#OrderedContent");

WidgetFactory.typeWidgets.push(OrderedContentWidget);

OrderedContentWidget.prototype.addChild = function(child, pos, lastSavedStore) {
   	var li = document.createElementNS("http://www.w3.org/1999/xhtml", "li");
   	var div = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
   	this.positionHandling(pos, div);
   	var controlFunctions = this.getControlFunctions(li, pos);
   	
   	this.childWidgets[pos] = WidgetFactory.create(child, div, controlFunctions, undefined, undefined, lastSavedStore);
   	li.appendChild(div);
   	this.childElemContainer.appendChild(li);
}

OrderedContentWidget.prototype.getWidgetControls = function() {
	var controlFunctions = new Array();
	var moveUpControl = new Object();
   	moveUpControl.label = "ADD";
   	var orderedContentWidget = this;
   	moveUpControl.perform = function() {
   		var baseURI = orderedContentWidget.rdfSymbol.uri;
   		if (!baseURI.match(/\/$/)) {
   			baseURI += "/";
   		}
   		var childRDFSymbol = new RDFSymbol(baseURI+orderedContentWidget.childWidgets.length);
   		orderedContentWidget.addChild(childRDFSymbol, orderedContentWidget.childWidgets.length); 
   		orderedContentWidget.controller.modifiedStateChanged(true);
   	}
   	controlFunctions[controlFunctions.length] = moveUpControl;
	return controlFunctions;
}
OrderedContentWidget.prototype.getControlFunctions = function(li, pos) {
	var controlFunctions = new Array();
	var childWidgets = this.childWidgets;
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
	   		var previousWidget = childWidgets[pos -1];
	   		childWidgets[pos -1] = childWidgets[pos];
	   		childWidgets[pos] = previousWidget;
	   		for (var i = 0; i < childWidgets.length; i++) {
	   			childWidgets[i].widget.fillContextControler(containerWidget.getControlFunctions(ulElem.childNodes[i], i));
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
	   		var nextWidget = childWidgets[pos +1];
	   		childWidgets[pos +1] = childWidgets[pos];
	   		childWidgets[pos] = nextWidget;
	   		for (var i = 0; i < childWidgets.length; i++) {
	   			childWidgets[i].widget.fillContextControler(containerWidget.getControlFunctions(ulElem.childNodes[i], i));
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
   		for (var i = 0; i < childWidgets.length; i++) {
   			if (i != pos) {
	   			childWidgets[j] = childWidgets[i];
	   			j++;
	   		}
	   	}
	   	childWidgets.length = childWidgets.length-1;
	   	for (var i = 0; i < childWidgets.length; i++) {
		   	childWidgets[i].widget.fillContextControler(containerWidget.getControlFunctions(ulElem.childNodes[i], i));
		}
   	}
   	controlFunctions[controlFunctions.length] = removeControl;
   	
   	return controlFunctions;
}

OrderedContentWidget.prototype.getChildElemContainerClassName = function() {
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
		this.childWidgets[entryPos].widget.rdfSymbol);
	return result;
}


function TitledContentWidget(store, rdfSymbol, xhtmlContainer, controller) {
	var containsStatements = store.statementsMatching(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#contains"), undefined);
    this.childElemContainer = document.createElementNS("http://www.w3.org/1999/xhtml", "ol");
    this.childElemContainer.className = this.getChildElemContainerClassName();
    if (containsStatements.length != 2) {
    	this.childWidgets = new Array(2);
    	var baseURI = rdfSymbol.uri;
   		if (!baseURI.match(/\/$/)) {
   			baseURI += "-";
   		}
   		
   		var titleURI = baseURI + "title";
   		var titleRDFSymbol = new RDFSymbol(titleURI);
   		WidgetFactory.store.add(titleRDFSymbol,  RDF("type"), XHTMLInfoDBWidget.type);
		this.addChild(titleRDFSymbol, 0, new RDFIndexedFormula()); 
   		this.childWidgets[0].widget.controller.modifiedStateChanged(true);
   		
   		var contentURI = baseURI + "content";
   		var contentRDFSymbol = new RDFSymbol(contentURI);
		this.addChild(contentRDFSymbol, 1); 
   		controller.modifiedStateChanged(true);
   		
   		xhtmlContainer.appendChild(this.childElemContainer);
    } else {
		this.load(store, rdfSymbol, xhtmlContainer);
	}
}

TitledContentWidget.type = new RDFSymbol("http://discobits.org/ontology#TitledContent");

WidgetFactory.typeWidgets.push(TitledContentWidget);

TitledContentWidget.prototype.load = OrderedContentWidget.prototype.load;
TitledContentWidget.prototype.addChild = OrderedContentWidget.prototype.addChild;
TitledContentWidget.prototype.getEntryForChild = OrderedContentWidget.prototype.getEntryForChild;


TitledContentWidget.prototype.getControlFunctions = function(li, pos) {
	controlFunctions = new Array();
	return controlFunctions;
}

TitledContentWidget.prototype.getChildElemContainerClassName = function() {
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

TitledContentWidget.prototype.getStore = function() {
	var store = new RDFIndexedFormula();
	store.add(this.rdfSymbol, 
		new RDFSymbol('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), 
		new RDFSymbol('http://discobits.org/ontology#TitledContent'));
	for (var i = 0; i < this.childWidgets.length; i++) {
		var entry = this.getEntryForChild(store, i);
		store.add(this.rdfSymbol,  
		new RDFSymbol('http://discobits.org/ontology#contains'),
		entry);
	}
	return store;
}

// helpers ////////////
WidgetFactory.addClass = function(elem, className) {
	//elem.className += "foo bar ";
	elem.className += " "+className;
	
}
WidgetFactory.hasType = function(rdfSymbol, type, store) {
 	//alert("anyStatementMatching for "+rdfSymbol+WidgetFactory.store.anyStatementMatching(rdfSymbol, undefined, undefined));
	//return (typeof(WidgetFactory.store.anyStatementMatching(rdfSymbol, undefined, type)) != 'undefined')
	return (typeof(store.anyStatementMatching(rdfSymbol, new RDFSymbol('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), type)) != 'undefined')
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




