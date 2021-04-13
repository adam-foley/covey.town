import { customAlphabet, nanoid } from 'nanoid';
import dotenv from 'dotenv'; // ANDREW - TODO ADDED FOR GOOGLE API KEY
import axios from 'axios';
import { UserLocation, YoutubeVideoInfo } from '../CoveyTypes';
import CoveyTownListener from '../types/CoveyTownListener';
import Player from '../types/Player';
import PlayerSession from '../types/PlayerSession';
import TwilioVideo from './TwilioVideo';
import IVideoClient from './IVideoClient';
import Timer from '../timer';
import { YTVideo, getDefaultVideos } from '../types/YTVideo';

dotenv.config(); // ANDREW - TODO ADDED FOR GOOGLE API KEY

const friendlyNanoID = customAlphabet('1234567890ABCDEF', 8);

function formatDuration(YTDuration: string): string { 
  const timeArray= YTDuration.match(/(\d+)(?=[MHS])/ig)||[]; 

  const formattedTime= timeArray.map((time) => {
    if (timeArray.length === 1 && time.length < 2) {
      return `00:0${time}`;
    } 
    if (timeArray.length === 1) {
      return `00:${time}`;
    } 
    if (time.length<2) {
      return `0${time}`;
    } 
    return time;
  }).join(':');

  return formattedTime;
}

function parseDurationToSeconds(videoHoursMinutesSeconds: string[]) : number{
  let vidDurationSeconds;
  if (videoHoursMinutesSeconds.length === 3) {
    vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 3600 + parseInt(videoHoursMinutesSeconds[1], 10) * 60 + parseInt(videoHoursMinutesSeconds[2], 10);
  } else {
    vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 60 + parseInt(videoHoursMinutesSeconds[1], 10);
  }
return vidDurationSeconds;
}

/**
 * The CoveyTownController implements the logic for each town: managing the various events that
 * can occur (e.g. joining a town, moving, leaving a town)
 */
export default class CoveyTownController {


  get capacity(): number {
    return this._capacity;
  }

  set isPubliclyListed(value: boolean) {
    this._isPubliclyListed = value;
  }

  get isPubliclyListed(): boolean {
    return this._isPubliclyListed;
  }

  get townUpdatePassword(): string {
    return this._townUpdatePassword;
  }

  get players(): Player[] {
    return this._players;
  }

  get occupancy(): number {
    return this._listeners.length;
  }

  get friendlyName(): string {
    return this._friendlyName;
  }

  set friendlyName(value: string) {
    this._friendlyName = value;
  }

  get coveyTownID(): string {
    return this._coveyTownID;
  }

  get listeners(): CoveyTownListener[] {
    return this._listeners;
  }

  /** The list of players currently in the town * */
  private _players: Player[] = [];

  /** The list of valid sessions for this town * */
  private _sessions: PlayerSession[] = [];

  /** The videoClient that this CoveyTown will use to provision video resources * */
  private _videoClient: IVideoClient = TwilioVideo.getInstance();

  /** The list of CoveyTownListeners that are subscribed to events in this town * */
  private _listeners: CoveyTownListener[] = [];

  private readonly _coveyTownID: string;

  private _friendlyName: string;

  private readonly _townUpdatePassword: string;

  private _isPubliclyListed: boolean;

  private _capacity: number;

  // Andrew - map of players to listeners so that controller knows which listener to use when a specific player
  // needs something
  private _listenersInTVAreaMap: Map<Player, CoveyTownListener> = new Map<Player, CoveyTownListener>();

  // Andrew - default video info to send to player that is first to join tv area
  private _defaultVideoInfo: YoutubeVideoInfo; // construction moved to constructor
  
  // Adam - I think we can use this when pciking next video? Maybe we put video length in here instead of it's own variable?
  private _currentVideoInfo: YoutubeVideoInfo; // construction moved to constructor

  // Master video length and time elapsed are in seconds to be compatible with Youtube
  // TODO: Master video leghth for mario video
  private _masterVideoLength: number; // construction moved to constructor

  private _masterTimeElapsed = 0;

  private _currentTimer : Timer | null;


  // Andrew - map of video URL to how many votes it has received so that, at the end of the current video, the
  // server can choose the next video URL and send it to each client to play. 
  private _videoURLVotes: Map<string, number> = new Map<string, number>();

  private _videoList: YTVideo[];

  private _defaultVideoList: YTVideo[];

