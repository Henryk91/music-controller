import React, { Component } from "react";
import {
  Grid,
  Typography,
  Card,
  IconButton,
  LinearProgress,
  Slider,
} from "@material-ui/core";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import VolumeUpIcon from "@material-ui/icons/VolumeUp";

export default class MusicPlayer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      volume: this.props.volume !== undefined ? this.props.volume : 50,
      isChangingVolume: false,
      lastVolumeChangeTime: 0,
    };
    this.handleVolumeChange = this.handleVolumeChange.bind(this);
    this.handleVolumeChangeStart = this.handleVolumeChangeStart.bind(this);
    this.handleVolumeChangeEnd = this.handleVolumeChangeEnd.bind(this);
  }

  componentDidUpdate(prevProps) {
    // Only update volume from props if user isn't actively changing it
    // and enough time has passed since the last user change
    const timeSinceLastChange = Date.now() - this.state.lastVolumeChangeTime;
    const shouldUpdateFromProps = !this.state.isChangingVolume && timeSinceLastChange > 500;
    
    if (prevProps.volume !== this.props.volume && shouldUpdateFromProps) {
      if (this.props.volume !== undefined && this.props.volume !== null) {
        this.setState({ volume: this.props.volume });
      }
    }
  }

  componentDidMount() {
    // Initialize volume from props if available
    if (this.props.volume !== undefined && this.props.volume !== null) {
      this.setState({ volume: this.props.volume });
    }
  }

  skipSong() {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/spotify/skip", requestOptions);
  }

  pauseSong() {
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/spotify/pause", requestOptions);
  }

  playSong() {
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/spotify/play", requestOptions);
  }

  handleVolumeChangeStart(event) {
    this.setState({ isChangingVolume: true });
  }

  handleVolumeChange(event, newValue) {
    this.setState({ 
      volume: newValue,
      lastVolumeChangeTime: Date.now()
    });
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        volume_percent: newValue,
      }),
    };
    fetch("/spotify/set-volume", requestOptions);
  }

  handleVolumeChangeEnd(event) {
    // Allow a short delay before accepting prop updates again
    setTimeout(() => {
      this.setState({ isChangingVolume: false });
    }, 300);
  }

  render() {
    const songProgress = (this.props.time / this.props.duration) * 100;
    const isMobile = window.innerWidth < 600;

    return (
      <Card style={{ 
        padding: isMobile ? '8px' : '16px',
        maxWidth: '100%',
        width: '100%',
        margin: '0 auto'
      }}>
        <Grid container alignItems="center" spacing={isMobile ? 1 : 2}>
          <Grid item xs={12} sm={4} align="center">
            <img 
              src={this.props.image_url} 
              height="100%" 
              width="100%" 
              style={{ maxWidth: isMobile ? '200px' : '100%', borderRadius: '4px' }}
              alt="Album cover"
            />
          </Grid>
          <Grid item xs={12} sm={8} align="center">
            <Typography 
              component="h5" 
              variant="h5"
              style={{ 
                fontSize: isMobile ? '1.1rem' : '1.5rem',
                marginBottom: '4px',
                wordBreak: 'break-word'
              }}
            >
              {this.props.title}
            </Typography>
            <Typography 
              color="textSecondary" 
              variant="subtitle1"
              style={{ 
                fontSize: isMobile ? '0.9rem' : '1rem',
                marginBottom: '8px',
                wordBreak: 'break-word'
              }}
            >
              {this.props.artist}
            </Typography>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              <IconButton
                onClick={() => {
                  this.props.is_playing ? this.pauseSong() : this.playSong();
                }}
                size={isMobile ? 'small' : 'medium'}
              >
                {this.props.is_playing ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
              <IconButton 
                onClick={() => this.skipSong()}
                size={isMobile ? 'small' : 'medium'}
              >
                <span style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                  {this.props.votes} / {this.props.votes_required}
                </span>
                <SkipNextIcon style={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
              </IconButton>
            </div>
            {(this.props.isHost || this.props.guestCanControlVolume) && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginTop: 10,
                width: '100%',
                padding: isMobile ? '0 8px' : '0'
              }}>
                <VolumeUpIcon style={{ marginRight: 8, fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                <Slider
                  value={this.state.volume}
                  onChange={this.handleVolumeChange}
                  onMouseDown={this.handleVolumeChangeStart}
                  onTouchStart={this.handleVolumeChangeStart}
                  onMouseUp={this.handleVolumeChangeEnd}
                  onTouchEnd={this.handleVolumeChangeEnd}
                  min={0}
                  max={100}
                  style={{ width: isMobile ? 'calc(100% - 40px)' : 150, maxWidth: '200px' }}
                  aria-labelledby="volume-slider"
                />
              </div>
            )}
          </Grid>
        </Grid>
        <LinearProgress 
          variant="determinate" 
          value={songProgress} 
          style={{ marginTop: isMobile ? '8px' : '16px' }}
        />
      </Card>
    );
  }
}