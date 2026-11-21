import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

export const WhatsAppIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    {/* Outlined speech bubble + handset (filled bubble would hide the handset). */}
    <path
      fillRule="evenodd"
      d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 1 1-4.2 15.2l-.3-.2-2.9.8.8-2.8-.2-.3A8.2 8.2 0 0 1 12 3.8z"
    />
    <path d="M17.5 14.4c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.8.9-1 1.1-.2.2-.4.2-.7.1-1.7-.9-2.9-1.6-4-3.6-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5 4.5 1.9.8 2.6.9 3.5.8.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.4z" />
  </svg>
);

export const SendIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
  </svg>
);

export const MicIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3z" />
    <path d="M19 12a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V24h2v-3.06A9 9 0 0 0 21 12h-2z" />
  </svg>
);

export const AttachIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

export const EmojiIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
    <line x1="9" y1="9" x2="9.01" y2="9" strokeLinecap="round" />
    <line x1="15" y1="9" x2="15.01" y2="9" strokeLinecap="round" />
  </svg>
);

export const CameraIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export const PhoneIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.5-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" />
  </svg>
);

export const BackIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

export const PlayIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8 5v14l11-7z" /></svg>
);

export const PauseIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
);

export const CheckDouble = (p: P) => (
  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M1 9l3.5 3.5L11 6" />
    <path d="M7 12l1 1 6.5-7" />
  </svg>
);

export const DownloadIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

export const FileIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);

export const TelegramIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M21.9 4.3l-3.2 15.1c-.2 1.1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.2-8.3c.4-.4-.1-.6-.6-.2L6.2 13.1l-4.9-1.5c-1.1-.3-1.1-1.1.2-1.6l19.1-7.4c.9-.3 1.7.2 1.3 1.7z" />
  </svg>
);

export const InstagramIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </svg>
);

export const GlobeIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const ChevronRightIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export const ChatBubbleIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.6 1.3 4.9 3.4 6.5L4.6 22l4.2-2.2c1 .3 2.1.4 3.2.4 5.5 0 10-3.9 10-8.6S17.5 3 12 3zm-4 10a1.3 1.3 0 1 1 0-2.6A1.3 1.3 0 0 1 8 13zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6z" />
  </svg>
);

export const CheckCircleIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.4 14.2l-4.2-4.2 1.4-1.4 2.8 2.8 5.8-5.8 1.4 1.4-7.2 7.2z" />
  </svg>
);

export const ShareIOSIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
  </svg>
);

export const PlusSquareIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

export const MoreVerticalIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

export const MicOffIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M1 1l22 22M9 9v3a3 3 0 0 0 5.1 2.1M15 9.3V5a3 3 0 0 0-5.9-.6" />
    <path d="M17 16.9A7 7 0 0 1 5 12M19 12a7 7 0 0 1-.1 1.2M12 19v4" />
  </svg>
);

export const SpeakerIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M11 5L6 9H2v6h4l5 4z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
  </svg>
);

export const HangUpIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 9c-1.6 0-3.2.3-4.6.7v3.1c0 .4-.2.7-.6.9-1 .5-1.9 1.1-2.6 1.8-.2.2-.4.3-.7.3s-.5-.1-.7-.3L.3 13.1A1 1 0 0 1 0 12.4c0-.3.1-.5.3-.7C3.3 8.8 7.5 7 12 7s8.7 1.8 11.7 4.7c.2.2.3.4.3.7s-.1.5-.3.7l-2.5 2.5c-.2.2-.4.3-.7.3s-.5-.1-.7-.3c-.8-.7-1.7-1.3-2.6-1.8-.3-.2-.6-.5-.6-.9V9.7C15.2 9.3 13.6 9 12 9z" />
  </svg>
);

export const SearchIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </svg>
);

export const ChatsIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 1-2zm3 5v2h10V8H7zm0 4v2h7v-2H7z" />
  </svg>
);

export const StatusIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
    <path d="M12 3a9 9 0 0 1 0 18" />
    <path d="M12 21a9 9 0 0 1-8.5-6M3.5 9A9 9 0 0 1 8 4" strokeDasharray="0.1 4.2" />
  </svg>
);

export const SettingsIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.6 7.6 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.6 7.6 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.6 7.6 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)" />
  </svg>
);

export const UserIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <circle cx="12" cy="8.5" r="4.5" />
    <path d="M3.5 21a8.5 8.5 0 0 1 17 0z" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const DocIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V9h5.5z" />
  </svg>
);

export const PaperclipIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M16.5 6.5l-7.8 7.8a2 2 0 0 0 2.8 2.8l8.2-8.2a4 4 0 0 0-5.7-5.7L5.8 11.4a6 6 0 0 0 8.5 8.5L20 14.2" />
  </svg>
);

export const SmileIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 14.5a5 5 0 0 0 8 0" />
    <path d="M9 9.5h.01M15 9.5h.01" strokeWidth="3" />
  </svg>
);
