import React, {
  Dispatch, SetStateAction, useCallback, useEffect, useMemo, useReducer, useState,
} from 'react';
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
// ADDED chakra
import { Box, Button, ChakraProvider, FormControl, FormHelperText, FormLabel, Input, Stack, Table, Tbody, Td, Th, Thead, Tr, Radio, Heading, useToast, useForceUpdate } from '@chakra-ui/react';
import { MuiThemeProvider } from '@material-ui/core/styles';
import assert from 'assert';
import axios from 'axios';
import dotenv from 'dotenv';
import WorldMap from './components/world/WorldMap';
import VideoOverlay from './components/VideoCall/VideoOverlay/VideoOverlay';
import { CoveyAppState, NearbyPlayers } from './CoveyTypes';
import VideoContext from './contexts/VideoContext';
import Login from './components/Login/Login';
import CoveyAppContext from './contexts/CoveyAppContext';
import NearbyPlayersContext from './contexts/NearbyPlayersContext';
import AppStateProvider, { useAppState } from './components/VideoCall/VideoFrontend/state';
import useConnectionOptions from './components/VideoCall/VideoFrontend/utils/useConnectionOptions/useConnectionOptions';
import UnsupportedBrowserWarning
from './components/VideoCall/VideoFrontend/components/UnsupportedBrowserWarning/UnsupportedBrowserWarning';
import { VideoProvider } from './components/VideoCall/VideoFrontend/components/VideoProvider';
import ErrorDialog from './components/VideoCall/VideoFrontend/components/ErrorDialog/ErrorDialog';
import theme from './components/VideoCall/VideoFrontend/theme';
import { Callback } from './components/VideoCall/VideoFrontend/types';
import Player, { ServerPlayer, UserLocation } from './classes/Player';
import TownsServiceClient, { TownJoinResponse } from './classes/TownsServiceClient';
import Video from './classes/Video/Video';
import { YTVideo, videoList, getVideos } from './YoutubeVids';

dotenv.config();

type CoveyAppUpdate =
  | { action: 'doConnect'; data: { userName: string, townFriendlyName: string, townID: string,townIsPubliclyListed:boolean, sessionToken: string, myPlayerID: string, socket: Socket, players: Player[], emitMovement: (location: UserLocation) => void } }
  | { action: 'addPlayer'; player: Player }
  | { action: 'playerMoved'; player: Player }
  | { action: 'playerDisconnect'; player: Player }
  | { action: 'weMoved'; location: UserLocation }
  | { action: 'disconnect' }
  ;

function defaultAppState(): CoveyAppState {
  return {
    nearbyPlayers: { nearbyPlayers: [] },
    players: [],
    myPlayerID: '',
    currentTownFriendlyName: '',
    currentTownID: '',
    currentTownIsPubliclyListed: false,
    sessionToken: '',
    userName: '',
    socket: null,
    currentLocation: {
      x: 0, y: 0, rotation: 'front', moving: false,
    },
    emitMovement: () => {
    },
    apiClient: new TownsServiceClient(),
  };
}

