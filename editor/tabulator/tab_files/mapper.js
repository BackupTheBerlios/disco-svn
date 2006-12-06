// The mapper!
// Display RDF info on a map using HTML DOM and the Google Maps API.

function centerAndZoomOnMarkers(map, markers) {
    var bounds = new GLatLngBounds(markers[0].getPoint(), markers[0].getPoint());
    var i;
    for (i=1; i<markers.length; i++) {
        bounds.extend(markers[i].getPoint());
    }
    var lat = (bounds.getNorthEast().lat() + bounds.getSouthWest().lat()) / 2.0;
    var lng = (bounds.getNorthEast().lng() + bounds.getSouthWest().lng()) / 2.0;
    if(bounds.getNorthEast().lng() < bounds.getSouthWest().lng()){
      lng += 180;
    }
    var center = new GLatLng(lat,lng)
    map.setCenter(center, map.getBoundsZoomLevel(bounds)-1);
} 

function AJAR_Map(event) {
// var selection as used below is currently defined in tabulate.js, but it is
// not solely relevant to the tabulator view. Maybe its location should change?
    makeQueryLines(); 
    //!!!!!!!!!!Need to filter out results that can't be mapped
    //For now there is nothing here, but should use an address / geocoding.
    //Below should be the necessary calls to make a map!
    mapArea(myQuery);
} //AJAR_Map

function findMapVars(q) {
    var ns = q.pat.statements.length, sta;
    for(i=0; i<ns; i++) {
        //alert(q.pat.statements[i].toString());
        sta=q.pat.statements[i].toString();
        if (sta.match('http://xmlns.com/foaf/0.1/based_near')!=null) { q.pat.statements[i].object.mapUsed='based_near'; }
        else if (sta.match('http://www.w3.org/2000/10/swap/pim/contact#address')!=null) { q.pat.statements[i].object.mapUsed='address'; }
        else if (sta.match('http://www.w3.org/2003/01/geo/wgs84_pos#lat')!=null)   { q.pat.statements[i].object.mapUsed='lat'; }
        else if (sta.match('http://www.w3.org/2003/01/geo/wgs84_pos#long')!=null)  { q.pat.statements[i].object.mapUsed='long'; }
    }
}       

function isImage(extension) {
    switch(extension) {
        case '.jpg':
        case '.JPG':
        case '.gif':
        case '.GIF':
        case '.png':
        case '.PNG':
            return true; break;
        default:
            return false; break;
    }
}
//Note: In the future, it may be helpful to store an array of arrays of markers,
//so as to remove markers from specific queries but not remove others.
var mapViewArea; //globals vars that contain mapView and its markers.
var geocoder;

/** construct the map view..
    builds up an array of markers, and adds the locations to those markers as
    they are found.  Finally, adds those markers to the map to be viewed.*/
