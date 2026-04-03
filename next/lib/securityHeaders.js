const COMMON_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

function getS3Origins() {
  const bucketName =
    process.env.AWS_S3_BUCKET_NAME || process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME;
  const region =
    process.env.AWS_S3_REGION || process.env.NEXT_PUBLIC_AWS_S3_REGION;

  const origins = new Set([
    "https://*.s3.amazonaws.com",
    "https://*.amazonaws.com",
  ]);

  if (bucketName && region) {
    origins.add(`https://${bucketName}.s3.${region}.amazonaws.com`);
  }

  return Array.from(origins);
}

function buildContentSecurityPolicy({ production, nonce } = {}) {
  const scriptSrc = ["'self'"];
  const s3Origins = getS3Origins();
  if (nonce) {
    scriptSrc.push(`'nonce-${nonce}'`, "'strict-dynamic'");
  }

  const directives = [
    ["default-src", ["'self'"]],
    ["script-src", scriptSrc],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    [
      "img-src",
      [
        "'self'",
        "data:",
        "blob:",
        "https://lh3.googleusercontent.com",
        ...s3Origins,
        "https://source.boringavatars.com",
        "https://dummyimage.com",
        "https://drive.google.com",
        "https://avatars.githubusercontent.com",
      ],
    ],
    ["font-src", ["'self'", "data:"]],
    [
      "connect-src",
      production
        ? ["'self'", "https://api.github.com", ...s3Origins]
        : ["'self'", "https://api.github.com", ...s3Origins, "ws:", "wss:"],
    ],
    ["frame-src", ["https://calendar.google.com"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
    ["upgrade-insecure-requests", []],
  ];

  return directives
    .map(([directive, values]) =>
      values.length > 0 ? `${directive} ${values.join(" ")}` : directive
    )
    .join("; ");
}

function getSecurityHeaders({
  nodeEnv = process.env.NODE_ENV,
  deploymentEnv = process.env.NEXT_PUBLIC_ENV,
  includeCsp = true,
  nonce,
} = {}) {
  const runtimeProduction = nodeEnv === "production";
  // The development deployment runs a production build, so header enforcement
  // must key off the deployment target rather than NODE_ENV alone.
  const enforceCsp = deploymentEnv === "prod";
  const headers = [...COMMON_HEADERS];

  if (includeCsp) {
    headers.push({
      key: enforceCsp
        ? "Content-Security-Policy"
        : "Content-Security-Policy-Report-Only",
      value: buildContentSecurityPolicy({
        production: runtimeProduction,
        nonce,
      }),
    });
  }

  if (enforceCsp) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }

  return headers;
}

module.exports = {
  buildContentSecurityPolicy,
  getSecurityHeaders,
};
