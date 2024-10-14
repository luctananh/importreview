import { authenticator } from "../server/auth.server.js";

export const loader = ({ request }) => {
  return authenticator.authenticate("auth0", request, {
    successRedirect: "http://importify.io/Home",
    failureRedirect: "http://importify.io/loi",
  });
};

export default function Auth0CallbackRoute() {
  return null;
}
