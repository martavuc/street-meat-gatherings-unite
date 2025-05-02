
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MapPin, MessageCircle, Heart } from "lucide-react";

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <div
        className="flex-1 flex flex-col items-center justify-center bg-cover bg-center text-center p-6"
        style={{
          backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url('https://source.unsplash.com/random/1920x1080/?street-food')",
        }}
      >
        <h1 className="street-meat-title mb-6">STREET MEAT EVENT</h1>
        <p className="street-meat-subtitle mb-8">Join us for the ultimate street food experience!</p>

        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-8">
          <Button 
            size="lg" 
            className="bg-streetmeat-primary hover:bg-streetmeat-primary/90 text-white"
            onClick={() => navigate("/signup")}
          >
            Sign Up Now
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="border-streetmeat-accent text-streetmeat-text hover:bg-streetmeat-accent/20"
            onClick={() => navigate("/community")}
          >
            View Community
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl mt-12">
          <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg flex flex-col items-center">
            <MapPin className="h-12 w-12 text-streetmeat-primary mb-4" />
            <h3 className="text-xl font-bold text-streetmeat-text mb-2">Choose Location</h3>
            <p className="text-streetmeat-text/80 text-center">
              Select your preferred pickup location from our list of venues
            </p>
          </div>
          
          <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg flex flex-col items-center">
            <MessageCircle className="h-12 w-12 text-streetmeat-secondary mb-4" />
            <h3 className="text-xl font-bold text-streetmeat-text mb-2">Leave Comments</h3>
            <p className="text-streetmeat-text/80 text-center">
              Connect with other foodies and share your excitement
            </p>
          </div>
          
          <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg flex flex-col items-center">
            <Heart className="h-12 w-12 text-streetmeat-accent mb-4" />
            <h3 className="text-xl font-bold text-streetmeat-text mb-2">Like & Interact</h3>
            <p className="text-streetmeat-text/80 text-center">
              Like comments and engage with the community
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
