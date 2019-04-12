/**
 * Provide ChatPanel (part of ClassControlPanel)
 */

import React, {
  FunctionComponent,
  useRef,
  useEffect,
  CSSProperties,
  useState
} from 'react';
import { Button, Input } from 'antd';
import './index.scss';

export interface ChatPanelProps {
  onSendMessage?: (message: string) => void;
  messages: Array<Message>;
  className?: string;
  style?: CSSProperties;
}

interface Message {
  local: boolean;
  content: string;
  username: string;
}

const MessageItem: FunctionComponent<Message> = props => {
  const { local, content, username } = props;
  const align = local ? 'right' : 'left';

  return (
    <div className={`message-item ${align}`}>
      <div className="arrow" style={{ float: align }} />
      <div className="message-content" style={{ float: align }}>
        {content}
      </div>
      <div className="message-sender" style={{ textAlign: align }}>
        {username}
      </div>
    </div>
  );
};

const ChatPanel: FunctionComponent<ChatPanelProps> = props => {
  const messageBoxRef = useRef(null);
  const [messageToSend, setMessageToSend] = useState('')

  useEffect(() => {
    let box: any = messageBoxRef.current;
    if (box) {
      box.scrollTop = box.scrollHeight - box.clientHeight;
    }
  }, [props.messages.length]);

  const handleSendMessage = () => {
    if (!messageToSend) {
      return;
    }
    setMessageToSend('')
    props.onSendMessage && props.onSendMessage(messageToSend);
  };

  const handleKeyPress = (evt: any) => {
    if (evt.key === 'Enter') {
      handleSendMessage();
    }
  };

  const className = (props.className || '') + ' message-container';

  return (
    <div style={props.style} className={className}>
      <div className="message-box" ref={messageBoxRef}>
        {props.messages.map(({ username, local, content }, index) => (
          <MessageItem
            key={index}
            username={username}
            local={local}
            content={content}
          />
        ))}
      </div>
      <div className="message-input">
        <Input
          id="message"
          onChange={e => setMessageToSend(e.target.value)}
          value={messageToSend}
          onKeyPress={handleKeyPress}
          placeholder="Input messages..."
        />
        <Button onClick={handleSendMessage} id="sendBtn" type="primary">
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatPanel;
