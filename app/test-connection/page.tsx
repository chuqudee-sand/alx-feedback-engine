import { createClient } from '@supabase/supabase-js';

// Initialize the client using the variables you just added
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function ConnectionTest() {
  // Test: Fetching the list of tables (or just a single count)
  const { data, error } = await supabase
    .from('feedback_entries')
    .select('id')
    .limit(1);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Systems Architect: Handshake Test</h1>
      <hr className="mb-4" />
      
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p><strong>Connection Failed:</strong> {error.message}</p>
          <p className="text-sm mt-2">Check if your Service Role Key and URL are correct in Vercel.</p>
        </div>
      ) : (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p><strong>Connection Success!</strong></p>
          <p className="text-sm mt-2">Vercel is now successfully talking to your Supabase Data Warehouse.</p>
        </div>
      )}
    </div>
  );
}