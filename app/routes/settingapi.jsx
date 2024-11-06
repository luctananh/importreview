import { json, redirect } from "@remix-run/node";
import { prisma } from "../server/db.server";
import { getSession } from "../server/auth.server.js"; // Giả sử bạn có helper để quản lý session

export const action = async ({ request }) => {
  const formData = new URLSearchParams(await request.text());
  const maxReviewCount = formData.get("maxReviewCount");
  const key = formData.get("key");

  console.log("Received data:", { maxReviewCount, key });

  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (!userId) {
    return redirect("/login");
  }

  // Kiểm tra và đảm bảo các giá trị là số hợp lệ
  const maxReviewCountInt = parseInt(maxReviewCount, 10);
  const keyInt = parseInt(key, 10);

  // Kiểm tra nếu giá trị không phải là số hợp lệ
  if (isNaN(maxReviewCountInt) || isNaN(keyInt)) {
    console.error("Invalid maxReviewCount or key:", {
      maxReviewCountInt,
      keyInt,
    });
    return json({ error: "Invalid data received" }, { status: 400 });
  }

  try {
    console.log("Parsed values:", { maxReviewCountInt, keyInt });

    // Cập nhật hoặc tạo mới setting
    await prisma.setting.upsert({
      where: { userId },
      update: { maxReviewCount: maxReviewCountInt, key: keyInt },
      create: { userId, maxReviewCount: maxReviewCountInt, key: keyInt },
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật cài đặt:", error);
    return json({ error: "Failed to update setting" }, { status: 500 });
  }

  return redirect("/setting"); // Chuyển hướng lại trang cài đặt sau khi cập nhật
};
