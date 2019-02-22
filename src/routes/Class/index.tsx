import React from 'react';
import { Button, notification, Spin, Tooltip, message } from 'antd';
import { List } from 'immutable';
// import axios from "axios";
import ClassControlPanel from '../../components/ClassControlPanel';
// import Whiteboard from "../../components/Whiteboard";
import SimpleIconButton from '../../components/SimpleIconButton';
import './index.scss';

// const RECORDING_SERVICE = "http://123.155.153.85:3233";

notification.config({
  placement: 'bottomLeft'
});

const ClassroomNavbar = ({
  onClick,
  networkStatus,
  channelName,
  teacherName,
  RecordingButton
}) => {
  return (
    <header className="title">
      <div className="status-bar">
        <Tooltip title={`Network Status: ${networkStatus}`}>
          <span>Network Status: {networkStatus}</span>
        </Tooltip>
        <Tooltip title={`Classroom: ${channelName}`}>
          <span>Classroom: {channelName}</span>
        </Tooltip>
        <Tooltip title={`Teacher: ${teacherName}`}>
          <span>Teacher: {teacherName}</span>
        </Tooltip>
      </div>

      <TitleBar>
        {RecordingButton}
        <Button
          className="no-drag-btn btn"
          ghost
          icon="logout"
          onClick={onClick}
        />
      </TitleBar>
    </header>
  );
};

class Classroom extends React.Component {
  constructor(props) {
    super(props);
    this._client = props._client;
    this._rtc = this._client.rtcEngine;
    this.state = {
      teacher: '',
      channel: this.props.state.clientConfig.channel,
      networkQuality: 2,
      isRecording: false,
      recordBtnLoading: false,
      teacherList: List(),
      studentList: List(),
      messageList: List(),
      isSharing: false,
      enableVideo: true,
      enableAudio: true,
      windowList: [],
      totalPage: 1,
      currentPage: 1
    };
    this.subscribeRTCEvents();
    this.enableChat = true;
  }

  subscribeRTCEvents() {
    const rtc = this._rtc;
    rtc.on('error', (err, msg) => {
      console.error(`RtcEngine throw an error: ${err}`);
    });
    rtc.on('lastmilequality', quality => {
      this.setState({
        networkQuality: quality
      });
    });
  }

  componentDidMount() {
    this._client.enterClass();
    if (this._client.user.role === 'teacher') {
      this._client.prepareScreenShare();
    }
    this.subscribeClientEvents();
  }

  componentWillUnmount() {
    if (this._client.user.role === 'teacher') {
      this._client.stopScreenShare();
      this._client.destroyScreenShare();
    }
  }

  _getOtherStudents = () => {
    let uids = this.state.studentList.map(value => value.uid);
    let index = uids.indexOf(this._client.user.uid);
    if (index !== -1) {
      return uids.splice(index, 1).toArray();
    } else {
      return uids.toArray();
    }
  };

