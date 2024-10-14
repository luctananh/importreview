import { authenticator } from "../server/auth.server.js";

export const loader = ({ request }) => {
  return authenticator.authenticate("auth0", request, {
    successRedirect: "",
    failureRedirect: "",
  });
};

export const action = ({ request }) => {
  return authenticator.authenticate("auth0", request, {
    successRedirect: "http://localhost:5173/home",
    failureRedirect: "http://localhost:5173/loi",
  });
};

export default function Auth0Route() {
  return null;
}
