
import React from "react";
import SignupForm from "@/components/SignupForm";

const Signup: React.FC = () => {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-8 text-streetmeat-primary">Sign Up for Street Meat Event</h1>
      <SignupForm />
    </div>
  );
};

export default Signup;
