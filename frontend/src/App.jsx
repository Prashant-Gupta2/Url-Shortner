import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './components/Home';
import Auth from './components/Auth';
import './App.css';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password/:token" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;