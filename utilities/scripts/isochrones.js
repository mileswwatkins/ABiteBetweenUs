define([
        "require",
        "jsts/lib/javascript.util",
        "jsts/lib/jsts"
        ],
        function() {
    main();
});

function main() {
    function createIsochrone(
            originLatLon,
            travelTimeInMinutes,
            transportMode
            ) {
        /*
        Create isochrones based on transport mode, travel time, and
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

        var LINE_SEGMENTS_PER_ISOCHRONE_QUADRANT = 4;
        
        // Create the isochrone
        var geometryFactory = new jsts.geom.GeometryFactory();
        var origin = geometryFactory.createPoint(originLatLon);
        var isochrone = origin.buffer(
                distance=distanceInDegrees,
                quadrantSegments=LINE_SEGMENTS_PER_ISOCHRONE_QUADRANT
                );
        
        // Output the isochrone as a GeoJSON
        var writer = new jsts.io.GeoJSONWriter();
        var isochroneGeoJSON = writer.write(isochrone);
        return isochroneGeoJSON;
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

    var testIsochroneA = createIsochrone([31.212386, -23.568481], 20, "walk");
    var testIsochroneB = createIsochrone([31.211275, -23.546208], 25, "walk");
    var intersection = intersect([testIsochroneA, testIsochroneB]);

    function topCuisinesInArea (latLon) {
        var yelpRequest = new XMLHttpRequest();
        var yelpURL = "http://api.yelp.com/v2/search?term=cream+puffs&amp;location=San+Francisco";

        yelpRequest.open("GET", yelpURL, false);
        yelpRequest.send();

        return [];
    }

    // foobar = topCuisinesInArea([31.212, -23.568]);
}
