import React from 'react';
import { Switch, Route } from 'react-router-dom';
import './App.css';
import Display from './Display/Display';
import Mobile from './Mobile/Mobile';
import Mobilelobby from './Mobile/Mobilelobby';


function App() {
  return (
    <Switch>
      <Route path="/d/:key" component={Display} />
      <Route path="/m/:key" component={Mobile} />
      <Route path="/m/" component={Mobilelobby} />
    </Switch>
  );
}

export default App;
