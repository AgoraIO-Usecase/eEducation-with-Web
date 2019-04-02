import React from "react";
import { HashRouter as Router, Route } from "react-router-dom";

import Adapter from "../modules/Adapter";
import RoomControlClient from "../modules/RoomControl";
import RoomControlStore from "../store/RoomControl";

import LoginPage from "./Login";
import DeviceTestPage from "./DeviceTest";
import ClassroomPage from "./Class";

function App() {
  const engine = new Adapter({
    appId: process.env.REACT_APP_AGORA_APPID
  });

  const roomClient = new RoomControlClient(process.env
    .REACT_APP_AGORA_APPID as string);

  return (
    <Router>
      <RoomControlStore.Provider>
        <Route
          exact
          path="/"
          render={props => <LoginPage {...props} engine={engine} roomClient={roomClient}/>}
        />
        <Route
          path="/device_test"
          render={props => <DeviceTestPage {...props} engine={engine} roomClient={roomClient} />}
        />
        <Route
          path="/classroom"
          render={props => <ClassroomPage {...props} engine={engine} roomClient={roomClient} />}
        />
      </RoomControlStore.Provider>
    </Router>
  );
}

export default App;
