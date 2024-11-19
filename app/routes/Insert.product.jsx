import React, { useState } from "react";
import { Button, Link } from "@nextui-org/react";
import { useLoaderData, Form } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { prisma } from "../server/db.server";
import { getSession } from "../server/auth.server.js";
import "../styles/insert_product.css";
import UploadWidget from "../layouts/uploadimage";
import { Toaster, toast } from "sonner";
import { authenticator } from "../server/auth.server.js";
import { useFetcher } from "@remix-run/react";
import {
  Tooltip,
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
import { NavLink } from "react-router-dom";
import "../styles/home.css";
import "../styles/Navigation.css";
import { useNavigation } from "react-router-dom";
import NProgress from "nprogress";
import { useEffect } from "react";

export const loader = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return json({ error: "User not authenticated" }, { status: 401 });
  }
  return json({ user });
};

// Handle adding a new product
export const action = async ({ request }) => {
  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description");
  const url = formData.get("url");

  // Get user session
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (!userId) {
    return json({ error: "Người dùng chưa đăng nhập" }, { status: 401 });
  }

  if (!name) {
    return json({ error: "Lỗi nhập dữ liệu" }, { status: 400 });
  }

  // Create a new product and link it to the user
  await prisma.product.create({
    data: {
      name,
      description,
      url: url || null, // Allow empty URL
      userId,
    },
  });

  return redirect("/products");
};

export default function ProductTable() {
  const { user } = useLoaderData();
  const [imageUrl, setImageUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const fetcher = useFetcher();
  const navigation = useNavigation();
  useEffect(() => {
    if (navigation.state === "loading") {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [navigation.state]);
  const logout = () => {
    fetcher.submit(null, { method: "post", action: "/auth/logout" });
  };

  function handleUpload(url, error) {
    if (error) {
      setErrorMessage("Upload failed: " + error.message);
      setImageUrl("");
    } else {
      setImageUrl(url);
      setErrorMessage("");
    }
  }

  const handleSubmit = async (event) => {
    // Lấy dữ liệu từ form
    const formData = new FormData(event.target);
    const name = formData.get("name");
    const description = formData.get("description");

    // Kiểm tra xem các trường có được điền đầy đủ không
    if (!name || !description) {
      toast.error("Please fill out all fields before submitting!");
      return;
    }

    setLoading(true); // Bắt đầu trạng thái loading

    try {
      // Gọi API thêm sản phẩm hoặc logic xử lý
      const response = await someApiCall({
        name,
        description,
        url,
      });

      if (response.ok) {
        toast.success("Add product successfully!");
        setImageUrl(""); // Reset image URL
        event.target.reset(); // Reset form
      } else {
        throw new Error("Failed to add product");
      }
    } catch (error) {
      toast.success("Add product successfully!");
    } finally {
      setLoading(false); // Dừng trạng thái loading
    }
  };

  const handleClick = () => {
    NProgress.start(); // Bắt đầu thanh loading
    setTimeout(() => {
      navigate("/Insert/product"); // Điều hướng sau khi loading
      NProgress.done(); // Kết thúc thanh loading
    }, 500); // Thời gian delay để thanh loading hiển thị
  };
  return (
    <>
      <Toaster position="top-center" richColors />
      <header>
        <Navbar className="custom-navbar2">
          <NavbarBrand>
            <img src="/logo.png" alt="logo" height="70px" width="70px" />
          </NavbarBrand>

          <NavbarContent className="hidden sm:flex" justify="center">
            <NavbarItem className="navbar-item-custom">
              <Link color="foreground" href="#"></Link>
            </NavbarItem>
            <NavbarItem className="navbar-item-custom">
              <Link color="foreground" href="#" aria-current="page"></Link>
            </NavbarItem>
            <NavbarItem className="navbar-item-custom">
              <Link color="foreground" href="#"></Link>
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
                  <Button onClick={logout}>Sign Out</Button>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarContent>
        </Navbar>
      </header>

      <div className="modal_container">
        <div className="form-container">
          <div className="card_title">
            <Tooltip key="top-start" placement="top-start" content="Back">
              <Link href="/products">
                <img onClick={handleClick} src="/back.svg" alt="back icon" />
              </Link>
            </Tooltip>
            <h1>Add New Product</h1>
          </div>
          <Form method="post" onSubmit={handleSubmit}>
            <div>
              <label>Product Name</label>
              <input type="text" name="name" required />
            </div>
            <div>
              <label>Description</label>
              <input type="text" name="description" required />
            </div>
            <div className="card_image">
              <label>Image URL</label>
              <UploadWidget onUpload={handleUpload} />
              {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
              {imageUrl && (
                <div>
                  <h2>Uploaded Image:</h2>
                  <img
                    src={imageUrl}
                    alt="Uploaded"
                    height="20px"
                    width="20px"
                  />
                </div>
              )}
              <input
                type="text"
                name="url"
                id="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            {loading ? (
              <div className="spinner">
                <p>Processing...</p>
              </div>
            ) : (
              <div className="button_prd">
                <Button type="submit" size="xl" radius="sm" variant="flat">
                  Add Product
                </Button>
              </div>
            )}
          </Form>
        </div>
      </div>
    </>
  );
}
