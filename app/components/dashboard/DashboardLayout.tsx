import type { ReactNode } from 'react';

type DashboardLayoutProps = {
	isDark: boolean;
	themeStyle: { bg: string; textMain: string };
	sidebar: ReactNode;
	children: ReactNode;
};

export function DashboardLayout({
	isDark,
	themeStyle,
	sidebar,
	children,
}: DashboardLayoutProps) {
	return (
		<div
			className="flex min-h-screen transition-colors duration-500 relative"
			style={{
				fontFamily: "'Ubuntu', sans-serif",
				backgroundColor: themeStyle.bg,
				color: themeStyle.textMain,
			}}
		>
			<div
				className="fixed inset-0 z-0 pointer-events-none flex justify-center items-center"
				style={{ opacity: isDark ? 0.03 : 0.04 }}
			>
				<img
					src={isDark ? '/alx-logo-transparent.png' : '/alx-logo-black.png'}
					alt="ALX Logo"
					className="w-[40%] object-contain"
					style={{ mixBlendMode: isDark ? 'luminosity' : 'multiply' }}
				/>
			</div>
			{sidebar}
			<main className="flex-1 p-10 overflow-y-auto relative z-10">{children}</main>
		</div>
	);
}
