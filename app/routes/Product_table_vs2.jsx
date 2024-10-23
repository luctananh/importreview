import React, { useState } from "react";
import { Button, Input } from "@nextui-org/react";
import { useLoaderData, Form, useFetcher, Link } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { prisma } from "../server/db.server";
import { getSession } from "../server/session.server";
import "../styles/product.css";
import { useEffect } from "react";
import {
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from "@nextui-org/dropdown";
import { Toaster, toast } from "sonner";
import { Spinner } from "@nextui-org/spinner";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isLoading1, setIsLoading1] = useState(false);

  //add checkbox
  // const [selectedProducts, setSelectedProducts] = useState([]); // State to track selected products
  // const [selectAll, setSelectAll] = useState(false);
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        toast.success("Reviews imported successfully!");
      } else {
        const errorDetails = fetcher.data.error || "No response";
        console.error("Error importing reviews: ", errorDetails);
        toast.error(`Failed to import reviews: ${errorDetails}`);
      }
      setIsLoading1(false);
    }
  }, [fetcher.state, fetcher.data]);

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
  const {
    isOpen: isOpen1,
    onOpen: onOpen1,
    onOpenChange: onOpenChange1,
  } = useDisclosure();
  const {
    isOpen: isOpen2,
    onOpen: onOpen2,
    onOpenChange: onOpenChange2,
  } = useDisclosure();
  const {
    isOpen: isOpen3,
    onOpen: onOpen3,
    onOpenChange: onOpenChange3,
  } = useDisclosure();

  //delete_product
  // Hàm kiểm tra và xóa sản phẩm
  const handleDelete = async (e) => {
    e.preventDefault(); // Ngăn chặn reload trang

    // Kiểm tra số lượng review của sản phẩm
    if (selectedProduct.reviewCount === 0) {
      // Nếu không có review, tiến hành xóa sản phẩm
      setIsLoading(true); // Bắt đầu trạng thái loading

      const formData = new FormData(e.target); // Lấy dữ liệu từ form

      try {
        const response = await fetch("/products", {
          method: "POST",
          body: formData,
        });

        // Kiểm tra mã trạng thái HTTP trả về từ API
        if (!response.ok) {
          const errorData = await response.json(); // Lấy thông tin chi tiết về lỗi nếu có
          throw new Error(errorData.message || "Failed to delete"); // Tạo thông báo lỗi chi tiết
        }

        toast.success("Deleted successfully.");
        window.location.reload(); // Tải lại trang để cập nhật bảng
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error(
          `An error occurred while deleting the product: ${error.message}.`
        );
      } finally {
        setIsLoading(false); // Kết thúc trạng thái loading
        onClose2(); // Đóng modal sau khi submit thành công
      }
    } else {
      // Nếu sản phẩm có review, không cho phép xóa và hiển thị thông báo lỗi
      toast.error(
        "Delete failed: There are reviews associated with this product."
      );
    }
  };
  const isValidURL = (url) => {
    const pattern = new RegExp(
      "^(https?:\\/\\/)?" // protocol
    );
    return !!pattern.test(url);
  };
  const handleImportReviews = async () => {
    if (!productURL || !isValidURL(productURL)) {
      toast.error("Please enter a valid product URL");
      return;
    }
    setIsLoading1(true); // Bật spinner khi bắt đầu cào dữ liệu
    const formData = new FormData();
    formData.append("_actionType", "import_reviews");
    formData.append("productURL", productURL);
    formData.append("productId", selectedProduct?.id);

    // Thực hiện fetch và chờ phản hồi từ server
    fetcher.submit(formData, {
      method: "post",
      action: "/import_review",
    });
  };
  // checkbox cho từng product
  // const handleSelectProduct = (productId) => {
  //   setSelectedProducts((prevSelected) =>
  //     prevSelected.includes(productId)
  //       ? prevSelected.filter((id) => id !== productId)
  //       : [...prevSelected, productId]
  //   );
  // };
  // // checkbox chọn tất cả
  // const handleSelectAll = () => {
  //   if (selectAll) {
  //     setSelectedProducts([]);
  //   } else {
  //     setSelectedProducts(filteredProducts.map((product) => product.id));
  //   }
  //   setSelectAll(!selectAll);
  // };
  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="table-container">
        <div className="search_card">
          <Input
            size="sm"
            type="search"
            label="Seaching in name.."
            value={searchTerm} // Gắn giá trị input với searchTerm
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Reviews</th>
              <th>Import & Export</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr
                key={product.id}
                onClick={() =>
                  (window.location.href = `/product_reviews/?pI=${
                    product.id
                  }&na=${encodeURIComponent(product.name)}`)
                }
              >
                <td>
                  <img src={product.url} alt={product.name} />
                </td>
                <td>{product.name}</td>
                <td>{product.reviewCount}</td>
                <td>
                  <div className="card_button">
                    <Button
                      variant="faded"
                      size="sm"
                      onPress={() => {
                        setSelectedProduct(product); // Cập nhật sản phẩm được chọn
                        setProductURL(""); // Reset URL khi mở modal
                        onOpen1(); // Mở modal
                      }}
                    >
                      Import reviews
                    </Button>
                    <Modal
                      isOpen={isOpen1}
                      size="3xl"
                      onOpenChange={() => {
                        onOpenChange1();
                        setProductURL(""); // Reset URL khi modal đóng
                        setSelectedProduct(null); // Reset sản phẩm được chọn
                        isDismissable = false;
                      }}
                    >
                      <ModalContent>
                        {(onClose) => (
                          <>
                            <ModalHeader className="flex flex-col gap-1">
                              Import reviews for {selectedProduct?.name}
                              {isLoading1 && <Spinner />}{" "}
                            </ModalHeader>
                            <ModalBody className="Modalbody">
                              <input
                                type="text"
                                value={productURL}
                                onChange={handleURLChange}
                                placeholder="Enter URL product"
                                onClick={(e) => e.stopPropagation()}
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
                                disabled={isLoading1} // Vô hiệu hóa nút khi đang tải
                                onClick={(e) => e.stopPropagation()}
                              >
                                Close
                              </Button>
                              <Button
                                onClick={handleImportReviews}
                                disabled={isLoading1}
                              >
                                {isLoading1 ? "Importing..." : "Import Reviews"}
                              </Button>
                            </ModalFooter>
                          </>
                        )}
                      </ModalContent>
                    </Modal>
                    <Button
                      size="sm"
                      variant="faded"
                      to={`/DownloandCSV?productId=${product.id}`}
                      as={Link}
                    >
                      Download Reviews
                    </Button>
                  </div>
                </td>
                <td>
                  <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                      <div className="more_svg">
                        <img src="./more.svg" alt="icon_more" />
                      </div>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Static Actions">
                      <DropdownItem
                        onPress={() => {
                          setSelectedProduct(product); // Cập nhật sản phẩm được chọn
                          onOpen2(); // Mở modal
                        }}
                        key="delete"
                        className="text-danger"
                        color="danger"
                      >
                        Delete product
                      </DropdownItem>
                      {product.reviewCount > 0 && (
                        <DropdownItem
                          onPress={() => {
                            setSelectedProduct(product);
                            onOpen3();
                          }}
                          key="delete"
                          className="text-danger"
                          color="danger"
                        >
                          Delete all reviews
                        </DropdownItem>
                      )}
                    </DropdownMenu>
                  </Dropdown>

                  <Modal
                    isOpen={isOpen2}
                    onOpenChange={() => {
                      onOpenChange2();
                      setSelectedProduct(null); // Reset sản phẩm khi modal đóng
                    }}
                  >
                    <ModalContent>
                      {(onClose2) => (
                        <>
                          <ModalHeader className="flex flex-col gap-1">
                            Delete Product
                          </ModalHeader>
                          <ModalBody>
                            <p>Are you sure you want to delete this product?</p>
                          </ModalBody>
                          <ModalFooter>
                            <Button
                              color="danger"
                              variant="light"
                              onPress={onClose2}
                            >
                              Close
                            </Button>
                            <Form
                              method="post"
                              action="/products"
                              onSubmit={handleDelete}
                            >
                              {/* Gán giá trị productId từ selectedProduct */}
                              <input
                                type="hidden"
                                name="productId"
                                value={selectedProduct?.id}
                              />
                              <input
                                type="hidden"
                                name="_actionType"
                                defaultValue="Delete_product"
                              />

                              <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Deleting..." : "Delete"}
                              </Button>
                            </Form>
                          </ModalFooter>
                        </>
                      )}
                    </ModalContent>
                  </Modal>

                  <Modal isOpen={isOpen3} onOpenChange={onOpenChange3}>
                    <ModalContent>
                      {(onClose3) => (
                        <>
                          <ModalHeader className="flex flex-col gap-1">
                            Delete All Reviews
                          </ModalHeader>
                          <ModalBody>
                            <p>
                              Are you sure you want to delete all reviews for
                              this product?
                            </p>
                          </ModalBody>
                          <ModalFooter>
                            <Button
                              color="danger"
                              variant="light"
                              onPress={onClose3}
                            >
                              Close
                            </Button>
                            <Form
                              method="post"
                              action="/delete_all_RV" // Đường dẫn xử lý delete all reviews
                              onSubmit={async (e) => {
                                e.preventDefault(); // Ngăn chặn reload trang
                                setIsLoading(true); // Bắt đầu trạng thái loading

                                const formData = new FormData(e.target); // Lấy dữ liệu từ form

                                try {
                                  const response = await fetch(
                                    "/delete_all_RV",
                                    {
                                      method: "POST",
                                      body: formData,
                                    }
                                  );

                                  if (!response.ok) {
                                    const errorData = await response.json(); // Lấy thông tin chi tiết về lỗi nếu có
                                    throw new Error(
                                      errorData.message ||
                                        "Failed to delete all reviews"
                                    ); // Tạo thông báo lỗi chi tiết
                                  }

                                  toast.success(
                                    "All reviews deleted successfully."
                                  );
                                  onClose3(); // Đóng modal sau khi submit thành công
                                  window.location.reload(); // Tải lại trang để cập nhật bảng
                                } catch (error) {
                                  console.error(
                                    "Error deleting all reviews:",
                                    error
                                  );
                                  toast.error(
                                    `An error occurred while deleting all reviews: ${error.message}.`
                                  );
                                } finally {
                                  setIsLoading(false); // Kết thúc trạng thái loading
                                }
                              }}
                            >
                              <input
                                type="hidden"
                                name="productId" // Giá trị ID của sản phẩm (cần phải gán giá trị này)
                                value={selectedProduct?.id} // Gán ID của sản phẩm mà bạn đang muốn xóa tất cả reviews
                              />
                              <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Deleting All..." : "Delete All"}
                              </Button>
                            </Form>
                          </ModalFooter>
                        </>
                      )}
                    </ModalContent>
                  </Modal>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
