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

        // GeoJSON uses (x,y) for coordinates, the opposite order of (lat,lon)
        var isochroneBounds = [
                [originLon + distanceInDegrees, originLat],
                [originLon + distanceForDiagonals, originLat + distanceForDiagonals],
                [originLon, originLat + distanceInDegrees],
                [originLon - distanceForDiagonals, originLat + distanceForDiagonals],
                [originLon - distanceInDegrees, originLat],
                [originLon - distanceForDiagonals, originLat - distanceForDiagonals],
                [originLon, originLat - distanceInDegrees],
                [originLon + distanceForDiagonals, originLat - distanceForDiagonals],
                [originLon + distanceInDegrees, originLat]
        ];

        var isochrone = {
                type: "Polygon",
                coordinates: [isochroneBounds]
        };

        return isochrone;
    }

    function intersect(polygons) {
        /*
        Return the intersection of all passed geoJSON polygons
        */

        // Throw an error if no polygons are provided
        if (polygons.length === 0) {
            throw "No polygons were provided to intersect";
        }

        var reader = new jsts.io.GeoJSONReader();

        var areaInAll = reader.read(polygons[0]);
        polygons.forEach(function(intersectWithThis) {
            areaInAll = areaInAll.intersection(reader.read(intersectWithThis));
        });

        // Throw an error if the polygons do not intersect
        if (areaInAll.getArea() === 0) {
            throw "There is no intersection between these polygons";
        }
        
        var writer = new jsts.io.GeoJSONWriter();
        var areaInAllJSON = writer.write(areaInAll);

        return areaInAllJSON;
    }

    function geoJSONToGooglePolygon(polygon) {
        /*
        Convert a geoJSON polygon to a Google Polygon
        */

        var bounds = [];
        polygon.coordinates[0].forEach(function(LonLat) {
            googleBound = new google.maps.LatLng(LonLat[1], LonLat[0]);
            bounds.push(googleBound);
        });

        var googlePolygon = new google.maps.Polygon({
            paths: bounds,

            fillColor: "#000000",
            fillOpacity: 0.2,
            
            strokeColor: "#000000",
            strokeOpacity: 0.3,
            strokeWeight: 2,
            strokePosition: google.maps.StrokePosition.OUTSIDE
        });

        return googlePolygon;
    }

    function geocodeAddress (addressToGeocode) {
        /*
        Take a street address and return a set of geographic coordinates
        */

        // Make an API call to a geocoding service
        // Currently use Google Maps, without a key
        var API_URL_BASE =
                "https://maps.googleapis.com/maps/api/geocode/json?address=";
        var addressEncoded = encodeURIComponent(addressToGeocode);
        var apiURL = API_URL_BASE + addressEncoded;

        // Send the request
        var xhr = new XMLHttpRequest();
        xhr.open("GET", apiURL, false);
        xhr.send();

        // Retrieve the latitude and longitude from the API's response
        // Also, check to make sure the geocoding succeeded
        var geocodingResponse = JSON.parse(xhr.responseText);

        if (geocodingResponse.status != "OK") {
            throw("Address geocoding failed");
        }

        else {
            var latLonResponse =
                    geocodingResponse.results[0].geometry.location;
            var latLon = [latLonResponse.lat, latLonResponse.lng];
    
            return latLon;
        }
    }

    function initializeGoogleMap(polygons) {
        /*
        Create a Google Maps Map object that covers the extent of all
        polygons provided, ideally centered on their intersect
        */

        // Identify map bounds
        var mapBounds = new google.maps.LatLngBounds();

        // Set fallback map bounds if there are no polygons
        // Use Ann Arbor as the default
        if (polygons.length === 0) {
            mapBounds.extend(new google.maps.LatLng(42.22, -83.80));
            mapBounds.extend(new google.maps.LatLng(42.33, -83.67));
        }

        // If there are polygons, calculate bounds for the map
        else {
            polygons.forEach(function(polygon) {
                polygon.coordinates[0].forEach(function(LonLat) {
                    mapBounds.extend(new google.maps.LatLng(
                            LonLat[1],
                            LonLat[0]
                    ));
                });
            });
        }

        // Create document-level map object that will be inserted into the view
        // Use the bounds of the map to determine center point and zoom level
        var mapOptions = {
            center: mapBounds.getCenter()
        };
        var map = new google.maps.Map(
                document.getElementById("map-canvas"),
                mapOptions
        );
        map.fitBounds(mapBounds);

        // Add polygons to the view, including the overall intersection
        if (polygons.length > 0) {

            // Add each polygon to the map's data layer
            polygons.forEach(function(polygon) {
                geoJSONToGooglePolygon(polygon).setMap(map);
            });

            // Determine the intersection of all polygons, and add it as well
            // Color the intersection differently draw the user's attention
            var intersectionPolygon =
                    geoJSONToGooglePolygon(intersect(polygons));

            intersectionPolygon.setOptions({
                    fillColor: "#FF0000",
                    fillOpacity: 0.4,

                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8
            });

            intersectionPolygon.setMap(map);
        }
    }

    // Actually add the Google map to the view
    initializeGoogleMap([]);

    // Create the list of user isochrones
    isochrones = [];

    // Enable the form to update the isochrones and resultant intersection map
    document.getElementById("userParameters").onsubmit = function(e) {
        e.preventDefault();

        isochroneFromForm = createIsochrone(
                geocodeAddress(userParameters.origin.value),
                parseInt(userParameters.travelTimeInMinutes.value),
                userParameters.transportMode.value
        );

        isochrones.push(isochroneFromForm);

        initializeGoogleMap(isochrones);
    };
}
