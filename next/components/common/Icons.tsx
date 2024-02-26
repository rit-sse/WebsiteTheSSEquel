interface IconProps {
    className?: string;
}

/**
 * Use stroke-* classes to change the color of the icon.
 */
export const SearchIcon = ({ className }: IconProps) => (
    <svg
        className={`stroke-base-content ${className || 'w-5 h-5'}`}
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
        className={`stroke-base-content ${className || 'w-5 h-5'}`}
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
        className={`stroke-base-content ${className || 'w-5 h-5'}`}
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
        className={`stroke-base-content ${className || 'w-5 h-5'}`}
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
        className={`absolute left-[-0.625rem] top-[-0.625rem] text-content stroke-base-100 fill-base-content ${className || 'w-5 h-5'}`}
        xmlns="http://www.w3.org/2000/svg"
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
export const GitHubIcon = ({ className }: IconProps) => (
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
export const LinkedInIcon = ({ className }: IconProps) => (
    <svg
        className={`fill-base-content ${className || 'w-5 h-5'}`}
        viewBox="0 0 48 48"
    >
        <path d="M44.447 0H3.544C1.584 0 0 1.547 0 3.46V44.53C0 46.444 1.584 48 3.544 48h40.903C46.407 48 48 46.444 48 44.54V3.46C48 1.546 46.406 0 44.447 0zM14.24 40.903H7.116V17.991h7.125v22.912zM10.678 14.87a4.127 4.127 0 01-4.134-4.125 4.127 4.127 0 014.134-4.125 4.125 4.125 0 010 8.25zm30.225 26.034h-7.115V29.766c0-2.653-.047-6.075-3.704-6.075-3.703 0-4.265 2.896-4.265 5.887v11.325h-7.107V17.991h6.826v3.13h.093c.947-1.8 3.272-3.702 6.731-3.702 7.21 0 8.541 4.744 8.541 10.912v12.572z" />
    </svg>
);

export const GoLinkIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
);

export const GoLinkStar = () => (
    <svg
        className="me-2 flex-shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        width="22.04825"
        height="20.2"
        viewBox="0,0,42.04825,40.2">
        <g transform="translate(-218.96759,-158.9)">
            <g data-paper-data="{&quot;isPaintingLayer&quot;:true}" fill="#f5b700" fillRule="nonzero" stroke="none" strokeWidth="1" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="10" strokeDasharray="" strokeDashoffset="0" style={{mixBlendMode: "normal"}}>
                <path d="M260.2,176.7l-8.2,8l1.8,11.3c0.2,1 -0.2,2 -1,2.6c-0.4,0.3 -1,0.5 -1.5,0.5c-0.4,0 -0.8,-0.1 -1.2,-0.3l-10.1,-5.3l-10.2,5.3c-0.4,0.2 -0.8,0.3 -1.2,0.3c-0.5,0 -1,-0.2 -1.5,-0.5c-0.8,-0.6 -1.2,-1.6 -1,-2.6l1.9,-11.2l-8.2,-8c-0.8,-0.7 -1,-1.7 -0.7,-2.7c0.3,-1 1.1,-1.7 2.1,-1.8l11.3,-1.6l5.1,-10.3c0.5,-0.9 1.4,-1.5 2.4,-1.5c1,0 2,0.6 2.4,1.5l5.1,10.3l11.3,1.6c1,0.2 1.8,0.8 2.1,1.8c0.3,0.9 0,2 -0.7,2.6z" />
            </g>
        </g>
    </svg>

)

export const GoLinkEdit = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24" 
        fill="none"
        stroke="currentColor"
        className="w-6 h-6">
        <path d="M21.2799 6.40005L11.7399 15.94C10.7899 16.89 7.96987 17.33 7.33987 16.7C6.70987 16.07 7.13987 13.25 8.08987 12.3L17.6399 2.75002C17.8754 2.49308 18.1605 2.28654 18.4781 2.14284C18.7956 1.99914 19.139 1.92124 19.4875 1.9139C19.8359 1.90657 20.1823 1.96991 20.5056 2.10012C20.8289 2.23033 21.1225 2.42473 21.3686 2.67153C21.6147 2.91833 21.8083 3.21243 21.9376 3.53609C22.0669 3.85976 22.1294 4.20626 22.1211 4.55471C22.1128 4.90316 22.0339 5.24635 21.8894 5.5635C21.7448 5.88065 21.5375 6.16524 21.2799 6.40005V6.40005Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M11 4H6C4.93913 4 3.92178 4.42142 3.17163 5.17157C2.42149 5.92172 2 6.93913 2 8V18C2 19.0609 2.42149 20.0783 3.17163 20.8284C3.92178 21.5786 4.93913 22 6 22H17C19.21 22 20 20.2 20 18V13" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
)

export const GoLinkDelete = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-6 h-6">
        <path d="M10 11V17" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 11V17" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 7H20" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 7H12H18V18C18 19.6569 16.6569 21 15 21H9C7.34315 21 6 19.6569 6 18V7Z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
)

