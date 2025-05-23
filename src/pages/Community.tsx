
import React, { useState } from "react";
import { useEventContext } from "@/context/EventContext";
import UserCard from "@/components/UserCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LocationChat from "@/components/LocationChat";

const Community: React.FC = () => {
  const { users, currentUser, pickupLocations } = useEventContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");

  const filteredUsers = activeTab === "all" 
    ? users 
    : users.filter(user => user.pickupLocation === activeTab);

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Street Meat Community</h1>
        {!currentUser && (
          <Button 
            onClick={() => navigate("/signup")}
            className="bg-streetmeat-primary hover:bg-streetmeat-accent"
          >
            Sign Up to Participate
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full mb-8" onValueChange={setActiveTab}>
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          {pickupLocations.map(location => (
            <TabsTrigger key={location.id} value={location.name}>
              {location.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {pickupLocations.map(location => (
          <TabsContent key={location.id} value={location.name}>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground mb-4">
                  No one has signed up for {location.name} yet. Be the first!
                </p>
                <Button 
                  onClick={() => navigate("/signup")}
                  className="bg-streetmeat-primary hover:bg-streetmeat-accent"
                >
                  Sign Up Now
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredUsers.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
                <LocationChat locationName={location.name} />
              </>
            )}
          </TabsContent>
        ))}

        <TabsContent value="all">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground mb-4">
                No one has signed up yet. Be the first!
              </p>
              <Button 
                onClick={() => navigate("/signup")}
                className="bg-streetmeat-primary hover:bg-streetmeat-accent"
              >
                Sign Up Now
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
              <LocationChat locationName="all" />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Community;
