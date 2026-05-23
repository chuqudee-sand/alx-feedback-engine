export type MetricType = 'sat' | 'agree' | 'help' | 'quality';

export type MetricDef = {
	label: string;
	column: string;
	type: MetricType;
	insight?: string;
};

export const ONBOARDING_METRICS: MetricDef[] = [
	{
		label: 'ONBOARDING SATISFACTION',
		column: 'sat_next_steps',
		type: 'sat',
		insight:
			'are highly satisfied with their onboarding experience and confidently know their next steps.',
	},
	{
		label: 'PROGRAM EXPECTATION CLARITY',
		column: 'clear_expectations',
		type: 'agree',
		insight:
			"completely understand the program's expectations and graduation requirements.",
	},
	{
		label: 'ACCESS TO PROGRAM TEAM',
		column: 'access_tech_mentors',
		type: 'agree',
		insight:
			'know exactly how to access the Program Team for expert guidance when needed.',
	},
	{
		label: 'CONNECT WITH PEERS',
		column: 'connect_peers',
		type: 'agree',
		insight:
			'know exactly how to connect with peers and Community Ambassadors for support.',
	},
	{
		label: 'PLATFORM BUG AWARENESS',
		column: 'help_platform_bugs',
		type: 'agree',
		insight:
			'know where to go to get help with platform issues and technical bugs.',
	},
	{
		label: 'SUPPORT TOOL CLARITY',
		column: 'access_support_tools',
		type: 'agree',
		insight:
			'are clear on how to access key support tools like LEA, Chidi, and PeerFinder.',
	},
	{
		label: 'PAUSE/WITHDRAW CLARITY',
		column: 'know_pause_withdraw',
		type: 'agree',
		insight:
			'know exactly what to do if they need to pause or withdraw from the program.',
	},
	{
		label: 'COMMS CLARITY & USEFULNESS',
		column: 'comms_useful',
		type: 'help',
		insight:
			'found emails and community communications clear and highly useful for getting started.',
	},
];

export const AICE_SKILLS_METRICS: MetricDef[] = [
	{
		label: 'CAN EXPLAIN AI CONCEPTS',
		column: 'skill_explain_ai',
		type: 'agree',
		insight:
			'feel highly confident explaining artificial intelligence and how AI systems work.',
	},
	{
		label: 'CAN WRITE CLEAR PROMPTS',
		column: 'skill_write_prompts',
		type: 'agree',
		insight:
			'are confident in writing goal-oriented prompts to guide AI tools for quality results.',
	},
	{
		label: 'CAN EVALUATE AI ETHICS',
		column: 'skill_evaluate_ethics',
		type: 'agree',
		insight:
			'feel highly capable of evaluating an AI tool against core ethical principles.',
	},
	{
		label: 'CAN CREATE AI CONTENT',
		column: 'skill_create_content',
		type: 'agree',
		insight:
			'are confident using generative AI to create professional text and multimedia content.',
	},
	{
		label: 'CAN IDENTIFY DATA PATTERNS',
		column: 'skill_identify_patterns',
		type: 'agree',
		insight:
			'are highly confident using AI tools to identify data patterns and visual findings.',
	},
	{
		label: 'CAN BUILD AI PORTFOLIO',
		column: 'skill_build_portfolio',
		type: 'agree',
		insight:
			'feel fully ready to build and publish an AI-powered professional portfolio.',
	},
];

