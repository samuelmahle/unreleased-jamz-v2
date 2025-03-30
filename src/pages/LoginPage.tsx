
import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '@/components/LoginForm';

const LoginPage: React.FC = () => {
  return (
    <div className="pt-6 pb-32 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Login</h1>
      <LoginForm />
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="text-music hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
