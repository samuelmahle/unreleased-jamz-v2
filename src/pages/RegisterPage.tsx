
import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '@/components/RegisterForm';

const RegisterPage: React.FC = () => {
  return (
    <div className="pt-6 pb-32 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Create an Account</h1>
      <RegisterForm />
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-music hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
