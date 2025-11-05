import React, { Component } from "react";
import { TextField, Button, Grid, Typography } from "@material-ui/core";
import { Link } from "react-router-dom";

export default class RoomJoinPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      roomCode: "",
      error: "",
    };
    this.handleTextFieldChange = this.handleTextFieldChange.bind(this);
    this.roomButtonPressed = this.roomButtonPressed.bind(this);
  }

  render() {
    const isMobile = window.innerWidth < 600;
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography 
            variant="h4" 
            component="h4"
            style={{ fontSize: isMobile ? '1.5rem' : '2.125rem' }}
          >
            Join a Room
          </Typography>
        </Grid>
        <Grid item xs={12} sm={8} md={6} align="center">
          <TextField
            fullWidth
            error={this.state.error}
            label="Code"
            placeholder="Enter a Room Code"
            value={this.state.roomCode}
            helperText={this.state.error}
            variant="outlined"
            onChange={this.handleTextFieldChange}
            inputProps={{
              style: { 
                textAlign: 'center',
                fontSize: isMobile ? '1rem' : '1.25rem',
                textTransform: 'uppercase'
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={8} md={6} align="center">
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={this.roomButtonPressed}
          >
            Enter Room
          </Button>
        </Grid>
        <Grid item xs={12} sm={8} md={6} align="center">
          <Button 
            fullWidth
            variant="contained" 
            color="secondary" 
            to="/" 
            component={Link}
          >
            Back
          </Button>
        </Grid>
      </Grid>
    );
  }

  handleTextFieldChange(e) {
    this.setState({
      roomCode: e.target.value,
    });
  }

  roomButtonPressed() {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: this.state.roomCode,
      }),
    };
    fetch("/api/join-room", requestOptions)
      .then((response) => {
        if (response.ok) {
          this.props.history.push(`/room/${this.state.roomCode}`);
        } else {
          this.setState({ error: "Room not found." });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
}