  subscribeClientEvents = () => {
    this._client.on('user-added', (uid, info) => {
      if (info.role === 'teacher') {
        // set to high stream
        this._rtc.setRemoteVideoStreamType(uid, 0);
        this.setState({
          teacherList: this.state.teacherList.push({
            uid,
            username: info.username,
            role: info.role
          }),
          teacher: info.username
        });
      } else if (info.role === 'student') {
        // set to low stream
        this._rtc.setRemoteVideoStreamType(uid, 1);
        this.setState({
          studentList: this.state.studentList.push({
            uid,
            username: info.username,
            role: info.role,
            video: true,
            audio: true,
            chat: true,
            ring: false
          })
        });
      } else {
        // do nothing in temp
      }
    });
    this._client.on('user-updated', (uid, preInfo, nextInfo) => {
      if (preInfo.role !== nextInfo.role) {
        if (preInfo.role === 'audience' && nextInfo.role === 'student') {
          if (uid === this._client.user.uid) {
            this._rtc.set_clientRole(1);
          }
          this._rtc.setRemoteVideoStreamType(uid, 1);
          this.setState({
            studentList: this.state.studentList.push({
              uid,
              username: nextInfo.username,
              role: nextInfo.role,
              video: true,
              audio: true,
              chat: true,
              ring: false
            })
          });
        }

        if (preInfo.role === 'student' && nextInfo.role === 'audience') {
          if (uid === this._client.user.uid) {
            this._rtc.set_clientRole(2);
          }
          let index = this.state.studentList.findIndex(
            (value, key) => value.uid === uid
          );
          if (index !== -1) {
            this.setState({
              studentList: this.state.studentList.splice(index, 1)
            });
          }
        }
      }
    });
    this._client.on('user-removed', (uid, info) => {
      if (info.role === 'teacher') {
        let index = this.state.teacherList.findIndex(
          (value, key) => value.uid === uid
        );
        if (index !== -1) {
          this.setState({
            teacherList: this.state.teacherList.splice(index, 1)
          });
        }
      } else if (info.role === 'student') {
        let index = this.state.studentList.findIndex(
          (value, key) => value.uid === uid
        );
        if (index !== -1) {
          this.setState({
            studentList: this.state.studentList.splice(index, 1)
          });
        }
      } else {
        // do nothing in temp
      }
    });
    this._client.on('screen-share-started', evt => {
      let board = document.getElementById('shareboard');
      if (board) {
        // reclear board
        board.innerHTML = '';
        // check if presenter is your self
        if (evt.sharerId === this._client.user.uid) {
          this._rtc.setupLocalVideoSource(board);
        } else {
          this._rtc.subscribe(evt.shareId, board);
        }
        // transfer to fit mode
        this._rtc.setupViewContentMode('videosource', 1);
        this._rtc.setupViewContentMode(String(evt.shareId), 1);
      }
      this.setState({
        isSharing: true
      });
    });
    this._client.on('screen-share-stopped', () => {
      let board = document.getElementById('shareboard');
      if (board) {
        board.innerHTML = '';
        this.setState({
          isSharing: false
        });
      }
    });
    this._client.on('message-received', evt => {
      if (evt.detail.type === 'str') {
        this.setState({
          messageList: this.state.messageList.push({
            content: evt.detail.message,
            username: evt.detail.username,
            local: evt.detail.uid === this._client.user.uid
          })
        });
      } else {
        // type === 'json'
        let { type, action, uid } = JSON.parse(evt.detail.message);
        let from = evt.detail.uid;
        this.handleRemoteControl(type, action, uid, from);
      }
    });
  };

  updatePagination = payload => {
    this.setState(payload);
  };

  handleRemoteControl = (type, action, uid, from) => {
    let isLocal = uid === this._client.user.uid;
    if (type === 'chat') {
      if (isLocal) {
        this.enableChat = action === 'enable';
      }
    } else if (type === 'video') {
      if (action === 'enable') {
        if (!isLocal) {
          this._client.unmuteVideo(uid);
        }
      } else if (action === 'disable') {
        if (!isLocal) {
          this._client.muteVideo(uid);
        }
      } else if (action === 'enableAll') {
        this._client.unmuteVideo(this._getOtherStudents());
      } else if (action === 'disableAll') {
        this._client.muteVideo(this._getOtherStudents());
      } else {
        throw new Error('Invalid action');
      }
    } else if (type === 'audio') {
      if (action === 'enable') {
        if (!isLocal) {
          this._client.unmuteAudio(uid);
        }
      } else if (action === 'disable') {
        if (!isLocal) {
          this._client.muteAudio(uid);
        }
      } else if (action === 'enableAll') {
        this._client.unmuteAudio(this._getOtherStudents());
      } else if (action === 'disableAll') {
        this._client.muteAudio(this._getOtherStudents());
      } else {
        throw new Error('Invalid action');
      }
    } else if (type === 'ring') {
      if (this._client.user.role === 'teacher') {
        let username = this._client.getUser(from).username;
        message.info(`Student ${username} is ringing the bell!`);
      }
    } else if (type === 'role') {
      if (action === 'requestPromotion') {
        if (this._client.user.role === 'teacher') {
          let user = this._client.getUser(from);
          this.openNotification(user.username, user.uid);
        }
      } else {
        // to be extended
      }
    } else {
      // can be extended by your situation
    }
  };

  handleExit = () => {
    this._client.leaveClass();
    message.info('Left the classroom...');
    window.location.hash = '';
  };

  handleSendMsg = msg => {
    if (this.enableChat) {
      this._client.broadcastMessage(msg);
    } else {
      message.warn('You are banned to send messages!');
    }
  };

