'use client';
import { useState } from 'react';

export default function FeedbackPage() {
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('Sending...');
    
    const formData = new FormData(e.currentTarget);
    const payload = {
      email: formData.get('email'),
      program: formData.get('program'),
      tag: formData.get('tag'),
      rating: parseInt(formData.get('rating') as string),
      comment: formData.get('comment'),
    };

    const res = await fetch('/api/ingest/widget', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.ok) setStatus('✅ Feedback Sent Successfully!');
    else setStatus('❌ Error sending feedback.');
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-black">Always-On Feedback Widget</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="email" type="email" placeholder="Learner Email" required className="w-full p-2 border rounded text-black" />
        
        <select name="program" required className="w-full p-2 border rounded text-black">
          <option value="AiCE">AiCE</option>
          <option value="VA">VA</option>
          <option value="SE">SE</option>
        </select>

        <select name="tag" required className="w-full p-2 border rounded text-black">
          <option value="Learning Content">Learning Content</option>
          <option value="LMS">LMS</option>
          <option value="Tech Mentor Support">Tech Mentor Support</option>
        </select>

        <input name="rating" type="number" min="1" max="5" placeholder="Rating (1-5)" required className="w-full p-2 border rounded text-black" />
        
        <textarea name="comment" placeholder="Tell us more..." className="w-full p-2 border rounded text-black" />

        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">
          Submit Feedback
        </button>
      </form>
      {status && <p className="mt-4 text-center font-semibold text-blue-800">{status}</p>}
    </div>
  );
}