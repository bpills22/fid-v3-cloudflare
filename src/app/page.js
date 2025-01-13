"use client";
import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
} from "@mui/material";
import { ArrowDropUp, ArrowDropDown } from "@mui/icons-material";
import SearchIcon from "@mui/icons-material/Search";
import Image from "next/image";

export default function HomePage() {
  const [currentPageUrl, setCurrentPageUrl] = useState(null);
  const [previousPages, setPreviousPages] = useState([]);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [flightData, setFlightData] = useState([]);
  const [flightType, setFlightType] = useState("arrivals");
  const [selectedAirport, setSelectedAirport] = useState("kaus");
  const [debugInfo, setDebugInfo] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFlights = async (
    airportCode,
    type = "arrivals",
    pageUrl = null
  ) => {
    // Base URL changes based on environment
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:8787" // Local development Worker URL
        : ""; // Empty string for production (uses relative URL)

    const url = pageUrl || `${baseUrl}/api/flights/${airportCode}/${type}`;
    setDebugInfo(`URL passed to Edge Function: ${url}`);

    try {
      const response = await fetch(url, { method: "GET" });
      if (!response.ok)
        throw new Error(`API request failed with status ${response.status}`);

      const data = await response.json();
      setFlightData(type === "departures" ? data.departures : data.arrivals);

      if (data.links && data.links.next) {
        setNextPageUrl(
          `${baseUrl}/api/flights/${airportCode}/${type}?cursor=${
            data.links.next.split("cursor=")[1]
          }`
        );
      } else {
        setNextPageUrl(null);
      }
    } catch (error) {
      console.error("Error fetching flight data:", error);
      setFlightData([]);
      setDebugInfo("Failed to fetch data from API.");
    }
  };

  const updateAirportLogo = (airportCode) => {
    setLogoUrl(
      `https://cf-assets-flightaware.bpillsbury.com/${airportCode.toLowerCase()}.png`
    );
  };

  useEffect(() => {
    updateAirportLogo(selectedAirport);
    fetchFlights(selectedAirport, "arrivals");
  }, [selectedAirport]); // Runs whenever `selectedAirport` changes

  const handleSelectChange = (event) => {
    const airportCode = event.target.value;
    setSelectedAirport(airportCode);
    setPreviousPages([]);
    setCurrentPageUrl(null);
    fetchFlights(airportCode, flightType);
    updateAirportLogo(airportCode);
  };

  const handleFlightTypeChange = (type) => {
    setFlightType(type);
    fetchFlights(selectedAirport, type);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedData = [...flightData].sort((a, b) => {
      const aValue = key === "city" ? a.origin.city : a[key];
      const bValue = key === "city" ? b.origin.city : b[key];

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setFlightData(sortedData);
  };

  const renderSortIcon = (key) => {
    // Show ArrowDropDown by default if the column isn't actively sorted
    if (sortConfig.key !== key) {
      return <ArrowDropDown fontSize="small" style={{ color: "white" }} />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowDropUp fontSize="small" style={{ color: "white" }} />
    ) : (
      <ArrowDropDown fontSize="small" style={{ color: "white" }} />
    );
  };

  const filteredFlightData = flightData
    .filter((flight) => {
      const query = searchQuery.toLowerCase();
      return (
        flight.operator_iata?.toLowerCase().includes(query) ||
        flight.ident_iata?.toLowerCase().includes(query) ||
        (flightType === "arrivals"
          ? flight.origin?.city?.toLowerCase().includes(query)
          : flight.destination?.city?.toLowerCase().includes(query))
      );
    })
    .concat(
      flightData.filter((flight) => {
        const query = searchQuery.toLowerCase();
        return !(
          flight.operator_iata?.toLowerCase().includes(query) ||
          flight.ident_iata?.toLowerCase().includes(query) ||
          (flightType === "arrivals"
            ? flight.origin?.city?.toLowerCase().includes(query)
            : flight.destination?.city?.toLowerCase().includes(query))
        );
      })
    );

  const displayedFlightData = searchQuery ? filteredFlightData : flightData;

  return (
    <Container>
      <Typography variant="h3" gutterBottom style={{ textAlign: "center" }}>
        FlightAware Arrivals and Departures Information
      </Typography>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        {/* Left-aligned Airport Logo */}
        {logoUrl && (
          <Image
            id="airport-logo"
            src={logoUrl}
            alt="Airport Logo"
            width={250} // specify a fixed width
            height={100} // specify a fixed height
            style={{ objectFit: "contain" }} // adjust for scaling without distortion
          />
        )}

        {/* Centered Airport Selector with Arrivals/Departures Links */}
        <div style={{ textAlign: "center" }}>
          <Typography variant="body1">Select an Airport:</Typography>
          <Select
            value={selectedAirport}
            onChange={handleSelectChange}
            displayEmpty
          >
            <MenuItem value="kaus">Austin - KAUS - AUS</MenuItem>
            <MenuItem value="kbos">Boston - KBOS - BOS</MenuItem>
            <MenuItem value="kbur">Burbank - KBUR - BUR</MenuItem>
            <MenuItem value="egll">London Heathrow - EGLL - LHR</MenuItem>
            <MenuItem value="klax">
              Los Angeles Int&rsquo;l - KLAX - LAX
            </MenuItem>
            <MenuItem value="ksna">
              Orange County/John Wayne - KSNA - SNA
            </MenuItem>
            <MenuItem value="engm">Oslo Norway - ENGM - OSL</MenuItem>
            <MenuItem value="kphl">Philadelphia - KPHL - PHL</MenuItem>
            <MenuItem value="sbgl">Rio de Janiero - SBGL - GIG</MenuItem>
            <MenuItem value="kslc">Salt Lake City - KSLC - SLC</MenuItem>
            <MenuItem value="ksan">San Diego - KSAN - SAN</MenuItem>
            <MenuItem value="kilg">Wilmington Delaware - KILG - ILG</MenuItem>
          </Select>

          {/* Arrivals and Departures Links */}
          <div className="flight-type-links" style={{ marginTop: "10px" }}>
            <Typography
              variant="body1"
              onClick={() => handleFlightTypeChange("arrivals")}
              style={{
                cursor: "pointer",
                fontWeight: flightType === "arrivals" ? "bold" : "normal",
                color: flightType === "arrivals" ? "black" : "inherit",
                borderBottom:
                  flightType === "arrivals" ? "3px solid #FFC107" : "none",
              }}
            >
              Arrivals
            </Typography>
            <Typography
              variant="body1"
              onClick={() => handleFlightTypeChange("departures")}
              style={{
                cursor: "pointer",
                fontWeight: flightType === "departures" ? "bold" : "normal",
                color: flightType === "departures" ? "black" : "inherit",
                borderBottom:
                  flightType === "departures" ? "3px solid #FFC107" : "none",
                marginLeft: "10px",
              }}
            >
              Departures
            </Typography>
          </div>
        </div>

        {/* Right-aligned Search Box */}
        <TextField
          placeholder="Search by flight #, city, or airline"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          style={{
            maxWidth: "300px",
            backgroundColor: "white",
            borderRadius: "25px",
          }}
        />
      </div>

      <Typography style={{ color: "red", marginTop: "10px" }}>
        {debugInfo}
      </Typography>

      <TableContainer component={Paper} style={{ marginTop: "20px" }}>
        <Table>
          <TableHead>
            <TableRow style={{ backgroundColor: "#003366" }}>
              <TableCell
                style={{
                  fontWeight: "bold",
                  color: "white",
                  cursor: "pointer",
                }}
                onClick={() => handleSort("city")}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  City {renderSortIcon("city")}
                </div>
              </TableCell>
              <TableCell
                style={{
                  fontWeight: "bold",
                  color: "white",
                  cursor: "pointer",
                }}
                onClick={() => handleSort("code_iata")}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  Airport Code {renderSortIcon("code_iata")}
                </div>
              </TableCell>
              <TableCell
                style={{
                  fontWeight: "bold",
                  color: "white",
                  cursor: "pointer",
                }}
                onClick={() => handleSort("operator_iata")}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  Airline {renderSortIcon("operator_iata")}
                </div>
              </TableCell>
              <TableCell
                style={{
                  fontWeight: "bold",
                  color: "white",
                  cursor: "pointer",
                }}
                onClick={() => handleSort("ident_iata")}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  Flight Number {renderSortIcon("ident_iata")}
                </div>
              </TableCell>
              <TableCell
                style={{
                  fontWeight: "bold",
                  color: "white",
                  cursor: "pointer",
                }}
                onClick={() => handleSort("arrival_time")}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  {flightType === "arrivals"
                    ? "Arrival Time"
                    : "Departure Time"}{" "}
                  {renderSortIcon("arrival_time")}
                </div>
              </TableCell>
              <TableCell
                style={{
                  fontWeight: "bold",
                  color: "white",
                  cursor: "pointer",
                }}
                onClick={() => handleSort("status")}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  Status {renderSortIcon("status")}
                </div>
              </TableCell>
              <TableCell
                style={{
                  fontWeight: "bold",
                  color: "white",
                  cursor: "pointer",
                }}
                onClick={() => handleSort("aircraft_type")}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  Aircraft Type {renderSortIcon("aircraft_type")}
                </div>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {(searchQuery ? filteredFlightData : flightData).length > 0 ? (
              (searchQuery ? filteredFlightData : flightData).map(
                (flight, index) => (
                  <TableRow
                    key={index}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#e0f7fa" : "#ffffff",
                    }}
                  >
                    <TableCell>
                      {flightType === "departures"
                        ? flight.destination?.city || "Unknown"
                        : flight.origin?.city || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {flightType === "departures"
                        ? flight.destination?.code_iata || "N/A"
                        : flight.origin?.code_iata || "N/A"}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const isGeneralAviation =
                          flight.type === "General_Aviation";
                        const airlineCode = isGeneralAviation
                          ? "GA"
                          : flight.operator_iata || "GA";
                        const logoUrl = `https://cf-assets-flightaware.bpillsbury.com/${airlineCode.toLowerCase()}.png`;
                        return (
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <Image
                              src={logoUrl}
                              alt={airlineCode}
                              width={150} // specify the width directly
                              height={40} // specify the height directly
                              style={{
                                marginRight: "8px",
                                objectFit: "contain",
                              }}
                            />
                            <span
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              {airlineCode}
                            </span>
                          </div>
                        );
                      })()}
                    </TableCell>

                    <TableCell>
                      {flight.ident_iata || "General Aviation"}
                    </TableCell>
                    <TableCell>
                      {new Date(
                        flight.actual_on ||
                          flight.estimated_on ||
                          flight.scheduled_on
                      ).toLocaleString("en-US") || "Unknown"}
                    </TableCell>
                    <TableCell>{flight.status || "Unknown"}</TableCell>
                    <TableCell>{flight.aircraft_type || "Unknown"}</TableCell>
                  </TableRow>
                )
              )
            ) : (
              <TableRow>
                <TableCell colSpan={7}>No flight data available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
