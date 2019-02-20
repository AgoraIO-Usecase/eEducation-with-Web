import React from "react";
import { HashRouter as Router, Route } from "react-router-dom";

import Adapter from "../modules/Adapter";
import { APP_ID } from "../agora.config";
import LoginPage from "./Login";
import DeviceTestPage from './DeviceTest';
import { ClientRole } from "../modules/Adapter/types";

function App() {
  const engine = new Adapter({
    appId: APP_ID,
    role: ClientRole.STUDENT
  });

  return (
    <Router>
      <div className="full">
        <Route
          exact
          path="/"
          render={props => <LoginPage {...props} engine={engine} />}
        />
        <Route
          path="/device_test"
          render={props => <DeviceTestPage {...props} engine={engine} />}
        />
      </div>
    </Router>
  );
}

export default App;
