// src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#0077B5", // Customize primary color
    },
    secondary: {
      main: "#00A1D6", // Customize secondary color
    },
  },
  typography: {
    fontFamily: "Arial, sans-serif", // Customize typography
  },
});

export default theme;
