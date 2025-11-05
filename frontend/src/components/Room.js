import React, { Component } from "react";
import { Grid, Button, Typography } from "@material-ui/core";
import { QRCodeSVG } from "qrcode.react";
import CreateRoomPage from "./CreateRoomPage";
import MusicPlayer from "./MusicPlayer";

export default class Room extends Component {
  constructor(props) {
    super(props);
    this.state = {
      votesToSkip: 2,
      guestCanPause: false,
      guestCanControlVolume: false,
      isHost: false,
      showSettings: false,
      spotifyAuthenticated: false,
      song: {},
    };
    this.roomCode = this.props.match.params.roomCode;
    this.leaveButtonPressed = this.leaveButtonPressed.bind(this);
    this.updateShowSettings = this.updateShowSettings.bind(this);
    this.renderSettingsButton = this.renderSettingsButton.bind(this);
    this.renderSettings = this.renderSettings.bind(this);
    this.getRoomDetails = this.getRoomDetails.bind(this);
    this.authenticateSpotify = this.authenticateSpotify.bind(this);
    this.getCurrentSong = this.getCurrentSong.bind(this);
    this.getRoomDetails();
  }

  componentDidMount() {
    this.interval = setInterval(this.getCurrentSong, 1000);
    // Poll room details every 2 seconds to check for rule changes
    this.roomInterval = setInterval(this.getRoomDetails, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    clearInterval(this.roomInterval);
  }

  getRoomDetails() {
    return fetch("/api/get-room" + "?code=" + this.roomCode)
      .then((response) => {
        if (!response.ok) {
          this.props.leaveRoomCallback();
          this.props.history.push("/");
        }
        return response.json();
      })
      .then((data) => {
        this.setState({
          votesToSkip: data.votes_to_skip,
          guestCanPause: data.guest_can_pause,
          guestCanControlVolume: data.guest_can_control_volume,
          isHost: data.is_host,
        });
        if (this.state.isHost) {
          this.authenticateSpotify();
        }
      });
  }

  authenticateSpotify() {
    fetch("/spotify/is-authenticated")
      .then((response) => response.json())
      .then((data) => {
        this.setState({ spotifyAuthenticated: data.status });
        console.log(data.status);
        if (!data.status) {
          fetch("/spotify/get-auth-url")
            .then((response) => response.json())
            .then((data) => {
              window.location.replace(data.url);
            });
        }
      });
  }

  getCurrentSong() {
    fetch("/spotify/current-song")
      .then((response) => {
        if (!response.ok || response.status !== 200) {
          return {};
        } else {
          return response.json();
        }
      })
      .then((data) => {
        this.setState({ song: data });
      });
  }

  leaveButtonPressed() {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/api/leave-room", requestOptions).then((_response) => {
      this.props.leaveRoomCallback();
      this.props.history.push("/");
    });
  }

  updateShowSettings(value) {
    this.setState({
      showSettings: value,
    });
  }

  renderSettings() {
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <CreateRoomPage
            update={true}
            votesToSkip={this.state.votesToSkip}
            guestCanPause={this.state.guestCanPause}
            guestCanControlVolume={this.state.guestCanControlVolume}
            roomCode={this.roomCode}
            updateCallback={this.getRoomDetails}
          />
        </Grid>
        <Grid item xs={12} align="center">
          <Button
            variant="contained"
            color="secondary"
            onClick={() => this.updateShowSettings(false)}
          >
            Close
          </Button>
        </Grid>
      </Grid>
    );
  }

  renderSettingsButton() {
    const isMobile = window.innerWidth < 600;
    return (
      <Grid item xs={12} align="center">
        <Button
          variant="contained"
          color="primary"
          onClick={() => this.updateShowSettings(true)}
          size={isMobile ? 'medium' : 'small'}
        >
          Settings
        </Button>
      </Grid>
    );
  }

  render() {
    if (this.state.showSettings) {
      return this.renderSettings();
    }
    const joinUrl = `${window.location.origin}/join?code=${this.roomCode}`;
    const isMobile = window.innerWidth < 600;
    const qrSize = 150;

    return (
      <Grid container spacing={isMobile ? 1 : 0}>
        <Grid item xs={12} align="center" style={{ marginBottom: isMobile ? '8px' : '2px', padding: '0' }}>
          <Typography 
            variant="h4" 
            component="h4"
            style={{ fontSize: isMobile ? '1.5rem' : '1.5rem', marginBottom: '0', lineHeight: '1.2' }}
          >
            Code: {this.roomCode}
          </Typography>
        </Grid>
        <Grid item xs={12} align="center" style={{ marginBottom: isMobile ? '8px' : '2px', padding: '0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <MusicPlayer 
              {...this.state.song} 
              isHost={this.state.isHost}
              guestCanPause={this.state.guestCanPause}
              guestCanControlVolume={this.state.guestCanControlVolume}
            />
          </div>
        </Grid>
        {this.state.isHost ? (
          <Grid item xs={12} align="center" style={{ marginBottom: isMobile ? '8px' : '2px', padding: '0' }}>
            {this.renderSettingsButton()}
          </Grid>
        ) : null}
        <Grid item xs={12} align="center" style={{ marginBottom: isMobile ? '8px' : '2px', padding: '0' }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={this.leaveButtonPressed}
            size={isMobile ? 'medium' : 'small'}
          >
            Leave Room
          </Button>
        </Grid>
        <Grid item xs={12} align="center" style={{ padding: '0' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            marginTop: isMobile ? '24px' : '4px'
          }}>
            <QRCodeSVG 
              value={joinUrl}
              size={qrSize}
              level="H"
              includeMargin={true}
              style={{ marginBottom: '2px' }}
            />
            <Typography 
              variant="body2" 
              color="textSecondary"
              style={{ fontSize: isMobile ? '0.75rem' : '0.65rem', marginTop: '2px' }}
            >
              Scan to join room
            </Typography>
          </div>
        </Grid>
      </Grid>
    );
  }
}