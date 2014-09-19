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

        var reader = new jsts.io.GeoJSONReader();

        var areaInAll = reader.read(polygons.pop());

        while (polygons.length > 0) {
            var intersectWithThis = reader.read(
                    polygons.pop());
            areaInAll = areaInAll.intersection(intersectWithThis);
        }

        // Throw an error if the two polygons do not intersect
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

        googlePolygon = new google.maps.Polygon({
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

    function initializeGoogleMap(polygons) {
        /*
        Create a Google Maps Map object that covers the extent of all
        polygons provided, ideally centered on their intersect
        */

        // Calculate center point of all polygons
        min_lat = 90;
        max_lat = -90;
        min_lon = 90;
        max_lon = -90;

        polygons.forEach(function(polygon) {
            polygon.coordinates[0].forEach(function(LonLat) {
                if (LonLat[1] < min_lat) {
                    min_lat = LonLat[1];
                }
                if (LonLat[1] > max_lat) {
                    max_lat = LonLat[1];
                }
                if (LonLat[0] < min_lon) {
                    min_lon = LonLat[0];
                }
                if (LonLat[0] > max_lon) {
                    max_lon = LonLat[0];
                }
            });
        });

        mapCenter = new google.maps.LatLng(
                (min_lat + max_lat) / 2,
                (min_lon + max_lon) / 2
        );

        // Set center point and extent
        var mapOptions = {
            zoom: 12,
            center: mapCenter
        };

        // Create document-level map object that will be inserted into the view
        map = new google.maps.Map(
                document.getElementById("map-canvas"),
                mapOptions
        );

        // Add polygons to the view's data layer
        var firstPolygon = true;
        polygons.forEach(function(polygon) {
            googlePolygon = geoJSONToGooglePolygon(polygon);

            // Color the first one differently to indicate it is the main focus
            if (firstPolygon) {
                firstPolygon = false;
                googlePolygon.setOptions({
                        fillColor: "#FF0000",
                        fillOpacity: 0.4,

                        strokeColor: "#FF0000",
                        strokeOpacity: 0.8
                });
            }

            googlePolygon.setMap(map);
        });
    }

    testIsochroneA = createIsochrone([42.2814, -83.7483], 40, "walk");
    testIsochroneB = createIsochrone([42.2805, -83.7803], 30, "walk");
    testIntersectionA = intersect([testIsochroneA, testIsochroneB]);
    initializeGoogleMap([
            testIntersectionA,
            testIsochroneA,
            testIsochroneB
    ]);

    // Enable the form to update the isochrone and resultant intersection map
    document.getElementById("userParameters").onsubmit = function(e) {
        e.preventDefault();

        isochroneFromForm = createIsochrone(
                userParameters.origin.value,
                parseInt(userParameters.travelTimeInMinutes.value),
                userParameters.transportMode.value
        );
        testIntersectionB = intersect([isochroneFromForm, testIsochroneB]);
        initializeGoogleMap([testIntersectionA, testIntersectionB]);
    };
}
