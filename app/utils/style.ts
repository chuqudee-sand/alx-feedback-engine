export const colors = {
	berkeleyBlue: '#002B56',
	sidebarNavy: '#001428',
	springGreen: '#05F283',
	iris: '#5648B7',
	white: '#FFFFFF',
	electricBlue: '#27DEF2',
	blueNCS: '#028ECA',
	tomato: '#FF5347',
	gold: '#FBD437',
	turquoise: '#41C9B9',
};

export const getThemeStyle = (isDark: boolean) => {
	return {
		bg: isDark ? colors.berkeleyBlue : '#e2e4e7f6',
		sidebar: isDark ? colors.sidebarNavy : colors.berkeleyBlue,
		cardBg: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.white,
		cardBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
		textMain: isDark ? colors.white : colors.berkeleyBlue,
		textMuted: isDark ? '#94A3B8' : '#64748B',
	};
};
