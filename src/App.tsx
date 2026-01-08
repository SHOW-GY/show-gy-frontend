import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './login/Signup';
import Summary from './pages/Summary';
import Library from './pages/Library';
import Center from './summary/Center';


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/signup" element={<Signup />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/library" element={<Library />} />
        <Route path="/summary/center" element={<Center />} />
      </Routes>
    </Router>
  );
}