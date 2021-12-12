import { createCtx } from "./context/ContextFactory";

//const [active,setActive]=useState(value)
const [ctx, Provider] = createCtx({
  user: null,
  balance: 0,
});

export const UserContext = ctx;

export const UserProvider = Provider;
