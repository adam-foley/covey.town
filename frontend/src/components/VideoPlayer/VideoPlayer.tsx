import React, { useEffect, useState, useRef } from 'react';
import YouTube from 'react-youtube';
// import { YouTubePlayer } from 'youtube-player/dist/types'; 
import { Button, HStack, useToast } from '@chakra-ui/react';
import { YoutubeVideoInfo } from '../../CoveyTypes';
import useCoveyAppState from '../../hooks/useCoveyAppState';

export default function VideoPlayer(): JSX.Element {
  const {
    showYTPlayer, socket
  } = useCoveyAppState();

  /* eslint-disable */
  const playerRef = useRef<any>();
  /* eslint-enable */

  const [arePlayPauseDisabled, setArePlayPausedDisabled] = useState<boolean>(true);
  const toast = useToast();
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  useEffect(() => {
    // socket?.emit('clientEnteredTVArea');
    // Andrew - listens for server saying someone paused video
    socket?.on('playerPaused', () => {
        playerRef.current?.internalPlayer.pauseVideo();
        setIsPlaying(false);
    });
    // Andrew - listens for server saying someone played video
    socket?.on('playerPlayed', () => {
        playerRef.current?.internalPlayer.playVideo();
        setIsPlaying(true);
    });
    // Andrew - listens for server telling client to load a certain video at certain timestamp
    socket?.on('videoSynchronization', (currentVideoInfo: YoutubeVideoInfo) => {
        const vidID = currentVideoInfo.url.split('=')[currentVideoInfo.url.split('=').length - 1];
        playerRef.current?.internalPlayer.loadVideoById(vidID, currentVideoInfo.timestamp);
        setIsPlaying(true);
        if (!currentVideoInfo.isPlaying) {
          playerRef.current?.internalPlayer.pauseVideo();
          setIsPlaying(false);
        }
    });
    // Andrew - listens for server re-enabling client's "Join Stream" button
    socket?.on('disablePlayPauseButtons', () => {
        setArePlayPausedDisabled(true);
        setIsMuted(false);
    });
  },[socket]);

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
  
  return (<div>
    { showYTPlayer ? <div> <div style={{position: 'absolute', zIndex: 300000, height: '200px', width: '400px'}}> </div> <div> <YouTube
      ref={playerRef}
      opts={{height: '200', width: '400', playerVars: {enablejsapi: 1, controls: 0}}}
      /> </div>
      <div>
        <HStack spacing="82px">
          { !arePlayPauseDisabled ? <div>
          <Button colorScheme="blue" disabled={arePlayPauseDisabled} type="submit" onClick={() => {
            if (isPlaying) {
              socket?.emit('clientPaused');
            } else {
              socket?.emit('clientPlayed');
            }
            }}>Play/Pause</Button>
          <Button colorScheme="blue" disabled={arePlayPauseDisabled} type="submit" onClick={() => socket?.emit('clientSynced')}>Sync</Button>
          <Button colorScheme="blue" disabled={arePlayPauseDisabled} type="submit" onClick={() => {
            if (isMuted) {
              playerRef.current?.internalPlayer.unMute();
              setIsMuted(false);
            } else {
              playerRef.current?.internalPlayer.mute();
              setIsMuted(true);
            }
            }}>Mute/Unmute</Button>
          </div> : null }
          { arePlayPauseDisabled ? <div>
          <Button colorScheme="blue" disabled={!arePlayPauseDisabled} type="submit" onClick={() => {
            socket?.emit('clientEnteredTVArea');
            setArePlayPausedDisabled(false);
          }}>Join Stream</Button>
          </div> : null }
        </HStack>
      </div>
      </div>
       : null}
  </div>)

}