  constructor(friendlyName: string, isPubliclyListed: boolean) {
    this._coveyTownID = (process.env.DEMO_TOWN_ID === friendlyName ? friendlyName : friendlyNanoID());
    this._capacity = 50;
    this._townUpdatePassword = nanoid(24);
    this._isPubliclyListed = isPubliclyListed;
    this._friendlyName = friendlyName;
    this._currentTimer = null;
    this._videoList = getDefaultVideos();
    this._defaultVideoList = getDefaultVideos();
    const randomFirstVideo = this._defaultVideoList[Math.floor(Math.random() * this._defaultVideoList.length)];
    this._defaultVideoInfo = { 
      url: randomFirstVideo.url,
      timestamp: 0,
      isPlaying: true,
    };
    this._currentVideoInfo = {
      url: this._defaultVideoInfo.url,
      timestamp: this._defaultVideoInfo.timestamp,
      isPlaying: this._defaultVideoInfo.isPlaying,
    };
    const videoHoursMinutesSeconds = randomFirstVideo.duration.split(':');
    const vidDurationSeconds = parseDurationToSeconds(videoHoursMinutesSeconds)
    this._masterVideoLength = vidDurationSeconds;
  }

  /**
   * Adds a player to this Covey Town, provisioning the necessary credentials for the
   * player, and returning them
   *
   * @param newPlayer The new player to add to the town
   */
  async addPlayer(newPlayer: Player): Promise<PlayerSession> {
    const theSession = new PlayerSession(newPlayer);

    this._sessions.push(theSession);
    this._players.push(newPlayer);

    // Create a video token for this user to join this town
    theSession.videoToken = await this._videoClient.getTokenForTown(this._coveyTownID, newPlayer.id);

    // Notify other players that this player has joined
    this._listeners.forEach((listener) => listener.onPlayerJoined(newPlayer));

    return theSession;
  }

  /**
   * Destroys all data related to a player in this town.
   *
   * @param session PlayerSession to destroy
   */
  destroySession(session: PlayerSession): void {
    this._players = this._players.filter((p) => p.id !== session.player.id);
    this._sessions = this._sessions.filter((s) => s.sessionToken !== session.sessionToken);
    this._listeners.forEach((listener) => listener.onPlayerDisconnected(session.player));
  }

  /**
   * Updates the location of a player within the town
   * @param player Player to update location for
   * @param location New location for this player
   */
  updatePlayerLocation(player: Player, location: UserLocation): void {
    player.updateLocation(location);
    this._listeners.forEach((listener) => listener.onPlayerMoved(player));
  }

  /**
   * Subscribe to events from this town. Callers should make sure to
   * unsubscribe when they no longer want those events by calling removeTownListener
   *
   * @param listener New listener
   */
  addTownListener(listener: CoveyTownListener): void {
    this._listeners.push(listener);
  }

  /**
   * Unsubscribe from events in this town.
   *
   * @param listener The listener to unsubscribe, must be a listener that was registered
   * with addTownListener, or otherwise will be a no-op
   */
  removeTownListener(listener: CoveyTownListener): void {
    this._listeners = this._listeners.filter((v) => v !== listener);
  }

  /**
   * Fetch a player's session based on the provided session token. Returns undefined if the
   * session token is not valid.
   *
   * @param token
   */
  getSessionByToken(token: string): PlayerSession | undefined {
    return this._sessions.find((p) => p.sessionToken === token);
  }

  disconnectAllPlayers(): void {
    this._listeners.forEach((listener) => listener.onTownDestroyed());
  }

  /**
   * Used to get the amount of time we need to set the timer for based on the 
   * current video length and much time is left in the video
   * 
   */
  private getMilisecondsForTimer(): number {
    return  (this._masterVideoLength - this._masterTimeElapsed) * 1000;
  }

  /** Creates a time object that is used to know when to go to chooseNextVideo. */
  private createTimer(): Timer {
    return new Timer( () => { this.chooseNextVideo(); }, this.getMilisecondsForTimer() );
  }

  /** Destroys the current timer and sets the timer to null. */
  private destroyTimer(): void {
    this._currentTimer?.clearTimer();
    this._currentTimer = null;
  }

  /** Updates master time elpased with time elapsed on the on the current timer. */
  private addTimerToMasterTimeElapsed(): void {
    if (this._currentTimer) {
      this._masterTimeElapsed += this._currentTimer.getElapsedSeconds();
    }
  }

  /** Pauses the video for all listeners within the TV Area. */
  pauseVideos(): void {

    // We only want to pause if there is a timer, meaning that the video is currently playing
    if (this._currentTimer) {
      this.addTimerToMasterTimeElapsed();
      this.destroyTimer();
      this._listenersInTVAreaMap.forEach((listener) => listener.onPlayerPaused());
    }
  }

