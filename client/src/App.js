import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./modules/Dashboard";
import LoginSignupForm from "./components/LoginSignupForm";

const ProtectedRoute = ({ children, auth = false }) => {
  const isLoggedIn = localStorage.getItem("user:token") !== null || false;

  if (!isLoggedIn && auth) {
    return <Navigate to={"/login"} />;
  } else if (
    isLoggedIn &&
    ["/login", "/signup"].includes(window.location.pathname)
  ) {
    return <Navigate to={"/"} />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute auth={true}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login"
        element={
          <ProtectedRoute >
            <LoginSignupForm isLogin={true} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <ProtectedRoute>
            <LoginSignupForm isLogin={false} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
