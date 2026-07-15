// Full-canvas screen background (burgundy). Every screen uses the centered
// cartridge-card treatment (spec §4) — this centers its children.
export default function Screen({ children, className = '', column = false }) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: 1512,
        height: 982,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: column ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: column ? 26 : 0,
        background: '#2C0F1A',
        fontFamily: "'VT323', monospace",
      }}
    >
      {children}
    </div>
  );
}