function appStateReducer(state: CoveyAppState, update: CoveyAppUpdate): CoveyAppState {
  const nextState = {
    sessionToken: state.sessionToken,
    currentTownFriendlyName: state.currentTownFriendlyName,
    currentTownID: state.currentTownID,
    currentTownIsPubliclyListed: state.currentTownIsPubliclyListed,
    myPlayerID: state.myPlayerID,
    players: state.players,
    currentLocation: state.currentLocation,
    nearbyPlayers: state.nearbyPlayers,
    userName: state.userName,
    socket: state.socket,
    emitMovement: state.emitMovement,
    apiClient: state.apiClient,
  };

  function calculateNearbyPlayers(players: Player[], currentLocation: UserLocation) {
    const isWithinCallRadius = (p: Player, location: UserLocation) => {
      if (p.location && location) {
        const dx = p.location.x - location.x;
        const dy = p.location.y - location.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        return d < 80;
      }
      return false;
    };
    return { nearbyPlayers: players.filter((p) => isWithinCallRadius(p, currentLocation)) };
  }

  function samePlayers(a1: NearbyPlayers, a2: NearbyPlayers) {
    if (a1.nearbyPlayers.length !== a2.nearbyPlayers.length) return false;
    const ids1 = a1.nearbyPlayers.map((p) => p.id).sort();
    const ids2 = a2.nearbyPlayers.map((p) => p.id).sort();
    return !ids1.some((val, idx) => val !== ids2[idx]);
  }

  let updatePlayer;
  switch (update.action) {
    case 'doConnect':
      nextState.sessionToken = update.data.sessionToken;
      nextState.myPlayerID = update.data.myPlayerID;
      nextState.currentTownFriendlyName = update.data.townFriendlyName;
      nextState.currentTownID = update.data.townID;
      nextState.currentTownIsPubliclyListed = update.data.townIsPubliclyListed;
      nextState.userName = update.data.userName;
      nextState.emitMovement = update.data.emitMovement;
      nextState.socket = update.data.socket;
      nextState.players = update.data.players;
      break;
    case 'addPlayer':
      nextState.players = nextState.players.concat([update.player]);
      break;
    case 'playerMoved':
      updatePlayer = nextState.players.find((p) => p.id === update.player.id);
      if (updatePlayer) {
        updatePlayer.location = update.player.location;
      } else {
        nextState.players = nextState.players.concat([update.player]);
      }
      nextState.nearbyPlayers = calculateNearbyPlayers(nextState.players,
        nextState.currentLocation);
      if (samePlayers(nextState.nearbyPlayers, state.nearbyPlayers)) {
        nextState.nearbyPlayers = state.nearbyPlayers;
      }
      break;
    case 'weMoved':
      nextState.currentLocation = update.location;
      nextState.nearbyPlayers = calculateNearbyPlayers(nextState.players,
        nextState.currentLocation);
      if (samePlayers(nextState.nearbyPlayers, state.nearbyPlayers)) {
        nextState.nearbyPlayers = state.nearbyPlayers;
      }
      break;
    case 'playerDisconnect':
      nextState.players = nextState.players.filter((player) => player.id !== update.player.id);

      nextState.nearbyPlayers = calculateNearbyPlayers(nextState.players,
        nextState.currentLocation);
      if (samePlayers(nextState.nearbyPlayers, state.nearbyPlayers)) {
        nextState.nearbyPlayers = state.nearbyPlayers;
      }
      break;
    case 'disconnect':
      state.socket?.disconnect();
      return defaultAppState();
    default:
      throw new Error('Unexpected state request');
  }

  return nextState;
}

async function GameController(initData: TownJoinResponse,
  dispatchAppUpdate: (update: CoveyAppUpdate) => void) {
  // Now, set up the game sockets
  const gamePlayerID = initData.coveyUserID;
  const sessionToken = initData.coveySessionToken;
  const url = process.env.REACT_APP_TOWNS_SERVICE_URL;
  assert(url);
  const video = Video.instance();
  assert(video);
  const roomName = video.townFriendlyName;
  assert(roomName);

  const socket = io(url, { auth: { token: sessionToken, coveyTownID: video.coveyTownID } });
  socket.on('newPlayer', (player: ServerPlayer) => {
    dispatchAppUpdate({
      action: 'addPlayer',
      player: Player.fromServerPlayer(player),
    });
  });
  socket.on('playerMoved', (player: ServerPlayer) => {
    if (player._id !== gamePlayerID) {
      dispatchAppUpdate({ action: 'playerMoved', player: Player.fromServerPlayer(player) });
    }
  });
  socket.on('playerDisconnect', (player: ServerPlayer) => {
    dispatchAppUpdate({ action: 'playerDisconnect', player: Player.fromServerPlayer(player) });
  });
  socket.on('disconnect', () => {
    dispatchAppUpdate({ action: 'disconnect' });
  });
  const emitMovement = (location: UserLocation) => {
    socket.emit('playerMovement', location);
    dispatchAppUpdate({ action: 'weMoved', location });
  };

  dispatchAppUpdate({
    action: 'doConnect',
    data: {
      sessionToken,
      userName: video.userName,
      townFriendlyName: roomName,
      townID: video.coveyTownID,
      myPlayerID: gamePlayerID,
      townIsPubliclyListed: video.isPubliclyListed,
      emitMovement,
      socket,
      players: initData.currentPlayers.map((sp) => Player.fromServerPlayer(sp)),
    },
  });
  return true;
}

