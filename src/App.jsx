import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Assistants from "./pages/Assistants";
import Accounts from "./pages/Accounts";
import Sidebar from "./navigation/Sidebar";

// Crear el cliente de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Crear el cliente de React Query
globalThis.__REACT_QUERY_CLIENT__ = queryClient;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas: login y register sin sidebar ni flex */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Rutas protegidas: layout con sidebar */}
          <Route
            path="/"
            element={
              <div className="min-h-screen bg-gray-50 flex">
                <Sidebar />
                <div className="flex-1">
                  <Dashboard />
                </div>
              </div>
            }
          />
          <Route
            path="/profile"
            element={
              <div className="min-h-screen bg-gray-50 flex">
                <Sidebar />
                <div className="flex-1">
                  <Profile />
                </div>
              </div>
            }
          />
          <Route
            path="/chat"
            element={
              <div className="min-h-screen bg-gray-50 flex">
                <Sidebar />
                <div className="flex-1">
                  <Chat />
                </div>
              </div>
            }
          />
          <Route
            path="/assistants"
            element={
              <div className="min-h-screen bg-gray-50 flex">
                <Sidebar />
                <div className="flex-1">
                  <Assistants />
                </div>
              </div>
            }
          />
          <Route
            path="/accounts"
            element={
              <div className="min-h-screen bg-gray-50 flex">
                <Sidebar />
                <div className="flex-1">
                  <Accounts />
                </div>
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;