export const VA_SKILLS_METRICS: MetricDef[] = [
	{
		label: 'PRESENT PROFESSIONALLY AS VA',
		column: 'skill_va_present_professionally',
		type: 'agree',
		insight:
			'are highly confident they can present themselves professionally as a Virtual Assistant.',
	},
	{
		label: 'COMMUNICATE & MANAGE TIME',
		column: 'skill_va_communicate_effectively',
		type: 'agree',
		insight:
			'feel fully prepared to communicate effectively and manage time in a professional setting.',
	},
	{
		label: 'RESPOND TO WORKPLACE SCENARIOS',
		column: 'skill_va_workplace_scenarios',
		type: 'agree',
		insight:
			'are confident they can respond to real workplace scenarios with clear, structured thinking.',
	},
	{
		label: 'USE DIGITAL TOOLS EFFICIENTLY',
		column: 'skill_va_digital_tools',
		type: 'agree',
		insight:
			'feel highly capable of using digital tools like Google Workspace to manage workflows.',
	},
	{
		label: 'COMPLETE CORE VA TASKS',
		column: 'skill_va_core_tasks',
		type: 'agree',
		insight:
			'are ready to complete core tasks like research, scheduling, and admin support.',
	},
	{
		label: 'PRESENT WORK CLEARLY',
		column: 'skill_va_present_work',
		type: 'agree',
		insight:
			'feel highly confident presenting their work clearly through structured outputs.',
	},
	{
		label: 'APPLY FOR REMOTE JOBS',
		column: 'skill_va_apply_jobs',
		type: 'agree',
		insight:
			'are fully confident applying for remote jobs or freelance opportunities.',
	},
	{
		label: 'PITCH SKILLS TO CLIENTS',
		column: 'skill_va_pitch_skills',
		type: 'agree',
		insight:
			'feel prepared to pitch their skills and attract potential clients or employers.',
	},
	{
		label: 'IDENTIFY A NICHE',
		column: 'skill_va_identify_niche',
		type: 'agree',
		insight:
			'are confident they can identify a specific VA niche and create an action plan.',
	},
	{
		label: 'BUILD PROFESSIONAL PORTFOLIO',
		column: 'skill_va_build_portfolio',
		type: 'agree',
		insight:
			'feel completely ready to build a professional portfolio and use AI tools responsibly.',
	},
];

export const EOP_METRICS: MetricDef[] = [
	{
		label: 'OVERALL EXPERIENCE',
		column: 'overall_sat',
		type: 'sat',
		insight: 'are highly satisfied with their overall program experience.',
	},
	{
		label: 'CAREER IMPACT',
		column: 'career_impact',
		type: 'help',
		insight:
			'feel the program was highly effective in enhancing their skills and advancing their careers.',
	},
	{
		label: 'COMMUNITY EVENTS',
		column: 'supp_events',
		type: 'agree',
		insight:
			'say community events kept them motivated, engaged, and on track to complete the program.',
	},
	{
		label: 'PEER SUPPORT',
		column: 'supp_peers',
		type: 'agree',
		insight:
			'felt well-supported and motivated by their peers throughout their learning journey.',
	},
	{
		label: 'PROGRAM TEAM SUPPORT',
		column: 'supp_mentors',
		type: 'agree',
		insight:
			'state that Program Team support contributed meaningfully to their learning.',
	},
	{
		label: 'LEA (AI ASSISTANT)',
		column: 'supp_lea',
		type: 'agree',
		insight:
			'found the LEA AI Assistant easily accessible and highly useful when facing challenges.',
	},
	{
		label: 'CHIDI (AI ASSISTANT)',
		column: 'supp_chidi',
		type: 'agree',
		insight:
			'relied on Chidi AI to successfully navigate and overcome learning content challenges.',
	},
	{
		label: 'PROGRAM TEAM COMMS',
		column: 'supp_prog_team',
		type: 'agree',
		insight:
			'received timely and helpful guidance from the Program Team communications.',
	},
	{
		label: 'PEERFINDER APP',
		column: 'supp_peerfinder',
		type: 'agree',
		insight:
			'successfully used the PeerFinder tool to connect with peers for collaboration.',
	},
	{
		label: 'RESOURCES HUB',
		column: 'supp_hub',
		type: 'agree',
		insight:
			'found the Program Guides and Resources Hub essential for supporting their journey.',
	},
];

export const TAB_DISPLAY_MAP: Record<string, string> = {
	onboarding: 'Onboarding',
	community: 'Community Events',
	support: 'Learner Support Webinars',
	eop: 'End of Program',
};

export const PROGRAMS = [
	'AiCE',
	'Virtual Assistant',
	'Professional Foundations',
] as const;

export const TABS = [
	{ id: 'onboarding', label: 'ONBOARDING' },
	{ id: 'community', label: 'COMMUNITY EVENTS' },
	{ id: 'support', label: 'LEARNER SUPPORT WEBINARS' },
	{ id: 'eop', label: 'END OF PROGRAM' },
] as const;
