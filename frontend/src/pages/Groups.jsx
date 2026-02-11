import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchGroups, createGroup } from '../services/api';
import { Users, MapPin, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Groups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    radius: 50,
    category: '',
  });

  useEffect(() => {
    fetchGroups();
  }, [filters]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const params = {
        lat: user?.lat || 42.0987,
        lng: user?.lng || -75.9179,
        radius: filters.radius,
        ...(filters.category && { category: filters.category }),
      };

      const response = await searchGroups(params);
      setGroups(response.data.groups);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mac-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-semibold mb-2">Groups</h1>
            <p className="text-mac-text-secondary">Find and join communities near you</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Group</span>
          </button>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Radius (miles)</label>
              <input
                type="number"
                value={filters.radius}
                onChange={(e) => setFilters({ ...filters, radius: e.target.value })}
                className="input"
                min="1"
                max="200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <input
                type="text"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="input"
                placeholder="e.g., basketball, valorant"
              />
            </div>
          </div>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-6">
                <div className="skeleton h-6 w-3/4 mb-4"></div>
                <div className="skeleton h-4 w-full mb-2"></div>
                <div className="skeleton h-4 w-2/3"></div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-mac-text-secondary mb-4">No groups found in your area</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              Create the First Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="card p-6 cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-block px-3 py-1 bg-mac-surface text-xs font-medium rounded-full">
                    {group.category}
                  </span>
                  <span className="text-xs text-mac-text-secondary">
                    {group.distance_miles} mi
                  </span>
                </div>

                <h3 className="text-lg font-semibold mb-2 group-hover:opacity-70 transition-opacity">
                  {group.name}
                </h3>

                <p className="text-sm text-mac-text-secondary mb-4 line-clamp-2">
                  {group.description || 'No description'}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-mac-text-secondary">
                    <Users className="w-4 h-4" />
                    <span>{group.member_count} members</span>
                  </div>
                  {group.city && (
                    <div className="flex items-center space-x-2 text-mac-text-secondary">
                      <MapPin className="w-4 h-4" />
                      <span>{group.city}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateModal && (
          <CreateGroupModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchGroups();
            }}
          />
        )}
      </div>
    </div>
  );
}

function CreateGroupModal({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    eventType: 'sports',
    city: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createGroup({
        ...formData,
        location: {
          lat: user?.lat || 42.0987,
          lng: user?.lng || -75.9179,
        },
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="card p-8 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-semibold mb-6">Create New Group</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-mac text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Group Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Basketball Enthusiasts"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows="3"
              placeholder="Tell people about your group..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input"
              placeholder="e.g., basketball, valorant"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              className="input"
            >
              <option value="sports">Sports</option>
              <option value="esports">Esports</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="input"
              placeholder="Binghamton"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
