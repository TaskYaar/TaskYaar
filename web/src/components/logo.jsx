export default function Logo({ size = 48, light = false }) {
  return (
    <span className={`logo ${light ? "logo-light" : ""}`} style={{ fontSize: size }}>
      Task<b>Yaar</b>
    </span>
  );
}
