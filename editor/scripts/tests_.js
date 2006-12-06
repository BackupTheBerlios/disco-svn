function TestStore() {
    this.bn = 97 // 'a'
    this.triples = []
    this.collections = {}
    this.sym = function (uri) {
        return {val: uri, type: "sym"}
    }
    this.collection = function () {
        var store = this
	var c = new Object()
	c.val = this.bn++
	c.type = "collection"
	c.elements = []
	c.append = function (el) { this.elements[this.elements.length]=el }
	c.close = function () {
	    var rdfns = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
	    if (this.elements.length == 0) {
	        store.add(this,store.sym(rdfns+"first"),store.sym(rdfns+"nil"))
		return
	    }
	    var cn = this
	    store.add(cn,store.sym(rdfns+"first"),this.elements[0])
	    for (var x=1; x<this.elements.length; x++) {
	        var nn = store.bnode()
		store.add(cn,store.sym(rdfns+"rest"),nn)
		cn = nn
	        store.add(cn,store.sym(rdfns+"first"),this.elements[x])
	    }
	    store.add(cn,store.sym(rdfns+"rest"),store.sym(rdfns+"nil"))
	}
	return c
    }
    this.bnode = function () {
        return {val: this.bn++, type: "bnode"}
    }
    this.literal = function (val, lang, type) {
        return {val: val, datatype: type, type: "literal", lang: lang}
    }
    this.add = function (s,p,o,w) {
	if (o.type == "literal" && o.datatype
	    == "http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral") {
	    var val = ""
	    var xmls = new XMLSerializer()
	    for (var x=0; x < o.val.childNodes.length; x++) {
	        val += xmls.serializeToString(o.val.childNodes[x])
	    }
	    o.val = val
	}
        if (s.type == "bnode" || s.type == "collection") {
	    s = "_:"+String.fromCharCode(s.val)
	}
	else {
	    s = "<"+s.val+">"
	}
	s += " <" + p.val + "> "
        if (o.type == "literal") {
            s += "\"" + o.val + "\""
            if (o.datatype) { s += "^^<"+o.datatype+">" }
	    if (o.lang != "") { s += "@"+o.lang }
        }
	else if (o.type == "bnode" || o.type == "collection") {
	    s += "_:"+String.fromCharCode(o.val)
	}
        else {
            s += "<" + o.val + ">"
        }
        this.triples[this.triples.length] = s + " ."
    }
}

function setUpPage() {
    xhr = XMLHTTPFactory()
    setUpPageStatus = "complete"
}

function parseNT(text) {
    var bnodes = {}
    var bn = 97 // 'a'
    text = text.split("\n")
    var retval = []
    for (var x = 0; x < text.length; x++) {
        text[x] = text[x].replace(/\x0a/g,"")
	text[x] = text[x].replace(/\x0d/g,"")
	text[x] = text[x].replace(/\s*\.\s*$/,"")
	text[x] = text[x].replace(/^\s*$/,"")
        if (text[x][0] != "#" && text[x].length>0) {
	    var s, p, o, unesc
	    unesc = text[x].match(/\\u[0-9A-F]{4}/g)
	    if (unesc != undefined) {
	    for (var k = 0; k < unesc.length; k++) {
	        text[x] = text[x].replace(eval("/\\\\u"
                                               +unesc[k].slice(2)+"/g"),
			                  String.fromCharCode(parseInt(
				                       unesc[k].slice(2),16)))
	    }
	    }
	    s = text[x].slice(0,text[x].indexOf(" "))
	    text[x] = text[x].slice(text[x].indexOf(" ")+1).replace(/^\s*/,"")
	    p = text[x].slice(0,text[x].indexOf(" "))
	    o = text[x].slice(text[x].indexOf(" ")+1).replace(/^\s*/,"")
	    function bnr(str) {
	        if (bnodes[str.slice(2)] == undefined) {
		    bnodes[str.slice(2)] = String.fromCharCode(bn++)
		}
		return "_:"+bnodes[str.slice(2)]
	    }
	    if (s.slice(0,2) == "_:") { s = bnr(s) }
	    if (o.slice(0,2) == "_:") { o = bnr(o) }
	    o = o.replace(/^ +/,"")
	    retval[retval.length] = s+" "+p+" "+o+" ."
        }
    }

    return retval
}

function esc(str) {
  str = str.replace(/</g,"&lt;")
  return str.replace(/>/g,"&gt;")
}

function runW3CTest(dir, tests, desc) {
    for (var x = 0; x < tests.length; x++) {
        var store = new TestStore()
	var parser = new RDFParser(store)
	parser.reify = parser.forceRDF = true

        getW3CData(dir + "/" + tests[x] + ".rdf")
	parser.parse(xhr.responseXML,
	             "http://www.w3.org/2000/10/rdf-tests/rdfcore/"
		     + dir + "/" + tests[x] + ".rdf")
	getW3CData(dir + "/" + tests[x] + ".nt")
	var nt = parseNT(xhr.responseText)
	if (nt.length != store.triples.length) {
	    alert(store.triples)
	    warn(tests[x]+": Triple mismatch: Parser returned "
	         +store.triples.length+" triples but test cases claim "
		 +nt.length+" triples.")
	    assert(desc,false)
	}

	// dumbest triple compare ever
	var matches = 0
	for (var k = 0; k < nt.length; k++) {
	   for (var l = 0; l < store.triples.length; l++) {
	       if (nt[k] == store.triples[l]) {
	           matches++
	       }
	   }
	}
	   
	if (matches == nt.length) {
	   debug("<br/>nt: <br/>"+map(esc,nt).join("<br/>")
	         +"<br/>rdf: <br/>"+map(esc,store.triples).join("<br/>"))
	} else {
	   warn("<br/>nt: <br/>"+map(esc,nt).join("<br/>")
                +"<br/>rdf: <br/>"+map(esc,store.triples).join("<br/>"))
	}
	assert(desc, matches == nt.length)
    }
}

