import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, Users, Sparkles, TrendingUp } from 'lucide-react';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      title: 'Discover Events',
      description: 'Find sports and esports events happening near you',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Users,
      title: 'Join Groups',
      description: 'Connect with people who share your interests',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Sparkles,
      title: 'AI Assistant',
      description: 'Get personalized event recommendations with HELP',
      color: 'from-pink-500 to-pink-600',
    },
    {
      icon: TrendingUp,
      title: 'Stay Updated',
      description: 'Never miss an event with real-time updates',
      color: 'from-green-500 to-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-mac-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20">
          <h1 className="text-6xl sm:text-7xl font-semibold mb-6 leading-tight">
            Discover Events.<br />
            <span className="bg-gradient-to-r from-mac-accent to-blue-400 bg-clip-text text-transparent">
              Connect Locally.
            </span>
          </h1>
          <p className="text-xl text-mac-text-secondary max-w-2xl mx-auto mb-10">
            Find sports and esports events in your area, join communities, and never miss out on what matters to you.
          </p>
          {!isAuthenticated && (
            <div className="flex justify-center space-x-4">
              <button onClick={() => navigate('/register')} className="btn-primary text-lg px-8 py-3">
                Get Started
              </button>
              <button onClick={() => navigate('/login')} className="btn-secondary text-lg px-8 py-3">
                Sign In
              </button>
            </div>
          )}
          {isAuthenticated && (
            <button onClick={() => navigate('/events')} className="btn-primary text-lg px-8 py-3 glow-accent">
              Explore Events
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card p-6 hover:scale-[1.02] hover:border-mac-accent transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-mac-text-secondary text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
