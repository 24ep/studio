"use client";
import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import 'react-quill/dist/quill.snow.css';
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
export default function SystemSettingsPage() {
    const [loginPageContent, setLoginPageContent] = useState('');
    const [maxConcurrentProcessors, setMaxConcurrentProcessors] = useState(5);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetch('/api/settings/system-settings')
            .then(res => res.json())
            .then(data => {
            setLoginPageContent(data.loginPageContent || '');
            const maxConcurrent = parseInt(data.maxConcurrentProcessors, 10);
            setMaxConcurrentProcessors(isNaN(maxConcurrent) ? 5 : maxConcurrent);
            setLoading(false);
        });
    }, []);
    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        await fetch('/api/settings/system-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([
                { key: 'loginPageContent', value: loginPageContent },
                { key: 'maxConcurrentProcessors', value: String(maxConcurrentProcessors) },
            ]),
        });
        setLoading(false);
    };
    if (loading)
        return <div>Loading...</div>;
    return (<form onSubmit={handleSave}>
      <label>Login Page Content</label>
      <ReactQuill value={loginPageContent} onChange={setLoginPageContent}/>
      <label style={{ marginTop: 16, display: 'block' }}>Max Concurrent Processors</label>
      <input type="number" min={1} max={100} value={maxConcurrentProcessors} onChange={(e) => setMaxConcurrentProcessors(Number(e.target.value))} style={{ marginBottom: 16, width: 80 }}/>
      <button type="submit">Save</button>
    </form>);
}
