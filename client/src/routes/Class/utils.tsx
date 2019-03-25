import React, { FunctionComponent, ReactNode, Fragment } from 'react';
import { Button, Tooltip } from 'antd';

import SimpleIconButton from '../../components/SimpleIconButton';

// ---------------- Classroom Header ----------------

export interface ClassroomHeaderProps {
  // networkStatus: string,
  channelName: string;
  teacherName: string;
  onLogout: () => void;
  additionalButtonGroup?: ReactNode[];
}

export const ClassroomHeader: FunctionComponent<
  ClassroomHeaderProps
> = props => {
  const {
    // networkStatus,
    channelName,
    teacherName,
    onLogout,
    additionalButtonGroup
  } = props;

  return (
    <header className="title">
      <div className="status-bar">
        {/* <Tooltip title={`Network Status: ${networkStatus}`}>
          <span>Network Status: {networkStatus}</span>
        </Tooltip> */}
        <Tooltip title={`Classroom: ${channelName}`}>
          <span>Classroom: {channelName}</span>
        </Tooltip>
        <Tooltip title={`Teacher: ${teacherName}`}>
          <span>Teacher: {teacherName}</span>
        </Tooltip>
      </div>
      <div className="tool-bar">
        {additionalButtonGroup}
        <Button className="btn" ghost icon="logout" onClick={onLogout} />
      </div>
    </header>
  );
};

// ---------------- Recording Button ----------------

export interface RecordingButtonProps {
  isRecording: boolean;
  isPending: boolean;
  onClick: () => void;
}

export const RecordingButton: FunctionComponent<
  RecordingButtonProps
> = props => {
  return (
    <Button
      loading={props.isPending}
      id="recordBtn"
      type="primary"
      onClick={props.onClick}
    >
      {props.isRecording ? 'Stop Recording' : 'Start Recording'}
    </Button>
  );
};

// ---------------- User Button Group ----------------

export interface UserButtonGroupProps {
  role: ClientRole;
  isVideoOn: boolean;
  isAudioOn: boolean;
  onPromote: () => void;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onHandUp: () => void;
}

export const UserButtonGroup: FunctionComponent<
  UserButtonGroupProps
> = props => {
  const PromoteButton = (
    <SimpleIconButton
      style={{ marginBottom: '6px' }}
      key="promote"
      onClick={props.onPromote}
      type="promote"
    />
  );

  const ToggleVideoButton = (
    <SimpleIconButton
      style={{ marginBottom: '6px' }}
      key="video"
      active={props.isVideoOn}
      onClick={props.onToggleVideo}
      type="video"
    />
  );

  const ToggleAudioButton = (
    <SimpleIconButton
      style={{ marginBottom: '6px' }}
      key="audio"
      active={props.isAudioOn}
      onClick={props.onToggleAudio}
      type="audio"
    />
  );

  const HandUpButton = (
    <SimpleIconButton
      style={{ marginBottom: '6px' }}
      key="handUp"
      onClick={props.onHandUp}
      type="hand-up"
    />
  );

  switch (props.role) {
    default:
    case 0:
      return <Fragment>{[PromoteButton]}</Fragment>;
    case 1:
      return (
        <Fragment>
          {[ToggleVideoButton, ToggleAudioButton, HandUpButton]}
        </Fragment>
      );
    case 2:
      return <Fragment>{[ToggleVideoButton, ToggleAudioButton]}</Fragment>;
  }
};
