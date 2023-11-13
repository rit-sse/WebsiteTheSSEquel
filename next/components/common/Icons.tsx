interface IconProps {
    className?: string;
}

/**
 * Use stroke-* classes to change the color of the icon.
 */
export const SearchIcon = ({ className }: IconProps) => (
    <svg
        className={`w-5 h-5 stroke-base-content ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
);

/**
 * Use stroke-* classes to change the color of the icon.
 */
export const ClearIcon = ({ className }: IconProps) => (
    <svg
        className={`w-5 h-5 stroke-base-content ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
);

/**
 * Use stroke-* classes to change the color of the icon.
 */
export const DiceIcon = ({ className }: IconProps) => (
    <svg
        className={`w-5 h-5 stroke-base-content ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect width="12" height="12" x="2" y="10" rx="2" ry="2" />
        <path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" />
        <path d="M6 18h.01" />
        <path d="M10 14h.01" />
        <path d="M15 6h.01" />
        <path d="M18 9h.01" />
    </svg>
);

/**
 * Use stroke-* classes to change the color of the icon.
 */
export const ExternalLinkIcon = ({ className }: IconProps) => (
    <svg
        className={`w-5 h-5 stroke-base-content ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
);


/**
 * Use stroke-* classes to change the border color of the icon.
 * Use fill-* classes to change the fill color of the icon.
 */
export const StarIcon = ({ className }: IconProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`w-5 h-5 absolute left-[-0.625rem] top-[-0.625rem] text-content stroke-base-100 fill-base-content ${className}`}
        viewBox="0 0 24 24"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

/**
 * Use fill-* classes to change the color of the icon.
 */
export const GitHub = ({ className }: IconProps) => (
    <svg
        className={`w-5 h-5 fill-base-content ${className}`}
        aria-hidden="true"
        viewBox="0 0 16 16"
        data-view-component="true"
    >
        <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
);

/**
 * Use fill-* classes to change the color of the icon.
 */
export const LinkedIn = ({ className }: IconProps) => (
    <svg
        className={`w-5 h-5 fill-base-content ${className}`}
        viewBox="0 0 48 48"
    >
        <path d="M44.447 0H3.544C1.584 0 0 1.547 0 3.46V44.53C0 46.444 1.584 48 3.544 48h40.903C46.407 48 48 46.444 48 44.54V3.46C48 1.546 46.406 0 44.447 0zM14.24 40.903H7.116V17.991h7.125v22.912zM10.678 14.87a4.127 4.127 0 01-4.134-4.125 4.127 4.127 0 014.134-4.125 4.125 4.125 0 010 8.25zm30.225 26.034h-7.115V29.766c0-2.653-.047-6.075-3.704-6.075-3.703 0-4.265 2.896-4.265 5.887v11.325h-7.107V17.991h6.826v3.13h.093c.947-1.8 3.272-3.702 6.731-3.702 7.21 0 8.541 4.744 8.541 10.912v12.572z" />
    </svg>
);

/**
 * Use fill-* classes to change the color of the icon.
 */
export const Email = ({ className }: IconProps) => (
    <svg
        viewBox="0 0 24 24"
        className={`w-5 h-5 fill-base-content ${className}`}
    >
        <path d="M20 8l-8 5-8-5V6l8 5 8-5m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" />
    </svg>
);