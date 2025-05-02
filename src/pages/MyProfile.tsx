
import React from "react";
import { useEventContext } from "@/context/EventContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

const MyProfile: React.FC = () => {
  const { users, currentUser, setCurrentUser } = useEventContext();
  const navigate = useNavigate();
  
  const user = currentUser ? users.find(u => u.id === currentUser) : null;
  
  if (!user) {
    navigate("/signup");
    return null;
  }
  
  const handleSignOut = () => {
    setCurrentUser(null);
    navigate("/");
  };
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">My Profile</h1>
      
      <Card className="max-w-md mx-auto">
        <CardHeader className="p-0">
          <div className="bg-gradient-to-r from-streetmeat-primary to-streetmeat-secondary h-32"></div>
        </CardHeader>
        <CardContent className="p-6 -mt-16 flex flex-col items-center">
          <Avatar className="w-32 h-32 border-4 border-background">
            <AvatarImage src={user.imageUrl} />
            <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          
          <h2 className="text-2xl font-bold mt-4">{user.name}</h2>
          
          <div className="bg-muted/30 px-4 py-2 rounded-md mt-4 w-full">
            <p className="text-center">
              <span className="text-muted-foreground">Pickup Location:</span>{" "}
              <span className="font-medium">{user.pickupLocation}</span>
            </p>
          </div>
          
          <div className="w-full mt-8 space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/community")}
            >
              View Community
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyProfile;
