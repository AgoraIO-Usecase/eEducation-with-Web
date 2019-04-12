import React, { FunctionComponent, useState } from 'react';
import { Tabs } from 'antd';

import UserListPanel, {
  Action,
  ActionType,
  UserListPanelProps
} from '../UserListPanel';
import ChatPanel, { ChatPanelProps } from '../ChatPanel';
import './index.sass';

const TabPane = Tabs.TabPane;

export type ClassControlPanelProps = {
  onSendMessage?: (message: string) => void;
  onAction?: (actionType: ActionType, action: Action, uid?: string) => any;
  className?: string;
} & ChatPanelProps &
  UserListPanelProps;

const ClassControlPanel: FunctionComponent<ClassControlPanelProps> = props => {
  const [currentTabIndex, setCurrentTabIndex] = useState('1');

  const handleMessage = (msg: string) => {
    props.onSendMessage && props.onSendMessage(msg);
  };

  const handleAction = (
    actionType: ActionType,
    action: Action,
    uid?: string
  ) => {
    props.onAction && props.onAction(actionType, action, uid);
  };

  const className = (props.className || '') + ' classroom-control';

  return (
    <Tabs
      className={className}
      activeKey={currentTabIndex}
      onChange={setCurrentTabIndex}
      tabBarStyle={{ margin: '0', width: '100%' }}
      type="card"
    >
      <TabPane tab="Chatroom" key="1">
        <ChatPanel
          onSendMessage={handleMessage}
          messages={props.messages}
          style={{ width: '100%', height: '100%' }}
        />
      </TabPane>
      <TabPane tab="Student List" key="2">
        <UserListPanel
          controllable={props.controllable}
          onAction={handleAction}
          users={props.users}
          style={{ width: '100%', height: '100%' }}
        />
      </TabPane>
    </Tabs>
  );
};

export default ClassControlPanel;
