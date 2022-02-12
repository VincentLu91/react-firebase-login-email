import { useEffect } from "react";

const AuthComponent = ({ children }) => {
  useEffect(() => {}, []);
  return <div>{children}</div>;
};
export default AuthComponent;
