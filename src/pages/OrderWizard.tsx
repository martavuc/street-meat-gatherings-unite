import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { menuAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
}

interface PickupLocation {
  id: number;
  name: string;
  address: string;
}

interface TimeSlot {
  id: number;
  time: string;
}

const OrderWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [menuData, locationsData, timeSlotsData] = await Promise.all([
          menuAPI.getTodaysMenu(),
          menuAPI.getPickupLocations(),
          menuAPI.getTimeSlots(),
        ]);
        
        setMenuItems(menuData);
        setPickupLocations(locationsData);
        setTimeSlots(timeSlotsData);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: "Error",
          description: "Failed to load menu data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleMenuItemSelect = (itemId: number) => {
    setSelectedMenuItem(itemId);
  };

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
  };

  const handleNext = () => {
    if (step === 1 && selectedMenuItem) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMenuItem || !selectedLocation || !selectedTimeSlot) {
      toast({
        title: "Error",
        description: "Please select all required options.",
        variant: "destructive",
      });
      return;
    }

    try {
      await menuAPI.createOrder({
        menu_item_id: selectedMenuItem,
        pickup_location: selectedLocation,
        time_slot: selectedTimeSlot,
      });

      toast({
        title: "Success!",
        description: "Your order has been placed successfully.",
      });

      navigate('/community');
    } catch (error) {
      console.error('Failed to create order:', error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Place Your Order</h1>
          <p className="text-muted-foreground">
            {step === 1 ? "Choose your menu item" : "Select pickup location and time"}
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex-1 text-center ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              Step 1: Menu Item
            </div>
            <Separator className="flex-1 mx-4" />
            <div className={`flex-1 text-center ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              Step 2: Pickup Details
            </div>
          </div>
        </div>

        {step === 1 ? (
          <Card>
            <CardHeader>
              <CardTitle>Select Your Menu Item</CardTitle>
              <CardDescription>Choose from today's available options</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedMenuItem?.toString()}
                onValueChange={(value) => handleMenuItemSelect(parseInt(value))}
                className="space-y-4"
              >
                {menuItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={item.id.toString()} id={`item-${item.id}`} />
                    <Label htmlFor={`item-${item.id}`} className="flex-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </div>
                        <div className="font-medium">{item.price}</div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleNext}
                disabled={!selectedMenuItem}
                className="w-full"
              >
                Continue
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Pickup Details</CardTitle>
              <CardDescription>Choose where and when to pick up your order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">Pickup Location</h3>
                <RadioGroup
                  value={selectedLocation || ''}
                  onValueChange={handleLocationSelect}
                  className="space-y-4"
                >
                  {pickupLocations.map((location) => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={location.name} id={`location-${location.id}`} />
                      <Label htmlFor={`location-${location.id}`} className="flex-1">
                        <div>
                          <div className="font-medium">{location.name}</div>
                          <div className="text-sm text-muted-foreground">{location.address}</div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <h3 className="font-medium mb-4">Pickup Time</h3>
                <RadioGroup
                  value={selectedTimeSlot || ''}
                  onValueChange={handleTimeSlotSelect}
                  className="space-y-4"
                >
                  {timeSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={slot.time} id={`time-${slot.id}`} />
                      <Label htmlFor={`time-${slot.id}`} className="font-medium">
                        {slot.time}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex space-x-4">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedLocation || !selectedTimeSlot}
                className="flex-1"
              >
                Place Order
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrderWizard; 