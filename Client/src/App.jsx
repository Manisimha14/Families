import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./components/Home";
import Discover from "./components/Discover";
import Login from "./components/Login";
import Profile from "./components/Profile";
import Register from "./components/Register";
import UserProfile from "./components/UserProfile";
import UserProvider from "./context/UserProvider";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import { useEffect } from "react";
import socket from "./socket.js";

function App() {
  useEffect(()=>{
    const handleConnect= ()=>{
        console.log("Socket Connected"+socket.id);

        socket.emit("hello","Message From Server for the hello Event")
        

    }
    const handleDisconnect = ()=>{
      console.log("Socket Disconencted");
      
    }

    socket.on("connect",handleConnect)
    socket.on("disconnect",handleDisconnect)
    socket.connect();
    return ()=>{
      socket.off("connect",handleConnect)
      socket.off("disconnect",handleDisconnect)
      socket.disconnect()
    }
  },[])
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={<PublicRoute><Login /></PublicRoute>}
          />
          <Route
            path="/register"
            element={<PublicRoute><Register /></PublicRoute>}
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/discover"
            element={
              <ProtectedRoute>
                <Discover />
              </ProtectedRoute>
            }
          />
          <Route path="/profile/:user_name" element={<UserProfile />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
