import React, { useState, useEffect } from "react";
import { Grid, Button, Typography, IconButton } from "@material-ui/core";
import NavigateBeforeIcon from "@material-ui/icons/NavigateBefore";
import NavigateNextIcon from "@material-ui/icons/NavigateNext";
import { Link } from "react-router-dom";

const pages = {
  JOIN: "pages.join",
  CREATE: "pages.create",
};

export default function Info(props) {
  const [page, setPage] = useState(pages.JOIN);

  function joinInfo() {
    return "Join page";
  }

  function createInfo() {
    return "Create page";
  }

  useEffect(() => {
    console.log("ran");
    return () => console.log("cleanup");
  });

  const isMobile = window.innerWidth < 600;
  
  return (
    <Grid container spacing={1}>
      <Grid item xs={12} align="center">
        <Typography 
          component="h4" 
          variant="h4"
          style={{ fontSize: isMobile ? '1.5rem' : '2.125rem' }}
        >
          What is House Party?
        </Typography>
      </Grid>
      <Grid item xs={12} sm={10} md={8} align="center">
        <Typography 
          variant="body1"
          style={{ 
            fontSize: isMobile ? '0.875rem' : '1rem',
            padding: isMobile ? '0 8px' : '0 16px'
          }}
        >
          {page === pages.JOIN ? joinInfo() : createInfo()}
        </Typography>
      </Grid>
      <Grid item xs={12} align="center">
        <IconButton
          onClick={() => {
            page === pages.CREATE ? setPage(pages.JOIN) : setPage(pages.CREATE);
          }}
          size={isMobile ? 'small' : 'medium'}
        >
          {page === pages.CREATE ? (
            <NavigateBeforeIcon />
          ) : (
            <NavigateNextIcon />
          )}
        </IconButton>
      </Grid>
      <Grid item xs={12} sm={8} md={6} align="center">
        <Button 
          fullWidth
          color="secondary" 
          variant="contained" 
          to="/" 
          component={Link}
        >
          Back
        </Button>
      </Grid>
    </Grid>
  );
}