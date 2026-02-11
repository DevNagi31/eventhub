import { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '../services/api';
import { Send, Loader, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Welcome message
    setMessages([
      {
        role: 'assistant',
        content: `Hello ${user?.username || 'there'}. I'm HELP, your Hub for Event Locating & Planning. I can help you discover events and groups based on your interests. What are you looking for today?`,
      },
    ]);
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await sendChatMessage(userMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.message,
          suggestedEvents: response.data.suggestedEvents,
          suggestedGroups: response.data.suggestedGroups,
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mac-bg flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col py-12 px-4">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-mac-accent to-mac-accent-hover rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-4xl font-semibold">HELP</h1>
          </div>
          <p className="text-mac-text-secondary">
            Hub for Event Locating & Planning - Your AI assistant
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 card p-6 mb-6 overflow-y-auto space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-mac p-4 ${
                  message.role === 'user'
                    ? 'bg-mac-accent text-white'
                    : 'bg-mac-bg border border-mac-border text-mac-text'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>

                {/* Suggested Events */}
                {message.suggestedEvents && message.suggestedEvents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium opacity-70">Suggested Events:</p>
                    {message.suggestedEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 bg-mac-surface rounded border border-mac-border hover:border-mac-accent transition-colors"
                      >
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-mac-text-secondary">
                          {event.venue_name} • {new Date(event.start_time).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Groups */}
                {message.suggestedGroups && message.suggestedGroups.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium opacity-70">Suggested Groups:</p>
                    {message.suggestedGroups.map((group) => (
                      <div
                        key={group.id}
                        className="p-3 bg-mac-surface rounded border border-mac-border hover:border-mac-accent transition-colors"
                      >
                        <p className="font-medium text-sm">{group.name}</p>
                        <p className="text-xs text-mac-text-secondary">
                          {group.category} • {group.member_count} members
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-mac-bg border border-mac-border rounded-mac p-4">
                <Loader className="w-5 h-5 animate-spin text-mac-accent" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="card p-4">
          <div className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about events or groups..."
              className="input flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
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
