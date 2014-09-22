define([
    "require",
    "jsts/lib/javascript.util",
    "jsts/lib/jsts"
    ],
    function() {
        main();
});

function main() {
    // Declare the map and user isochrones
    var map;
    var isochrones = [];


    function findDegreeLengths(originLatitude) {
        /*
        Determine the length of one degree of latitude and longitude,
        at a given latitude

        Code adapted from a calculator by the National Geospatial
        Intelligence Agency's Maritime Safety Information office:
        http://msi.nga.mil/MSISiteContent/StaticFiles/Calculators/degree.html
        */

        // Convert latitude to radians
        var DEGREES_PER_RADIAN = (2 * Math.PI) / 360;
        var latitudeInRadians = originLatitude * DEGREES_PER_RADIAN;

        // Set up constants for the calculation
        // Latitude calculation terms
        var M1 = 111132.92;
        var M2 = -559.82;
        var M3 = 1.175;
        var M4 = -0.0023;

        // Longitude calculation terms
        var P1 = 111412.84;
        var P2 = -93.5;
        var P3 = 0.118;

        // Calculate the length of a degree of latitude and longitude in meters
        var latitudeLengthInMeters =
                (M1) +
                (M2 * Math.cos(2 * latitudeInRadians)) +
                (M3 * Math.cos(4 * latitudeInRadians)) +
                (M4 * Math.cos(6 * latitudeInRadians))
                ;

        var longitudeLengthInMeters =
                (P1 * Math.cos(latitudeInRadians)) +
                (P2 * Math.cos(3 * latitudeInRadians)) +
                (P3 * Math.cos(5 * latitudeInRadians))
                ;

        // Convert the degree lengths to statute miles
        var METERS_PER_MILE = 1609.34;
        var latitudeLengthInMiles = latitudeLengthInMeters / METERS_PER_MILE;
        var longitudeLengthInMiles = longitudeLengthInMeters / METERS_PER_MILE;
        
        var degreeLengths = {
            lat: latitudeLengthInMiles,
            lon: longitudeLengthInMiles
        };

        return degreeLengths;
    }

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

        // Handle errors with parameters
        if (travelTimeInMinutes <= 0) {
            throw "Must have a positive travel time";
        }
        if (TRANSPORT_MODES.indexOf(transportMode) == -1) {
            throw "Not a valid transport mode";
        }

        // Determine the radii (in latitude and longitude degrees) of the isochrone
        var degreeLengths = findDegreeLengths(originLatLon[0]);

        var distanceInMiles = 
                SPEEDS[transportMode] * (travelTimeInMinutes / 60);

        distanceInLatDegrees = distanceInMiles / degreeLengths.lat;
        distanceInLonDegrees = distanceInMiles / degreeLengths.lon;
        
        // For the diagonals of the isochrone, find the lat and lon distances
        distanceForDiagonals = Math.sqrt(
                Math.pow(distanceInLatDegrees, 2) +
                Math.pow(distanceInLonDegrees, 2)
                ) / 2
                ;

        var originLat = originLatLon[0];
        var originLon = originLatLon[1];

        // Create a rough octagon of the isochrone's bounds
        // GeoJSON uses (x,y) for coordinates, the opposite order of (lat,lon)
        var isochroneBounds = [
                [originLon + distanceInLonDegrees, originLat],
                [originLon + distanceForDiagonals, originLat + distanceForDiagonals],
                [originLon, originLat + distanceInLatDegrees],
                [originLon - distanceForDiagonals, originLat + distanceForDiagonals],
                [originLon - distanceInLonDegrees, originLat],
                [originLon - distanceForDiagonals, originLat - distanceForDiagonals],
                [originLon, originLat - distanceInLatDegrees],
                [originLon + distanceForDiagonals, originLat - distanceForDiagonals],
                [originLon + distanceInLonDegrees, originLat]
        ];

        // Create a geoJSON object containing this information
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

        // Show an error and start over if the polygons do not intersect
        if (areaInAll.getArea() === 0) {
            window.alert("No intersection found, reloading page");
            location.reload();
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
        map = new google.maps.Map(
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
            showRestaurantsWithinArea(intersect(polygons));
        }
    }

    function addRestaurantToMap(place) {
        /*
        Add an item to the map
        */

        // Instantiate the marker
        var marker = new google.maps.Marker({
            map: map,
            position: place.geometry.location
        });

        // Define marker actions
        google.maps.event.addListener(marker, 'click', function() {
            infowindow.setContent(place.name);
            infowindow.open(map, this);
        });
    }

    function showRestaurantsWithinArea(areaToSearch) {
        /*
        Search for restaurants within a given area, and add results to
        the map
        */

        // Get the bounding box of the area to search
        var searchBounds = new google.maps.LatLngBounds();
        areaToSearch.coordinates[0].forEach(function(LonLat) {
            searchBounds.extend(new google.maps.LatLng(
                    LonLat[1],
                    LonLat[0]
            ));
        });

        // Set the search parameters and make the search
        // Display the results on the map
        var restaurantParameters = {
            location: searchBounds,
            rankBy: google.maps.places.RankBy.PROMINENCE,
            types: ["restaurant"]
        };

        var placesService = new google.maps.places.PlacesService(map);
        placesService.nearbySearch(
                restaurantParameters,
                function(results, status) {
                    if (status == google.maps.places.PlacesServiceStatus.OK) {
                        results.forEach(function(result) {
                            addRestaurantToMap(result);
                        });
                    }
                }
        );
    }

    // Actually add the Google map to the view
    initializeGoogleMap([]);

    // Enable the form to update the isochrones and resultant intersection map
    document.getElementById("userParameters").onsubmit = function(e) {
        e.preventDefault();

        var isochroneFromForm = createIsochrone(
                geocodeAddress(userParameters.origin.value),
                parseInt(userParameters.travelTimeInMinutes.value),
                userParameters.transportMode.value
        );

        isochrones.push(isochroneFromForm);

        initializeGoogleMap(isochrones);
    };
}