  handleClassCtrlAction = (type, action, uid) => {
    this._client.broadcastMessage(
      JSON.stringify({
        type,
        action,
        uid
      }),
      'json'
    );
    let index = this.state.studentList.findIndex(
      (value, key) => value.uid === uid
    );
    if (index !== -1) {
      this.setState({
        studentList: this.state.studentList.update(index, value => {
          value[type] = !value[type];
          return value;
        })
      });
    }
  };

  openNotification = (username, uid) => {
    const key = `open${Date.now()}`;
    const handleBtnClick = () => {
      this.handlePromotion(uid);
      notification.close(key);
    };
    const btn = (
      <Button type="primary" size="small" onClick={handleBtnClick}>
        Confirm
      </Button>
    );

    notification.open({
      message: 'Request for promotion',
      description: `Audience ${username} wants to join the discussion`,
      btn,
      key
    });
  };

  handleStartRecording = () => {
    console.log('Start Recording...');
    this.setState({
      recordBtnLoading: true
    });
    axios
      .post(`${RECORDING_SERVICE}/v1/recording/start`, {
        appid: APP_ID,
        channel: this._client.channel,
        uid: this._client.user.uid
      })
      .then(res => {
        this.setState({
          recordBtnLoading: false,
          isRecording: true
        });
      })
      .catch(err => {
        console.error(err);
        this.setState({
          recordBtnLoading: false
        });
      });
  };

  handleStopRecording = () => {
    console.log('Stop Recording...');
    this.setState({
      recordBtnLoading: true
    });
    axios
      .post(`${RECORDING_SERVICE}/v1/recording/stop`, {
        appid: APP_ID,
        channel: this._client.channel,
        uid: this._client.user.uid
      })
      .then(res => {
        this.setState({
          recordBtnLoading: false,
          isRecording: false
        });
      })
      .catch(err => {
        console.error(err);
        this.setState({
          recordBtnLoading: false
        });
      });
  };

  handleToggleVideo = () => {
    this.setState(
      {
        enableVideo: !this.state.enableVideo
      },
      () => {
        if (this.state.enableVideo) {
          this._client.unmuteVideo();
        } else {
          this._client.muteVideo();
        }
      }
    );
  };

  handleToggleAudio = () => {
    this.setState(
      {
        enableAudio: !this.state.enableAudio
      },
      () => {
        if (this.state.enableAudio) {
          this._client.unmuteAudio();
        } else {
          this._client.muteAudio();
        }
      }
    );
  };

  handleRing = () => {
    this._client.broadcastMessage(
      JSON.stringify({
        type: 'ring'
      }),
      'json'
    );
  };

  handleRequestPromotion = () => {
    this._client.broadcastMessage(
      JSON.stringify({
        type: 'role',
        action: 'requestPromotion'
      }),
      'json'
    );
  };

  handlePromotion = uid => {
    this._client.updateUserInfo(uid, {
      role: 'student'
    });
  };

  handleDemotion = uid => {
    this._client.updateUserInfo(uid, {
      role: 'audience'
    });
  };