/**
 * Use fill-* classes to change the color of the icon.
 */
export const EmailIcon = ({ className }: IconProps) => (
    <svg className={`fill-base-content ${className || 'w-8 h-8'}`}
        viewBox="0 0 24 24"
    >
        <path d="M20 8l-8 5-8-5V6l8 5 8-5m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" />
    </svg>
);

/**
 * Use fill-* classes to change the color of the icon.
 */
export const SlackIcon = ({ className }: IconProps) => (
    <svg className={`fill-base-content ${className || 'w-8 h-8'}`}
        xmlns="http://www.w3.org/2000/svg" viewBox="0,0,256,256">
        <g transform="translate(12.8,12.8) scale(0.9,0.9)"><g transform="scale(5.12,5.12)"><path d="M31,24c-2.757,0 -5,-2.243 -5,-5v-12c0,-2.757 2.243,-5 5,-5c2.757,0 5,2.243 5,5v12c0,2.757 -2.243,5 -5,5zM43,24h-4c-0.553,0 -1,-0.447 -1,-1v-4c0,-2.757 2.243,-5 5,-5c2.757,0 5,2.243 5,5c0,2.757 -2.243,5 -5,5zM19,24h-12c-2.757,0 -5,-2.243 -5,-5c0,-2.757 2.243,-5 5,-5h12c2.757,0 5,2.243 5,5c0,2.757 -2.243,5 -5,5zM23,12h-4c-2.757,0 -5,-2.243 -5,-5c0,-2.757 2.243,-5 5,-5c2.757,0 5,2.243 5,5v4c0,0.553 -0.447,1 -1,1zM19,48c-2.757,0 -5,-2.243 -5,-5v-12c0,-2.757 2.243,-5 5,-5c2.757,0 5,2.243 5,5v12c0,2.757 -2.243,5 -5,5zM7,36c-2.757,0 -5,-2.243 -5,-5c0,-2.757 2.243,-5 5,-5h4c0.553,0 1,0.447 1,1v4c0,2.757 -2.243,5 -5,5zM43,36h-12c-2.757,0 -5,-2.243 -5,-5c0,-2.757 2.243,-5 5,-5h12c2.757,0 5,2.243 5,5c0,2.757 -2.243,5 -5,5zM31,48c-2.757,0 -5,-2.243 -5,-5v-4c0,-0.553 0.447,-1 1,-1h4c2.757,0 5,2.243 5,5c0,2.757 -2.243,5 -5,5z"></path></g></g>
    </svg>
);

/**
 * Use fill-* classes to change the color of the icon.
 */
export const InstagramIcon = ({ className }: IconProps) => (
    <svg className={`fill-base-content ${className || 'w-8 h-8'}`}
        xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0,0,256,256">
        <g transform="translate(-25.6,-25.6) scale(1.2,1.2)"><g fillRule="nonzero" stroke="none" strokeWidth="1" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="10" strokeDasharray="" strokeDashoffset="0" fontFamily="none" fontWeight="none" fontSize="none" textAnchor="none"><g transform="scale(8,8)"><path d="M11.46875,5c-3.55078,0 -6.46875,2.91406 -6.46875,6.46875v9.0625c0,3.55078 2.91406,6.46875 6.46875,6.46875h9.0625c3.55078,0 6.46875,-2.91406 6.46875,-6.46875v-9.0625c0,-3.55078 -2.91406,-6.46875 -6.46875,-6.46875zM11.46875,7h9.0625c2.47266,0 4.46875,1.99609 4.46875,4.46875v9.0625c0,2.47266 -1.99609,4.46875 -4.46875,4.46875h-9.0625c-2.47266,0 -4.46875,-1.99609 -4.46875,-4.46875v-9.0625c0,-2.47266 1.99609,-4.46875 4.46875,-4.46875zM21.90625,9.1875c-0.50391,0 -0.90625,0.40234 -0.90625,0.90625c0,0.50391 0.40234,0.90625 0.90625,0.90625c0.50391,0 0.90625,-0.40234 0.90625,-0.90625c0,-0.50391 -0.40234,-0.90625 -0.90625,-0.90625zM16,10c-3.30078,0 -6,2.69922 -6,6c0,3.30078 2.69922,6 6,6c3.30078,0 6,-2.69922 6,-6c0,-3.30078 -2.69922,-6 -6,-6zM16,12c2.22266,0 4,1.77734 4,4c0,2.22266 -1.77734,4 -4,4c-2.22266,0 -4,-1.77734 -4,-4c0,-2.22266 1.77734,-4 4,-4z"></path></g></g></g>
    </svg>
);

/**
 * Use fill-* classes to change the color of the icon.
 */
