export const config = {
	supabaseUrl: process.env.SUPABASE_URL || '',
	renderBackendUrl:
		process.env.RENDER_BACKEND_URL ||
		'https://feedback-summarizer-kkds.onrender.com',
	supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
	zoomClientSecret: process.env.ZOOM_CLIENT_SECRET || '',
	zoomClientId: process.env.ZOOM_CLIENT_ID || '',
	zoomAccountID: process.env.ZOOM_ACCOUT_ID || '',
};
