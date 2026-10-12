import { useEffect, useState } from "react";
import { isNativeApp } from "./platform";

// The left sidebar is for a computer's browser only. Phones and iPads (website or app)
// keep the layout they had: header on top, bigger cards on a wide iPad.
const QUERY = "(min-width: 768px) and (min-height: 600px) and (hover: hover) and (pointer: fine)";
const get = () => !isNativeApp() && typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(QUERY).matches;

export function useSidebar() {
  const [on, setOn] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(QUERY);
    const f = () => setOn(get());
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  return on;
}
