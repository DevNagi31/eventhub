import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGroup, joinGroup, leaveGroup, getGroupMembers, getGroupEvents } from '../services/api';
import { Users, MapPin, Calendar, ArrowLeft, UserPlus, UserMinus, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    fetchGroupData();
  }, [id]);

  const fetchGroupData = async () => {
    setLoading(true);
    try {
      const [groupRes, membersRes, eventsRes] = await Promise.all([
        getGroup(id),
        getGroupMembers(id),
        getGroupEvents(id),
      ]);
      setGroup(groupRes.data);
      setMembers(membersRes.data);
      setEvents(eventsRes.data);
    } catch (error) {
      console.error('Failed to fetch group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await joinGroup(id);
      await fetchGroupData();
    } catch (error) {
      console.error('Failed to join group:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    
    setActionLoading(true);
    try {
      await leaveGroup(id);
      await fetchGroupData();
    } catch (error) {
      console.error('Failed to leave group:', error);
      alert(error.response?.data?.error || 'Failed to leave group');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mac-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="card p-8">
            <div className="skeleton h-8 w-1/2 mb-4"></div>
            <div className="skeleton h-4 w-3/4 mb-2"></div>
            <div className="skeleton h-4 w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-mac-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-mac-text-secondary mb-4">Group not found</p>
          <button onClick={() => navigate('/groups')} className="btn-secondary">
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mac-surface">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <button
          onClick={() => navigate('/groups')}
          className="flex items-center space-x-2 text-mac-text-secondary hover:text-mac-text mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Groups</span>
        </button>

        <div className="card p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-semibold">{group.name}</h1>
                <span className="px-3 py-1 bg-mac-surface text-xs font-medium rounded-full">
                  {group.category}
                </span>
              </div>
              <p className="text-mac-text-secondary mb-4">{group.description}</p>
              <div className="flex items-center space-x-6 text-sm text-mac-text-secondary">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{group.member_count} members</span>
                </div>
                {group.city && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{group.city}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{group.event_count} events</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              {group.isMember ? (
                <>
                  <button
                    onClick={() => navigate(`/groups/${id}/chat`)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Group Chat</span>
                  </button>
                  <button
                    onClick={handleLeave}
                    disabled={actionLoading}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <UserMinus className="w-4 h-4" />
                    <span>{actionLoading ? 'Leaving...' : 'Leave'}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={actionLoading}
                  className="btn-primary flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{actionLoading ? 'Joining...' : 'Join Group'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-mac-border">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('about')}
                className={`pb-3 border-b-2 transition-colors ${
                  activeTab === 'about'
                    ? 'border-mac-text text-mac-text'
                    : 'border-transparent text-mac-text-secondary hover:text-mac-text'
                }`}
              >
                About
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`pb-3 border-b-2 transition-colors ${
                  activeTab === 'events'
                    ? 'border-mac-text text-mac-text'
                    : 'border-transparent text-mac-text-secondary hover:text-mac-text'
                }`}
              >
                Events ({events.length})
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`pb-3 border-b-2 transition-colors ${
                  activeTab === 'members'
                    ? 'border-mac-text text-mac-text'
                    : 'border-transparent text-mac-text-secondary hover:text-mac-text'
                }`}
              >
                Members ({members.length})
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'about' && (
          <div className="card p-8">
            <h2 className="text-xl font-semibold mb-4">About this group</h2>
            <p className="text-mac-text-secondary mb-4">
              {group.description || 'No description available'}
            </p>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Created by:</span>{' '}
                <span className="text-mac-text-secondary">{group.creator_name}</span>
              </p>
              <p>
                <span className="font-medium">Type:</span>{' '}
                <span className="text-mac-text-secondary">{group.event_type}</span>
              </p>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-mac-text-secondary">No upcoming events</p>
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="card p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{event.displayTitle}</h3>
                      <p className="text-sm text-mac-text-secondary mb-2">
                        {event.displayDescription}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-mac-text-secondary">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(event.start_time).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.displayVenue}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-mac-text-secondary">
                        {event.going_count} going
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="card p-8">
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3 border-b border-mac-border last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-mac-surface rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {member.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{member.username}</p>
                      <p className="text-xs text-mac-text-secondary">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {member.role !== 'member' && (
                    <span className="px-3 py-1 bg-mac-surface text-xs font-medium rounded-full">
                      {member.role}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
