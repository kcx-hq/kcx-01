type HeaderProps = {
  title: string;
  subtitle?: string;
  onLogout?: () => void;
};

const Header = ({ title, subtitle, onLogout }: HeaderProps) => {
  return (
    <div className="header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <div className="status">{subtitle}</div> : null}
      </div>
      <div className="status">
        KCX Internal{" "}
        {onLogout ? (
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default Header;
