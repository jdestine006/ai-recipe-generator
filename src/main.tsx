import React from "react";
import ReactDOM from "react-dom/client";
import { Amplify } from "aws-amplify";
import './index.css';
import { parseAmplifyConfig } from "aws-amplify/utils";
import outputs from "../amplify_outputs.json";
import App from "./App";


const amplifyConfig = parseAmplifyConfig(outputs);

Amplify.configure({
  ...amplifyConfig,
  API: {
    ...amplifyConfig.API,
    REST: (outputs as any).custom?.API, // required for custom REST APIs
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);