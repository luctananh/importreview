import { Select, SelectItem } from "@nextui-org/react";
// import { Reviews } from "../server/data.js";
import { authenticator } from "../server/auth.server.js";
import { getSession } from "../server/auth.server.js";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { NavLink, useNavigation } from "react-router-dom";
import { json } from "@remix-run/node";
import {
  Button,
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
import { Link } from "@remix-run/react";
import "../styles/setting.css";
import "../styles/home.css";
import "../styles/Navigation.css";
import "../styles/responsive.css";
import { prisma } from "../server/db.server";
import { useState } from "react";
import { Toaster, toast } from "sonner";
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

  let setting;
  try {
    // Lấy cài đặt của người dùng từ database
    setting = await prisma.setting.findUnique({
      where: { userId },
    });
  } catch (error) {
    console.error("Error fetching setting:", error);
    setting = null; // Nếu có lỗi, gán setting là null
  }

  // Đặt giá trị mặc định nếu không có cài đặt
  const maxReviewCount = setting?.maxReviewCount || 20;
  return json({ user, maxReviewCount });
};
export default function Setting() {
  const { user, maxReviewCount } = useLoaderData();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const logout = () => {
    fetcher.submit(null, { method: "post", action: "/auth/logout" });
  };
  const [selectedValue, setSelectedValue] = useState(maxReviewCount);
  const Reviews = [
    { key: "20", label: "20 reviews" },
    { key: "40", label: "40 reviews" },
    { key: "100", label: "100 reviews" },
    { key: "200", label: "200 reviews" },
    { key: "50", label: "500 reviews" },
  ];
  const handleSelectChange = (e) => {
    const value = e.target.value;
    setSelectedValue(value);
  };
  const handleSaveSettings = () => {
    // Hiển thị thông báo khi ấn nút
    toast.success("Settings saved successfully");
  };
  return (
    <>
      <header>
        <Toaster position="top-center" richColors />
        {navigation.state === "loading" && <div>Loading...</div>}
        <Navbar className="custom-navbar2">
          <NavbarBrand>
            <img className="logo_icon" src="./logo.png" alt="logo" />
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
        <div className="setting_body">
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
          <div className="text-setting">
            <h1>Setting</h1>
          </div>
          <div className="setting_card">
            <span>Review quantity per import</span>
            <select
              value={selectedValue}
              onChange={handleSelectChange}
              className="max-w-xs"
            >
              {Reviews.map((review) => (
                <option key={review.key} value={review.key}>
                  {review.label}
                </option>
              ))}
            </select>
          </div>
          {/* Form của Remix với input ẩn */}
          <div className="save_setting">
            <fetcher.Form method="post" action="/settingapi">
              <input
                type="hidden"
                name="maxReviewCount"
                value={selectedValue}
              />
              <input type="hidden" name="key" value={selectedValue} />
              <Button onClick={handleSaveSettings} type="submit">
                Save Settings
              </Button>
            </fetcher.Form>
          </div>
        </div>
      </div>
    </>
  );
}
