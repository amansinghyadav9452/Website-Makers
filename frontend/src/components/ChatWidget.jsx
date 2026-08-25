import React, { useState, useRef, useEffect } from 'react';
import { toast } from './ToastProvider';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://website-makers-api.onrender.com' : 'http://localhost:4000')).replace(/\/$/, '');

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m the Website Makers assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [leadMode, setLeadMode] = useState(false);
  const [leadData, setLeadData] = useState({ name: '', email: '', phone: '' });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chatbot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: userMessage }].slice(-10) })
      });

      const data = await res.json();

      if (data.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else if (data.fallback) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'I\'m currently unavailable. Leave your details and we\'ll contact you within 24 hours.' 
        }]);
        setLeadMode(true);
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I\'m having trouble connecting. Please try again or contact us directly.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const submitLead = async (e) => {
    e.preventDefault();
    if (!leadData.name || !leadData.email) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/chatbot/capture-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          message: 'Lead from chatbot'
        })
      });

      if (res.ok) {
        toast.success('We\'ll contact you soon!');
        setLeadMode(false);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Thank you! Our team will reach out to you within 24 hours.' }]);
      }
    } catch (err) {
      toast.error('Could not save your details.');
    }
  };

  return (
    <>
      <button 
        className={`chat-widget-toggle ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label="Open chat"
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="chat-widget">
          <div className="chat-header">
            <strong>Website Makers</strong>
            <span>AI Assistant</span>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {loading && <div className="chat-message assistant typing"><span>●</span><span>●</span><span>●</span></div>}
            <div ref={messagesEndRef} />
          </div>

          {leadMode ? (
            <form className="chat-lead-form" onSubmit={submitLead}>
              <input 
                placeholder="Your name" 
                value={leadData.name} 
                onChange={e => setLeadData(p => ({ ...p, name: e.target.value }))}
                required
              />
              <input 
                type="email"
                placeholder="Your email" 
                value={leadData.email} 
                onChange={e => setLeadData(p => ({ ...p, email: e.target.value }))}
                required
              />
              <input 
                placeholder="Phone (optional)" 
                value={leadData.phone} 
                onChange={e => setLeadData(p => ({ ...p, phone: e.target.value }))}
              />
              <button type="submit">Submit</button>
            </form>
          ) : (
            <div className="chat-input">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                disabled={loading}
              />
              <button onClick={sendMessage} disabled={loading || !input.trim()}>
                ➤
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
