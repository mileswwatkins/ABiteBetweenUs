define(["require", "geojson"], function (require) {
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

    // Function to create isochrones based on transport mode, travel time,
    // and starting location
    function createIsochrone(startingLocation, travelTimeInMinutes, transportMode) {
        if (TRANSPORT_MODES.indexOf(transportMode) == -1) {
            throw "Not a valid transport mode";
        }

        var distance = SPEEDS[transportMode] * (travelTimeInMinutes / 60);
        var deltaNorthSouth = distance * (1 / LATITUDE_DEGREE_LENGTH);
        var deltaEastWest = distance * (1 / LONGITUDE_DEGREE_LENGTH);
        var deltaDiagonal = distance * Math.sin(45 * (Math.PI / 180)) *
                (1 / ((LONGITUDE_DEGREE_LENGTH + LATITUDE_DEGREE_LENGTH) / 2));

        var startingLat = startingLocation[0];
        var startingLon = startingLocation[1];

        var isochroneBounds = [{"isochrone": [[
                [startingLat + deltaNorthSouth, startingLon],
                [startingLat + deltaDiagonal, startingLon + deltaDiagonal],
                [startingLat, startingLon + deltaEastWest],
                [startingLat - deltaDiagonal, startingLon + deltaDiagonal],
                [startingLat - deltaNorthSouth, startingLon],
                [startingLat - deltaDiagonal, startingLon - deltaDiagonal],
                [startingLat, startingLon - deltaEastWest],
                [startingLat + deltaDiagonal, startingLon - deltaDiagonal]
        ]]}];

        var isochrone = GeoJSON.parse(isochroneBounds, {"Polygon": "isochrone"});

        return isochrone;
    }

    test_isochrone = createIsochrone([40, 80], 40, "walk");
}
