import React, { useState, useEffect } from "react";
import { Button, Input } from "@nextui-org/react";
import { useLoaderData, Form, useFetcher, Link } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { prisma } from "../server/db.server";
import { getSession } from "../server/session.server";
import "../styles/product.css";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import { Toaster, toast } from "sonner";

// Lấy danh sách sản phẩm từ cơ sở dữ liệu cho người dùng hiện tại
export const loader = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (!userId) {
    return redirect("/login");
  }

  const products = await prisma.product.findMany({
    where: { userId },
    include: {
      reviews: true, // Bao gồm các review để tính số lượng
    },
  });

  if (products.length === 0) {
    return redirect("/create-product");
  }
  const productsWithReviewCount = products.map((product) => ({
    ...product,
    reviewCount: product.reviews.length, // Đếm số lượng review
  }));

  return json({ products: productsWithReviewCount });
};

export default function ProductTable() {
  const { products } = useLoaderData();
  const fetcher = useFetcher();
  const [selectedProduct, setSelectedProduct] = useState(null); // State cho sản phẩm được chọn
  const [productURL, setProductURL] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // Tạo state cho chuỗi tìm kiếm
  const [filteredProducts, setFilteredProducts] = useState(products);

  /* add websocket*/
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // Establish WebSocket connection
    const socket = new WebSocket("ws://localhost:3000");

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "new_review") {
        // Update the review count for the specific product
        setFilteredProducts((prevProducts) =>
          prevProducts.map((product) =>
            product.id === message.productId
              ? { ...product, reviewCount: product.reviewCount + 1 }
              : product
          )
        );
      }
    };

    socket.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);
  /* End*/
  const handleURLChange = (e) => {
    setProductURL(e.target.value);
  };

  // Cập nhật danh sách sản phẩm đã lọc khi searchTerm thay đổi
  useEffect(() => {
    setFilteredProducts(
      products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, products]);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  //delete_product
  // Hàm kiểm tra và xóa sản phẩm
  const handleDelete = (product) => {
    // Kiểm tra số lượng review của sản phẩm cụ thể
    if (product.reviewCount === 0) {
      // Nếu reviewCount bằng 0, hiển thị thông báo xóa thành công
      toast.success("Delete successful");
      // Thực hiện logic xóa ở đây nếu cần
    } else {
      // Nếu reviewCount khác 0, hiển thị thông báo xóa thất bại
      toast.error(
        "Delete failed: There are reviews associated with this product."
      );
    }
  };

  return (
    <>
      <div className="table-container">
        <div className="search_card">
          <Input
            size="sm"
            type="search"
            label="Seaching in name.."
            value={searchTerm} // Gắn giá trị input với searchTerm
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <img src="./search.svg" alt="search_button" />
          <Link to="/Insert_product">
            <img src="./plus.svg" alt="add_button" />
          </Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Reviews</th>
              <th>Import & Export</th>
              <th> </th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  <img src={product.url} alt={product.name} />
                </td>
                <td>{product.name}</td>
                <td>{product.reviewCount}</td>
                <td>
                  <div className="card_button">
                    <Button
                      size="sm"
                      onPress={() => {
                        setSelectedProduct(product); // Cập nhật sản phẩm được chọn
                        setProductURL(""); // Reset URL khi mở modal
                        onOpen(); // Mở modal
                      }}
                    >
                      Import reviews
                    </Button>
                    <Modal
                      isOpen={isOpen}
                      size="3xl"
                      onOpenChange={() => {
                        onOpenChange();
                        setProductURL(""); // Reset URL khi modal đóng
                        setSelectedProduct(null); // Reset sản phẩm được chọn
                      }}
                    >
                      <ModalContent>
                        {(onClose) => (
                          <>
                            <ModalHeader className="flex flex-col gap-1">
                              Import reviews for {selectedProduct?.name}
                            </ModalHeader>
                            <ModalBody className="Modalbody">
                              <input
                                type="text"
                                value={productURL}
                                onChange={handleURLChange}
                                placeholder="Enter URL product"
                              />
                              <input
                                type="hidden"
                                name="_actionType"
                                defaultValue="URLproduct"
                              />
                            </ModalBody>
                            <ModalFooter>
                              <Button
                                color="danger"
                                variant="light"
                                onPress={onClose}
                              >
                                Close
                              </Button>
                              <fetcher.Form
                                method="post"
                                action="/import_review"
                              >
                                <input
                                  type="hidden"
                                  name="productURL"
                                  value={productURL}
                                />
                                <input
                                  type="hidden"
                                  name="productId"
                                  value={selectedProduct?.id} // Sử dụng id của sản phẩm đã chọn
                                />
                                <Button
                                  type="submit"
                                  onClick={() =>
                                    toast.success("Import reviews successfully")
                                  }
                                  color="primary"
                                >
                                  Import
                                </Button>
                              </fetcher.Form>
                            </ModalFooter>
                          </>
                        )}
                      </ModalContent>
                    </Modal>
                    <Button
                      size="sm"
                      to={`/DownloandCSV?productId=${product.id}`}
                      as={Link}
                      variant="bordered"
                    >
                      Download Reviews
                    </Button>
                  </div>
                </td>

                <td>
                  <Form method="post" action="/Home">
                    <input type="hidden" name="productId" value={product.id} />
                    <input
                      type="hidden"
                      name="_actionType"
                      defaultValue="Delete_product"
                    />
                    <Button
                      size="sm"
                      color="danger"
                      variant="bordered"
                      type="submit"
                      onClick={() => handleDelete(product)}
                    >
                      Delete
                    </Button>
                  </Form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
