import { authenticator } from "../server/auth.server.js";

export const loader = ({ request }) => {
  return authenticator.authenticate("auth0", request, {
    successRedirect: "",
    failureRedirect: "",
  });
};

export const action = ({ request }) => {
  return authenticator.authenticate("auth0", request, {
    successRedirect: "https://importify.io/home",
    failureRedirect: "https://importify.io/loi",
  });
};

export default function Auth0Route() {
  return null;
}