function mapArea(q) {
    var div = document.getElementById('mapper'), markers = [];
    div.setAttribute('style','width:95%; height: 80%');
    if (GBrowserIsCompatible()) {
				var map = new GMap2(div);
        map.setCenter(new GLatLng(42.359701394644546,-71.08615636825562),13);
        map.addControl(new GSmallMapControl);
        if(geocoder==null) {
            geocoder = new GClientGeocoder();
        }
    }
    findMapVars(q);
    function onBinding(bindings) { //Creates a row of the table and sticks all the columns in it
        tinfo("making a marker w/ bindings " + bindings);
        var nv = q.vars.length;
        var info, t, marker, point, lat, lng; //info holds the info bubble's DOM node
        info = document.createElement('div');
        info.setAttribute('ondblclick','mapViewDoubleClick(event)');
        t=document.createElement('table');
        info.appendChild(t);
        for (i=0; i<nv; i++) {
            var obj = bindings[q.vars[i]];
            var geoType = q.vars[i].mapUsed;
            if(geoType!=null) {
                switch (geoType) {
                    case 'lat':
                        lat=obj.value;
                    break;
                    case 'long':
                        lng=obj.value;
                    break;
                    case 'based_near':
                        lat = kb.the(obj, kb.sym('http://www.w3.org/2003/01/geo/wgs84_pos#lat'), undefined).value;
                        lng = kb.the(obj, kb.sym('http://www.w3.org/2003/01/geo/wgs84_pos#long'), undefined).value;
                    break;
                    case 'address':
                        var street, city, country, post;
                        street=kb.the(obj, kb.sym('http://www.w3.org/2000/10/swap/pim/contact#street'), undefined).value;
                        city=kb.the(obj, kb.sym('http://www.w3.org/2000/10/swap/pim/contact#city'), undefined).value;
                        country=kb.the(obj, kb.sym('http://www.w3.org/2000/10/swap/pim/contact#country'), undefined).value;
                        post=kb.the(obj, kb.sym('http://www.w3.org/2000/10/swap/pim/contact#postalCode'), undefined).value;
                        geocoder.getLatLng(street+" "+city+" "+country+" "+post, function(newPoint) {
                            if(point==null && newPoint!=null) {  //if query didn't find another coord, and geocoding worked
                                marker = new GMarker(newPoint);
                                map.addOverlay(marker);
                                markers[markers.length]=marker;  //place our marker in the next index.
                                centerAndZoomOnMarkers(map, markers);
                                info.appendChild(document.createTextNode("("+newPoint.lat() +", "+newPoint.lng()+")"));
                                GEvent.addListener(marker, "click", function() {
                                    marker.openInfoWindow(info);
                                });
                            }
                        });
                    break;
                    default:
                        terror("Error in onBinding for MapView: findGeoType returned unknown type: "+geoType);
                    break;
                }
            }
            else {
                var tr = document.createElement('tr');
                var td, tt;
                tt= document.createElement('td')
                tt.appendChild(document.createTextNode(q.vars[i].label))
                tr.appendChild(tt);
                if(obj.termType=='symbol' && isImage(obj.uri.substring(obj.uri.length-4))) {
                    td=matrixTD(obj,true);                }
                else {
                    td=matrixTD(obj);
                }
                tr.appendChild(td);
                t.appendChild(tr);
            }
        } //for each query var, check for coord, or handle data.
        if((lat!=undefined && lng!=undefined) || point!=undefined)
        {
            if(lat!=undefined && lng!=undefined) {
                point = new GLatLng(lat, lng);
            }
            info.appendChild(document.createTextNode("("+point.lat() +", "+point.lng()+")"));
            marker = new GMarker(point);
            map.addOverlay(marker);
            markers[markers.length]=marker;  //place our marker in the next index.
            centerAndZoomOnMarkers(map, markers);
            GEvent.addListener(marker, "click", function() {
                marker.openInfoWindow(info);
            });
        }
    }

    use_callback = 1
    use_fetcher = 1
    if (use_callback) {
        kb.query(myQuery, onBinding, use_fetcher ? myFetcher : null); 
        //queries myQuery with use_fetcher, creating a callback to onBinding when it is fetched
        //It passes onBinding an association list of all the vars with their associated values in this subgraph
        //kb.query essentially routes to kb.match, which passes all matching subsets of kb, each to onBinding
        //kb.query(myQuery, queryCB)
    } else {
        var nbs = kb.query(myQuery.pat)
        var j, tr, nb, bindings, what
        for (j=0; j<nbs.length; j++) {
            tr = document.createElement('tr')
            t.appendChild(tr)
            bindings = nbs[j][0]  // [bindings, reason]
            for (i=0; i<nv; i++) {
            v = q.vars[i]
            td = document.createElement('td')
            what = bindings[v]
        //      fyi("    table cell "+v+": "+what + " type="+what.termType)
            tr.appendChild(matrixTD(what))
            }
        }
    }
    mapViewArea=div;
    return div;
}

function mapViewDoubleClick(event) {
	var target = getTarget(event);
	var aa = getAbout(kb, target)
	if (!aa) return;
  if (aa && aa.termType == 'symbol')
      GotoURI(aa.uri);
}