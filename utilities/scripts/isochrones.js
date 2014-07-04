define([
        "require",
        "geojson",

        "jsts/lib/javascript.util",
        "jsts/lib/jsts"
        // "jsts/src/jsts",

        // "jsts/src/jsts/geom/Geometry",
        // "jsts/src/jsts/geom/GeometryFactory",
        // "jsts/src/jsts/geom/PrecisionModel",
        // "jsts/src/jsts/geom/Coordinate",
        // "jsts/src/jsts/geom/LinearRing",
        // "jsts/src/jsts/geom/LineString",
        // "jsts/src/jsts/geom/Polygon",

        // "jsts/src/jsts/io/GeoJSONParser",
        // "jsts/src/jsts/io/GeoJSONReader"
        ],
        function (require) {
    var GeoJSON = require("geojson");
    main();
});

function main() {
    // Latitude and longitude in statute miles, roughly, given a latitude
    // of 40 degrees
    var LATITUDE_DEGREE_LENGTH = 69;
    var LONGITUDE_DEGREE_LENGTH = 53;

    // Approxiate mile-per-hour speeds of different transport modes
    var TRANSPORT_MODES = ["walk", "bike", "transit", "drive"];
    var SPEEDS = {
            "walk": 3,
            "bike": 12,
            "transit": 8,
            "drive": 30
    };

    function createIsochrone(originLatLon, travelTimeInMinutes, transportMode) {
        /*
        Create isochrones based on transport mode, travel time, and
        starting location
        */
        if (TRANSPORT_MODES.indexOf(transportMode) == -1) {
            throw "Not a valid transport mode";
        }

        var distance = SPEEDS[transportMode] * (travelTimeInMinutes / 60);
        var deltaNorthSouth = distance * (1 / LATITUDE_DEGREE_LENGTH);
        var deltaEastWest = distance * (1 / LONGITUDE_DEGREE_LENGTH);
        var deltaDiagonal = distance * Math.sin(45 * (Math.PI / 180)) *
                (1 / ((LONGITUDE_DEGREE_LENGTH + LATITUDE_DEGREE_LENGTH) / 2));

        var originLat = originLatLon[0];
        var originLon = originLatLon[1];

        var isochroneBounds = [{"isochrone": [[
                [originLat + deltaNorthSouth, originLon],
                [originLat + deltaDiagonal, originLon + deltaDiagonal],
                [originLat, originLon + deltaEastWest],
                [originLat - deltaDiagonal, originLon + deltaDiagonal],
                [originLat - deltaNorthSouth, originLon],
                [originLat - deltaDiagonal, originLon - deltaDiagonal],
                [originLat, originLon - deltaEastWest],
                [originLat + deltaDiagonal, originLon - deltaDiagonal]
        ]]}];

        var isochrone = GeoJSON.parse(isochroneBounds, {"Polygon": "isochrone"});

        return isochrone;
    }

    function intersect(polygons) {
        /*
        Return the intersection of all passed geoJSON polygons
        */

        geometryFactory = new jsts.geom.GeometryFactory();
        reader = new jsts.io.GeoJSONReader(geometryFactory);

        foobar = polygons.pop();
        console.log(foobar);
        areaInAll = reader.read(foobar);
        console.log(areaInAll.envelope);
        while (polygons.length > 0) {
            intersectWithThis = reader.read(polygons.pop());
            areaInAll = areaInAll.intersection(intersectWithThis);
        }

        // writer = new jsts.io.GeoJSONWriter();
        // areaInAllJSON = writer.write(areaInAll);

        // return areaInAllJSON;
    }

    testIsochroneA = createIsochrone([40, 80], 30, "drive");
    testIsochroneB = createIsochrone([40.1, 80.05], 40, "walk");
    intersection = intersect([testIsochroneA, testIsochroneB]);
}
