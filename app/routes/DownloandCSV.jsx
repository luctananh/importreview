import { Form, useActionData, Link } from "@remix-run/react";
import { useSearchParams } from "@remix-run/react";
import "../styles/Dowloand.css";
import { Button } from "@nextui-org/react";
import { Toaster, toast } from "sonner";
export default function DownloadCSV() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  const actionData = useActionData();

  const handleSubmit = async (event) => {
    event.preventDefault(); // Ngăn chặn hành vi mặc định của form

    const formData = new FormData(event.target);
    const response = await fetch(event.target.action, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      console.error("Error downloading CSV:", await response.json());
      return;
    }

    const { csvContent, fileName } = await response.json();

    // Tạo blob từ nội dung CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    // Tạo link để tải file
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.csv`; // Đặt tên tệp
    document.body.appendChild(a);
    a.click(); // Tự động click vào link
    a.remove(); // Xóa link sau khi tải xong
    window.URL.revokeObjectURL(url); // Giải phóng URL
  };

  return (
    <div className="overlay">
      <div className="container">
        <h1>Export Reviews .CSV</h1>

        <Form method="post" action="/downloand_reviews" onSubmit={handleSubmit}>
          <input type="hidden" name="_actionType" value="download" />
          <input type="hidden" name="productId" value={productId} />{" "}
          {/* Sử dụng ID thực tế */}
          <label htmlFor="fileName">Enter file name:</label>
          <div>
            <input
              type="text"
              name="fileName"
              id="fileName"
              placeholder="Enter file name"
            />
            <div className="button_card">
              <Button
                size="sm"
                onClick={() => toast.success("Downloand successfully")}
                variant="shadow"
                type="submit"
              >
                Download
              </Button>
              <Button
                size="sm"
                color="danger"
                radius="sm"
                variant="bordered"
                as={Link}
                to="/prducts"
              >
                Close
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
