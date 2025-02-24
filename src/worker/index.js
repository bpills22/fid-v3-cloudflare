export default {
	async fetch(request, env, ctx) {
	  const url = new URL(request.url);
  
	  // Enhanced Debug logging
	  console.log("Worker Environment:", {
		isDev: process.env.NODE_ENV === "development",
		env: process.env.NODE_ENV,
		bindings: Object.keys(env || {}),
		hasKV: !!env?.FLIGHTAWARE_CACHE,
		hasAPI: !!env?.API_KEY,
		url: url.toString()
	  });
	  
	  // CORS handling
	  if (request.method === "OPTIONS") {
		return handleCORS(request);
	  }
	  
	  // Test KV endpoint
	  if (url.pathname === "/test-kv") {
		try {
		  const testValue = await env.FLIGHTAWARE_CACHE.get("test");
		  return new Response(JSON.stringify({
			success: true,
			value: testValue,
			hasKV: !!env.FLIGHTAWARE_CACHE
		  }), {
			headers: {
			  "Content-Type": "application/json",
			  "Access-Control-Allow-Origin": "*"
			}
		  });
		} catch (error) {
		  return new Response(JSON.stringify({
			success: false,
			error: error.message,
			hasKV: !!env.FLIGHTAWARE_CACHE
		  }), {
			status: 500,
			headers: {
			  "Content-Type": "application/json",
			  "Access-Control-Allow-Origin": "*"
			}
		  });
		}
	  }

	  if (url.pathname.startsWith("/api/flights/")) {
		try {
		  return await handleFlightRequest(request, env, ctx);
		} catch (error) {
		  console.error("Full error details:", {
			message: error.message,
			stack: error.stack,
			url: url.toString()
		  });
		  return new Response(JSON.stringify({
			error: error.message,
			path: url.pathname,
			timestamp: new Date().toISOString()
		  }), {
			status: 500,
			headers: {
			  "Content-Type": "application/json",
			  "Access-Control-Allow-Origin": "*"
			}
		  });
		}
	  }
  
	  return new Response("Not Found", { status: 404 });
	}
  };
  
  async function handleFlightRequest(request, env, ctx) {
	try {
	  const url = new URL(request.url);
	  const pathSegments = url.pathname.split("/");
	  const airportCode = pathSegments[3];
	  const flightType = pathSegments[4];
  
	  // Generate cache key
	  const cacheKey = `flights:${airportCode}:${flightType}`;
  
	  // Check cache first
	  const cachedData = await env.FLIGHTAWARE_CACHE.get(cacheKey, { type: "json" });
	  if (cachedData) {
		const now = Date.now();
		if (now - cachedData.timestamp < 60000) { // 60 second TTL
		  return new Response(JSON.stringify(cachedData.data), {
			headers: {
			  "Content-Type": "application/json",
			  "Access-Control-Allow-Origin": "*",
			  "Cache-Hit": "true",
			  "X-Cache-Time": new Date(cachedData.timestamp).toISOString()
			}
		  });
		}
	  }
  
	  // If not in cache or expired, fetch from API
	  const apiUrl = `https://aeroapi.flightaware.com/aeroapi/airports/${airportCode}/flights/${flightType}?max_pages=2`;
	  
	  const apiResponse = await fetch(apiUrl, {
		headers: { "x-apikey": env.API_KEY }
	  });
  
	  if (!apiResponse.ok) {
		throw new Error(`API request failed with status ${apiResponse.status}`);
	  }
  
	  const data = await apiResponse.json();
  
	  // Store in cache
	  await env.FLIGHTAWARE_CACHE.put(cacheKey, JSON.stringify({
		timestamp: Date.now(),
		data
	  }), {
		expirationTtl: 60 // 60 seconds
	  });
  
	  return new Response(JSON.stringify(data), {
		headers: {
		  "Content-Type": "application/json",
		  "Access-Control-Allow-Origin": "*",
		  "Cache-Hit": "false",
		  "X-Cache-Time": new Date().toISOString()
		}
	  });
  
	} catch (error) {
	  throw error; // Let the main error handler deal with it
	}
  }
  
  function handleCORS(request) {
	return new Response(null, {
	  headers: {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Max-Age": "86400",
	  }
	});
  }