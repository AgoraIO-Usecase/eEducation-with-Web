import React from "react";
import { Link } from "react-router-dom";
import { Form, Select, Button, Progress, Slider } from "antd";

import Adapter from "../../modules/Adapter";
import "./index.scss";

const FormItem = Form.Item;
const Option = Select.Option;

export default function(props: { engine: Adapter }) {
  return (
    <div className="wrapper" id="deviceTesting">
      <main className="main">
        <section className="content">
          <header>
            <img src={require("../../assets/images/logo.png")} alt="" />
          </header>
          <main>
            <Form>
              <FormItem
                style={{ marginBottom: "6px" }}
                label="Camera"
                colon={false}
              >
                <Select
                  defaultValue={0}
                  onChange={val => this.handleVideoDeviceChange(val)}
                >
                  {this.state.videoDevices.map((item, index) => (
                    <Option key={item.deviceid} value={index}>
                      {item.devicename}
                    </Option>
                  ))}
                </Select>
              </FormItem>
              <FormItem
                style={{ marginBottom: "6px" }}
                label="Microphone"
                colon={false}
              >
                <Select
                  defaultValue={0}
                  onChange={val => this.handleAudioDeviceChange(val)}
                >
                  {this.state.audioDevices.map((item, index) => (
                    <Option key={item.deviceid} value={index}>
                      {item.devicename}
                    </Option>
                  ))}
                </Select>
              </FormItem>
              <FormItem
                style={{ marginBottom: "6px" }}
                label={
                  <img
                    style={{ width: "13px" }}
                    src={require("../../assets/images/microphone.png")}
                    alt=""
                  />
                }
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 20 }}
                colon={false}
              >
                <Progress percent={this.state.inputVolume} showInfo={false} />
              </FormItem>
              <FormItem
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
              </FormItem>
              <FormItem
                style={{ marginBottom: "6px" }}
                label={
                  <img
                    style={{ cursor: "pointer", width: "19px" }}
                    onClick={this.playMusic}
                    src={require("../../assets/images/sound.png")}
                    alt=""
                  />
                }
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 20 }}
                colon={false}
              >
                <Slider
                  onChange={val => this.handlePlaybackVolume(val)}
                  min={0}
                  max={255}
                  defaultValue={this.outputVolume}
                  showInfo={false}
                />
              </FormItem>
            </Form>
          </main>
        </section>
        <section className="illustration">
          <h3 className="title">Device Testing</h3>
          <div className="preview-window" />
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
