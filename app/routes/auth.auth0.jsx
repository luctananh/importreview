import { authenticator } from "../server/auth.server.js";

export const loader = ({ request }) => {
  const url = new URL(request.url);
  const prompt = url.searchParams.get("prompt");
  return authenticator.authenticate("auth0", request, {
    successRedirect: "https://importify.io/products",
    failureRedirect: "/",
    authParams: {
      prompt: prompt || "login",
    },
  });
};

export const action = ({ request }) => {
  return authenticator.authenticate("auth0", request, {
    successRedirect: "https://importify.io/products",
    failureRedirect: "https://importify.io/loi",
  });
};

export default function Auth0Route() {
  return null;
}
