import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function Dashboard() {
  // Fetch data from the warehouse
  const { data: entries, error } = await supabase
    .from('feedback_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return <div className="p-10 text-red-500">Error loading dashboard: {error.message}</div>;

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Continuous Listening Engine</h1>
          <p className="text-gray-400">Real-time Learner Insights & Red Flags</p>
        </div>
        <div className="bg-blue-900/30 border border-blue-500 p-4 rounded-lg">
          <p className="text-sm text-blue-300 font-mono">System Status: ACTIVE</p>
        </div>
      </div>

      <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950">
              <th className="p-4 font-semibold text-gray-300">Timestamp</th>
              <th className="p-4 font-semibold text-gray-300">Learner</th>
              <th className="p-4 font-semibold text-gray-300">Program</th>
              <th className="p-4 font-semibold text-gray-300">Tag</th>
              <th className="p-4 font-semibold text-gray-300 text-center">Score</th>
              <th className="p-4 font-semibold text-gray-300">Comment</th>
            </tr>
          </thead>
          <tbody>
            {entries?.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-500 italic">
                  No feedback ingested yet. Send a test from the widget!
                </td>
              </tr>
            ) : (
              entries?.map((entry) => (
                <tr key={entry.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-medium text-gray-200">{entry.learner_email}</td>
                  <td className="p-4 text-gray-300">
                    <span className="px-2 py-1 bg-zinc-800 rounded text-xs">{entry.program}</span>
                  </td>
                  <td className="p-4 text-gray-300 text-sm">{entry.tag}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-block w-8 h-8 leading-8 rounded-full font-bold ${
                      entry.rating_score < 3 
                        ? 'bg-red-900 text-red-200 animate-pulse' 
                        : 'bg-green-900 text-green-200'
                    }`}>
                      {entry.rating_score}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-sm italic max-w-xs truncate">
                    "{entry.raw_response_1}"
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
