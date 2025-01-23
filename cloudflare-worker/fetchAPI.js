export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    console.log("Request URL:", url.toString());
    console.log("Request pathname:", url.pathname);
    console.log("Request headers:", Object.fromEntries(request.headers));

    // Helper function to determine allowed origins
    const getAllowedOrigin = (request) => {
      const origin = request.headers.get("Origin");
      console.log("Incoming origin:", origin);

      const allowedOrigins = [
        "https://cf-next-flightaware.bpillsbury.com",
        "http://localhost:3000",
        /^https:\/\/[0-9a-z-]+\.fid-v3-cloudflare\.pages\.dev$/i, // Preview URLs with case-insensitive match
        "https://flightaware-worker.bpills33.workers.dev",
      ];

      // Enhanced CORS debug logging
      if (origin) {
        console.log("Testing origins for:", origin);
        allowedOrigins.forEach((pattern) => {
          if (pattern instanceof RegExp) {
            const matches = pattern.test(origin);
            console.log(
              `RegExp pattern ${pattern.toString()} matches: ${matches}`
            );
          } else {
            const matches = pattern === origin;
            console.log(`Exact match "${pattern}" equals: ${matches}`);
          }
        });
      }

      if (!origin) return "*"; // For direct API testing

      // Check exact matches first
      if (allowedOrigins.includes(origin)) return origin;

      // Then check regex patterns
      for (const pattern of allowedOrigins) {
        if (pattern instanceof RegExp && pattern.test(origin)) {
          console.log(`Found matching pattern for ${origin}`);
          return origin;
        }
      }

      console.log(`No matching origin found for ${origin}`);
      return null;
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      console.log("Handling OPTIONS preflight request");
      const allowedOrigin = getAllowedOrigin(request);
      if (!allowedOrigin) {
        console.log("CORS Preflight: Origin not allowed");
        return new Response(null, { status: 403 });
      }

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

        console.log(
          `Processing request for airport: ${airportCode}, type: ${flightType}`
        );

        let apiUrl = `https://aeroapi.flightaware.com/aeroapi/airports/${airportCode}/flights/${flightType}?max_pages=2`;
        if (cursor) {
          apiUrl += `&cursor=${cursor}`;
        }

        console.log("Fetching from FlightAware API:", apiUrl);

        const apiResponse = await fetch(apiUrl, {
          headers: { "x-apikey": env.API_KEY },
        });

        if (!apiResponse.ok) {
          console.error("FlightAware API error:", apiResponse.status);
          return new Response(
            `Error fetching data from FlightAware API: ${apiResponse.status}`,
            {
              status: apiResponse.status,
              headers: {
                "Access-Control-Allow-Origin": getAllowedOrigin(request),
              },
            }
          );
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
        return new Response(`Internal Server Error: ${error.message}`, {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": getAllowedOrigin(request),
          },
        });
      }
    }

    console.log("No matching route found, returning 404");
    return new Response("Not Found", {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": getAllowedOrigin(request),
      },
    });
  },
};
