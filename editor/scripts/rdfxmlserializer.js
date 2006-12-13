function RDFXMLSerializer() {
}


RDFXMLSerializer.serialize = function(rdfFormula) {
	var statements = rdfFormula.statements;
	var result = document.implementation.createDocument("http://www.w3.org/1999/02/22-rdf-syntax-ns#", "rdf:RDF", null);
	var root = result.firstChild;
	for (var i = 0; i < statements.length; i++) {
		RDFXMLSerializer.addStatement(statements[i], result, root);
	}
	//alert(new XMLSerializer().serializeToString(result));
	return result;
}

RDFXMLSerializer.addStatement = function(statement, result, root) {
	var elem = result.createElementNS("http://www.w3.org/1999/02/22-rdf-syntax-ns#","rdf:Description");
	if (statement.subject.termType == "symbol") {
		elem.setAttributeNS("http://www.w3.org/1999/02/22-rdf-syntax-ns#","rdf:about", statement.subject.uri);
	} else {
		elem.setAttributeNS("http://www.w3.org/1999/02/22-rdf-syntax-ns#","rdf:nodeID", "a"+statement.subject.id);
	}
	root.appendChild(elem);
	var splittedURI = RDFXMLSerializer.splitURI(statement.predicate.uri);
	var propertyElem = result.createElementNS(splittedURI.ns, splittedURI.name);
	elem.appendChild(propertyElem);
	//console.debug("obj-type: "+statement.object.termType);
	if (statement.object.termType == "symbol") {
		propertyElem.setAttributeNS("http://www.w3.org/1999/02/22-rdf-syntax-ns#","rdf:resource", statement.object.uri);
	} else {
		if (statement.object.termType == "literal") {
			//TODO add type, copy elements for xmlliterals, add language for plain literals
			if (statement.object.elementValue) {
				var nodes = statement.object.elementValue.childNodes;
				for (var i = 0; i < nodes.length; i ++) {
					propertyElem.appendChild(nodes[i].cloneNode(true));
				}
				propertyElem.setAttributeNS("http://www.w3.org/1999/02/22-rdf-syntax-ns#","rdf:parseType", "Literal");
			} else {
				var textNode = result.createTextNode(statement.object.value);
				propertyElem.appendChild(textNode);
				if (statement.object.lang) {
					console.debug("lang "+statement.object.lang);
					propertyElem.setAttribute("xml:lang", statement.object.lang);
				}
			}
		} else {
			propertyElem.setAttributeNS("http://www.w3.org/1999/02/22-rdf-syntax-ns#","rdf:nodeID", "a"+statement.object.id);
		}
	}
}

RDFXMLSerializer.splitURI = function(uri) {
	var poundPos = uri.indexOf('#');
	var splitPos; 
	if (poundPos > -1) {
		splitPos = poundPos;
	} else {
		splitPos = uri.lastIndexOf('/');
	}
	var result = new Object();
	result.ns = uri.substring(0, splitPos+1);
	result.name = uri.substring(splitPos+1);
	return result;
	
}