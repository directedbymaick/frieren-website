export function IconSwap({ active, first, second }) {
  return <span className="t-icon-swap" data-state={active ? 'b' : 'a'} aria-hidden="true">
    <span className="t-icon" data-icon="a">{first}</span>
    <span className="t-icon" data-icon="b">{second}</span>
  </span>;
}
