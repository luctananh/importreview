import React from "react";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { prisma } from "../server/db.server";
import "../styles/review_table.css";
import { getSession } from "../server/auth.server.js";
import { Tooltip } from "@nextui-org/react";
import { DeleteIcon } from "../layouts/DeleteIcon.jsx";
import { EditIcon } from "../layouts/EditIcon .jsx";
import { authenticator } from "../server/auth.server.js";
import { useFetcher } from "@remix-run/react";
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import UploadWidget from "../layouts/uploadimage";
import "../styles/home.css";
import "../styles/Navigation.css";
import "../styles/responsive.css";

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
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from "@nextui-org/react";
import { Link, Form } from "@remix-run/react";
import { Toaster, toast } from "sonner";
import { tr } from "framer-motion/client";
// Lấy tất cả review từ cơ sở dữ liệu

export const loader = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return json({ error: "User not authenticated" }, { status: 401 });
  }
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (!userId) {
    return redirect("/login");
  }

  // const products = await prisma.product.findMany({
  //   where: { userId },
  //   include: {
  //     reviews: true,
  //   },
  // });
  const url = new URL(request.url);
  const order = url.searchParams.get("order") === "asc" ? "asc" : "desc";

  const products = await prisma.product.findMany({
    where: { userId },
    include: {
      reviews: {
        orderBy: {
          userName: order, // Sắp xếp theo 'rating' giảm dần; đổi thành 'asc' để tăng dần
        },
      },
    },
  });

  return json({ products, user });
};
// Hàm tính toán để gộp tất cả review từ tất cả sản phẩm
const getAllReviews = (products) => {
  let allReviews = [];
  products.forEach((product) => {
    const reviewsWithProductInfo = product.reviews.map((review) => ({
      ...review,
      productName: product.name, // Thêm thông tin sản phẩm vào từng review
      productId: product.id,
    }));
    allReviews = allReviews.concat(reviewsWithProductInfo);
  });
  return allReviews;
};
console.log(getAllReviews.length);
const StarRating = ({ rating }) => {
  // Chuyển đổi rating từ chuỗi sang số
  const numericRating = parseInt(rating, 10);

  // Kiểm tra nếu numericRating là số hợp lệ
  if (isNaN(numericRating)) {
    return <div>Invalid rating</div>;
  }

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={i <= numericRating ? "star filled" : "star"}>
        ★
      </span>
    );
  }
  return <div className="star-rating">{stars}</div>;
};

