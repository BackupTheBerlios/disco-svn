

function WidgetFactory() {
	
}

WidgetFactory.store = load('sample1b.rdf');
WidgetFactory.create = function(rdfSymbol, xhtmlContainer) {
	xhtmlContainer.style.border = "dashed";
	xhtmlContainer.style.borderWidth = "1px 1px 0px 0px";
	var controlArea = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
	controlArea.className = "controlArea";
	controlArea.style.visibility ="hidden";
	var saveLink = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
	//saveLink.appendChild(document.createTextNode("Save"));
	var saveIcon = document.createElementNS("http://www.w3.org/1999/xhtml", "img");
	saveLink.appendChild(saveIcon);
	saveIcon.src = "../scripts/mozile/images/silk/page_save.png";
	saveLink.onclick = function() {
		alert("connection error");
	}
	controlArea.appendChild(saveLink);
	xhtmlContainer.appendChild(controlArea);	
	var typeWidget = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
	typeWidget.className = "typeWidget";
	xhtmlContainer.appendChild(typeWidget);
	var controller = new Object();
	controller.modified = function() {
		controlArea.style.visibility ="";
	} 
	var result;
	//	alert("hasType "+WidgetFactory.hasType(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#XHTMLInfoDB")));
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
/*mozile.debug.logLevel = "debug";
mozile.require("mozile.dom");
mozile.require("mozile.xml");
mozile.require("mozile.xpath");
mozile.require("mozile.util");
mozile.require("mozile.edit");
mozile.require("mozile.edit.rich");
mozile.require("mozile.event");
mozile.require("mozile.save");
mozile.require("mozile.save.tidy");
mozile.require("mozile.save.extract");
mozile.require("mozile.gui");
mozile.require("mozile.gui.htmlToolbar");

mozile.useSchema("../scripts/mozile/lib/xhtml.rng");
mozile.require("mozile.save.post");
mozile.save.target = document;
mozile.save.format = null;
mozile.save.warn = true;
mozile.save.method = mozile.save.post;
mozile.save.post.async = true;
//TODO get single source attribute or 
mozile.save.post.uri = "/save-stuff";
mozile.save.post.user = null;
mozile.save.post.password = null;
mozile.save.post.showResponse = false;*/
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
// alert("XHTMLInfoDBWidget "+rdfSymbol+" "+xhtmlContainer);
	var infobitProperty = WidgetFactory.store.anyStatementMatching(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#infoBit"), undefined);
	var objectElement = infobitProperty.object.elementValue;
	//var editableParagraph = document.createElementNS("http://www.w3.org/1999/xhtml", "p");
	//xhtmlContainer.appendChild(editableParagraph);
	WidgetFactory.appendChildrenInDiv(objectElement, xhtmlContainer);
	mozile.editElement(xhtmlContainer.childNodes[0]);
	xhtmlContainer.childNodes[0].addEventListener("change", controller.modified, false);
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
// alert("anyStatementMatching "+WidgetFactory.store.anyStatementMatching(rdfSymbol, undefined, type));
	return (typeof(WidgetFactory.store.anyStatementMatching(rdfSymbol, undefined, type)) != 'undefined')
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
//////////////////




