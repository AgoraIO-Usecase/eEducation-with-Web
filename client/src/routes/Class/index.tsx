import { Button, notification, Spin, Tooltip, message } from 'antd';
import { Map } from 'immutable';
import React, { useState, useEffect, useMemo } from 'react';
import StreamPlayer from 'agora-stream-player';

import ClassControlPanel from '../../components/ClassControlPanel';
import { ClassroomHeader, RecordingButton, UserButtonGroup } from './utils';
// import Whiteboard from "../../components/Whiteboard";
import Adapter from '../../modules/Adapter';
import { useMediaStream } from '../../modules/Hooks';
import RecordingAPI, {
  STATUS_IDLE,
  STATUS_PENDING,
  STATUS_RECORDING
} from '../../modules/Recording';
import RoomControlClient from '../../modules/RoomControl';
import RoomControlStore from '../../store/RoomControl';
import createLogger from '../../utils/logger';
import './index.scss';

notification.config({
  placement: 'bottomLeft'
});

const classLog = createLogger('[Class]', '#FFF', '#5b8c00',true)

export default function(props: { engine: Adapter; roomClient: RoomControlClient; [propName: string]: any }) {
  const engine = props.engine;
  const roomClient = props.roomClient;
  const { appId, channel, name, role, uid } = engine.state;

  // ---------------- Hooks ----------------
  // Hooks used in this component
  const [recordState, setRecordState] = useState({
    isRecording: false,
    isPending: false
  });
  const {
    teacherList, studentList, channelAttr, messageList
  } = RoomControlStore.getState();
  const [streamList, length] = useMediaStream(engine.localClient);
  // initialize and subscribe events
  useEffect(() => {
    // join class and add local user/stream
    engine.enterClass()
    return () => {
      engine.leaveClass();
    };
  }, []);

  // ---------------- Methods or Others ----------------
  // Methods or sth else used in this component

  const handleLogout = async () => {
    try {
      await engine.leaveClass();
      
    } catch (err) {
      classLog(err);
    } finally {
      props.history.push('/');
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
        .catch(err => {
          classLog(err);
          setRecordState({
            isRecording: false,
            isPending: false
          });
        });
    }
  };

  const studentStreams = useMemo(() => {
    return studentList.toArray().map(([uid, info]) => {
      const { name } = info;
      const index = streamList.findIndex((stream: any) => stream.getId() === Number(info.streamId))
      if (index !== -1) {
        const stream = streamList[index]
        return (
          <StreamPlayer key={stream.getId()} className="student-window" stream={stream} networkDetect={true} label={name} video={true} audio={true} autoChange={false} />
        );
      } else {
        return null
      }
    })
  }, [studentList, length]);

  const teacherStream = useMemo(() => {
    return teacherList.toArray().map(([uid, info]) => {
      const { name } = info;
      const index = streamList.findIndex((stream: any) => stream.getId() === Number(info.streamId))
      if (index !== -1) {
        const stream = streamList[index]
        return (
          <StreamPlayer key={stream.getId()} className="teacher-window" stream={stream} networkDetect={true} label={name} video={true} audio={true} autoChange={false} />
        );
      } else {
        return null
      }
    })
  }, [teacherList, length])

  return (
    <div className="wrapper" id="classroom">
      {/* Header */}
      <ClassroomHeader
        channelName={channel}
        teacherName={teacherList.size && channelAttr.get("teacherId") && teacherList.get(channelAttr.get("teacherId") as string).name}
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
      <section className="students-container">{
        studentStreams
      }</section>

      {/* Whiteboard (tbd) */}

      {/* Teacher container */}
      <section className="teacher-container">{
        teacherStream
      }</section>

      {/* ClassControl */}
      <ClassControlPanel
        className="channel-container"
        messages={[]}
        users={[]}
        controllable={false}
        onAction={() => {}}
        onSendMessage={() => {}}
      />
    </div>
  );
}
