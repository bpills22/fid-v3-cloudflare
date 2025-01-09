export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);

    // Handle preflight (OPTIONS) requests for CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin":
            "https://cf-next-flightaware.bpillsbury.com",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Handle API routes starting with "/api/flights/"
    if (url.pathname.startsWith("/api/flights/")) {
      try {
        const pathSegments = url.pathname.split("/");
        const airportCode = pathSegments[3]; // e.g., 'kaus'
        const flightType = pathSegments[4]; // e.g., 'arrivals' or 'departures'

        // Retrieve cursor if available in the query string
        const cursor = url.searchParams.get("cursor");

        // Construct the FlightAware API URL
        let apiUrl = `https://aeroapi.flightaware.com/aeroapi/airports/${airportCode}/flights/${flightType}?max_pages=2`;
        if (cursor) {
          apiUrl += `&cursor=${cursor}`;
        }

        // Fetch data from FlightAware API
        const apiResponse = await fetch(apiUrl, {
          headers: { "x-apikey": env.apikey },
        });

        if (!apiResponse.ok) {
          console.error("Error fetching from API:", apiResponse.statusText);
          return new Response("Error fetching from FlightAware API", {
            status: apiResponse.status,
          });
        }

        // Return the API response to the client with CORS headers
        const data = await apiResponse.json();
        return new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin":
              "https://cf-next-flightaware.bpillsbury.com",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      } catch (error) {
        console.error("Error in Worker:", error);
        return new Response("Internal Server Error", { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
