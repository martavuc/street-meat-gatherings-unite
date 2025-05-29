import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, MessageCircle, Heart, Calendar } from "lucide-react";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to Street Meat Event</h1>
          <p className="text-xl text-muted-foreground">
            Join us for a delicious street food gathering at Stanford on May 31st, 2025
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Order Your Food</CardTitle>
              <CardDescription>
                Choose from our delicious menu and select your pickup location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Browse our menu, select your favorite dishes, and choose a convenient pickup location and time slot.
              </p>
            </CardContent>
            <CardFooter>
              <Link to={user ? "/order" : "/login"} className="w-full">
                <Button className="w-full">
                  {user ? "Place Order" : "Login to Order"}
          </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Join the Community</CardTitle>
              <CardDescription>
                Connect with other food lovers and share your experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Share your thoughts, photos, and connect with other participants in our community feed.
              </p>
            </CardContent>
            <CardFooter>
              <Link to={user ? "/community" : "/login"} className="w-full">
                <Button className="w-full">
                  {user ? "View Community" : "Login to Join"}
          </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {!user && (
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Don't have an account yet? Sign up to join the event!
            </p>
            <Link to="/signup">
              <Button variant="outline">Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
