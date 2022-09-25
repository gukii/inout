import React from 'react';
import ReactDOM from 'react-dom/client';


// npx tailwindcss -i ./src/tailwind.css -o ./dist/tailwind.output.css --watch

// yarn build
// yarn deploy


//import './App.css';
import './tailwind.output.css'

import App from './App';
//import App from './AppTanStackFilter';

//import AppFormValidateOnBlur from './AppFormValidateOnBlur';

import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();