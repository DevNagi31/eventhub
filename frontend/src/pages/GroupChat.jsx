import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGroup, getGroupMessages } from '../services/api';
import socketService from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { Send, ArrowLeft, Loader } from 'lucide-react';

export default function GroupChat() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchGroupAndMessages();
    
    const socket = socketService.connect();
    socketService.joinGroup(id);

    socketService.onNewMessage((data) => {
      setMessages((prev) => [...prev, {
        user_id: data.userId,
        username: data.username,
        message: data.message,
        created_at: data.timestamp
      }]);
    });

    return () => {
      socketService.leaveGroup(id);
      socketService.offNewMessage();
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGroupAndMessages = async () => {
    try {
      const [groupRes, messagesRes] = await Promise.all([
        getGroup(id),
        getGroupMessages(id)
      ]);
      
      setGroup(groupRes.data);
      setMessages(messagesRes.data.messages);
    } catch (error) {
      console.error('Failed to fetch group/messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    const messageText = input.trim();
    setInput('');

    try {
      socketService.sendMessage(id, user.id, user.username, messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mac-bg flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-mac-text-secondary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-mac-bg flex items-center justify-center">
        <p className="text-mac-text-secondary">Group not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mac-bg flex flex-col">
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/groups/${id}`)}
            className="flex items-center space-x-2 text-mac-text-secondary hover:text-mac-text mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {group.name}</span>
          </button>
          <h1 className="text-4xl font-semibold mb-2">{group.name} Chat</h1>
          <p className="text-mac-text-secondary">Real-time group discussion</p>
        </div>

        {/* Messages Container */}
        <div className="flex-1 card p-6 mb-6 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-mac-text-secondary py-12">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.user_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-mac p-4 ${
                      msg.user_id === user.id
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'bg-mac-surface text-mac-text border border-mac-border'
                    }`}
                  >
                    {msg.user_id !== user.id && (
                      <p className="text-xs font-medium mb-1 opacity-70">{msg.username}</p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    <p className="text-xs mt-1 opacity-60">
                      {new Date(msg.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="card p-4">
          <div className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="input flex-1"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="btn-primary flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