  render() {
    // get network status
    const profile = {
      0: {
        text: 'unknown',
        color: '#000',
        bgColor: '#FFF'
      },
      1: {
        text: 'excellent',
        color: '',
        bgColor: ''
      },
      2: {
        text: 'good',
        color: '#7ED321',
        bgColor: '#B8E986'
      },
      3: {
        text: 'poor',
        color: '#F5A623',
        bgColor: '#F8E71C'
      },
      4: {
        text: 'bad',
        color: '#FF4D89',
        bgColor: '#FF9EBF'
      },
      5: {
        text: 'vbad',
        color: '',
        bgColor: ''
      },
      6: {
        text: 'down',
        color: '#4A90E2',
        bgColor: '#86D9E9'
      }
    };

    const quality = (() => {
      switch (this.state.networkQuality) {
        default:
        case 0:
          return profile[0];
        case 1:
        case 2:
          return profile[2];
        case 3:
          return profile[3];
        case 4:
        case 5:
          return profile[4];
        case 6:
          return profile[6];
      }
    })();

    const teacher = (() => {
      let result = [];
      this.state.teacherList.map(item => {
        result.push(
          <Window
            key={item.uid}
            uid={item.uid}
            isLocal={item.uid === this._client.user.uid}
            client={this.props._client}
            username={item.username}
            role={item.role}
          />
        );
      });
      return result;
    })();

    const students = (() => {
      let result = [];
      this.state.studentList.map(item => {
        result.push(
          <Window
            key={item.uid}
            uid={item.uid}
            isLocal={item.uid === this._client.user.uid}
            client={this.props._client}
            username={item.username}
            role={item.role}
          />
        );
      });
      return result;
    })();

    // recording Button
    let RecordingButton;
    if (this._client.user.role === 'teacher') {
      let id, content, func;
      if (this.state.isRecording) {
        id = 'recordBtn disabled';
        content = 'Stop Recording';
        func = this.handleStopRecording;
      } else {
        id = 'recordBtn';
        content = 'Start Recording';
        func = this.handleStartRecording;
      }
      RecordingButton = (
        <Button
          className="no-drag-btn"
          loading={this.state.recordBtnLoading}
          onClick={func}
          id={id}
          type="primary"
        >
          {content}
        </Button>
      );
    }

    // float button group
    let ButtonGroup = [];

    if (this._client.user.role === 'audience') {
      ButtonGroup = [
        <SimpleIconButton
          style={{ marginBottom: '6px' }}
          key={0}
          onClick={this.handleRequestPromotion}
          type="promote"
        />
      ];
    } else {
      ButtonGroup = [
        <SimpleIconButton
          style={{ marginBottom: '6px' }}
          key={0}
          active={this.state.enableVideo}
          onClick={this.handleToggleVideo}
          type="video"
        />,
        <SimpleIconButton
          style={{ marginBottom: '6px' }}
          key={1}
          active={this.state.enableAudio}
          onClick={this.handleToggleAudio}
          type="audio"
        />
      ];
    }

    if (this._client.user.role === 'student') {
      ButtonGroup.push(
        <SimpleIconButton
          style={{ marginBottom: '6px' }}
          key={2}
          onClick={this.handleRing}
          type="hand-up"
        />
      );
    }
    return (
      <div className="wrapper" id="classroom">
        <ClassroomNavbar
          networkStatus={quality.text}
          channelName={this.state.channel}
          teacherName={this.state.teacher}
          RecordingButton={RecordingButton}
          onClick={this.handleExit}
        />
        <section className="students-container">{students}</section>
        <Whiteboard {...this.props} floatButtonGroup={ButtonGroup} />
        <section className="teacher-container">{teacher}</section>
        <ClassControl
          className="channel-container"
          controllable={this._client.user.username === this.state.teacher}
          onSendMessage={this.handleSendMsg}
          onAction={this.handleClassCtrlAction}
          messages={this.state.messageList.toArray()}
          users={this.state.studentList.toArray()}
        />
      </div>
    );
  }
}

class Window extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true
    };
    this._rtc = props.client.rtcEngine;
  }

  shouldComponentUpdate(nextProps, nextState) {
    // always return false in temp
    if ((this.state.loading = nextState.loading)) {
      return false;
    }
    return true;
  }

  componentDidMount() {
    const dom = document.querySelector(`#video-${this.props.uid}`);
    if (this.props.isLocal) {
      // local stream
      console.log(`Setup local: ${this.props.uid}`);
      this._rtc.setupLocalVideo(dom);
    } else {
      // remote stream
      console.log(`Setup remote: ${this.props.uid}`);
      this._rtc.subscribe(this.props.uid, dom);
    }

    let name = this.props.uid;
    name = this.props.isLocal ? 'local' : name;

    const render = this._rtc.streams[name];
    if (render) {
      if (render.firstFrameRender) {
        this.setState({ loading: false });
      } else {
        render.event.on('ready', () => {
          this.setState({ loading: false });
        });
      }
    }
  }

  render() {
    const loaderClass = this.state.loading ? 'loader loading' : 'loader';
    if (this.props.role === 'teacher') {
      return (
        <div className="teacher-window">
          <div className="teacher-video" id={`video-${this.props.uid}`}>
            <Spin className={loaderClass} />
          </div>
          <div className="teacher-bar">Teacher: {this.props.username}</div>
        </div>
      );
    } else if (this.props.role === 'student') {
      return (
        <div className="student-window">
          <div className="student-video" id={`video-${this.props.uid}`}>
            <Spin className={loaderClass} />
          </div>
          <div className="student-bar">{this.props.username}</div>
        </div>
      );
    }
  }
}

export default Classroom;
