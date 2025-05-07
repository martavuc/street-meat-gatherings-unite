
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { useEventContext } from "@/context/EventContext";

const Navbar: React.FC = () => {
  const { currentUser } = useEventContext();

  return (
    <nav className="bg-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center mb-4 sm:mb-0">
          <MapPin className="h-8 w-8 text-streetmeat-primary mr-2" />
          <Link to="/" className="text-gray-700 text-2xl font-bold">
            Street Meat Event
          </Link>
        </div>
        <div className="flex space-x-4">
          <Link to="/">
            <Button variant="ghost" className="text-gray-600 hover:text-white hover:bg-streetmeat-primary">
              Home
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="ghost" className="text-gray-600 hover:text-white hover:bg-streetmeat-primary">
              Sign Up
            </Button>
          </Link>
          <Link to="/community">
            <Button variant="ghost" className="text-gray-600 hover:text-white hover:bg-streetmeat-primary">
              Community
            </Button>
          </Link>
          {currentUser && (
            <Link to="/my-profile">
              <Button variant="outline" className="text-gray-700 border-streetmeat-accent hover:bg-streetmeat-accent hover:text-white">
                My Profile
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