function getW3CData(relURI) {
    xhr.open("GET", "../rdf-tests/" + relURI, false)
    xhr.send("")
}

function testAmpInURL() {
    var dir = "amp-in-url"
    var tests = ["test001"]
    runW3CTest(dir, tests, dir)
}

function testDatatypes() {
    var dir = "datatypes"
    var tests = ["test001","test002"]
    runW3CTest(dir, tests, dir)
}

function testRDFElementNotMandatory() {
    var dir = "rdf-element-not-mandatory"
    var tests = ["test001"]
    runW3CTest(dir, tests, dir)
}

function testReificationNotRequired() {
    var dir = "rdfms-reification-required"
    var tests = ["test001"]
    runW3CTest(dir, tests, dir)
}

function testURISubstructure() {
    var dir = "rdfms-uri-substructure"
    var tests = ["test001"]
    runW3CTest(dir, tests, dir)
}

function testRDFXMLLang() {
    var dir = "rdfms-xmllang"
    var tests = ["test001",
                 "test002",
		 "test003",
		 "test004",
		 "test005",
		 "test006"]
    runW3CTest(dir, tests, dir)
}

function testUnrecognizedXMLAttr() {
    var dir = "unrecognised-xml-attributes"
    var tests = ["test001","test002"]
    runW3CTest(dir, tests, dir)
}

function testXMLCanon() {
    var dir = "xml-canon"
    var tests = ["test001"]
    runW3CTest(dir, tests, dir)
}

function testRDFCharmodLiteral() {
    var dir = "rdf-charmod-literals"
    var tests = ["test001"]
    runW3CTest(dir, tests, dir)
}

function testRDFCharmodURI() {
    var dir = "rdf-charmod-uris"
    var tests = ["test001","test002"]
    runW3CTest(dir, tests, dir)
}

function testRDFNSPrefixConfusion() {
    var dir = "rdf-ns-prefix-confusion"
    var tests = ["test0001",
                 "test0003",
		 "test0004",
		 "test0005",
		 "test0006",
		 "test0009",
		 "test0010",
		 "test0011",
		 "test0012",
		 "test0013",
		 "test0014"]
     runW3CTest(dir, tests, dir)
}

function testRDFContainersSyntaxVsSchema() {
    var dir = "rdf-containers-syntax-vs-schema"
    var	tests = ["test001","test002","test003","test004",
	         "test006","test007","test008"]
    runW3CTest(dir, tests, dir)
}

function testDifferenceBetweenIDAndAbout() {
    var dir = "rdfms-difference-between-ID-and-about"
    var tests = ["test1","test2","test3"]
    runW3CTest(dir, tests, dir)
}

function testDuplicateMemberProps() {
    var dir = "rdfms-duplicate-member-props"
    var tests = ["test001"]
    runW3CTest(dir, tests, dir)
}

function testEmptyPropertyElements() {
    var dir = "rdfms-empty-property-elements"
    var tests = ["test001","test002","test003","test004","test005","test006",
                 "test007","test008","test009","test010","test011","test012",
		 "test013","test014","test015","test016","test017"]
    runW3CTest(dir,tests,dir)
}

function testIdentityAnonymousResources() {
    var dir = "rdfms-identity-anon-resources"
    var tests = ["test001","test002","test003","test004","test005"]
    runW3CTest(dir,tests,dir)
}

function testNotIDAndResourceAttr() {
    var dir = "rdfms-not-id-and-resource-attr"
    var tests = ["test001","test002","test004","test005"]
    runW3CTest(dir,tests,dir)
}

function testPara196() {
    var dir = "rdfms-para196"
    var tests = ["test001"]
    runW3CTest(dir,tests,dir)
}

function testRDFNamesUse() {
    var dir = "rdfms-rdf-names-use"
    var tests = ["test-001","test-002","test-003","test-004","test-005",
                 "test-006","test-007","test-008","test-009","test-010",
		 "test-011","test-012","test-013","test-014","test-015",
		 "test-016","test-017","test-018","test-019","test-020",
		 "test-021","test-022","test-023","test-024","test-025",
		 "test-026","test-027","test-028","test-029","test-030",
		 "test-031","test-032","test-033","test-034","test-035",
		 "test-036","test-037"]
    runW3CTest(dir,tests,dir)
}

function testSequenceRepresentation() {
    var dir = "rdfms-seq-representation"
    var tests = ["test001"]
    runW3CTest(dir, tests, dir)
}

function testSyntaxIncomplete() {
    var dir = "rdfms-syntax-incomplete"
    var tests = ["test001","test002","test003","test004"]
    runW3CTest(dir, tests, dir)
}

function testXMLBase() {
    var dir = "xmlbase"
    var tests = ["test001","test002","test003","test004","test006","test007",
                 "test008","test009","test010","test011","test013","test014"]
    runW3CTest(dir, tests, dir)
}

function testXMLLiteralNamespaces() {
    var dir = "rdfms-xml-literal-namespaces"
    var tests = ["test001","test002"]
    runW3CTest(dir, tests, dir)
}

function testDomainAndRange() {
    var dir = "rdfs-domain-and-range"
    var tests = ["test001","test002"]
    runW3CTest(dir, tests, dir)
}