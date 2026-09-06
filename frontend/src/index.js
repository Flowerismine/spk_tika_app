import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/store";

import "./index.css";
import App from "./App";
import axios from "axios";
import { ContextProvider } from "./contexts/ContextProvider";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

axios.defaults.withCredentials = true;

const rootElement = document.getElementById("root");

const root = ReactDOM.createRoot(rootElement);

root.render(
  <Provider store={store}>
    <ContextProvider>
      <App />
    </ContextProvider>
  </Provider>,
);

serviceWorkerRegistration.register();