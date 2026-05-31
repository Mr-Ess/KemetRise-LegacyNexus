import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Help() {
  const nav = useNavigate();
  useEffect(() => { nav("/settings?section=notifications", { replace: true }); }, [nav]);
  return null;
}