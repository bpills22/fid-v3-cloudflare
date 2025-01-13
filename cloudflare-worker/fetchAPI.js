export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);

    // Helper function to determine allowed origins
    const getAllowedOrigin = (request) => {
      const origin = request.headers.get("Origin");
      const allowedOrigins = [
        "https://cf-next-flightaware.bpillsbury.com",
        "http://localhost:3000",
        /https:\/\/.*--fid-v3-cloudflare\.pages\.dev$/, // Preview URLs
        "https://flightaware-worker.bpills33.workers.dev",
      ];

      if (!origin) return "*"; // For direct API testing

      // Check exact matches first
      if (allowedOrigins.includes(origin)) return origin;

      // Then check regex patterns
      for (const pattern of allowedOrigins) {
        if (pattern instanceof RegExp && pattern.test(origin)) {
          return origin;
        }
      }

      return null;
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      const allowedOrigin = getAllowedOrigin(request);
      if (!allowedOrigin) return new Response(null, { status: 403 });

      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

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
            headers: {
              "Access-Control-Allow-Origin": getAllowedOrigin(request),
            },
          });
        }

        const data = await apiResponse.json();
        return new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": getAllowedOrigin(request),
          },
        });
      } catch (error) {
        console.error("Worker error:", error);
        return new Response("Internal Server Error", {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": getAllowedOrigin(request),
          },
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
