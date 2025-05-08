
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEventContext } from "@/context/EventContext";
import { useNavigate } from "react-router-dom";

const SignupForm: React.FC = () => {
  const { addUser, pickupLocations, timeSlots } = useEventContext();
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("https://source.unsplash.com/random/300x300/?portrait");
  const [pickupLocation, setPickupLocation] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file to a server
      // For now, we'll just use a placeholder URL
      setImageUrl(`https://source.unsplash.com/random/300x300/?food`);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!pickupLocation) newErrors.pickupLocation = "Pickup location is required";
    if (!timeSlot) newErrors.timeSlot = "Time slot is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    addUser({
      name,
      imageUrl,
      pickupLocation,
      timeSlot
    });
    
    navigate("/community");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Sign Up for Street Meat</CardTitle>
        <CardDescription className="text-center">Enter your details to sign up for the event</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image">Profile Picture</Label>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Preferred Pickup Location</Label>
            <Select
              onValueChange={setPickupLocation}
              defaultValue={pickupLocation}
            >
              <SelectTrigger className={errors.pickupLocation ? "border-destructive" : ""}>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {pickupLocations.map((location) => (
                  <SelectItem key={location.id} value={location.name}>
                    {location.name} - {location.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.pickupLocation && (
              <p className="text-sm text-destructive">{errors.pickupLocation}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeSlot">Preferred Pickup Time</Label>
            <Select
              onValueChange={setTimeSlot}
              defaultValue={timeSlot}
            >
              <SelectTrigger className={errors.timeSlot ? "border-destructive" : ""}>
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot.id} value={slot.time}>
                    {slot.time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.timeSlot && (
              <p className="text-sm text-destructive">{errors.timeSlot}</p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full bg-streetmeat-primary hover:bg-streetmeat-accent"
          >
            Sign Up
          </Button>
          
          <p className="text-sm text-muted-foreground text-center">
            Already signed up?{" "}
            <Button 
              variant="link" 
              className="p-0 text-streetmeat-primary"
              onClick={() => navigate("/community")}
              type="button"
            >
              View the community
            </Button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SignupForm;
