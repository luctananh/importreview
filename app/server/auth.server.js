import { createCookieSessionStorage } from "@remix-run/node";
import { Authenticator } from "remix-auth";
import { Auth0Strategy } from "remix-auth-auth0";

// Tạo session storage
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_auth_session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: ["ZySbrdFDYXG2o/a6XG+XaTQp7fSoKsbGBnTcXkQ7Uzc="],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, //7 ngày
  },
});
export const { getSession, commitSession, destroySession } = sessionStorage;

// Tạo authenticator
export const authenticator = new Authenticator(sessionStorage);

// Cấu hình Auth0 strategy https://importify.io/auth/auth0/callback
const auth0Strategy = new Auth0Strategy(
  {
    callbackURL: process.env.AUTH0_CALLBACK_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    domain: process.env.AUTH0_DOMAIN,
  },
  async ({ accessToken, refreshToken, extraParams, profile }) => {
    // Trả về user profile hoặc tạo user trong database của bạn
    return profile;
  }
);

authenticator.use(auth0Strategy);

export const logout = async (request) => {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  return redirect("/_index", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
};

// AUTH0_RETURN_TO_URL=http://localhost:5173
// AUTH0_CALLBACK_URL=http://localhost:5173
// AUTH0_CLIENT_ID= UpT0esnQTQjHDg2wBr4MMBQexfZvsFs2
// AUTH0_CLIENT_SECRET=TRtNxvwmRbwV1dwhl7sK7C-x2QrFYbl36cQQxpQA8kASU6TgjAGEzVe8pI2l5pQV
// AUTH0_DOMAIN=dev-c841kfnfmsjcrhcr.us.auth0.com
// AUTH0_LOGOUT_URL=http://localhost:5173
// SECRETS=ZySbrdFDYXG2o/a6XG+XaTQp7fSoKsbGBnTcXkQ7Uzc=
