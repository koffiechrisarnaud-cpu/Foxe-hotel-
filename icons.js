// Icônes des services (dessins simples). Utilisées par l'accueil et l'administration.
window.FOXE_ICONS = {
  wifi:'<path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><path d="M2 9a14 14 0 0 1 20 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/>',
  breakfast:'<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v2M12 3v2"/>',
  ac:'<path d="M12 2v20M4.2 7l15.6 10M4.2 17L19.8 7"/><path d="M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5"/>',
  parking:'<rect x="4" y="3" width="16" height="18" rx="4"/><path d="M10 17V8h3.2a2.6 2.6 0 0 1 0 5.2H10"/>',
  restaurant:'<path d="M3 17h18"/><path d="M5 17a7 7 0 0 1 14 0"/><path d="M12 6V4M10.5 4h3"/><path d="M3 20h18"/>',
  shuttle:'<rect x="4" y="4" width="16" height="13" rx="3"/><path d="M4 11h16"/><circle cx="8" cy="19.5" r="1.5"/><circle cx="16" cy="19.5" r="1.5"/>',
  laundry:'<rect x="4" y="3" width="16" height="18" rx="3"/><circle cx="12" cy="13" r="4"/><path d="M8 6.5h.01M11 6.5h.01"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pool:'<path d="M2 15c2 0 2-1.5 5-1.5S9 15 12 15s2-1.5 5-1.5S19 15 22 15"/><path d="M2 20c2 0 2-1.5 5-1.5S9 20 12 20s2-1.5 5-1.5S19 20 22 20"/><path d="M8 13V5a2 2 0 0 1 4 0M14 13V5a2 2 0 0 1 4 0"/>',
  gym:'<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>',
  spa:'<path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14z"/><path d="M5 19l8-8"/>',
  tv:'<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
  safe:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  car:'<path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>',
  bed:'<path d="M3 18V7M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="1.5"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'
};
window.foxeIcon = function (k) {
  return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (window.FOXE_ICONS[k] || window.FOXE_ICONS.star) + '</svg>';
};
