import { redirect } from "@remix-run/node";
import { authenticator } from "../server/auth.server.js";

export const action = async ({ request }) => {
  const auth0Domain = "dev-qoakuhj30oocsvf4.us.auth0.com";
  const clientId = "zirqgvWtSPptB2eAZx2LHKsKc76i2jnV";
  const returnTo = "http://importreview.vercel.app/";

  await authenticator.logout(request, {
    redirectTo: "http://importreview.vercel.app/",
  });

  return redirect(
    `https://${auth0Domain}/v2/logout?client_id=${clientId}&returnTo=${encodeURIComponent(
      returnTo
    )}`
  );
};

export const loader = async () => {
  return redirect("/");
};
