import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { socialAPI, authAPI, menuAPI, User, PickupLocation } from '@/lib/api';
import UserGridCard from '@/components/UserGridCard';
import CombinedFeed from '@/components/CombinedFeed';
import SocialFeed from '@/components/SocialFeed';
import { Users, MapPin, MessageSquare } from 'lucide-react';
import LayoutWithHotDogs from "@/components/LayoutWithHotDogs";

const Community: React.FC = () => {
  const initialTab = ((): string => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("user_pickup_location") || "";
  })();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [usersByLocation, setUsersByLocation] = useState<Record<string, User[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkOrderAndLoadData = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Check if user has an order
        const orders = await menuAPI.getMyOrders();
        if (orders.length === 0) {
          toast({
            title: "No Orders Found",
            description: "Please place an order to access the community.",
            variant: "destructive",
          });
          navigate('/order');
          return;
        }

        // Load pickup locations
        const locations = await authAPI.getPickupLocations();
        setPickupLocations(locations);

        // If activeTab not set or invalid, switch to user location or first location
        const userLoc = localStorage.getItem("user_pickup_location");
        if (userLoc && locations.some((l) => l.name === userLoc)) {
          setActiveTab(userLoc);
        } else if (locations.length && !locations.some((l) => l.name === activeTab)) {
          setActiveTab(locations[0].name);
        }

        // Load users for each location
        const locationUserData: Record<string, User[]> = {};
        
        for (const location of locations) {
          try {
            const users = await socialAPI.getUsersByLocation(location.name);
            locationUserData[location.name] = users;
          } catch (error) {
            console.error(`Failed to load users for ${location.name}:`, error);
            locationUserData[location.name] = [];
          }
        }

        setUsersByLocation(locationUserData);

        if (orders.length) {
          localStorage.setItem("user_pickup_location", orders[0].pickup_location);
        }
      } catch (error) {
        console.error('Failed to load community data:', error);
        toast({
          title: "Error",
          description: "Failed to load community data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkOrderAndLoadData();
  }, [user, navigate, toast]);

  const getAllUsers = () => {
    return Object.values(usersByLocation).flat();
  };

  const getUsersForLocation = (location: string) => {
    return usersByLocation[location] || [];
  };

  const getUserOrder = async () => {
    if (!user) return null;
    try {
      const orders = await menuAPI.getMyOrders();
      return orders.length > 0 ? orders[0] : null;
    } catch (error) {
      return null;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                Please log in to access the community.
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading Community...</h2>
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded w-1/3 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LayoutWithHotDogs>
    <div className="container mx-auto py-6 sm:py-10 px-4 sm:px-6">

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex justify-center max-w-2xl mx-auto mb-4 bg-white/10 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden py-7">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8">
            {pickupLocations.map(location => (
              <TabsTrigger 
                key={location.id} 
                value={location.name} 
                className="flex items-center justify-center space-x-2 px-6 sm:px-10 py-3 sm:py-5 text-base sm:text-lg font-medium data-[state=active]:bg-red-500/10 data-[state=active]:text-red-500 transition-colors h-full whitespace-nowrap"
              >
                <MapPin className="h-5 w-5" />
                <span>{location.name}</span>
              </TabsTrigger>
            ))}
          </div>
        </TabsList>

        {/* Location-specific tabs */}
        {pickupLocations.map(location => (
          <TabsContent key={location.id} value={location.name} className="space-y-8">
            <CombinedFeed location={location.name} currentUserId={user.id} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
    </LayoutWithHotDogs>
  );
};

export default Community;
