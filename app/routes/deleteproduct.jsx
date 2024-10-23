import { prisma } from "../server/db.server";
import { redirect } from "@remix-run/node";

export const action = async ({ formData }) => {
  const productId = formData.get("productId");

  if (!productId) {
    return new Response("Product ID is required", { status: 400 });
  }

  try {
    await prisma.product.delete({
      where: { id: productId },
    });
    return redirect("/products"); // Điều hướng lại về trang Home sau khi xóa
  } catch (error) {
    console.error("Error deleting product:", error);
    return new Response("Error deleting product", { status: 500 });
  }
};
