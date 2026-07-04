import React, { useState, useRef, useEffect } from 'react';
import { chatAPI } from '../../services/api';

export default function Chatbot() {
  const [messages, setMessages] = useState([{ role: 'ai', content: 'Hello! I am your LibraMind AI assistant. How can I help you with the library today?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatAPI.send(input);
      setMessages((prev) => [...prev, { role: 'ai', content: res.data.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }]);
    }
    setLoading(false);
  };

  const quickQueries = [
    'How do I borrow a book?',
    'What are the library hours?',
    'How are fines calculated?',
    'How do I return a book?',
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Library Assistant</h1>
          <p className="text-gray-500 dark:text-dark-400">Ask me anything about the library</p>
        </div>
      </div>

      <div className="card h-[600px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-sm'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-dark-100 rounded-bl-sm'
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-dark-700 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {quickQueries.map((q) => (
            <button key={q} onClick={() => { setInput(q); }} className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300 hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors">
              {q}
            </button>
          ))}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..." className="input-field flex-1" />
          <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-6">Send</button>
        </form>
      </div>
    </div>
  );
}
