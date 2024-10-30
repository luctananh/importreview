// //Quản lý session
// import { createCookieSessionStorage } from "@remix-run/node";

// // Tạo session cookie
// const sessionSecret = process.env.SESSION_SECRET;

// export const { getSession, commitSession, destroySession } =
//   createCookieSessionStorage({
//     cookie: {
//       name: "session",
//       secure: process.env.NODE_ENV === "production",
//       secrets: [sessionSecret],
//       sameSite: "lax",
//       path: "/",
//       httpOnly: true,
//       maxAge: 60 * 60 * 24 * 7, //7 ngày
//     },
//   });

// // Lấy Id người dùng
// export async function getUserFromSession(request) {
//   const session = await getSession(request.headers.get("Cookie"));
//   const userId = session.get("userId");

//   if (!userId) return null;
//   // truy vấn lấy id người dùng
//   const user = await prisma.user.findUnique({ where: { id: userId } });
//   return user;
// }
