
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-10 p-4 backdrop-blur-md bg-white/70 border-b border-border">
      <div className="container mx-auto flex justify-between items-center">
        <Link 
          to={username ? '/dashboard' : '/'} 
          className="text-2xl font-bold text-primary transition-all duration-300 hover:text-primary/80"
        >
          Debate.io
        </Link>
        
        {username && (
          <div className="flex items-center space-x-4">
            <span className="text-foreground">Hello, <span className="font-semibold">{username}</span></span>
            <button 
              onClick={handleLogout}
              className="btn-secondary py-2 px-4"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
