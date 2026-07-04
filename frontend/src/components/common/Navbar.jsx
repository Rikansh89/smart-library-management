import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { FiBook, FiBell, FiLogOut, FiUser, FiMenu, FiX } from 'react-icons/fi';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLinks = {
    student: [
      { to: '/student/dashboard', label: 'Dashboard' },
      { to: '/student/books', label: 'Books' },
      { to: '/student/my-books', label: 'My Books' },
      { to: '/student/study-room', label: 'Study Room' },
      { to: '/student/digital-library', label: 'Digital Library' }
    ],
    librarian: [
      { to: '/librarian/dashboard', label: 'Dashboard' },
      { to: '/librarian/books', label: 'Books' },
      { to: '/librarian/issues', label: 'Issues' },
      { to: '/librarian/rooms', label: 'Rooms' },
      { to: '/librarian/resources', label: 'Resources' }
    ],
    admin: [
      { to: '/admin/dashboard', label: 'Dashboard' },
      { to: '/admin/users', label: 'Users' },
      { to: '/admin/analytics', label: 'Analytics' }
    ]
  };

  const links = user ? roleLinks[user.role] || [] : [];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <FiBook className="h-6 w-6 text-primary-600" />
              <span className="font-bold text-xl text-gray-900">Smart Library</span>
            </Link>
            {user && (
              <div className="hidden md:flex ml-10 space-x-4">
                {links.map(link => (
                  <Link key={link.to} to={link.to}
                    className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <Link to="/notifications" className="relative p-2 text-gray-500 hover:text-primary-600">
                  <FiBell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/profile" className="hidden md:flex items-center space-x-2 text-gray-700 hover:text-primary-600">
                  <FiUser className="h-5 w-5" />
                  <span className="text-sm font-medium">{user.name}</span>
                </Link>
                <button onClick={handleLogout}
                  className="hidden md:flex items-center space-x-1 text-gray-500 hover:text-red-600 text-sm">
                  <FiLogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            )}
            {!user && (
              <div className="flex space-x-3">
                <Link to="/login" className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium">Login</Link>
                <Link to="/register" className="btn-primary text-sm">Register</Link>
              </div>
            )}
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && user && (
        <div className="md:hidden bg-white border-t border-gray-200 pb-3">
          {links.map(link => (
            <Link key={link.to} to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 text-gray-600 hover:bg-gray-50">
              {link.label}
            </Link>
          ))}
          <Link to="/profile" onClick={() => setMobileOpen(false)}
            className="block px-4 py-2 text-gray-600 hover:bg-gray-50">Profile</Link>
          <button onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50">Logout</button>
        </div>
      )}
    </nav>
  );
}
