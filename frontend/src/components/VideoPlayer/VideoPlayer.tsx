import React, { useEffect, useState, useRef } from 'react';
import YouTube from 'react-youtube';
import { Button, HStack, useToast } from '@chakra-ui/react';
import { YoutubeVideoInfo } from '../../CoveyTypes';
import useCoveyAppState from '../../hooks/useCoveyAppState';

/**
 * A Youtube video player component. Video player allows users to watch youtube videos synchronously with
 * other clients in the same town gathered around the TV. Video stream must be actively joined by clicking
 * "Join Stream". After this, three buttons will appear for play/pause, sync, and mute/unmute. Play/pause
 * cause your video and other clients' videos to play/pause. Sync causes everyone's video to go to the same
 * timestamp. Mute/unmute causes only your own video to be muted or unmuted. 
 */
export default function VideoPlayer(): JSX.Element {
  // Access showYTPlayer boolean so video player only renders when near TV
  const {
    showYTPlayer, socket
  } = useCoveyAppState();

  // The following syntax with <any> is used since the react-youtube package has a known issue with using
  // Typescript to get a pointer to the youtube player object: https://github.com/tjallingt/react-youtube/issues/211 
  // This syntax is the best workaround.
  /* eslint-disable */
  const playerRef = useRef<any>();
  /* eslint-enable */

  // Controls whether buttons to control video player are disabled and not shown
  const [areControlButtonsDisabled, setAreControlButtonsDisabled] = useState<boolean>(true);

  const toast = useToast();

  // Following two stats control which functionality each respective button has, whether mute or unmute for the
  // mute/unmute button, or play or pause for the play/pause button
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  useEffect(() => {
    // Listens for server saying someone paused video, which should cause client's video to pause
    socket?.on('playerPaused', () => {
        playerRef.current?.internalPlayer.pauseVideo();
        setIsPlaying(false);
    });
    // Listens for server saying someone played video, which should cause client's video to pause
    socket?.on('playerPlayed', () => {
        playerRef.current?.internalPlayer.playVideo();
        setIsPlaying(true);
    });
    // Listens for server telling client to load a certain video at certain timestamp and either play or pause
    socket?.on('videoSynchronization', (currentVideoInfo: YoutubeVideoInfo) => {
        const vidID = currentVideoInfo.url.split('=')[currentVideoInfo.url.split('=').length - 1];
        playerRef.current?.internalPlayer.loadVideoById(vidID, currentVideoInfo.timestamp);
        setIsPlaying(true);
        if (!currentVideoInfo.isPlaying) {
          playerRef.current?.internalPlayer.pauseVideo();
          setIsPlaying(false);
        }
    });
    // Listens for server re-enabling client's "Join Stream" button and disabling video player control buttons
    // as well as unmuting video player for next time client returns to the stream
    socket?.on('disableControlButtons', () => {
        setAreControlButtonsDisabled(true);
        setIsMuted(false);
    });
  },[socket]);

  // When the user enters the TV area, a toast should appear indicating how the user can interact with the youtube player stream
  useEffect(() => {
    if (showYTPlayer) {
      toast({
        title: `You've entered the TV Area!`,
        description: `Please scroll down to view the Youtube Player. Click 'Join Stream' to start watching! Leave anytime by walking out of the TV Area`,
        status: 'info',
        isClosable: true,
        duration: 10000,
      });
    }
  }, [toast, showYTPlayer]);
  
  // showYTPlayer boolean controls if youtube player is shown. An invisible div is placed above youtube player to prevent user from accidentally
  // interacting with the youtube player. This requires user to interact with stream using the Play/Pause button, Sync button, and Mute/Unmut button.
  return (<div>
    { showYTPlayer ? <div> <div style={{position: 'absolute', zIndex: 300000, height: '200px', width: '400px'}}> </div> <div> <YouTube
      ref={playerRef}
      opts={{height: '200', width: '400', playerVars: {enablejsapi: 1, controls: 0}}}
      /> </div>
      <div>
        <HStack spacing="82px">
          { !areControlButtonsDisabled ? <div>
          <Button colorScheme="blue" disabled={areControlButtonsDisabled} type="submit" onClick={() => {
            // conditional determines if button functions as pauser or player
            if (isPlaying) {
              socket?.emit('clientPaused');
            } else {
              socket?.emit('clientPlayed');
            }
            }}>Play/Pause</Button>
          <Button colorScheme="blue" disabled={areControlButtonsDisabled} type="submit" onClick={() => socket?.emit('clientSynced')}>Sync</Button>
          <Button colorScheme="blue" disabled={areControlButtonsDisabled} type="submit" onClick={() => {
            // conditional determines if button functions as unmuter or muter
            if (isMuted) {
              playerRef.current?.internalPlayer.unMute();
              setIsMuted(false);
            } else {
              playerRef.current?.internalPlayer.mute();
              setIsMuted(true);
            }
            }}>Mute/Unmute</Button>
          </div> : null }
          { areControlButtonsDisabled ? <div>
          <Button colorScheme="blue" disabled={!areControlButtonsDisabled} type="submit" onClick={() => {
            // "Join Stream" button tells server that user entered stream and should be synced up
            socket?.emit('clientEnteredTVArea');
            setAreControlButtonsDisabled(false);
          }}>Join Stream</Button>
          </div> : null }
        </HStack>
      </div>
      </div>
       : null}
  </div>)

}