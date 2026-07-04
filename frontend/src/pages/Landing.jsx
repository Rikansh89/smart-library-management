import { Link } from 'react-router-dom';
import { FiBook, FiSearch, FiClock, FiShield, FiUsers, FiTrendingUp } from 'react-icons/fi';

export default function Landing() {
  return (
    <div>
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Smart Library Management System</h1>
            <p className="text-xl text-primary-100 mb-8">
              A modern, intelligent library management platform for students, librarians, and administrators.
              Search, borrow, reserve, and manage books with ease.
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/register" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
                Get Started
              </Link>
              <Link to="/login" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50" />
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="card text-center hover:shadow-md transition-shadow">
                <div className="inline-flex p-3 bg-primary-100 text-primary-600 rounded-xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">{i + 1}</div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-primary-100 mb-8">Join thousands of students and librarians using Smart Library.</p>
          <Link to="/register" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}

const features = [
  { icon: <FiSearch className="h-6 w-6" />, title: 'Advanced Search', description: 'Search books by title, author, ISBN, or category with instant results.' },
  { icon: <FiClock className="h-6 w-6" />, title: 'Real-Time Tracking', description: 'Track borrowed books, due dates, and reservations in real-time.' },
  { icon: <FiBook className="h-6 w-6" />, title: 'Digital Library', description: 'Access e-books, notes, and study materials from anywhere.' },
  { icon: <FiShield className="h-6 w-6" />, title: 'Secure Authentication', description: 'Role-based access with JWT authentication for maximum security.' },
  { icon: <FiUsers className="h-6 w-6" />, title: 'Multi-Role Support', description: 'Dedicated dashboards for students, librarians, and administrators.' },
  { icon: <FiTrendingUp className="h-6 w-6" />, title: 'AI Recommendations', description: 'Get personalized book recommendations based on your interests.' }
];

const steps = [
  { title: 'Register', description: 'Create your free account as a student or librarian.' },
  { title: 'Browse Books', description: 'Search and explore thousands of books in the catalog.' },
  { title: 'Borrow & Read', description: 'Borrow books, reserve, or read e-books online.' },
  { title: 'Track & Return', description: 'Manage your loans, returns, and fines effortlessly.' }
];
