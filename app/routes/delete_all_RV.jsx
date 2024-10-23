// routes/delete_all_reviews.jsx
import { prisma } from "../server/db.server";
import { redirect } from "@remix-run/node";

export const action = async ({ request }) => {
  const formData = await request.formData();
  const productId = formData.get("productId");

  if (!productId) {
    return new Response("Product ID is required", { status: 400 });
  }

  try {
    await prisma.review.deleteMany({
      where: { productId: productId }, // Xóa tất cả review của sản phẩm theo productId
    });
    return redirect("/review_table"); // Redirect đến trang bạn muốn sau khi xóa
  } catch (error) {
    console.error("Error deleting reviews:", error);
    return new Response("Error deleting reviews", { status: 500 });
  }
};