export default function ReviewTable() {
  const { products, user } = useLoaderData();
  const [isOpen, setIsOpen] = useState(false); // Trạng thái mở modal
  const [selectedReviewId, setSelectedReviewId] = useState(null); // Lưu trữ reviewId đang được chọn
  const [selectedReview, setSelectedReview] = useState(null);
  const [updatedContent, setUpdatedContent] = useState("");
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [scrollBehavior, setScrollBehavior] = React.useState("inside");
  const fetcher = useFetcher();
  const [isMobile, setIsMobile] = useState(false);

  //mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize(); // Thiết lập ban đầu khi component được mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // Hàm để mở modal và lưu trữ reviewId
  const onOpen = (reviewId) => {
    setSelectedReviewId(reviewId);
    setIsOpen(true);
  };
  const onOpen2 = (reviewId) => {
    setSelectedReviewId(reviewId);
    setIsOpenDelete(true);
  };

  const onEditOpen2 = (review) => {
    setSelectedReview(review);
    setUpdatedContent(review.reviewContent); // Lưu nội dung cũ để chỉnh sửa
    setIsOpenEdit(true);
  };
  const [isLoading, setIsLoading] = useState(false);
  const handleDelete = async (e) => {
    e.preventDefault(); // Ngăn chặn reload trang
    setIsLoading(true); // Bắt đầu trạng thái loading

    const formData = new FormData(e.target); // Lấy dữ liệu từ form
    const reviewId = formData.get("reviewId"); // Lấy giá trị reviewId

    try {
      const response = await fetch("/delete_review", {
        method: "POST",
        body: formData,
      });

      console.log(response.status); // Log status code

      if (response.ok) {
        toast.success("Deleted successful.");
      } else {
        toast.error(`Failed to delete. Status code: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("An error occurred while deleting the review.");
    } finally {
      setIsLoading(false); // Kết thúc trạng thái loading
      setTimeout(() => {
        window.location.reload();
      }, 500);
      onClose();
    }
  };
  // Hàm để đóng modal
  const onClose = () => {
    setIsOpen(false);
    setSelectedReviewId(null); // Reset lại reviewId khi đóng modal
  };
  const logout = () => {
    fetcher.submit(null, { method: "post", action: "/auth/logout" });
  };

  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const page = parseInt(params.get("currentPage"), 10);
      return page && !isNaN(page) ? page : 1;
    }
    return 1;
  });

  const reviewsPerPage = 10;

  // Cập nhật URL khi currentPage thay đổi, đảm bảo code chỉ chạy client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("currentPage", currentPage);
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params}`
      );
    }
  }, [currentPage]);

  // Gộp tất cả review từ các sản phẩm
  const allReviews = getAllReviews(products);

  // Tính tổng số trang
  const totalReviews = allReviews.length;
  const totalPages = Math.ceil(totalReviews / reviewsPerPage);

  // Tính toán startIndex và endIndex dựa trên trang hiện tại
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const currentReviews = allReviews.slice(startIndex, endIndex);

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const generatePaginationItems = () => {
    const items = [];
    items.push(1);

    if (totalPages > 5) {
      if (currentPage <= 4) {
        for (let i = 2; i <= 5; i++) {
          items.push(i);
        }
        items.push("forward");
        items.push(totalPages);
      } else if (currentPage >= 5 && currentPage <= totalPages - 4) {
        items.push("backward");
        items.push(currentPage - 1);
        items.push(currentPage);
        items.push(currentPage + 1);
        items.push("forward");
        items.push(totalPages);
      } else {
        items.push("backward");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          items.push(i);
        }
      }
    } else {
      for (let i = 2; i <= totalPages; i++) {
        items.push(i);
      }
    }

    return items;
  };
  const handleUpdateReview = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target);

    // Kiểm tra xem formData có giá trị đúng không
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    const response = await fetch("/update_review", {
      method: "POST",
      body: formData, // Gửi form data thay vì JSON
    });

    if (response.ok) {
      toast.success("Review updated successfully", {
        autoClose: 5000, // Hiển thị trong 5 giây
      });

      setIsOpenEdit(false);
    } else {
      const result = await response.json();
      toast.error(`Error: ${result.error}`);
    }
    setTimeout(() => {
      window.location.reload();
    }, 500);
    setIsLoading(false);
  };
  function handleUpload(url, error) {
    if (error) {
      setErrorMessage("Upload failed: " + error.message);
      setImageUrl(""); // Đặt lại imageUrl khi có lỗi
    } else {
      setImageUrl(url); // Cập nhật imageUrl với URL của ảnh mới
      setErrorMessage(""); // Xóa thông báo lỗi nếu có
    }
  }
  return (
    <>
      <Toaster position="top-center" richColors />

      <Navbar className="custom-navbar2">
        <NavbarBrand>
          <img src="./logo.png" alt="logo" height={"70px"} width={"70px"} />
        </NavbarBrand>

        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem>
            <Link color="foreground" href="#">
              {/* Features */}
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="#" aria-current="page">
              {/* Customers */}
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="#">
              {/* Integrations */}
            </Link>
          </NavbarItem>
        </NavbarContent>

        <NavbarContent as="div" justify="end">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                color="success"
                name={user._json.name}
                size="sm"
                src={user._json.picture}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">{user._json.name}</p>
                <p className="font-semibold">{user._json.email}</p>
              </DropdownItem>
              <DropdownItem key="help_and_feedback">
                Help & Feedback
              </DropdownItem>
              <DropdownItem key="logout" color="danger">
                <Button onClick={logout}> Sign Out </Button>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarContent>
      </Navbar>

      <div className="card_slide">
        <div className="card_navar">
          <nav className="side-nav">
            <ul>
              <li>
                <NavLink to="/products" exact activeClassName="active">
                  <div className="nava_product">
                    <img src="/productst.svg" alt="product-icon" />
                    <p>Products</p>
                  </div>
                </NavLink>
              </li>
              <li>
                <NavLink to="/review_table" activeClassName="active">
                  <div className="nava_product">
                    <img src="/review.svg" alt="review-icon" />
                    <p>Reviews</p>
                  </div>
                </NavLink>
              </li>
              <li>
                <NavLink to="/setting" activeClassName="active">
                  <div className="nava_product">
                    <img src="/setting.svg" alt="seting-icon" />
                    <p>Setting</p>
                  </div>
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
        <div className="product_table">
          <div className="navbar-container">
            <nav>
              <ul>
                <li>
                  <NavLink to="/products" exact activeClassName="active">
                    Products
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/review_table" activeClassName="active">
                    Reviews
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/setting" activeClassName="active">
                    Setting
                  </NavLink>
                </li>
              </ul>
            </nav>
          </div>
          <div className="card_text">
            <h1>Reviews</h1>
          </div>
          <div className="table-review">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th className="none">User Name</th>
                  <th className="none">Country</th>
                  <th className="none">Review Content</th>
                  <th>Rating</th>
                  <th className="none"></th>
                  <th>
                    {" "}
                    <div className="filter_review">
                      <Dropdown>
                        <DropdownTrigger>
                          <Button variant="bordered">
                            <img
                              className="filter_icon"
                              src="/filter.svg"
                              alt="filter"
                            />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Static Actions">
                          <DropdownItem key="new">
                            <div className="btn_sort">
                              <a href="?order=asc">Sort A-Z</a>
                            </div>
                          </DropdownItem>
                          <DropdownItem key="copy">
                            <div className="btn_sort">
                              <a href="?order=desc">Sort Z-A</a>
                            </div>
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {allReviews.length > 0 ? (
                  allReviews.slice(startIndex, endIndex).map((review) => (
                    <tr key={review.id} onClick={() => onEditOpen2(review)}>
                      <td>
                        <img src={review.productImage} alt="" />
                        {selectedReview && (
                          <Modal
                            size="4xl"
                            isOpen={isOpenEdit}
                            onOpenChange={setIsOpenEdit}
                            scrollBehavior={scrollBehavior}
                          >
                            <>
                              <ModalContent>
                                <ModalHeader className="flex flex-col gap-1">
                                  <h1>Edit review</h1>
                                </ModalHeader>
                                <ModalBody>
                                  <label>Image URL:</label>
                                  <div>
                                    <UploadWidget onUpload={handleUpload} />
                                  </div>
                                  {errorMessage && (
                                    <p style={{ color: "red" }}>
                                      {errorMessage}
                                    </p>
                                  )}
                                  {(imageUrl ||
                                    selectedReview.productImage) && (
                                    <div>
                                      <h3>Image:</h3>
                                      <img
                                        src={
                                          imageUrl ||
                                          selectedReview.productImage
                                        }
                                        alt="Uploaded"
                                        height={"100px"}
                                        width={"100px"}
                                      />
                                    </div>
                                  )}

                                  <Form
                                    method="post"
                                    action="/update_review"
                                    onSubmit={handleUpdateReview}
                                    className="edit_from"
                                  >
                                    <input
                                      type="hidden"
                                      name="reviewId"
                                      value={selectedReview.id}
                                    />
                                    <label>
                                      <input
                                        type="hidden"
                                        name="url"
                                        value={imageUrl}
                                      />
                                    </label>
                                    <label>
                                      Name:
                                      <input
                                        type="text"
                                        name="name"
                                        defaultValue={selectedReview.userName}
                                        required
                                      />
                                    </label>
                                    <label>
                                      Country:
                                      <input
                                        type="text"
                                        name="country"
                                        defaultValue={selectedReview.userContry}
                                        required
                                      />
                                    </label>
                                    <label>
                                      Content:
                                      <textarea
                                        name="content"
                                        id="content"
                                        defaultValue={
                                          selectedReview.reviewContent
                                        }
                                        required
                                      />
                                    </label>
                                    <label>
                                      Rating:
                                      <input
                                        type="number"
                                        name="rating"
                                        min="1"
                                        max="5"
                                        defaultValue={selectedReview.rating}
                                        onBlur={(e) => {
                                          const value = parseInt(
                                            e.target.value,
                                            10
                                          );
                                          if (
                                            isNaN(value) ||
                                            value < 1 ||
                                            value > 5
                                          ) {
                                            e.target.value =
                                              selectedReview.rating;
                                          }
                                        }}
                                      />
                                    </label>
                                    <ModalFooter>
                                      <Button
                                        onClick={() => setIsOpenEdit(false)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        type="submit"
                                        disabled={isLoading}
                                      >
                                        {isLoading ? "Updating..." : "Update"}
                                      </Button>
                                    </ModalFooter>
                                  </Form>
                                </ModalBody>
                              </ModalContent>
                            </>
                          </Modal>
                        )}
                      </td>
                      <td className="none">{review.userName}</td>
                      <td className="none">{review.userContry}</td>
                      <td className="none">{review.reviewContent}</td>
                      <td>
                        <StarRating rating={review.rating} />
                      </td>
                      <td className="none">
                        <Tooltip content="Edit review">
                          <Button
                            onClick={() => onEditOpen2(review)}
                            variant="faded"
                            size="sm"
                          >
                            <img
                              className="edit_icon"
                              src="./edit.svg"
                              alt="edit icon"
                            />
                          </Button>
                        </Tooltip>
                        {selectedReview && (
                          <Modal
                            size="4xl"
                            isOpen={isOpenEdit}
                            onOpenChange={setIsOpenEdit}
                            scrollBehavior={scrollBehavior}
                          >
                            <>
                              <ModalContent>
                                <ModalHeader className="flex flex-col gap-1">
                                  <h1>Edit review</h1>
                                </ModalHeader>
                                <ModalBody>
                                  <label>Image URL:</label>
                                  <div>
                                    <UploadWidget onUpload={handleUpload} />
                                  </div>
                                  {errorMessage && (
                                    <p style={{ color: "red" }}>
                                      {errorMessage}
                                    </p>
                                  )}
                                  {(imageUrl ||
                                    selectedReview.productImage) && (
                                    <div>
                                      <h3>Image:</h3>
                                      <img
                                        src={
                                          imageUrl ||
                                          selectedReview.productImage
                                        }
                                        alt="Uploaded"
                                        height={"100px"}
                                        width={"100px"}
                                      />
                                    </div>
                                  )}

                                  <Form
                                    method="post"
                                    action="/update_review"
                                    onSubmit={handleUpdateReview}
                                    className="edit_from"
                                  >
                                    <input
                                      type="hidden"
                                      name="reviewId"
                                      value={selectedReview.id}
                                    />
                                    <label>
                                      <input
                                        type="hidden"
                                        name="url"
                                        value={imageUrl}
                                      />
                                    </label>
                                    <label>
                                      Name:
                                      <input
                                        type="text"
                                        name="name"
                                        defaultValue={selectedReview.userName}
                                        required
                                      />
                                    </label>
                                    <label>
                                      Country:
                                      <input
                                        type="text"
                                        name="country"
                                        defaultValue={selectedReview.userContry}
                                        required
                                      />
                                    </label>
                                    <label>
                                      Content:
                                      <textarea
                                        name="content"
                                        id="content"
                                        defaultValue={
                                          selectedReview.reviewContent
                                        }
                                        required
                                      />
                                    </label>
                                    <label>
                                      Rating:
                                      <input
                                        type="number"
                                        name="rating"
                                        min="1"
                                        max="5"
                                        defaultValue={selectedReview.rating}
                                        onBlur={(e) => {
                                          const value = parseInt(
                                            e.target.value,
                                            10
                                          );
                                          if (
                                            isNaN(value) ||
                                            value < 1 ||
                                            value > 5
                                          ) {
                                            e.target.value =
                                              selectedReview.rating;
                                          }
                                        }}
                                      />
                                    </label>
                                    <ModalFooter>
                                      <Button
                                        onClick={() => setIsOpenEdit(false)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        type="submit"
                                        disabled={isLoading}
                                      >
                                        {isLoading ? "Updating..." : "Update"}
                                      </Button>
                                    </ModalFooter>
                                  </Form>
                                </ModalBody>
                              </ModalContent>
                            </>
                          </Modal>
                        )}
                      </td>
                      <td>
                        <Tooltip content="Delete review">
                          <Button
                            onPress={() => onOpen(review.id)}
                            variant="faded"
                            size="sm"
                            type="submit"
                          >
                            <img
                              className="delete_icon"
                              src="./trash.svg"
                              alt="delete icon"
                            />
                          </Button>
                        </Tooltip>
                        {selectedReviewId === review.id && (
                          <Modal
                            isOpen={isOpen}
                            onOpenChange={setIsOpen}
                            isDismissable={false}
                            isKeyboardDismissDisabled={true}
                          >
                            <ModalContent>
                              <>
                                <ModalHeader className="flex flex-col gap-1">
                                  Delete Review
                                </ModalHeader>
                                <ModalBody>
                                  <p>
                                    Are you sure you want to delete this review?
                                  </p>
                                </ModalBody>
                                <ModalFooter>
                                  <Button
                                    color="danger"
                                    variant="light"
                                    onPress={onClose}
                                  >
                                    Cancel
                                  </Button>
                                  <Form
                                    method="post"
                                    action="/delete_review"
                                    onSubmit={handleDelete}
                                  >
                                    <input
                                      type="hidden"
                                      name="reviewId"
                                      value={review.id}
                                    />
                                    <Button type="submit" disabled={isLoading}>
                                      {isLoading ? "Deleting..." : "Delete"}
                                    </Button>
                                  </Form>
                                </ModalFooter>
                              </>
                            </ModalContent>
                          </Modal>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-reviews">
                      No reviews available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="pagination">
              <Button
                size="sm"
                variant="bordered"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              {generatePaginationItems().map((item, index) => (
                <span key={index}>
                  {item === "backward" ? (
                    <Button
                      size="sm"
                      variant="bordered"
                      onClick={() => setCurrentPage(currentPage - 3)}
                      className="ellipsis-button ellipsis-backward"
                    >
                      {"..."}
                    </Button>
                  ) : item === "forward" ? (
                    <Button
                      size="sm"
                      variant="bordered"
                      onClick={() => setCurrentPage(currentPage + 3)}
                      className="ellipsis-button ellipsis-forward"
                    >
                      {"..."}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant={currentPage === item ? "solid" : "bordered"}
                      onClick={() => setCurrentPage(item)}
                    >
                      {item}
                    </Button>
                  )}
                </span>
              ))}

              <Button
                size="sm"
                variant="bordered"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            <div className="pagination-mobile">
              <Button
                size="sm"
                variant="bordered"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="bordered"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
