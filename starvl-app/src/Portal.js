import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

export default function Portal({ children }) {
  const el = useRef(document.createElement('div'));

  useEffect(() => {
    const container = el.current;
    document.body.appendChild(container);
    return () => document.body.removeChild(container);
  }, []);

  return ReactDOM.createPortal(children, el.current);
}
