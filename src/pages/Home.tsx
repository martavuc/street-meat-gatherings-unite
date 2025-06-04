import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, MessageCircle, Heart, Calendar } from "lucide-react";
import LayoutWithHotDogs from '@/components/LayoutWithHotDogs';

const Home = () => {
  const { user, hasOrder } = useAuth();

  return (

    <LayoutWithHotDogs>
      {/* top bar ‒ unchanged */}
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Street Meat Express – Order Together, Eat Together
            </h1>
            <p className="text-xl text-muted-foreground">
              Join us for a delicious street food gathering
            </p>
          </div>

          {/* single, centered card */}
          <div className="flex justify-center">
            <Card className="w-full max-w-xl rounded-3xl shadow-2xl bg-white/10 backdrop-blur-md text-center">
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  <MapPin size={20} /> Kappa Sig · White Plaza · SNU
                </CardTitle>
                <CardDescription>
                  June 5 · 9:30pm – 10:30pm
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <p>
                  Reserve your hotdog, then dive straight into our community feed to see who else is rolling up, swap tips on toppings, and plan an in person meetup at pickup time. One click turns a quick bite into a larger hangout.
                </p>

                {hasOrder ? (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-green-600/15 px-4 py-2 text-green-800">
                    <Heart size={18} /> Order confirmed — jump into the conversation!
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-yellow-500/15 px-4 py-2 text-yellow-800">
                    <Calendar size={18} /> Order by 6pm Thursday to guarantee a plate
                  </div>
                )}
              </CardContent>

              <CardFooter
                /* two columns when both buttons show, otherwise flex-center */
                className={`gap-2 ${hasOrder
                    ? "grid place-items-center"   // ← grids: center the lone cell
                    : "flex justify-center"       // ← fallback flex layout
                  }`}
              >
                <Link
                  to={hasOrder ? "/community" : user ? "/order" : "/login"}
                  className="flex justify-center"
                >
                  <Button className="flex justify-center">
                    {hasOrder
                      ? "Go to Community Feed"
                      : user
                        ? "Order & Join"
                        : "Login to Start"}
                  </Button>
                </Link>
              </CardFooter>

            </Card>
          </div>

          {/* signup prompt unchanged */}
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
    </LayoutWithHotDogs>
  );
};

export default Home;