import { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [above, setAbove] = useState(true);
  const [alignRight, setAlignRight] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setAbove(rect.top > 60);
      setAlignRight(rect.left + rect.width / 2 < 140);
    }
  }, [visible]);

  return (
    <div
      className="tooltip-wrapper"
      ref={wrapperRef}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className={`tooltip-box ${above ? 'above' : 'below'} ${alignRight ? 'align-right' : ''}`}>
          {text}
        </div>
      )}
    </div>
  );
}
