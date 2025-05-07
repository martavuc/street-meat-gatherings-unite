
import React from "react";
import SignupForm from "@/components/SignupForm";

const Signup: React.FC = () => {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-2 text-streetmeat-primary">Sign Up for Street Meat Event</h1>
      <p className="text-center mb-8 text-gray-600">Join us at Stanford on May 31st, 2025</p>
      <SignupForm />
    </div>
  );
};

export default Signup;
