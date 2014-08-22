
var GeoJSON = require("geojson");
var GeoJSON = require("jsts/lib/jsts");
var GeoJSON = require("jsts/lib/javascript.util");

function createIsochrone(
        originLatLon,
        travelTimeInMinutes,
        transportMode
        ) {
    /*
    Create isochrone based on transport mode, travel time, and
    starting location
*/

    // Set constants
    // Approxiate mile-per-hour speeds of different transport modes
    var TRANSPORT_MODES = ["walk", "bike", "transit", "drive"];
    var SPEEDS = {
            "walk": 3,
            "bike": 12,
            "transit": 8,
            "drive": 30
    };
    // Rough distance of a (latitude) degree length in miles
    var DEGREE_LENGTH_IN_MILES = 69;

    // Handle errors with parameters
    if (travelTimeInMinutes <= 0) {
        throw "Must have a positive travel time";
    }
    if (TRANSPORT_MODES.indexOf(transportMode) == -1) {
        throw "Not a valid transport mode";
    }

    // Determine the radius of the isochrone, in degrees
    var distanceInMiles = 
            SPEEDS[transportMode] * (travelTimeInMinutes / 60);
    var distanceInDegrees = distanceInMiles / DEGREE_LENGTH_IN_MILES;
    
    // For the diagonals of the octagon, find the x- and y-distances
    var distanceForDiagonals = distanceInDegrees / Math.sqrt(2);

    var originLat = originLatLon[0];
    var originLon = originLatLon[1];

    var isochroneBounds = [{"isochrone": [[
            [originLat + distanceInDegrees, originLon],
            [originLat + distanceForDiagonals, originLon + distanceForDiagonals],
            [originLat, originLon + distanceInDegrees],
            [originLat - distanceForDiagonals, originLon + distanceForDiagonals],
            [originLat - distanceInDegrees, originLon],
            [originLat - distanceForDiagonals, originLon - distanceForDiagonals],
            [originLat, originLon - distanceInDegrees],
            [originLat + distanceForDiagonals, originLon - distanceForDiagonals],
            [originLat + distanceInDegrees, originLon]
    ]]}];
    
    var isochrone = GeoJSON.parse(isochroneBounds, {"Polygon": "isochrone"});

    url = JSON.stringify(isochrone);

    return isochrone;

}

function intersect(polygons) {
    /*
    Return the intersection of all passed geoJSON polygons
    */

    var geometryFactory = new jsts.geom.GeometryFactory();
    var reader = new jsts.io.GeoJSONReader(geometryFactory);

    var areaInAll = reader.read(polygons.pop().features[0].geometry);

    while (polygons.length > 0) {
        var intersectWithThis = reader.read(
                polygons.pop().features[0].geometry);
        var areaInAll = areaInAll.intersection(intersectWithThis);
    }

    var writer = new jsts.io.GeoJSONWriter();
    var areaInAllJSON = writer.write(areaInAll);

    return areaInAllJSON;
}

var testIsochroneA = createIsochrone([-83.751, 42.281], 20, "walk");
var testIsochroneB = createIsochrone([-83.746, 42.281], 25, "walk");
var testIntersection = intersect([testIsochroneA, testIsochroneB]);
