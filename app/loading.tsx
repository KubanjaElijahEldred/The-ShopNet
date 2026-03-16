export default function Loading() {
  return (
    <div className="app-splash show" aria-live="polite" aria-busy="true">
      <div className="app-splash-stack">
        <img src="/image.png" alt="ShopNet loading" className="app-splash-image" />
        <div className="app-splash-powered">
          <img
            src="/imagecopy6.png"
            alt="K.E.E Tech Solutions icon"
            className="app-splash-powered-icon"
          />
          <p>
            Powered by <strong>K.E.E Tech Solutions</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
