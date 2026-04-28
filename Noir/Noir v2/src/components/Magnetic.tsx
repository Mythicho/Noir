import { useRef, type ReactNode, type CSSProperties } from "react";

type Props = {
  children: ReactNode;
  strength?: number;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "button" | "a";
  href?: string;
  onClick?: () => void;
};

export default function Magnetic({
  children,
  strength = 0.35,
  className = "",
  style,
  as = "div",
  href,
  onClick,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };
  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0,0)";
  };

  const commonProps = {
    ref: ref as React.Ref<any>,
    className: `inline-block transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${className}`,
    style,
    onMouseMove: handleMove,
    onMouseLeave: handleLeave,
    onClick,
  };

  if (as === "a") return <a href={href} {...commonProps}>{children}</a>;
  if (as === "button") return <button {...commonProps}>{children}</button>;
  return <div {...commonProps}>{children}</div>;
}
