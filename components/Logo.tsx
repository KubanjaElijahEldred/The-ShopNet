import Link from "next/link";

type LogoProps = {
  size?: "small" | "medium" | "large";
  linkToHome?: boolean;
};

export function Logo({ size = "medium", linkToHome = true }: LogoProps) {
  const sizeClasses = {
    small: "logo-small",
    medium: "logo-medium",
    large: "logo-large"
  };

  const logoContent = (
    <div className={`shopnet-logo ${sizeClasses[size]}`}>
      <div className="logo-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3 4h2l2.1 10.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.3L21 7H7.2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="20" r="1.4" fill="currentColor" />
          <circle cx="18" cy="20" r="1.4" fill="currentColor" />
        </svg>
      </div>
      <div className="logo-text">
        <span className="logo-brand">ShopNet</span>
        {size !== "small" && (
          <span className="logo-tagline">Social commerce</span>
        )}
      </div>
    </div>
  );

  if (linkToHome) {
    return (
      <Link href="/" className="logo-link">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
