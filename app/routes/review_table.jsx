import React from "react";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { prisma } from "../server/db.server";
import "../styles/review_table.css";
import { getSession } from "../server/session.server";
import { Tooltip } from "@nextui-org/react";
import { DeleteIcon } from "../layouts/DeleteIcon.jsx";
import { EditIcon } from "../layouts/EditIcon .jsx";
import {
  Modal,
  Pagination,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Button,
} from "@nextui-org/react";
import { Link, Form } from "@remix-run/react";
import { Toaster, toast } from "sonner";
// Lấy tất cả review từ cơ sở dữ liệu
export const loader = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (!userId) {
    return redirect("/login");
  }

  const products = await prisma.product.findMany({
    where: { userId },
    include: {
      reviews: true,
    },
  });

  if (products.length === 0) {
    return redirect("/create-product");
  }

  return json({ products });
};

export default function ReviewTable({ products }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  return (
    <div className="table-container2">
      <table>
        <thead>
          <tr>
            <th>Image</th>
            <th>User Name</th>
            <th>Country</th>
            <th>Review Content</th>
            <th>Rating</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <React.Fragment key={product.id}>
              {product.reviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <img src={review.productImage} alt={product.name} />
                  </td>
                  <td>{review.userName}</td>
                  <td>{review.userContry}</td>
                  <td>{review.reviewContent}</td>
                  <td>{review.rating}</td>
                  <td>
                    <Tooltip content="Edit review">
                      <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                        <Link
                          to={`/edit_review?reviewId=${review.id}&name=${review.userName}&country=${review.userContry}&content=${review.reviewContent}&rating=${review.rating}`}
                        >
                          <EditIcon />
                        </Link>
                      </span>
                    </Tooltip>
                  </td>
                  <td>
                    <Form method="post" action="/delete_review">
                      <input type="hidden" name="reviewId" value={review.id} />
                      <Button
                        size="sm"
                        color="danger"
                        variant="bordered"
                        type="submit"
                        onClick={() => toast.success("Delete successful")}
                      >
                        Delete
                      </Button>
                    </Form>
                  </td>
                </tr>
              ))}
              {/* Chỉ hiển thị nút "Delete All Reviews" nếu còn review */}
              {product.reviews.length > 0 && (
                <tr>
                  <span className="nameproduct">{product.name}</span>
                  <td colSpan="7" style={{ textAlign: "right" }}>
                    <Form method="post" action="/delete_all_RV">
                      <input
                        type="hidden"
                        name="productId"
                        value={product.id}
                      />
                      <Button
                        size="sm"
                        color="danger"
                        onClick={() => toast.success("Delete all successfully")}
                        variant="bordered"
                        type="submit"
                      >
                        Delete All Reviews
                      </Button>
                    </Form>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div>
        <Pagination total={10} initialPage={1} />
      </div>
    </div>
  );
}
