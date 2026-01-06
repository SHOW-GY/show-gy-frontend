import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './login/Signup';
import Signup1 from './login/Signup1';
import Summary from './pages/Summary';
import Library from './pages/Library';
import Center from './summary/center';
import Findid from './login/Findid';
import Findid1 from './login/Findid1';
import Findpw from './login/Findpw';
import Findpw1 from './login/Findpw1';


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/signup" element={<Signup />} />
        <Route path="/login/signup1" element={<Signup1 />} />
        <Route path="/login/findid" element={<Findid />} />
        <Route path="/login/findid1" element={<Findid1 />} />
        <Route path="/login/findpw" element={<Findpw />} />
        <Route path="/login/findpw1" element={<Findpw1 />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/library" element={<Library />} />
        <Route path="/summary/center" element={<Center />} />
      </Routes>
    </Router>
  );
}