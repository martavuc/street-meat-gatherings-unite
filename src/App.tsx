import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Community from './pages/Community';
import OrderWizard from './pages/OrderWizard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main>
          <Routes>
            <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
              <Route
                path="/order"
                element={
                  <ProtectedRoute>
                    <OrderWizard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community"
                element={
                  <ProtectedRoute>
                    <Community />
                  </ProtectedRoute>
                }
              />
          </Routes>
          </main>
          <Toaster />
        </div>
      </AuthProvider>
    </Router>
);
}

export default App;
