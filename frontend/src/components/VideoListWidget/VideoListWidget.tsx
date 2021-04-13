import React, { useEffect, useState } from 'react';
import { Box, Button, FormControl, FormHelperText, FormLabel, Input, Stack, Table, Tbody, Td, Text, Th, Thead, Tr, Radio, Heading, useToast, HStack } from '@chakra-ui/react';
import useCoveyAppState from '../../hooks/useCoveyAppState';

/**
 * The format of youtube video information
 */
type YTVideo = {
  url: string;
  title: string;
  channel: string;
  duration: string;
}

/**
 * A widget component for voting for the next video to play in the stream. Component has a table of possible videos to vote on
 * as well as an input to submit a new youtube URL to add to the widgets of every person in the TV area.
 */
export default function VideoListWidget(): JSX.Element {
  // Access showYTPlayer boolean so widget only renders when near TV
  const {
    showYTPlayer, socket
  } = useCoveyAppState();

  const toast = useToast();
  const [newVideoURL, setNewVideoURL] = useState('');

  // All of the youtube videos that will displayed on the widget to vote on
  const [ytVideos, setYTVideos] = useState<YTVideo[]>([]);

  // Holds URL that may be voted on be user
  const [radioButtonState, setRadioButtonState] = useState('');
  
  // Controls whether voting button is disabled so that user can vote once per video
  const [votingButtonDisabled, setVotingButtonDisabled] = useState<boolean>(false);

  // Boolean controls whether widget is displayed or not
  const [showWidget, setShowWidget] = useState<boolean>(false);

  /** Creates a table row for each youtube video that can be voted on */
  const listVideos = () => ytVideos.map(video => (
      <Tr key={video.url}>
        <Td role='cell'>{video.title}</Td>
        <Td role='cell'>{video.channel}</Td>
        <Td role='cell'>{video.duration}</Td>
        <Td >
          <Radio value={video.url} isChecked={radioButtonState === video.url} 
            onChange={() => {setRadioButtonState(video.url);}}
          >
            Play Next
          </Radio>
        </Td>
      </Tr>
  ));

  /** Set up sockets to receive and handle messages from server */
  useEffect(() => {
    // When server gives client the list of videos that can be voted on, widget should update its video options
    socket?.on('nextVideoOptions', (nextVideoOptions: YTVideo[]) => {
      setYTVideos(nextVideoOptions);
    });
    // After a new video starts, server tells client to enable voting
    socket?.on('enableVotingButton', () => {
      setVotingButtonDisabled(false);
    });
    // After player leaves TV area, youtube video options should be reset and widget should not show up upon re-entering
    socket?.on('resetVideoOptions', () => {
      setYTVideos([]);
      setShowWidget(false);
    });
    // After stream is successfully joined, the client should show the voting widget
    socket?.on('displayVotingWidget', () => {
      setShowWidget(true);
    });
    // When any client in TV area adds a new URL to vote on, client should be notified with toast
    socket?.on('addedVideo', () => {
      toast({
        title: `Submitted Youtube video was added to the list`,
        status: 'success',
        isClosable: true,
        duration: 5000,
      });
    });
    // If server determines that submitted URL cannot be added to video list to vote on, then client should be notified with toast
    socket?.on('unableToAddVideo', () => {
      toast({
        title: `Looks like something went wrong:`,
        description: `Unable to add submitted Youtube video`,
        status: 'error',
        isClosable: true,
        duration: 5000,
      })
    });
    // If server determines that submitted URL does not match valid URL format then client should be notified with toast
    socket?.on('unableToUseURL', () => {
      toast({
        title: `Looks like something went wrong:`,
        description: `Unable to use submitted URL to retrieve Youtube video`,
        status: 'error',
        isClosable: true,
        duration: 5000,
      })
    })
  },[socket, toast]);

  // Component should only display if client is in TV area and has clicked "Join Stream"
  return (
    <> { showYTPlayer && showWidget ? 
      <form>
        <Stack>
            <HStack spacing="500px">
            <Heading p="5" size="lg">Select A Video To Watch Next</Heading>
            <Button colorScheme="blue" disabled={votingButtonDisabled} onClick={() => {
                // Send single vote for the next video to play to server and then disable voting button
                socket?.emit('clientVoted', radioButtonState);
                setVotingButtonDisabled(true);
            }}>Submit Vote</Button>
            </HStack>
            <Text fontSize="sm" align="center">Vote for the next video by clicking the video`s corresponding 
            Play Next button before the current video ends. Then submit your only vote for the next video.</Text>
          <Box maxH="300px" overflowY="scroll" borderWidth="1px" borderRadius="lg">
            <Heading p="5" size="md">Videos</Heading>
            <Table>
              <Thead><Tr><Th>Video Title</Th><Th>Channel</Th><Th>Duration</Th><Th>Vote For Next Video</Th></Tr></Thead>
                <Tbody>
                  {listVideos()}
                </Tbody>
            </Table>
          </Box>

          <FormControl id="submitURL">
            <FormLabel p="5">Submit New Video You Would Like To Watch</FormLabel>
            <Input name="newVideo" placeholder="Youtube URL" width="600px" onChange={event => setNewVideoURL(event.target.value)}/>
            <FormHelperText>Please enter in the Youtube URL.</FormHelperText>
          </FormControl>
          <Button size="md" width="150px" colorScheme="blue" 
            onClick={() => {
                // Send the URL to the server to check if it is a valid youtube video
                socket?.emit('clientProposedNewURL', newVideoURL);
            }}
          >
            Submit New Video
          </Button>
        </Stack>
      </form>
    : null } </>
  );
}