import 'whatwg-fetch'

import React from 'react';
import ReactDOM from 'react-dom';
import './static/index.less';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<App /> , document.getElementById('root'))
registerServiceWorker();
