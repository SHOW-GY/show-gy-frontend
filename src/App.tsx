import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Summary from './pages/Summary';
import Library from './pages/Library';
import Center from './summary/center';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/library" element={<Library />} />
        <Route path="/summary/center" element={<Center />} />
      </Routes>
    </Router>
  );
}