let voteVideoURL = videoList.length > 0 ? videoList[0].url : '';

function Countdown() {
  const [counter, setCounter] = useState(30);
  useEffect(() => {
    const timer = setInterval(() => {
      if (counter > 0) {
        setCounter(counter - 1);
      }
      if (counter === 0) {
          clearInterval(timer)
          
          /**
           * Once the counter reaches 0, the socket should emit a message 
           * to the backend with the correct message and the videoURL. 
           * We have to wait until we merge with Andrew and Adam's code to implement this.
           */

          // appState.socket?.emit('CORRECT_MESSAGE_HERE', { videoURL: voteVideoURL });
      }
    } , 1000);
    return () => clearInterval(timer);
  }, [counter]);

  return (
    <div className="App">
      <div>Countdown: {counter} forTestingURL: {voteVideoURL}</div>
    </div>
  );
}

const VideoListWidget: React.FunctionComponent = () => {
  const toast = useToast();
  const forceUpdate = useForceUpdate();
  const [radioButtonState, setRadioButtonState] = useState(videoList.length > 0 ? videoList[0].url : '');
  const [newVideoURL, setNewVideoURL] = useState('');
  const [ytVideos, setYTVideos] = useState<YTVideo[]>([]);

  const listVideos = () => ytVideos.map(video => (
      <Tr key={video.url}>
        <Td role='cell'>{video.title}</Td>
        <Td role='cell'>{video.channel}</Td>
        <Td role='cell'>{video.duration}</Td>
        <Td >
          <Radio value={video.url} isChecked={radioButtonState === video.url} 
            onChange={() => {setRadioButtonState(video.url); voteVideoURL=video.url;}}
          >
            Play Next
          </Radio>
        </Td>
      </Tr>
  ));

  // Forces a render
  const handleForceUpdate = React.useCallback(() => {
    forceUpdate();
  }, [forceUpdate]);

  function formatDuration(YTDuration:string){
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

  async function addVideoToVideoList(inputURL: string) {
    const instance = axios.create({
      baseURL: 'https://youtube.googleapis.com/youtube/v3',
    }); 
  
    // referenced https://stackoverflow.com/questions/10591547/how-to-get-youtube-video-id-from-url for url parsing
    const videoid = inputURL.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
    if (videoid != null) {
      const videoID = videoid[1];

      const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

      await instance.get(`/videos?part=snippet&part=contentDetails&id=${videoID}&key=${YOUTUBE_API_KEY}`).then((response) => {
        try {
          const {title} = response.data.items[0].snippet;
          const {channelTitle} = response.data.items[0].snippet;
          const {duration} = response.data.items[0].contentDetails;
          const formattedDuration = formatDuration(duration);
          const newVideo: YTVideo = {url: inputURL, title, channel: channelTitle, duration:formattedDuration};
          if (!videoList.find(video => video.url === newVideo.url)) {
            videoList.push(newVideo); // DEPENDS ON NEW DATA STRUCTURE CREATED
          }
        } catch (error) {
          throw Error('Unable to added video'); // maybe have return -1, instead of throw errors. Then server can send -1, thus can mean certain toast shows error message
        }
      }).catch(() => {
        throw Error('Unable to add video');
      });
    } else {
      throw Error('Invalid video URL');
    } 
  };

  const handleAddNewURL = () => {
    try {
      if (!newVideoURL || newVideoURL.length === 0) {
        toast({
          title: 'Unable to submit video suggestion',
          description: 'Please enter a valid Youtube URL',
          status: 'error',
        });
        return;
      }
      addVideoToVideoList(newVideoURL);
      toast({
        title: `New video is added to the video collection!`,
        status: 'success',
        isClosable: true,
        duration: 3000,
      })
    } catch (err) {
      toast({
        title: 'Unable to add URL to video collection.',
        description: err.toString(),
        status: 'error'
      })
    }
  };

  useEffect(() => {
    const getVideoList = () => {
      setYTVideos(getVideos()); // getVideo is the getter to get youtube videos list. function in import
    }
    getVideoList();
    const timeout = setTimeout(() => getVideoList(), 2000);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  // Joe - for new url submission. Check if URL is valid. If not say not added, if yes add it. Need to get youtube title, channel, duration using youtube api
  return (
    <>
      <form>
        <Stack>
        <Heading p="5" as="h5" size="md">Select a video to watch</Heading>
          <Box maxH="400px" overflowY="scroll" borderWidth="1px" borderRadius="lg">
            <Table>
              <Thead><Tr><Th>Video Title</Th><Th>Creator</Th><Th>Duration</Th><Th>Vote on next video</Th></Tr></Thead>
                <Tbody>
                  {listVideos()}
                </Tbody>
            </Table>
          </Box>

          <FormControl id="email">
            <FormLabel p="5" as="h5" size="md">Submit new video to you would like to watch</FormLabel>
            <Input name="newVideo" placeholder="Youtube URL" value={newVideoURL} onChange={event => setNewVideoURL(event.target.value)}/>
            <FormHelperText>Please enter in the Youtube URL.</FormHelperText>
          </FormControl>
          <Button colorScheme="blue" 
            onClick={() => {
              handleAddNewURL(); 
              handleForceUpdate();
            }}
          >
            submit new video
          </Button>
        </Stack>
      </form>
    </>
  );
}

function App(props: { setOnDisconnect: Dispatch<SetStateAction<Callback | undefined>> }) {
  const [appState, dispatchAppUpdate] = useReducer(appStateReducer, defaultAppState());

  const setupGameController = useCallback(async (initData: TownJoinResponse) => {
    await GameController(initData, dispatchAppUpdate);
    return true;
  }, [dispatchAppUpdate]);
  const videoInstance = Video.instance();

  const { setOnDisconnect } = props;
  useEffect(() => {
    setOnDisconnect(() => async () => { // Here's a great gotcha: https://medium.com/swlh/how-to-store-a-function-with-the-usestate-hook-in-react-8a88dd4eede1
      dispatchAppUpdate({ action: 'disconnect' });
      return Video.teardown();
    });
  }, [dispatchAppUpdate, setOnDisconnect]);

  const page = useMemo(() => {
    if (!appState.sessionToken) {
      return <Login doLogin={setupGameController} />;
    } if (!videoInstance) {
      return <div>Loading...</div>;
    }
    return (
      <div>
        <WorldMap />
        <VideoOverlay preferredMode="fullwidth" />
        <Countdown />
        <VideoListWidget />
      </div>
    );
  }, [setupGameController, appState.sessionToken, videoInstance]);
  return (

    <CoveyAppContext.Provider value={appState}>
      <VideoContext.Provider value={Video.instance()}>
        <NearbyPlayersContext.Provider value={appState.nearbyPlayers}>
          {page}
        </NearbyPlayersContext.Provider>
      </VideoContext.Provider>
    </CoveyAppContext.Provider>

  );
}

function EmbeddedTwilioAppWrapper() {
  const { error, setError } = useAppState();
  const [onDisconnect, setOnDisconnect] = useState<Callback | undefined>();
  const connectionOptions = useConnectionOptions();
  return (
    <UnsupportedBrowserWarning>
      <VideoProvider options={connectionOptions} onError={setError} onDisconnect={onDisconnect}>
        <ErrorDialog dismissError={() => setError(null)} error={error} />
        <App setOnDisconnect={setOnDisconnect} />
      </VideoProvider>
    </UnsupportedBrowserWarning>
  );
}

export default function AppStateWrapper(): JSX.Element {
  return (
    <BrowserRouter>
      <ChakraProvider>
        <MuiThemeProvider theme={theme('rgb(185, 37, 0)')}>
          <AppStateProvider preferredMode="fullwidth" highlightedProfiles={[]}>
            <EmbeddedTwilioAppWrapper />
          </AppStateProvider>
        </MuiThemeProvider>
      </ChakraProvider>
    </BrowserRouter>
  );
}