export const DiscordIcon = ({ className }: IconProps) => (
    <svg className={`fill-base-content ${className || 'w-8 h-8'}`}
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 23" version="1.1">
        <path className="" d="M 24.550781 2.046875 C 22.703125 1.179688 20.71875 0.539062 18.648438 0.171875 C 18.609375 0.167969 18.570312 0.183594 18.550781 0.21875 C 18.296875 0.683594 18.015625 1.289062 17.816406 1.765625 C 15.589844 1.421875 13.371094 1.421875 11.1875 1.765625 C 10.988281 1.277344 10.695312 0.683594 10.441406 0.21875 C 10.421875 0.183594 10.382812 0.167969 10.347656 0.171875 C 8.273438 0.539062 6.292969 1.179688 4.441406 2.046875 C 4.425781 2.054688 4.414062 2.066406 4.402344 2.082031 C 0.644531 7.832031 -0.386719 13.441406 0.121094 18.980469 C 0.121094 19.007812 0.136719 19.035156 0.15625 19.050781 C 2.636719 20.917969 5.039062 22.046875 7.398438 22.800781 C 7.4375 22.8125 7.476562 22.796875 7.5 22.765625 C 8.058594 21.984375 8.554688 21.164062 8.980469 20.296875 C 9.007812 20.246094 8.984375 20.1875 8.933594 20.167969 C 8.144531 19.859375 7.390625 19.488281 6.667969 19.0625 C 6.613281 19.027344 6.609375 18.945312 6.660156 18.90625 C 6.8125 18.789062 6.964844 18.667969 7.109375 18.542969 C 7.136719 18.523438 7.171875 18.519531 7.203125 18.53125 C 11.949219 20.75 17.085938 20.75 21.777344 18.53125 C 21.808594 18.515625 21.84375 18.519531 21.871094 18.542969 C 22.019531 18.667969 22.167969 18.789062 22.324219 18.90625 C 22.375 18.945312 22.371094 19.027344 22.316406 19.0625 C 21.59375 19.496094 20.839844 19.859375 20.050781 20.164062 C 20 20.1875 19.976562 20.246094 20.003906 20.296875 C 20.4375 21.160156 20.933594 21.984375 21.484375 22.765625 C 21.503906 22.796875 21.546875 22.8125 21.585938 22.800781 C 23.953125 22.046875 26.355469 20.917969 28.835938 19.050781 C 28.859375 19.035156 28.871094 19.011719 28.875 18.984375 C 29.480469 12.578125 27.863281 7.015625 24.585938 2.082031 C 24.578125 2.066406 24.566406 2.054688 24.550781 2.046875 Z M 9.691406 15.609375 C 8.261719 15.609375 7.085938 14.265625 7.085938 12.617188 C 7.085938 10.96875 8.238281 9.625 9.691406 9.625 C 11.152344 9.625 12.320312 10.980469 12.296875 12.617188 C 12.296875 14.265625 11.140625 15.609375 9.691406 15.609375 Z M 19.328125 15.609375 C 17.898438 15.609375 16.722656 14.265625 16.722656 12.617188 C 16.722656 10.96875 17.875 9.625 19.328125 9.625 C 20.789062 9.625 21.957031 10.980469 21.933594 12.617188 C 21.933594 14.265625 20.789062 15.609375 19.328125 15.609375 Z M 19.328125 15.609375 "></path>
    </svg>
);

/**
 * Use fill-* classes to change the color of the icon.
 */
export const TikTokIcon = ({ className }: IconProps) => (
    <svg className={`fill-base-content ${className || 'w-8 h-8'}`}
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
        <path d="M41,4H9C6.243,4,4,6.243,4,9v32c0,2.757,2.243,5,5,5h32c2.757,0,5-2.243,5-5V9C46,6.243,43.757,4,41,4z M37.006,22.323 c-0.227,0.021-0.457,0.035-0.69,0.035c-2.623,0-4.928-1.349-6.269-3.388c0,5.349,0,11.435,0,11.537c0,4.709-3.818,8.527-8.527,8.527 s-8.527-3.818-8.527-8.527s3.818-8.527,8.527-8.527c0.178,0,0.352,0.016,0.527,0.027v4.202c-0.175-0.021-0.347-0.053-0.527-0.053 c-2.404,0-4.352,1.948-4.352,4.352s1.948,4.352,4.352,4.352s4.527-1.894,4.527-4.298c0-0.095,0.042-19.594,0.042-19.594h4.016 c0.378,3.591,3.277,6.425,6.901,6.685V22.323z"></path>
    </svg>
);

/**
 * Use fill-* classes to change the color of the icon.
 */
export const TwitchIcon = ({ className }: IconProps) => (
    <svg className={`fill-base-content ${className || 'w-8 h-8'}`}
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M 5.3632812 2 L 2 6.6367188 L 2 20 L 7 20 L 7 23 L 10 23 L 13 20 L 17 20 L 22 15 L 22 2 L 5.3632812 2 z M 6 4 L 20 4 L 20 13 L 17 16 L 12 16 L 9 19 L 9 16 L 6 16 L 6 4 z M 11 7 L 11 12 L 13 12 L 13 7 L 11 7 z M 16 7 L 16 12 L 18 12 L 18 7 L 16 7 z"></path>
    </svg>
);
