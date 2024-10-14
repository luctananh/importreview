import { authenticator } from "../server/auth.server.js";

export const loader = ({ request }) => {
  return authenticator.authenticate("auth0", request, {
    successRedirect: "http://localhost:5173/home",
    failureRedirect: "",
  });
};

export default function Auth0CallbackRoute() {
  return null;
}
