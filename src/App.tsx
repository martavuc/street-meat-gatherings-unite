
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EventProvider } from "@/context/EventContext";
import Navbar from "@/components/Navbar";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Community from "./pages/Community";
import MyProfile from "./pages/MyProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <EventProvider>
        <BrowserRouter>
          <Navbar />
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/community" element={<Community />} />
            <Route path="/my-profile" element={<MyProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </EventProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