  /** Syncs the video for all listeners within the TV Area. */
  syncVideos(): void {

    // When the video is playing and sync is requested, we can pause the videos and then play to sync
    if (this._currentTimer){
      this.pauseVideos();
      this.playVideos();
    } else {
      // We know the video is not playing, so sync to the current master time elapsed
      this._listenersInTVAreaMap.forEach((listener) => listener.onVideoSyncing({
        url: this._currentVideoInfo.url,
        timestamp: this._masterTimeElapsed,
        isPlaying: false,
      }));
    }
  }

  /** Plays the video for all listeners within the TV Area. */
  playVideos(): void {

    // We only want to play if there is not a timer, meaning that the video is not currently playing
    if (!this._currentTimer) {
      this._listenersInTVAreaMap.forEach((listener) => listener.onVideoSyncing({
        url: this._currentVideoInfo.url,
        timestamp: this._masterTimeElapsed,
        isPlaying: true,
      }));

      // Create a new timer to track time elapsed after play is hit
      this._currentTimer = this.createTimer();
    }
  }

  /**  Adds player to TV area which adds them to listeners in the TV Area and syncs the player's video to the current state in the Town.
   *   This includes the correct video url, time elapsed, and if it is playing currently.
   */
  addToTVArea(playerToAdd: Player, listenerToAdd: CoveyTownListener): void {
    this._listenersInTVAreaMap.set(playerToAdd, listenerToAdd);
    let upToDateVideoInfo : YoutubeVideoInfo;

    // If there is a timer, the video is playing, provide the current url, the master time elapsed and the time elapsed on the timer, and to play the video.
    if (this._currentTimer) {
      upToDateVideoInfo = { url: this._currentVideoInfo.url, timestamp:  this._masterTimeElapsed + this._currentTimer.getElapsedSeconds(), isPlaying : true};
    } else if (this._listenersInTVAreaMap.size === 1) {
      // If they are the first player, provide the default video info and start a timer as default is to play when the first player enters.
      upToDateVideoInfo = this._defaultVideoInfo;
      this._currentTimer = this.createTimer();
    } else {
      // There is not a timer, the video is not playing, provide the current url, the master time elapsed, and to not play the video.
      upToDateVideoInfo = { url: this._currentVideoInfo.url, timestamp:  this._masterTimeElapsed, isPlaying : false};
    }

    // Sync the player's video to current state and provide them wirh voting widget and videos to vote on.
    listenerToAdd.onVideoSyncing(upToDateVideoInfo);
    listenerToAdd.onDisplayVotingWidget();
    listenerToAdd.onUpdatingNextVideoOptions(this._videoList);
  }


  /** 
   * Removes player and most-recent video info associated with player after they leave tv area.
   * 
   * @param playerToRemove The player to remove from the TV Area.
   * */
  removeFromTVArea(playerToRemove: Player): void {
   
    if (this._listenersInTVAreaMap.has(playerToRemove)) {

      // Reset to default state and deltes the player from the TV Area.
      this._listenersInTVAreaMap.get(playerToRemove)?.onDisableControlButtons();
      this._listenersInTVAreaMap.get(playerToRemove)?.onEnableVoting();
      this._listenersInTVAreaMap.get(playerToRemove)?.onResetVideoOptions();
      this._listenersInTVAreaMap.delete(playerToRemove);

      // After removing the player from the TV Area, if it is empty, reset to default state.
      if (this._listenersInTVAreaMap.size === 0){
        this.destroyTimer();
        this._masterTimeElapsed = 0;
        this._videoList = [...this._defaultVideoList];

        // Reset default and current video info to play a random video from the default list.
        const randomFirstVideo = this._defaultVideoList[Math.floor(Math.random() * this._defaultVideoList.length)];
        this._defaultVideoInfo = { 
          url: randomFirstVideo.url,
          timestamp: 0,
          isPlaying: true,
        };
        this._currentVideoInfo = {
          url: this._defaultVideoInfo.url,
          timestamp: this._defaultVideoInfo.timestamp,
          isPlaying: this._defaultVideoInfo.isPlaying,
        };

        // Parsing the duration of the randomFirstVideoInfo to be in seconds.
        const videoHoursMinutesSeconds = randomFirstVideo.duration.split(':');
        const vidDurationSeconds = parseDurationToSeconds(videoHoursMinutesSeconds)
        // Set the master video length to the length of randomFirstVideoInfo declared above.
        this._masterVideoLength = vidDurationSeconds;
      }
    }
  }

