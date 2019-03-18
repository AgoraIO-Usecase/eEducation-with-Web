import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Form, Select, Button, Progress, Slider } from 'antd';
import StreamPlayer from 'agora-stream-player';

import Adapter from '../../modules/Adapter';
import { useCamera, useMicrophone, useVolume } from '../../modules/Hooks';
import './index.scss';

const FormItem = Form.Item;
const Option = Select.Option;

enum PrecallTestStatus {
  PENDING = 0,
  SUCCESS,
  ERROR
}

export default function(props: { engine: Adapter; [propName: string]: any }) {
  // ---------------- Hooks ----------------
  // Hooks used in this component
  const musicRef = useRef(null);
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [musicVolume, setMusicVolume] = useState(1);

  const [precallTestStream, setStream] = useState<any>(null);
  const [precallTestStatus, setTestStatus] = useState(
    PrecallTestStatus.PENDING
  );
  const [precallTestErrMsg, setErrMsg] = useState('');

  const cameraList = useCamera(props.engine.localClient);
  const microphoneList = useMicrophone(props.engine.localClient);
  const volume = useVolume(precallTestStream);

  const [currentCamera, setCurrentCamera] = useState<string | undefined>(
    undefined
  );
  const [currentMic, setCurrentMic] = useState<string | undefined>(undefined);

  // refresh stream when change device
  useEffect(() => {
    if (precallTestStream) {
      precallTestStream.close();
      setStream(null);
      setTestStatus(PrecallTestStatus.PENDING);
      setErrMsg('');
    }

    props.engine
      .$createStream({
        streamID: Number(String(new Date().getTime()).slice(7)),
        video: true,
        audio: true
      })
      .then(stream => {
        setStream(stream);
        setTestStatus(PrecallTestStatus.SUCCESS);
      })
      .catch(err => {
        setTestStatus(PrecallTestStatus.ERROR);
        setErrMsg(err.msg);
      });

    return () => {
      if (precallTestStream) {
        precallTestStream.close();
      }
    };
  }, [currentCamera, currentMic]);

  // control volume when slider change
  useEffect(() => {
    if (musicRef) {
      let musicNode = (musicRef as any).current;
      musicNode.volume = musicVolume;
    }
  }, [musicVolume]);

  // ---------------- Methods or Others ----------------
  // Methods or sth else used in this component

  const toggleMusic = () => {
    if (!musicRef) {
      return;
    }
    let musicNode = (musicRef as any).current;
    if (!isMusicOn) {
      musicNode.play();
    } else {
      musicNode.pause();
    }
    setIsMusicOn(!isMusicOn);
  };

  return (
    <div className="wrapper" id="deviceTesting">
      <main className="main">
        <section className="content">
          <header>
            <img src={require('../../assets/images/logo.png')} alt="" />
          </header>
          <main>
            <Form>
              <FormItem
                style={{ marginBottom: '6px' }}
                label="Camera"
                colon={false}
              >
                <Select
                  defaultValue={0}
                  onChange={val => setCurrentCamera(cameraList[val].deviceId)}
                >
                  {cameraList.map((item, index) => (
                    <Option key={item.deviceId} value={index}>
                      {item.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
              <FormItem
                style={{ marginBottom: '6px' }}
                label="Microphone"
                colon={false}
              >
                <Select
                  defaultValue={0}
                  onChange={val => setCurrentMic(microphoneList[val].deviceId)}
                >
                  {microphoneList.map((item, index) => (
                    <Option key={item.deviceId} value={index}>
                      {item.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
              <FormItem
                style={{ marginBottom: '6px' }}
                label={
                  <img
                    style={{ width: '13px' }}
                    src={require('../../assets/images/microphone.png')}
                    alt=""
                  />
                }
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 20 }}
                colon={false}
              >
                <Progress percent={volume * 100} showInfo={false} />
              </FormItem>
              {/* Playback device seems useless in browser env */}
              {/* <FormItem
                style={{ marginBottom: "6px" }}
                label="Speaker"
                colon={false}
              >
                <Select
                  defaultValue={0}
                  onChange={val => this.handlePlaybackDeviceChange(val)}
                >
                  {this.state.audioPlaybackDevices.map((item, index) => (
                    <Option key={item.deviceid} value={index}>
                      {item.devicename}
                    </Option>
                  ))}
                </Select>
              </FormItem> */}
              <FormItem
                style={{ marginBottom: '6px' }}
                label={
                  <img
                    id="toggleMusicBtn"
                    onClick={toggleMusic}
                    src={require('../../assets/images/sound.png')}
                    alt=""
                  />
                }
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 20 }}
                colon={false}
              >
                <Slider
                  onChange={val => setMusicVolume(val as number)}
                  min={0}
                  step={0.01}
                  max={1.0}
                  value={musicVolume}
                />
              </FormItem>
              <audio
                ref={musicRef}
                style={{ display: 'none' }}
                src={require('../../assets/music/music.mp3')}
              />
            </Form>
          </main>
        </section>
        <section className="illustration">
          <h3 className="title">Device Testing</h3>
          {/* preview */}
          {precallTestStream && (
            <StreamPlayer
              className="preview-window"
              width="100%"
              height="100%"
              stream={precallTestStream}
            />
          )}
          <div className="button-group">
            <Button size="large" id="nextBtn" type="primary">
              <Link to="/classroom">Next Step -></Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
