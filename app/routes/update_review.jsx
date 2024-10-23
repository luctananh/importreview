import { prisma } from "../server/db.server.js"; // Đảm bảo bạn đã import Prisma Client
import { redirect, json } from "@remix-run/node";

export const action = async ({ request }) => {
  const formData = await request.formData();

  console.log("Received form data:", formData); // Kiểm tra dữ liệu nhận được

  const reviewId = formData.get("reviewId");
  const name = formData.get("name");
  const country = formData.get("country");
  const content = formData.get("content");
  const rating = formData.get("rating");
  const url = formData.get("url");

  // Thực hiện cập nhật review trong cơ sở dữ liệu
  try {
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        productImage: url,
        userName: name,
        userContry: country,
        reviewContent: content,
        rating: rating,
      },
    });
    return json("update thanh cong");
  } catch (error) {
    console.error("Failed to update review:", error);
    return json({ error: "Failed to update review" }, { status: 500 });
  }
};
