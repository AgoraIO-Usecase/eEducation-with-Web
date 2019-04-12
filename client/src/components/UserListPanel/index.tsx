/**
 * Provide UserListPanel (part of ClassControlPanel)
 */

import React, { FunctionComponent, useState, CSSProperties } from 'react';
import { Button } from 'antd';

import './index.scss';

interface UserItemProps {
  username: string;
  uid: string;
  onAction?: (actionType: ActionType, action: Action, uid: string) => any;
  controllable?: boolean;
  video: boolean;
  audio: boolean;
  chat: boolean;
}

export interface UserListPanelProps {
  users: UserItemProps[];
  onAction?: (actionType: ActionType, action: Action, uid?: string) => any;
  controllable: boolean;
  className?: string;
  style?: CSSProperties;
}

export enum ActionType {
  VIDEO = 'video',
  AUDIO = 'audio',
  CHAT = 'chat'
}

export enum Action {
  DISABLE = 'disable',
  ENABLE = 'enable',
  DISABLEALL = 'disableAll',
  ENABLEALL = 'enableAll'
}

const UserItem: FunctionComponent<UserItemProps> = props => {
  const handleAction = (action: ActionType) => {
    props.onAction &&
      props.onAction(
        action,
        props[action] ? Action.DISABLE : Action.ENABLE,
        props.uid
      );
  };

  return (
    <div className="user-item">
      <div className="user-info">{props.username}</div>
      {props.controllable ? (
        <div className="user-control">
          <Button
            onClick={() => handleAction(ActionType.CHAT)}
            type={props.chat ? 'primary' : 'default'}
            shape="circle"
            icon="message"
          />
          <Button
            onClick={() => handleAction(ActionType.VIDEO)}
            type={props.video ? 'primary' : 'default'}
            shape="circle"
            icon="video-camera"
          />
          <Button
            onClick={() => handleAction(ActionType.AUDIO)}
            type={props.audio ? 'primary' : 'default'}
            shape="circle"
            icon="sound"
          />
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

const UserListPanel: FunctionComponent<UserListPanelProps> = props => {
  const [allVideo, setAllVideo] = useState(true);
  const [allAudio, setAllAudio] = useState(true);

  const actionHandlerFromParent = (
    actionType: ActionType,
    action: Action,
    uid?: string
  ) => {
    props.onAction && props.onAction(actionType, action, uid);
  };

  const toggleAllVideo = () => {
    actionHandlerFromParent(
      ActionType.VIDEO,
      allVideo ? Action.DISABLEALL : Action.ENABLEALL
    );
    setAllVideo(!allVideo);
  };

  const toggleAllAudio = () => {
    actionHandlerFromParent(
      ActionType.AUDIO,
      allAudio ? Action.DISABLEALL : Action.ENABLEALL
    );
    setAllAudio(!allAudio);
  };

  const className = (props.className || '') + ' user-list-container';

  return (
    <div style={props.style} className={className}>
      <div className="user-list-box">
        {props.users.map(
          ({ uid, username, video, audio, chat }) => (
            <UserItem
              key={uid}
              uid={uid}
              username={username}
              video={video}
              audio={audio}
              chat={chat}
              controllable={props.controllable}
              onAction={actionHandlerFromParent}
            />
          )
        )}
      </div>
      {props.controllable ? (
        <div className="user-list-button-group">
          <Button
            onClick={toggleAllVideo}
            type={allVideo ? 'primary' : 'default'}
            icon="video-camera"
          >
            {allVideo ? 'Mute ' : 'Unmute'}
          </Button>
          <Button
            onClick={toggleAllAudio}
            type={allAudio ? 'primary' : 'default'}
            icon="sound"
          >
            {allAudio ? 'Mute ' : 'Unmute'}
          </Button>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default UserListPanel;