  /** Chooses the next video to be played to each player within the  TV Area. */
  chooseNextVideo(): void {

    // Destroy the current timer
    this.destroyTimer();

    // Choosing next video, Reset the master time to 0
    this._masterTimeElapsed = 0;

    // Select video with most votes and send it out to all clients to start
    let maxVotes = 0;
    const randomNextVideo = this._defaultVideoList[Math.floor(Math.random() * this._defaultVideoList.length)]; // if there are no votes then random vid plays from defaults
    let maxVotedURL = randomNextVideo.url;
    this._videoURLVotes.forEach((votes, vidURL) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        maxVotedURL = vidURL;
      }
    });

    const nextVideoInfo = this._videoList.find((video) => video.url === maxVotedURL);
    const videoHoursMinutesSeconds = nextVideoInfo?.duration.split(':');
    if (videoHoursMinutesSeconds) {
      const vidDurationSeconds = parseDurationToSeconds(videoHoursMinutesSeconds)
      this._masterVideoLength = vidDurationSeconds;
    } else {
      this._masterVideoLength = 100;
    }
    
    // Create a timer for this max voted video
    // TODO: Before this, we need to update _masterVideoLength
    // this._currentTimer = this.createTimer();

    this._currentVideoInfo.url = maxVotedURL.valueOf();

    // We only want to call onVideoSyncing to listeners in the TV Area Map
    this._listenersInTVAreaMap.forEach((listener) => listener.onVideoSyncing({
      url: this._currentVideoInfo.url,
      timestamp: 0,
      isPlaying: true,
    }));

    this._currentTimer = this.createTimer(); // ANDREW - CHANGE

    /* Need to update current video url to the max voted, that way when someone joins
       after video changes we need them to load the current video */
    
    // Andrew - this enables the voting button so that a client can vote this upcoming round
    // this._listenersInTVAreaMap.forEach((listener) => listener.onEnableVoting()); // TODO maybe have only listeners in the tv area
    this._listenersInTVAreaMap.forEach((listener) => {
      listener.onEnableVoting();
      listener.onUpdatingNextVideoOptions(this._videoList);
    }); 


    // clear votes now for next round
    this._videoURLVotes = new Map<string, number>();
  }

  voteForVideo(videoURL: string): void {
    let seenVid = false;
    this._videoURLVotes.forEach((numVotes, existingURL) => {
      if (existingURL === videoURL) {
        seenVid = true;
        this._videoURLVotes.set(existingURL, numVotes + 1);
      }
    });
    if (!seenVid) {
      this._videoURLVotes.set(videoURL, 1);
    }
  }

  async addVideoToVideoList(inputURL: string, listenerSubmittedBy: CoveyTownListener): Promise<void> {
    const instance = axios.create({
      baseURL: 'https://youtube.googleapis.com/youtube/v3',
    });

    // referenced https://stackoverflow.com/questions/10591547/how-to-get-youtube-video-id-from-url for url parsing
    const videoid = inputURL.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
    if (videoid != null) {
      const videoID = videoid[1];
      const KEY = process.env.API_KEY;
      await instance.get(`/videos?part=snippet&part=contentDetails&id=${videoID}&key=${KEY}`).then((response) => {
        try {
          const {title} = response.data.items[0].snippet;
          const {channelTitle} = response.data.items[0].snippet;
          const {duration} = response.data.items[0].contentDetails;
          const formattedDuration = formatDuration(duration);
          const newVideo: YTVideo = {url: inputURL, title, channel: channelTitle, duration:formattedDuration};
          this._videoList.push(newVideo);
          this._listenersInTVAreaMap.forEach((listener) => {
            listener.onUpdatingNextVideoOptions(this._videoList);
            listener.onVideoAdded();
          });
        } catch (error) {
          listenerSubmittedBy.onUnableToAddVideo();
        }
      }).catch(() => {
        listenerSubmittedBy.onUnableToAddVideo();
      });
    } else {
      listenerSubmittedBy.onUnableToUseURL();
    } 
  }

  checkNewURLValidity(videoURL: string, listenerSubmittedBy: CoveyTownListener): void {
    let unseenURLBefore = true;
    this._videoList.forEach((video) => {
      if (videoURL === video.url) {
        unseenURLBefore = false; // ANDREW - TODO MAYBE THIS IS ONE OF THE SPOTS THAT WE SEND A SOCKET MESSAGE TO THE CLIENT TO DISPLAY TOAST ABOUT URL ALREADY THERE
      }
    });
    if (unseenURLBefore) {
      this.addVideoToVideoList(videoURL, listenerSubmittedBy);
    }
  }
}