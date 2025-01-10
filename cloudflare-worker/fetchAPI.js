export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/flights/")) {
      try {
        const pathSegments = url.pathname.split("/");
        const airportCode = pathSegments[3];
        const flightType = pathSegments[4];
        const cursor = url.searchParams.get("cursor");

        let apiUrl = `https://aeroapi.flightaware.com/aeroapi/airports/${airportCode}/flights/${flightType}?max_pages=2`;
        if (cursor) {
          apiUrl += `&cursor=${cursor}`;
        }

        const apiResponse = await fetch(apiUrl, {
          headers: { "x-apikey": env.API_KEY },
        });

        if (!apiResponse.ok) {
          return new Response("Error fetching data from FlightAware API", {
            status: apiResponse.status,
          });
        }

        const data = await apiResponse.json();
        return new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin":
              "https://cf-next-flightaware.bpillsbury.com",
          },
        });
      } catch (error) {
        return new Response("Internal Server Error", { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
