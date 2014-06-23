var GeoJSON = require("geojson")


// Latitude and longitude in statute miles, roughly, given a latitude
// of 40 degrees
var LATITUDE_DEGREE_LENGTH = 69;
var LONGITUDE_DEGREE_LENGTH = 53;

// Approxiate mile-per-hour speeds of different transport modes
var TRANSPORT_MODES = ["walk", "bike", "transit", "drive"]
var SPEEDS = {
        "walk": 3,
        "bike": 12,
        "transit": 8,
        "drive": 30
}

// Function to create isochrones based on transport mode, travel time,
// and starting location
function createIsochrone(startingLocation, travelTimeInMinutes, transportMode) {
    if (TRANSPORT_MODES.indexOf(transportMode) == -1) {
        throw "Not a valid transport mode";
    }

    var distance = SPEEDS.transportMode / (travelTime / 60);
    var degreesEastWest = distance * (1 / LONGITUDE_DEGREE_LENGTH);
    var degreesNorthSouth = distance * (1 / LATITUDE_DEGREE_LENGTH);
    var degreesDiagonal = distance * Math.sin(45 * (Math.PI / 180)) * (1 / ((LONGITUDE_DEGREE_LENGTH + LATITUDE_DEGREE_LENGTH) / 2));

    var isochroneBounds = []

    var isochrone = GeoJSON.parse(isochroneBounds, {"Polygon": })

    return isochrone;
}
