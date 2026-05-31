import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Permissions() {
  const nav = useNavigate();
  useEffect(() => { nav("/user-management", { replace: true }); }, [nav]);
  return null;
}