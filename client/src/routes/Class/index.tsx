import { Button, notification, Spin, Tooltip, message } from "antd";
import { Map } from "immutable";
import React, { useState, useEffect, useMemo } from "react";
import StreamPlayer from "agora-stream-player";

import ClassControlPanel from "../../components/ClassControlPanel";
import {Action, ActionType} from "../../components/UserListPanel";
import { ClassroomHeader, RecordingButton } from "./utils";
import {WhiteboardComponent, WhiteboardAPI} from "../../modules/Whiteboard";
import { useMediaStream } from "../../modules/Hooks";
import RecordingAPI, {
  STATUS_IDLE,
  STATUS_PENDING,
  STATUS_RECORDING
} from "../../modules/Recording";
import Adapter from "../../modules/Adapter";
import RoomControlStore from "../../store/RoomControl";
import { createLogger, session } from "../../utils";
import "./index.scss";

notification.config({
  placement: "bottomLeft"
});

const classLog = createLogger("[Class]", "#FFF", "#5b8c00", true);

export default function(props: any) {
  const adapter: Adapter = props.adapter;

  const { channel, uid, role } = adapter.config;
  const appId = adapter.appId;
  
  // ---------------- Hooks ----------------
  // Hooks used in this component
  const [whiteToken, setWhiteToken] = useState('');
  const [recordState, setRecordState] = useState({
    isRecording: false,
    isPending: false
  });
  const [chatPermission, setChatPermission] = useState(true);
  const {
    teacherList,
    studentList,
    channelAttr,
    messageList
  } = RoomControlStore.getState();
  const dispatch = RoomControlStore.getDispatch();
  const [streamList, length] = useMediaStream(adapter.rtcEngine.localClient, id => (id !== Number(channelAttr.get('shareId') && role === 2)));

  const getNameByUid = (uid: string) => {
    const user = studentList.merge(teacherList).get(uid);
    if (user) {
      return user.name;
    } else {
      return 'unknown';
    }
  }

  // initialize and subscribe events
  useEffect(() => {
    // join class and add local user/stream
    adapter.rtcEngine.join();
    adapter.signal.on('Muted', (args: any) => {
      if(args.type === 'video') {
        adapter.rtcEngine.localStream.disableVideo()
      } else if (args.type === 'audio') {
        adapter.rtcEngine.localStream.disableAudio()
      } else if (args.type === 'chat') {
        setChatPermission(false);
      }
      message.info(`${args.type} muted`)
    })
    adapter.signal.on('Unmuted', (args: any) => {
      if(args.type === 'video') {
        adapter.rtcEngine.localStream.enableVideo()
      } else if (args.type === 'audio') {
        adapter.rtcEngine.localStream.enableAudio()
      } else if (args.type === 'chat') {
        setChatPermission(true);
      }
      message.info(`${args.type} unmuted`)
    })
    return () => {
      adapter.rtcEngine.leave();
      adapter.signal.release();
    };
  }, []);

  // whiteboard intialize
  useEffect(() => {
    let response: any;
    let roomToken: any;
    let room: any;
    const boardId = channelAttr.get('whiteboardId') ? String(channelAttr.get('whiteboardId')) : ''
    if (boardId) {
      WhiteboardAPI.initialize(channel, { uuid: boardId }).then((res: any) => {
        const roomToken = res.roomToken
        // const uuid = boardId;
        setWhiteToken(roomToken);
      }).catch(err => {
        classLog(`Failed to initialize whiteboard`);
      });
    } else {
      WhiteboardAPI.initialize(channel).then((res: any) => {
        const {roomToken, room} = res;
        const uuid = room.uuid;
        setWhiteToken(roomToken);
        adapter.signal.request(JSON.stringify({
          name: 'UpdateChannelAttr',
          args: {
            channelAttr: {
              whiteboardId: uuid
            }
          }
        }))
      }).catch(err => {
        classLog(`Failed to initialize whiteboard`);
      });
    }
  }, [0])

  const chatMessages = useMemo(() => {
    return messageList.map(item => {
      return {
        local: item.uid === uid,
        content: item.message,
        username: getNameByUid(item.uid)
      };
    });
  }, [messageList.length]);

  const controlledUsers = useMemo(() => {
    return studentList.toArray().map(([uid, info]) => {
      return {
        uid,
        username: info.name,
        role: info.role,
        video: info.video,
        audio: info.audio,
        chat: info.chat
      }
    })
  }, [studentList])

  const controllable = useMemo(() => {
    return channelAttr.get('teacherId') === uid
  }, [channelAttr.get('teacherId')])

  const teacherName = useMemo(() => {
    if (teacherList.size) {
      const teacherId = channelAttr.get('teacherId') || ''
      if (teacherId) {
        const teacher = teacherList.get(String(teacherId))
        if (teacher) {
          console.log('name is', teacher.name)
          return teacher.name
        }
      }
    }
    return '---'
  }, [channelAttr.get('teacherId'), teacherList.size])

  const remoteShareStream = useMemo(() => {
    const stream = streamList.find((item: any) => item.getId() === Number(channelAttr.get('shareId')))
    if (stream) {
      return stream
    } else {
      return null
    }
  }, [length])

  const studentStreams = useMemo(() => {
    return studentList.toArray().map(([uid, info]) => {
      const { name, video, audio } = info;
      const index = streamList.findIndex(
        (stream: any) => stream.getId() === Number(info.streamId)
      );
      if (index !== -1) {
        const stream = streamList[index];
        return (
          <StreamPlayer
            key={stream.getId()}
            className="student-window"
            stream={stream}
            networkDetect={true}
            label={name}
            video={video}
            audio={audio}
            autoChange={false}
          />
        );
      } else {
        return null;
      }
    });
  }, [studentList, length]);

  const teacherStream = useMemo(() => {
    return teacherList.toArray().map(([uid, info]) => {
      const { name } = info;
      const index = streamList.findIndex(
        (stream: any) => stream.getId() === Number(info.streamId)
      );
      if (index !== -1) {
        const stream = streamList[index];
        return (
          <StreamPlayer
            key={stream.getId()}
            className="teacher-window"
            stream={stream}
            networkDetect={true}
            label={name}
            video={true}
            audio={true}
            autoChange={false}
          />
        );
      } else {
        return null;
      }
    });
  }, [teacherList, length]);

  // ---------------- Methods or Others ----------------
  // Methods or sth else used in this component

  const handleAction = (actionType: ActionType, action: Action, uid?: string) => {
    let name = ''
    let target;
    if(action === Action.DISABLE) {
      name = 'Mute';
      target = uid;
      dispatch({type: 'updateMember', uid, attr: {[actionType]: false}})
    } else if (action === Action.ENABLE) {
      name = 'Unmute';
      target = uid;
      dispatch({type: 'updateMember', uid, attr: {[actionType]: true}})
    }  else if (action === Action.ENABLEALL) {
      name = 'Unmute';
      target = studentList.toArray().map(([uid, info]) => {
        dispatch({type: 'updateMember', uid, attr: {[actionType]: true}})
        return uid
      });
    } else if (action === Action.DISABLEALL) {
      name = 'Mute';
      target = studentList.toArray().map(([uid, info]) => {
        dispatch({type: 'updateMember', uid, attr: {[actionType]: false}})
        return uid
      });
    }
    adapter.signal.request(JSON.stringify({
      name,
      args: {
        target,
        type: actionType
      }
    }));
  }

  const handleSendMessage = (message: string) => {
    if (!chatPermission) {
      return;
    }
    adapter.signal.request(JSON.stringify({
      name: 'Chat',
      args: {
        message
      }
    }))
  }

  const handleLogout = async () => {
    try {
      await adapter.rtcEngine.leave();
      await adapter.signal.release()
    } catch (err) {
      classLog(err);
    } finally {
      props.history.push("/");
    }
  };

  const handleRecording = () => {
    if (RecordingAPI.status === STATUS_IDLE) {
      setRecordState({
        isRecording: true,
        isPending: true
      });
      RecordingAPI.start(appId, channel)
        .then(() => {
          setRecordState({
            isRecording: true,
            isPending: false
          });
        })
        .catch(err => {
          classLog(err);
          setRecordState({
            isRecording: false,
            isPending: false
          });
        });
    } else if (RecordingAPI.status === STATUS_PENDING) {
      return;
    } else if (RecordingAPI.status === STATUS_RECORDING) {
      setRecordState({
        isRecording: false,
        isPending: true
      });
      RecordingAPI.stop(appId, channel)
        .then(() => {
          setRecordState({
            isRecording: false,
            isPending: false
          });
        })
        .catch((err: any) => {
          classLog(err);
          setRecordState({
            isRecording: false,
            isPending: false
          });
        });
    }
  };

  return (
    <div className="wrapper" id="classroom">
      {/* Header */}
      <ClassroomHeader
        channelName={channel}
        teacherName={teacherName}
        additionalButtonGroup={[
          <RecordingButton
            key="recording-button"
            isRecording={recordState.isRecording}
            isPending={recordState.isPending}
            onClick={handleRecording}
          />
        ]}
        onLogout={handleLogout}
      />

      {/* Students Container */}
      <section className="students-container">{studentStreams}</section>

      {/* Whiteboard  */}
      <WhiteboardComponent
        uuid={channelAttr.get('whiteboardId') ?  String(channelAttr.get('whiteboardId')) : ''}
        roomToken={whiteToken}
        role={role}
        shareStream={remoteShareStream}
        startScreenShare={adapter.rtcEngine.startScreenShare}
        stopScreenShare={adapter.rtcEngine.stopScreenShare}
      />

      {/* Teacher container */}
      <section className="teacher-container">{teacherStream}</section>

      {/* ClassControl */}
      <ClassControlPanel
        className="channel-container"
        messages={chatMessages}
        users={controlledUsers}
        controllable={controllable}
        onAction={handleAction}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
