"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function SystemSettingsPage() {
  const [loginPageContent, setLoginPageContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings/system-settings')
      .then(res => res.json())
      .then(data => {
        setLoginPageContent(data.loginPageContent || '');
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/settings/system-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginPageContent }),
    });
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSave}>
      <label>Login Page Content</label>
      <ReactQuill value={loginPageContent} onChange={setLoginPageContent} />
      <button type="submit">Save</button>
    </form>
  );
} 