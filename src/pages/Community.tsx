import React, { useState } from "react";
import { useEventContext } from "@/context/EventContext";
import UserCard from "@/components/UserCard";
import SocialFeed from "@/components/SocialFeed";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { menuAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Community: React.FC = () => {
  const { users, currentUser, pickupLocations } = useEventContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const { user } = useAuth();
  const { toast } = useToast();

  const filteredUsers = activeTab === "all" 
    ? users 
    : users.filter(user => user.pickup_location === activeTab);

  // Convert string currentUser ID to number for API compatibility
  const currentUserId = currentUser ? parseInt(currentUser) : undefined;

  React.useEffect(() => {
    const checkOrder = async () => {
      if (!user) return;

      try {
        const orders = await menuAPI.getMyOrders();
        if (orders.length === 0) {
          toast({
            title: "No Orders Found",
            description: "Please place an order to access the community feed.",
            variant: "destructive",
          });
          navigate('/order');
        }
      } catch (error) {
        console.error('Failed to check orders:', error);
        toast({
          title: "Error",
          description: "Failed to verify your order status.",
          variant: "destructive",
        });
      }
    };

    checkOrder();
  }, [user, navigate, toast]);

  if (!user) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                Please log in to access the community feed.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => navigate('/login')}>
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full md:w-auto mb-8">
          <TabsTrigger value="all">All</TabsTrigger>
          {pickupLocations.map(location => (
            <TabsTrigger key={location.id} value={location.name}>
              {location.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* All locations tab */}
        <TabsContent value="all" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Social Feed - Takes up 2/3 of the space */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">Community Feed</h2>
                <p className="text-muted-foreground">
                  Share updates, ask questions, and connect with fellow food lovers
                </p>
              </div>
              <SocialFeed 
                currentUserId={currentUserId}
                locationFilter="all"
              />
            </div>

            {/* User Roster - Takes up 1/3 of the space */}
            <div className="lg:col-span-1">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Community Members</h2>
                <p className="text-sm text-muted-foreground">
                  {users.length} {users.length === 1 ? 'person' : 'people'} signed up
                </p>
              </div>
              
              {users.length === 0 ? (
              <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground mb-4">
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
                <div className="space-y-4 max-h-[800px] overflow-y-auto">
                  {users.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
            )}
            </div>
          </div>
          </TabsContent>

        {/* Location-specific tabs */}
        {pickupLocations.map(location => (
          <TabsContent key={location.id} value={location.name} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Social Feed for specific location */}
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold mb-2">{location.name} Feed</h2>
                  <p className="text-muted-foreground">
                    Posts and discussions for {location.name} pickup location
                  </p>
                </div>
                <SocialFeed 
                  currentUserId={currentUserId}
                  locationFilter={location.name}
                />
              </div>

              {/* Users for specific location */}
              <div className="lg:col-span-1">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">{location.name} Members</h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredUsers.length} {filteredUsers.length === 1 ? 'person' : 'people'} at this location
                  </p>
                </div>

                {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
                    <p className="text-lg text-muted-foreground mb-4">
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
                  <div className="space-y-4 max-h-[800px] overflow-y-auto">
                    {filteredUsers.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
                  </div>
                )}
              </div>
            </div>
        </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Community;
