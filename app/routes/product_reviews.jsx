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

  const url = new URL(request.url);
  const productId = url.searchParams.get("pI"); // Lấy productId từ query params
  const nameProduct = url.searchParams.get("na");

  if (!productId) {
    throw new Response("Product ID is required", { status: 400 });
  }

  // const reviews = await prisma.review.findMany({
  //   where: { productId },
  // });
  const order = url.searchParams.get("order") === "asc" ? "asc" : "desc";

  const reviews = await prisma.review.findMany({
    where: { productId },
    orderBy: {
      userName: order, // Sắp xếp theo userName
    },
  });
  const allReviews = getAllReviews(reviews);
  const totalReviewCount = reviews.length;
  return json({ reviews: allReviews, user, totalReviewCount, nameProduct });
};
// Hàm tính toán để gộp tất cả review từ tất cả sản phẩm
const getAllReviews = (reviews) => {
  // Kiểm tra xem reviews có dữ liệu không
  if (!reviews || reviews.length === 0) {
    return []; // Trả về mảng rỗng nếu không có đánh giá
  }

  return reviews.map((review) => ({
    ...review,
    // Nếu bạn có thêm thông tin sản phẩm khác cần thiết, hãy thêm vào đây
  }));
};
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
  const { reviews, user, totalReviewCount, nameProduct } = useLoaderData();
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
        toast.success("Delete successful");
      } else {
        toast.error(`Failed to delete. Status code: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Error occurred while deleting review");
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
  const allReviews = getAllReviews(reviews);

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
      <header>
        <Navbar className="custom-navbar2">
          <NavbarBrand>
            <img src="/logo.png" alt="logo" height={"70px"} width={"70px"} />
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
      </header>

      <div className="product_table">
        <div className="card_text">
          <Tooltip key="top-start" placement="top-start" content="Back">
            <Link to="/products">
              <img className="back_icon" src="/back.svg" alt="back icon" />
            </Link>
          </Tooltip>
          <h1>{nameProduct}</h1>
          <h2 className="total-reviews">Total Reviews: {totalReviewCount}</h2>
        </div>
        {totalReviewCount > 0 ? (
          <div className="table-review">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>User Name</th>
                  <th>Country</th>
                  <th>Review Content</th>
                  <th>Rating</th>
                  <th></th>
                  <th>
                    {" "}
                    <div className="filter_review">
                      <Dropdown>
                        <DropdownTrigger>
                          <Button variant="bordered">
                            <img
                              className="edit_icon"
                              src="/filter.svg"
                              alt="filter"
                            />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Static Actions">
                          <DropdownItem key="new">
                            <div className="btn_sort">
                              <button onClick={() => handleSort("asc")}>
                                Sort A-Z
                              </button>
                            </div>
                          </DropdownItem>
                          <DropdownItem key="copy">
                            <div className="btn_sort">
                              <button onClick={() => handleSort("desc")}>
                                Sort Z-A
                              </button>
                            </div>
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {allReviews.slice(startIndex, endIndex).map((review) => (
                  <tr key={review.id}>
                    <td>
                      <img src={review.productImage} alt="" />
                    </td>
                    <td>{review.userName}</td>
                    <td>{review.userContry}</td>
                    <td>{review.reviewContent}</td>
                    <td>
                      <StarRating rating={review.rating} />
                    </td>
                    <td>
                      <Tooltip content="Edit review">
                        <Button
                          onClick={() => onEditOpen2(review)}
                          variant="faded"
                          size="sm"
                        >
                          <img
                            className="edit_icon"
                            src="/edit.svg"
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
                                  <p style={{ color: "red" }}>{errorMessage}</p>
                                )}
                                {(imageUrl || selectedReview.productImage) && (
                                  <div>
                                    <h3>Image:</h3>
                                    <img
                                      src={
                                        imageUrl || selectedReview.productImage
                                      } // Hiển thị ảnh mới nếu có, nếu không hiển thị ảnh cũ
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
                                    />{" "}
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
                                            selectedReview.rating; // Quay về giá trị mặc định
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
                                    <Button type="submit" disabled={isLoading}>
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
                            src="/trash.svg"
                            alt="delete icon"
                          />
                        </Button>
                      </Tooltip>
                      {selectedReviewId === review.id && ( // Hiển thị modal chỉ cho review đang được chọn
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
                ))}
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
          </div>
        ) : (
          <p className="no-reviews">No reviews available.</p> // Thông báo không có đánh giá
        )}
      </div>

      {/* <section className="bg-white">
        <div className="max-w-screen-xl px-4 py-12 mx-auto space-y-8 overflow-hidden sm:px-6 lg:px-8">
          <nav className="flex flex-wrap justify-center -mx-5 -my-2">
            <div className="px-5 py-2">
              <a
                href="#"
                className="text-base leading-6 text-gray-500 hover:text-gray-900"
              >
                About
              </a>
            </div>
            <div className="px-5 py-2">
              <a
                href="#"
                className="text-base leading-6 text-gray-500 hover:text-gray-900"
              >
                Blog
              </a>
            </div>
            <div className="px-5 py-2">
              <a
                href="#"
                className="text-base leading-6 text-gray-500 hover:text-gray-900"
              >
                Team
              </a>
            </div>
            <div className="px-5 py-2">
              <a
                href="#"
                className="text-base leading-6 text-gray-500 hover:text-gray-900"
              >
                Pricing
              </a>
            </div>
            <div className="px-5 py-2">
              <a
                href="#"
                className="text-base leading-6 text-gray-500 hover:text-gray-900"
              >
                Contact
              </a>
            </div>
            <div className="px-5 py-2">
              <a
                href="#"
                className="text-base leading-6 text-gray-500 hover:text-gray-900"
              >
                Terms
              </a>
            </div>
          </nav>
          <div className="flex justify-center mt-8 space-x-6">
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Facebook</span>
              <svg
                className="w-6 h-6"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fill-rule="evenodd"
                  d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Instagram</span>
              <svg
                className="w-6 h-6"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fill-rule="evenodd"
                  d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Twitter</span>
              <svg
                className="w-6 h-6"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">GitHub</span>
              <svg
                className="w-6 h-6"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fill-rule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Dribbble</span>
              <svg
                className="w-6 h-6"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fill-rule="evenodd"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </a>
          </div>
          <p className="mt-8 text-base leading-6 text-center text-gray-400">
            © 2023 Import Review Aliexpress.
          </p>
        </div>
      </section> */}
    </>
  );
}
