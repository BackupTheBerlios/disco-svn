

function WidgetFactory() {
	
}

WidgetFactory.store = load('sample1b.rdf');
WidgetFactory.create = function(rdfSymbol, xhtmlContainer) {
	
	//	alert("hasType "+WidgetFactory.hasType(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#XHTMLInfoDB")));
	if(WidgetFactory.hasType(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#XHTMLInfoDB"))) {
		return new XHTMLInfoDBWidget(rdfSymbol, xhtmlContainer);
	}
	
	if(WidgetFactory.hasType(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#OrderedContent"))) {
		return new OrderedContentWidget(rdfSymbol, xhtmlContainer);
	}	
	
	if(WidgetFactory.hasType(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#TitledContent"))) {
		return new TitledContentWidget(rdfSymbol, xhtmlContainer);
	}
}

	
function XHTMLInfoDBWidget(rdfSymbol, xhtmlContainer) {
// alert("XHTMLInfoDBWidget "+rdfSymbol+" "+xhtmlContainer);
	var infobitProperty = WidgetFactory.store.anyStatementMatching(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#infoBit"), undefined);
	var objectElement = infobitProperty.object.elementValue;
	
	WidgetFactory.appendChildrenInDiv(objectElement, xhtmlContainer);
}



function OrderedContentWidget(rdfSymbol, xhtmlContainer) {
	this.load(rdfSymbol, xhtmlContainer);
}

OrderedContentWidget.prototype.load = function(rdfSymbol, xhtmlContainer) {

    // there is a shorthand
	//var rdfType = new RDFSymbol("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")

	//var orderedContentStatement = WidgetFactory.store.statementsMatching(rdfSymbol, rdfType, new RDFSymbol("http://discobits.org/ontology#OrderedContent"));
    
    var containsStatements = WidgetFactory.store.statementsMatching(rdfSymbol, new RDFSymbol("http://discobits.org/ontology#contains"), undefined);
    console.debug("containsStatements.length",containsStatements.length);
    
    var dbDiv = document.createElementNS("http://www.w3.org/1999/xhtml", "ol");
    dbDiv.className = this.getDbDivClassName();
    
    
    var children = new Array();//containsStatements.length);
    
    for(var i=0;i<containsStatements.length;i++) {
        var entry = containsStatements[i].object;
        var pos = WidgetFactory.store.statementsMatching(entry, new RDFSymbol("http://discobits.org/ontology#pos"), undefined);
        // alert("pos = "+pos);
   //     console.debug('pos',pos);
        console.debug('pos[0].object',pos[0].object);
        var holdsStatements = WidgetFactory.store.statementsMatching(entry, new RDFSymbol("http://discobits.org/ontology#holds"), undefined);
//        alert("holdsStatements = "+holdsStatements+" length="+holdsStatements.length);
		console.debug('holdsStatements',holdsStatements);
        children[pos[0].object] = holdsStatements[0].object; // 
    }
    for(var j=0;j<children.length;j++) {  
    	// recurse  
    	console.debug("recursing on "+children[j]); 	
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
		var div = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
		console.debug(objectElement);
		for( var i=0; i< objectElement.childNodes.length; i++ ){
			console.debug("adding node "+i+" "+objectElement.childNodes[i]);
			div.appendChild(objectElement.childNodes[i].cloneNode(true));		
		}
		xhtmlContainer.appendChild(div);	
	}
//////////////////




